/**
 * Custom Guacamole Client
 * 
 * Minimal implementation for VNC desktop rendering.
 * Based on working guac-simple.html renderer.
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GuacClientOptions {
    tunnelUrl: string;
    vncHost: string;
    vncPort: string;
    vncPassword?: string;
    onStateChange?: (state: ConnectionState) => void;
    onError?: (error: string) => void;
    onResize?: (width: number, height: number) => void;
}

interface LayerData {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

interface StreamData {
    layer: number;
    x: number;
    y: number;
    data: string;
}

export class GuacClient {
    private ws: WebSocket | null = null;
    private layers: Map<number, LayerData> = new Map();
    private activeStreams: Map<string, StreamData> = new Map();
    private messageBuffer = '';
    private state: ConnectionState = 'disconnected';

    private displayCanvas: HTMLCanvasElement;
    private displayCtx: CanvasRenderingContext2D;
    private options: GuacClientOptions;

    constructor(canvas: HTMLCanvasElement, options: GuacClientOptions) {
        this.displayCanvas = canvas;
        this.displayCtx = canvas.getContext('2d')!;
        this.displayCtx.imageSmoothingEnabled = false;
        this.options = options;
    }

    connect(): void {
        if (this.ws) {
            this.disconnect();
        }

        this.setState('connecting');
        this.messageBuffer = '';
        this.layers.clear();
        this.activeStreams.clear();

        console.log('[GuacClient] Connecting to:', this.options.tunnelUrl);
        this.ws = new WebSocket(this.options.tunnelUrl);

        this.ws.onopen = () => {
            console.log('[GuacClient] WebSocket connected, sending select...');
            this.sendInstruction('select', 'vnc');
        };

        this.ws.onmessage = (event) => {
            this.parseInstructions(event.data).forEach(instr => this.handleInstruction(instr));
        };

        this.ws.onclose = () => {
            console.log('[GuacClient] WebSocket closed');
            this.setState('disconnected');
        };

        this.ws.onerror = () => {
            console.error('[GuacClient] WebSocket error');
            this.options.onError?.('WebSocket connection failed');
            this.setState('error');
        };
    }

    disconnect(): void {
        if (this.ws) {
            // Only close if WebSocket is in a state that can be closed
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                console.log('[GuacClient] Closing WebSocket');
                this.ws.close();
            }
            this.ws = null;
        }
        this.setState('disconnected');
    }

    private setState(state: ConnectionState): void {
        this.state = state;
        this.options.onStateChange?.(state);
    }

    private sendInstruction(opcode: string, ...args: string[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const parts = [opcode, ...args];
        const msg = parts.map(p => `${String(p).length}.${p}`).join(',') + ';';
        this.ws.send(msg);
    }

    private parseInstructions(data: string): Array<{ opcode: string; args: string[] }> {
        this.messageBuffer += data;
        const instructions: Array<{ opcode: string; args: string[] }> = [];

        while (this.messageBuffer.includes(';')) {
            const semiIdx = this.messageBuffer.indexOf(';');
            const instrStr = this.messageBuffer.substring(0, semiIdx);
            this.messageBuffer = this.messageBuffer.substring(semiIdx + 1);

            const parts: string[] = [];
            let pos = 0;
            while (pos < instrStr.length) {
                const dotPos = instrStr.indexOf('.', pos);
                if (dotPos === -1) break;
                const len = parseInt(instrStr.substring(pos, dotPos));
                parts.push(instrStr.substring(dotPos + 1, dotPos + 1 + len));
                pos = dotPos + 1 + len + 1;
            }
            if (parts.length > 0) {
                instructions.push({ opcode: parts[0], args: parts.slice(1) });
            }
        }
        return instructions;
    }

    private handleInstruction(instr: { opcode: string; args: string[] }): void {
        const { opcode, args } = instr;

        switch (opcode) {
            case 'args':
                console.log('[GuacClient] Got args, sending connect...');
                this.sendConnect();
                break;

            case 'ready':
                console.log('[GuacClient] Ready!');
                this.setState('connected');
                // Request display size
                this.sendInstruction('size', '0', '1920', '1080');
                break;

            case 'size':
                this.handleSize(args);
                break;

            case 'img':
                this.handleImg(args);
                break;

            case 'blob':
                this.handleBlob(args);
                break;

            case 'end':
                this.handleEnd(args);
                break;

            case 'sync':
                this.sendInstruction('sync', args[0]);
                break;
        }
    }

    private sendConnect(): void {
        const { vncHost, vncPort, vncPassword = '' } = this.options;
        // Build connect with all required args (45 total)
        const connectArgs = [
            'VERSION_1_5_0', vncHost, vncPort, '', '', '', vncPassword,
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        this.sendInstruction('connect', ...connectArgs);
    }

    private handleSize(args: string[]): void {
        const [layerStr, widthStr, heightStr] = args;
        const layer = parseInt(layerStr);
        const width = parseInt(widthStr);
        const height = parseInt(heightStr);

        console.log(`[GuacClient] Size: layer ${layer} = ${width}x${height}`);

        if (layer === 0) {
            // Update main display canvas
            this.displayCanvas.width = width;
            this.displayCanvas.height = height;
            this.displayCtx = this.displayCanvas.getContext('2d')!;
            this.displayCtx.imageSmoothingEnabled = false;

            // Notify about resize
            this.options.onResize?.(width, height);
        }

        this.ensureLayer(layer, width, height);
    }

    private handleImg(args: string[]): void {
        const [stream, , layerStr, , xStr, yStr] = args;
        this.activeStreams.set(stream, {
            layer: parseInt(layerStr) || 0,
            x: parseInt(xStr) || 0,
            y: parseInt(yStr) || 0,
            data: ''
        });
    }

    private handleBlob(args: string[]): void {
        const [stream, data] = args;
        const streamData = this.activeStreams.get(stream);
        if (streamData) {
            streamData.data += data;
        }
    }

    private handleEnd(args: string[]): void {
        const [stream] = args;
        const streamData = this.activeStreams.get(stream);

        if (streamData && streamData.data) {
            const layerData = this.ensureLayer(streamData.layer);
            const img = new Image();
            img.onload = () => {
                layerData.ctx.drawImage(img, streamData.x, streamData.y);
                this.composeLayers();
            };
            img.src = 'data:image/png;base64,' + streamData.data;
        }

        this.activeStreams.delete(stream);
        this.sendInstruction('ack', stream, '0', 'OK');
    }

    private ensureLayer(index: number, width?: number, height?: number): LayerData {
        let layer = this.layers.get(index);
        if (!layer) {
            const canvas = document.createElement('canvas');
            canvas.width = width || 1920;
            canvas.height = height || 1080;
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = false;
            layer = { canvas, ctx };
            this.layers.set(index, layer);
        } else if (width && height) {
            layer.canvas.width = width;
            layer.canvas.height = height;
        }
        return layer;
    }

    private composeLayers(): void {
        const layer0 = this.layers.get(0);
        if (layer0) {
            this.displayCtx.drawImage(layer0.canvas, 0, 0);
        }
    }

    getState(): ConnectionState {
        return this.state;
    }

    /**
     * Send a mouse event to the remote desktop
     * @param x X coordinate (in canvas pixels)
     * @param y Y coordinate (in canvas pixels)
     * @param buttonMask Bit mask of pressed buttons (0=left, 1=middle, 2=right, 3=scroll up, 4=scroll down)
     */
    sendMouse(x: number, y: number, buttonMask: number): void {
        if (this.state !== 'connected') return;
        console.log(`[GuacClient] sendMouse: x=${x}, y=${y}, mask=${buttonMask}`);
        this.sendInstruction('mouse', x.toString(), y.toString(), buttonMask.toString());
    }

    /**
     * Send a key event to the remote desktop
     * @param keysym X11 keysym value
     * @param pressed true if key is pressed, false if released
     */
    sendKey(keysym: number, pressed: boolean): void {
        if (this.state !== 'connected') return;
        this.sendInstruction('key', keysym.toString(), pressed ? '1' : '0');
    }

    /**
     * Get the current display dimensions
     */
    getDisplaySize(): { width: number; height: number } {
        return {
            width: this.displayCanvas.width,
            height: this.displayCanvas.height,
        };
    }
}
