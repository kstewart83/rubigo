import type { ServerWebSocket } from "bun";
import type { WebSocketHandler, BaseConnectionData } from "./types";

const GUACD_HOST = process.env.GUACD_HOST || "localhost";
const GUACD_PORT = parseInt(process.env.GUACD_PORT || "4822", 10);

const DEFAULT_VNC_HOST = process.env.VNC_HOST || "host.docker.internal";
const DEFAULT_VNC_PORT = "5900";
const DEFAULT_VNC_PASSWORD = "";

/**
 * Connection data specific to Guacamole tunnel
 */
export interface GuacConnectionData extends BaseConnectionData {
    type: "guac";
    hostname: string;
    port: string;
    password: string;
    guacdSocket?: ReturnType<typeof Bun.connect> extends Promise<infer T> ? T : never;
    messageQueue: string[];
}

/**
 * Build a Guacamole instruction string
 */
function buildGuacInstruction(opcode: string, args: string[]): string {
    const parts = [opcode, ...args];
    return parts.map(p => `${p.length}.${p}`).join(',') + ';';
}

/**
 * Guacamole WebSocket tunnel handler.
 * Proxies Guacamole protocol between browser clients and guacd daemon.
 */
export const guacHandler: WebSocketHandler<GuacConnectionData> = {
    path: "/api/guac-tunnel",

    upgrade(req: Request, url: URL): GuacConnectionData | null {
        const hostname = url.searchParams.get("hostname") || DEFAULT_VNC_HOST;
        const port = url.searchParams.get("port") || DEFAULT_VNC_PORT;
        const password = url.searchParams.get("password") || DEFAULT_VNC_PASSWORD;
        const id = crypto.randomUUID();

        console.log(`[Guac] New connection #${id}: ${hostname}:${port}`);

        return {
            type: "guac",
            id,
            hostname,
            port,
            password,
            messageQueue: [],
        };
    },

    async open(ws: ServerWebSocket<GuacConnectionData>): Promise<void> {
        const { id, hostname, port, password } = ws.data;
        console.log(`[Guac:${id}] WebSocket connected, connecting to guacd...`);

        let dataBuffer = '';

        try {
            const socket = await Bun.connect({
                hostname: GUACD_HOST,
                port: GUACD_PORT,
                socket: {
                    data(socket, data) {
                        const message = data.toString();
                        dataBuffer += message;

                        while (dataBuffer.includes(';')) {
                            const semiIdx = dataBuffer.indexOf(';');
                            const instr = dataBuffer.substring(0, semiIdx + 1);
                            dataBuffer = dataBuffer.substring(semiIdx + 1);

                            try {
                                ws.send(instr);
                            } catch (e) {
                                console.error(`[Guac:${id}] Failed to send to WebSocket:`, e);
                            }
                        }
                    },
                    open(socket) {
                        console.log(`[Guac:${id}] Connected to guacd`);
                        ws.data.guacdSocket = socket;

                        // Flush queued messages
                        while (ws.data.messageQueue.length > 0) {
                            const msg = ws.data.messageQueue.shift();
                            if (msg) socket.write(msg);
                        }
                    },
                    close(socket) {
                        console.log(`[Guac:${id}] guacd connection closed`);
                        try { ws.close(); } catch (e) { }
                    },
                    error(socket, error) {
                        console.error(`[Guac:${id}] guacd error:`, error);
                    },
                },
            });
        } catch (error) {
            console.error(`[Guac:${id}] Failed to connect to guacd:`, error);
            ws.close();
        }
    },

    message(ws: ServerWebSocket<GuacConnectionData>, message: string | Buffer): void {
        const { id } = ws.data;
        const msgStr = message.toString();

        // Handle internal tunnel ping/pong
        if (msgStr.startsWith('0.,')) {
            if (msgStr.includes('ping')) {
                const timestamp = msgStr.match(/\d+\.\d+/)?.[0] || '';
                ws.send(buildGuacInstruction('0', ['pong', timestamp]));
                return;
            }
            return;
        }

        if (ws.data.guacdSocket) {
            try {
                ws.data.guacdSocket.write(msgStr);
            } catch (e) {
                console.error(`[Guac:${id}] Failed to write to guacd:`, e);
            }
        } else {
            ws.data.messageQueue.push(msgStr);
        }
    },

    close(ws: ServerWebSocket<GuacConnectionData>): void {
        const { id } = ws.data;
        console.log(`[Guac:${id}] WebSocket closed`);

        if (ws.data.guacdSocket) {
            try { ws.data.guacdSocket.end(); } catch (e) { }
        }
    },
};
