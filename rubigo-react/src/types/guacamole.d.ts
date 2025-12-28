/**
 * Guacamole TypeScript Declarations
 *
 * Type definitions for guacamole-common-js library.
 * This provides browser-based remote desktop access.
 */

declare module "guacamole-common-js" {
    /**
     * Guacamole client - manages connection and display
     */
    export class Client {
        constructor(tunnel: Tunnel);

        /** Connect to the remote desktop */
        connect(data?: string): void;

        /** Disconnect from the remote desktop */
        disconnect(): void;

        /** Get the display element */
        getDisplay(): Display;

        /** Send mouse event */
        sendMouseState(state: Mouse.State): void;

        /** Send key event */
        sendKeyEvent(pressed: boolean, keysym: number): void;

        /** Send clipboard data */
        setClipboard(data: ArrayBuffer, mimetype: string): void;

        /** Connection state change handler */
        onstatechange: ((state: Client.State) => void) | null;

        /** Error handler */
        onerror: ((error: Status) => void) | null;

        /** Clipboard received handler */
        onclipboard: ((stream: InputStream, mimetype: string) => void) | null;

        /** File received handler */
        onfile: ((stream: InputStream, mimetype: string, filename: string) => void) | null;

        /** Filesystem received handler */
        onfilesystem: ((object: Object, name: string) => void) | null;

        /** Name instruction received */
        onname: ((name: string) => void) | null;

        /** Required parameters handler */
        onrequired: ((parameters: string[]) => void) | null;

        /** Sync instruction handler */
        onsync: ((timestamp: number) => void) | null;
    }

    export namespace Client {
        enum State {
            IDLE = 0,
            CONNECTING = 1,
            WAITING = 2,
            CONNECTED = 3,
            DISCONNECTING = 4,
            DISCONNECTED = 5,
        }
    }

    /**
     * Display - manages visual output
     */
    export class Display {
        /** Get the DOM element for the display */
        getElement(): HTMLElement;

        /** Get display width */
        getWidth(): number;

        /** Get display height */
        getHeight(): number;

        /** Scale the display */
        scale(scale: number): void;

        /** Show cursor */
        showCursor(shown: boolean): void;

        /** Set cursor */
        setCursor(canvas: HTMLCanvasElement, x: number, y: number): void;

        /** Size change handler */
        onresize: ((width: number, height: number) => void) | null;

        /** Cursor change handler */
        oncursor: ((canvas: HTMLCanvasElement, x: number, y: number) => void) | null;
    }

    /**
     * Tunnel - connection transport
     */
    export interface Tunnel {
        /** Send data through tunnel */
        sendMessage(...elements: string[]): void;

        /** Disconnect tunnel */
        disconnect(): void;

        /** State change handler */
        onstatechange: ((state: Tunnel.State) => void) | null;

        /** Instruction received handler */
        oninstruction: ((opcode: string, parameters: string[]) => void) | null;

        /** Error handler */
        onerror: ((status: Status) => void) | null;
    }

    export namespace Tunnel {
        enum State {
            CLOSED = 0,
            OPEN = 1,
            UNSTABLE = 2,
        }
    }

    /**
     * WebSocket tunnel implementation
     */
    export class WebSocketTunnel implements Tunnel {
        constructor(tunnelURL: string);
        sendMessage(...elements: string[]): void;
        disconnect(): void;
        onstatechange: ((state: Tunnel.State) => void) | null;
        oninstruction: ((opcode: string, parameters: string[]) => void) | null;
        onerror: ((status: Status) => void) | null;
        state: Tunnel.State;
    }

    /**
     * HTTP tunnel implementation
     */
    export class HTTPTunnel implements Tunnel {
        constructor(tunnelURL: string, crossDomain?: boolean, extraHeaders?: Record<string, string>);
        sendMessage(...elements: string[]): void;
        disconnect(): void;
        onstatechange: ((state: Tunnel.State) => void) | null;
        oninstruction: ((opcode: string, parameters: string[]) => void) | null;
        onerror: ((status: Status) => void) | null;
        state: Tunnel.State;
    }

    /**
     * Mouse handler
     */
    export class Mouse {
        constructor(element: HTMLElement);

        /** Mouse button/position state handler */
        onmousedown: ((state: Mouse.State) => void) | null;
        onmouseup: ((state: Mouse.State) => void) | null;
        onmousemove: ((state: Mouse.State) => void) | null;
    }

    export namespace Mouse {
        interface State {
            x: number;
            y: number;
            left: boolean;
            middle: boolean;
            right: boolean;
            up: boolean;
            down: boolean;
        }

        class Touchpad extends Mouse {
            constructor(element: HTMLElement);
        }

        class Touchscreen extends Mouse {
            constructor(element: HTMLElement);
        }
    }

    /**
     * Keyboard handler
     */
    export class Keyboard {
        constructor(element: HTMLElement | Document);

        /** Key press/release handlers */
        onkeydown: ((keysym: number) => boolean | void) | null;
        onkeyup: ((keysym: number) => void) | null;

        /** Reset keyboard state */
        reset(): void;
    }

    /**
     * Status for errors
     */
    export class Status {
        code: number;
        message: string;
        isError(): boolean;
    }

    /**
     * Input stream
     */
    export class InputStream {
        index: number;
        onblob: ((data: string) => void) | null;
        onend: (() => void) | null;
        sendAck(message: string, code: number): void;
    }

    /**
     * Output stream
     */
    export class OutputStream {
        index: number;
        onack: ((status: Status) => void) | null;
        sendBlob(data: string): void;
        sendEnd(): void;
    }

    /**
     * Object (filesystem)
     */
    export class Object {
        index: number;
        onbody: ((stream: InputStream, mimetype: string, filename: string) => void) | null;
        onundefine: (() => void) | null;
        requestInputStream(name: string): void;
        getOutputStream(mimetype: string, name: string): OutputStream;
        createOutputStream(mimetype: string, name: string): OutputStream;
    }

    /**
     * String reader utility
     */
    export class StringReader {
        constructor(stream: InputStream);
        ontext: ((text: string) => void) | null;
        onend: (() => void) | null;
    }

    /**
     * String writer utility
     */
    export class StringWriter {
        constructor(stream: OutputStream);
        sendText(text: string): void;
        sendEnd(): void;
    }
}
