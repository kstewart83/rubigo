/**
 * Guacamole WebSocket Tunnel
 *
 * A Bun WebSocket server that proxies Guacamole protocol between
 * browser clients and the guacd daemon.
 *
 * Usage: bun run src/lib/guac-tunnel/server.ts
 */

const GUACD_HOST = process.env.GUACD_HOST || "localhost";
const GUACD_PORT = parseInt(process.env.GUACD_PORT || "4822", 10);
const TUNNEL_PORT = parseInt(process.env.TUNNEL_PORT || "4823", 10);

const DEFAULT_VNC_HOST = process.env.VNC_HOST || "host.docker.internal";
const DEFAULT_VNC_PORT = "5900";
const DEFAULT_VNC_PASSWORD = ""; // QEMU VNC has no password

/**
 * Parse a Guacamole instruction string
 */
function parseInstruction(instr: string): { opcode: string; args: string[] } {
    const args: string[] = [];
    let pos = 0;

    // Parse opcode
    let dotPos = instr.indexOf('.', pos);
    if (dotPos === -1) return { opcode: '', args: [] };

    const opcodeLen = parseInt(instr.substring(pos, dotPos), 10);
    const opcode = instr.substring(dotPos + 1, dotPos + 1 + opcodeLen);
    pos = dotPos + 1 + opcodeLen;

    // Parse args
    while (pos < instr.length && instr[pos] === ',') {
        pos++;
        dotPos = instr.indexOf('.', pos);
        if (dotPos === -1) break;

        const argLen = parseInt(instr.substring(pos, dotPos), 10);
        const arg = instr.substring(dotPos + 1, dotPos + 1 + argLen);
        args.push(arg);
        pos = dotPos + 1 + argLen;
    }

    return { opcode, args };
}

/**
 * Build a Guacamole instruction string
 */
function buildInstruction(opcode: string, args: string[]): string {
    const parts = [opcode, ...args];
    return parts.map(p => `${p.length}.${p}`).join(',') + ';';
}

/**
 * Build connect args matching the arg names from guacd
 * Maps common param names to their values
 */
function buildConnectArgs(argNames: string[], hostname: string, port: string, password: string): string[] {
    const params: Record<string, string> = {
        'VERSION_1_5_0': 'VERSION_1_5_0',
        'hostname': hostname,
        'port': port,
        'password': password,
    };

    return argNames.map(name => params[name] || '');
}

interface ConnectionData {
    hostname: string;
    port: string;
    password: string;
    id: string;
    guacdSocket?: ReturnType<typeof Bun.connect> extends Promise<infer T> ? T : never;
    messageQueue: string[];
}

// Track all active connections
const activeConnections = new Map<string, ConnectionData>();
let connectionIdCounter = 0;

/**
 * Start the WebSocket tunnel server
 */
