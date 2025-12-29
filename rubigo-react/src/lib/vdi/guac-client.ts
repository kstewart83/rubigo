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
    onCursor?: (cursorUrl: string, hotspotX: number, hotspotY: number) => void;
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
    private expectedArgs: string[] = [];
    private pendingCursor: { args: string[] } | null = null;

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
                // Store expected args (skipping first which is version)
                this.expectedArgs = args;
                console.log(`[GuacClient] Got args (${args.length} expected), sending connect...`);
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

            case 'cursor':
                this.handleCursor(args);
                break;
        }
    }

    private sendConnect(): void {
        const { vncHost, vncPort, vncPassword = '' } = this.options;

        // Per Guacamole protocol spec, client must send these BEFORE connect:
        // - size (display dimensions)
        // - audio (supported audio codecs)
        // - video (supported video codecs)  
        // - image (supported image formats)
        // - connect (terminates handshake)

        console.log('[GuacClient] Sending handshake instructions...');

        // Send optimal display size (width, height, dpi)
        this.sendInstruction('size', '1920', '1080', '96');

        // Send supported audio codecs (none for now)
        this.sendInstruction('audio');

        // Send supported video codecs (none)
        this.sendInstruction('video');

        // Send supported image formats
        this.sendInstruction('image', 'image/png', 'image/jpeg', 'image/webp');

        // Build connect args to match exactly what guacd expects
        // The args instruction tells us the expected parameter names
        const connectArgs: string[] = [];

        for (const argName of this.expectedArgs) {
            switch (argName) {
                case 'VERSION_1_5_0':
                    connectArgs.push('VERSION_1_5_0');
                    break;
                case 'hostname':
                    connectArgs.push(vncHost);
                    break;
                case 'port':
                    connectArgs.push(vncPort);
                    break;
                case 'password':
                    connectArgs.push(vncPassword);
                    break;
                default:
                    // All other args default to empty
                    connectArgs.push('');
                    break;
            }
        }

        console.log(`[GuacClient] Sending connect with ${connectArgs.length} args`);
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
        // img(stream, mode, layer, mimetype, x, y)
        const [stream, mode, layerStr, mimetype, xStr, yStr] = args;
        const layer = parseInt(layerStr);

        if (layer === -1) {
            // Cursor layer - debug only when needed
        }

        this.activeStreams.set(stream, {
            layer: layer,
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
            const layer = streamData.layer;
            const layerData = this.ensureLayer(layer);
            const img = new Image();
            img.onload = () => {
                layerData.ctx.drawImage(img, streamData.x, streamData.y);

                // If this was layer -1 (cursor) and we have a pending cursor, process it now
                if (layer === -1 && this.pendingCursor) {
                    this.extractCursor(this.pendingCursor.args);
                    this.pendingCursor = null;
                }

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

    /**
     * Handle cursor instruction - for layer -1, defer until image stream completes
     * Format: cursor(hotspotX, hotspotY, srcL, srcX, srcY, srcW, srcH)
     */
    private handleCursor(args: string[]): void {
        if (args.length < 7) return;

        const layerIdx = parseInt(args[2]);

        // For the cursor buffer layer (-1), defer until image stream completes
        if (layerIdx === -1) {
            this.pendingCursor = { args };
            return;
        }

        // For other layers, extract immediately
        this.extractCursor(args);
    }

    /**
     * Extract cursor image from layer and notify viewer
     */
    private extractCursor(args: string[]): void {
        const [hotspotXStr, hotspotYStr, srcLStr, srcXStr, srcYStr, srcWStr, srcHStr] = args;
        const hotspotX = parseInt(hotspotXStr);
        const hotspotY = parseInt(hotspotYStr);
        const layerIdx = parseInt(srcLStr);
        const srcX = parseInt(srcXStr);
        const srcY = parseInt(srcYStr);
        const srcW = parseInt(srcWStr);
        const srcH = parseInt(srcHStr);


        // Get cursor image from the layer
        const layer = this.layers.get(layerIdx);
        if (!layer) {
            this.options.onCursor?.('default', 0, 0);
            return;
        }

        if (srcW === 0 || srcH === 0) {
            this.options.onCursor?.('', 0, 0);
            return;
        }

        // Create a temporary canvas to extract just the cursor region
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = srcW;
        cursorCanvas.height = srcH;
        const cursorCtx = cursorCanvas.getContext('2d')!;
        cursorCtx.drawImage(
            layer.canvas,
            srcX, srcY, srcW, srcH,
            0, 0, srcW, srcH
        );

        // Check if the cursor canvas has any non-transparent pixels
        const imageData = cursorCtx.getImageData(0, 0, srcW, srcH);
        let hasContent = false;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) {
                hasContent = true;
                break;
            }
        }

        if (!hasContent) {
            this.options.onCursor?.('default', 0, 0);
            return;
        }

        const cursorUrl = cursorCanvas.toDataURL('image/png');
        this.options.onCursor?.(cursorUrl, hotspotX, hotspotY);
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