const server = Bun.serve<ConnectionData>({
    port: TUNNEL_PORT,
    fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === "/tunnel" || url.pathname === "/websocket-tunnel") {
            const hostname = url.searchParams.get("hostname") || DEFAULT_VNC_HOST;
            const port = url.searchParams.get("port") || DEFAULT_VNC_PORT;
            const password = url.searchParams.get("password") || DEFAULT_VNC_PASSWORD;
            const id = String(++connectionIdCounter);

            console.log(`[Tunnel] New connection request #${id}: ${hostname}:${port}`);

            // Get requested subprotocol (Guacamole library uses "guacamole")
            const secProtocol = req.headers.get("sec-websocket-protocol");
            console.log(`[${id}] Subprotocol requested: ${secProtocol}`);

            // Bun automatically handles sec-websocket-protocol negotiation
            const upgraded = server.upgrade(req, {
                data: { hostname, port, password, id, messageQueue: [] },
            });

            if (!upgraded) {
                return new Response("WebSocket upgrade failed", { status: 400 });
            }
            return undefined;
        }

        if (url.pathname === "/health") {
            return new Response(
                JSON.stringify({
                    status: "ok",
                    guacd: `${GUACD_HOST}:${GUACD_PORT}`,
                    connections: activeConnections.size,
                }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response("Guacamole Tunnel Server", { status: 200 });
    },
    websocket: {
        async open(ws) {
            const id = ws.data.id;
            const { hostname, port, password } = ws.data;
            console.log(`[${id}] WebSocket connected, connecting to guacd...`);

            activeConnections.set(id, ws.data);

            // Buffer for incomplete instructions
            let dataBuffer = '';

            try {
                console.log(`[${id}] Calling Bun.connect to ${GUACD_HOST}:${GUACD_PORT}...`);
                const socket = await Bun.connect({
                    hostname: GUACD_HOST,
                    port: GUACD_PORT,
                    socket: {
                        data(socket, data) {
                            // Simple passthrough: forward all data from guacd to browser
                            const message = data.toString();
                            dataBuffer += message;

                            // Send complete instructions to browser
                            while (dataBuffer.includes(';')) {
                                const semiIdx = dataBuffer.indexOf(';');
                                const instr = dataBuffer.substring(0, semiIdx + 1);
                                dataBuffer = dataBuffer.substring(semiIdx + 1);

                                // Skip logging high-frequency frame data
                                const isFrameData = instr.startsWith('4.blob') ||
                                    instr.startsWith('3.img') ||
                                    instr.startsWith('3.end') ||
                                    instr.startsWith('3.ack') ||
                                    instr.startsWith('4.sync');
                                if (!isFrameData) {
                                    const preview = instr.length > 80 ? instr.substring(0, 80) + "..." : instr;
                                    console.log(`[${id}] guacd -> browser: ${preview}`);
                                }
                                try {
                                    ws.send(instr);
                                } catch (e) {
                                    console.error(`[${id}] Failed to send to WebSocket:`, e);
                                }
                            }
                        },
                        open(socket) {
                            console.log(`[${id}] Connected to guacd (passthrough mode)`);
                            ws.data.guacdSocket = socket;

                            // Flush any queued messages from browser
                            while (ws.data.messageQueue.length > 0) {
                                const msg = ws.data.messageQueue.shift();
                                if (msg) socket.write(msg);
                            }
                        },
                        close(socket) {
                            console.log(`[${id}] guacd connection closed`);
                            try {
                                ws.close();
                            } catch (e) { }
                        },
                        error(socket, error) {
                            console.error(`[${id}] guacd error:`, error);
                        },
                    }
                });
            } catch (error) {
                console.error(`[${id}] Failed to connect to guacd:`, error);
                ws.close();
            }
        },
        message(ws, message) {
            const id = ws.data.id;
            const msgStr = message.toString();

            // Skip logging high-frequency messages (ack, sync, nop, ping)
            const isNoisy = msgStr.startsWith('3.ack') ||
                msgStr.startsWith('4.sync') ||
                msgStr.startsWith('3.nop') ||
                msgStr.startsWith('0.,4.ping');
            if (!isNoisy) {
                const preview = msgStr.length > 100 ? msgStr.substring(0, 100) + "..." : msgStr;
                console.log(`[${id}] browser -> guacd: ${preview}`);
            }

            // Handle internal tunnel messages (opcode "0" with empty string)
            // Format: "0.,4.ping,13.timestamp;" 
            if (msgStr.startsWith('0.,')) {
                // Parse internal instruction
                const parsed = parseInstruction(msgStr);
                const cmd = parsed.args[0];

                if (cmd === 'ping') {
                    // Respond with pong containing the same timestamp
                    const timestamp = parsed.args[1] || '';
                    const pong = buildInstruction('0', ['pong', timestamp]);
                    console.log(`[${id}] Internal ping -> pong: ${pong}`);
                    ws.send(pong);
                    return;
                }
                // Other internal messages are not forwarded
                console.log(`[${id}] Internal message handled: ${cmd}`);
                return;
            }

            if (ws.data.guacdSocket) {
                try {
                    ws.data.guacdSocket.write(msgStr);
                } catch (e) {
                    console.error(`[${id}] Failed to write to guacd:`, e);
                }
            } else {
                // Queue message until guacd connects
                console.log(`[${id}] Queuing message (guacd not ready)`);
                ws.data.messageQueue.push(msgStr);
            }
        },
        close(ws) {
            const id = ws.data.id;
            console.log(`[${id}] WebSocket closed`);

            if (ws.data.guacdSocket) {
                try {
                    ws.data.guacdSocket.end();
                } catch (e) { }
            }
            activeConnections.delete(id);
        },
    },
});

console.log(`
╔═══════════════════════════════════════════════════╗
║       Guacamole WebSocket Tunnel Server           ║
╠═══════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${TUNNEL_PORT}/tunnel             ║
║  guacd:     ${GUACD_HOST}:${GUACD_PORT}                            ║
║  Health:    http://localhost:${TUNNEL_PORT}/health           ║
╚═══════════════════════════════════════════════════╝
`);
