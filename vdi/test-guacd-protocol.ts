#!/usr/bin/env bun
/**
 * Direct guacd Protocol Test Script
 * 
 * Connects directly to guacd via TCP socket (bypasses tunnel and browser).
 * Tests the full Guacamole protocol handshake and input events.
 * 
 * Usage:
 *   bun run vdi/test-guacd-protocol.ts [options]
 * 
 * Options:
 *   --port 5900     VNC port (default: 5900 for QEMU VNC)
 *   --host localhost VNC host (default: host.docker.internal)
 *   --password ""   VNC password (empty for QEMU VNC)
 */

const GUACD_HOST = 'localhost';
const GUACD_PORT = 4822;

// Parse command line args
const args = process.argv.slice(2);
const VNC_HOST = args.includes('--host') ? args[args.indexOf('--host') + 1] : 'host.docker.internal';
const VNC_PORT = args.includes('--port') ? args[args.indexOf('--port') + 1] : '5900';
const VNC_PASSWORD = args.includes('--password') ? args[args.indexOf('--password') + 1] : '';

// State machine
type State = 'CONNECTING' | 'SELECTING' | 'WAITING_ARGS' | 'WAITING_READY' | 'CONNECTED' | 'DISCONNECTED';
let state: State = 'CONNECTING';
let startTime = Date.now();
let expectedArgs: string[] = [];
let syncCount = 0;
let lastSyncTime = 0;

// Statistics
const stats = {
    instructionsSent: 0,
    instructionsReceived: 0,
    mouseEventsSent: 0,
    keyEventsSent: 0,
};

// --------------------------------------------------
// Protocol Helpers
// --------------------------------------------------

function buildInstruction(opcode: string, args: string[]): string {
    const parts = [opcode, ...args];
    return parts.map(p => `${String(p).length}.${p}`).join(',') + ';';
}

function parseInstructions(data: string): Array<{ opcode: string; args: string[] }> {
    const instructions: Array<{ opcode: string; args: string[] }> = [];
    let buffer = data;

    while (buffer.includes(';')) {
        const semiIdx = buffer.indexOf(';');
        const instrStr = buffer.substring(0, semiIdx);
        buffer = buffer.substring(semiIdx + 1);

        const parts: string[] = [];
        let pos = 0;
        while (pos < instrStr.length) {
            const dotPos = instrStr.indexOf('.', pos);
            if (dotPos === -1) break;
            const len = parseInt(instrStr.substring(pos, dotPos));
            if (isNaN(len)) break;
            parts.push(instrStr.substring(dotPos + 1, dotPos + 1 + len));
            pos = dotPos + 1 + len + 1;
        }

        if (parts.length > 0) {
            instructions.push({ opcode: parts[0], args: parts.slice(1) });
        }
    }

    return instructions;
}

function log(direction: 'in' | 'out' | 'info' | 'error', message: string): void {
    const elapsed = Date.now() - startTime;
    const arrow = direction === 'in' ? '◄──' : direction === 'out' ? '──►' : direction === 'error' ? '❌ ' : '   ';
    console.log(`[${elapsed.toString().padStart(6)}ms] ${arrow} ${message}`);
}

// --------------------------------------------------
// Main Test
// --------------------------------------------------

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║      Direct guacd Protocol Test                   ║');
console.log('╠═══════════════════════════════════════════════════╣');
console.log(`║  guacd:    ${GUACD_HOST}:${GUACD_PORT}`.padEnd(53) + '║');
console.log(`║  VNC:      ${VNC_HOST}:${VNC_PORT}`.padEnd(53) + '║');
console.log(`║  Password: ${VNC_PASSWORD || '(none)'}`.padEnd(53) + '║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

let messageBuffer = '';
let activeSocket: any = null;

function send(opcode: string, args: string[]): void {
    if (!activeSocket || state === 'DISCONNECTED') return;
    const instr = buildInstruction(opcode, args);
    activeSocket.write(instr);
    stats.instructionsSent++;
    log('out', `${opcode}(${args.slice(0, 3).join(', ')}${args.length > 3 ? '...' : ''})`);
}

async function runTest() {
    await Bun.connect({
        hostname: GUACD_HOST,
        port: GUACD_PORT,
        socket: {
            open(sock) {
                activeSocket = sock;
                log('info', `Connected to guacd at ${GUACD_HOST}:${GUACD_PORT}`);
                state = 'SELECTING';
                send('select', ['vnc']);
            },

            data(sock, data) {
                messageBuffer += data.toString();

                const instructions = parseInstructions(messageBuffer);
                // Keep unparsed data in buffer
                const lastSemi = messageBuffer.lastIndexOf(';');
                if (lastSemi !== -1) {
                    messageBuffer = messageBuffer.substring(lastSemi + 1);
                }

                for (const instr of instructions) {
                    stats.instructionsReceived++;
                    handleInstruction(instr);
                }
            },

            close(sock) {
                state = 'DISCONNECTED';
                log('error', 'CONNECTION CLOSED BY guacd');
                printStats();
                process.exit(1);
            },

            error(sock, error) {
                log('error', `Socket error: ${error}`);
                state = 'DISCONNECTED';
            },
        },
    });
}

function handleInstruction(instr: { opcode: string; args: string[] }): void {
    const { opcode, args } = instr;

    // Log cursor-related messages for debugging
    if (opcode === 'cursor') {
        // cursor(hotspotX, hotspotY, srcL, srcX, srcY, srcW, srcH)
        const [hotX, hotY, srcL, srcX, srcY, srcW, srcH] = args;
        log('in', `CURSOR: layer=${srcL}, src=${srcX},${srcY},${srcW}x${srcH}, hotspot=${hotX},${hotY}`);
        return;
    }

    if (opcode === 'size' && args[0] === '-1') {
        log('in', `SIZE layer -1: ${args[1]}x${args[2]}`);
        return;
    }

    if (opcode === 'img' && args[1] === '-1') {
        log('in', `IMG layer -1: stream=${args[0]}, pos=${args[2]},${args[3]}, mime=${args[4]}`);
        return;
    }

    // Don't log noisy image data
    const isNoisy = ['img', 'blob', 'end', 'png', 'copy', 'sync', 'size'].includes(opcode);
    if (!isNoisy) {
        log('in', `${opcode}(${args.slice(0, 3).join(', ')}${args.length > 3 ? '...' : ''})`);
    }

    switch (opcode) {
        case 'args':
            expectedArgs = args;
            log('info', `Expected ${args.length} connect args: ${args.slice(0, 5).join(', ')}...`);
            sendHandshakeAndConnect();
            break;

        case 'ready':
            state = 'CONNECTED';
            log('info', `Connected! Session ID: ${args[0]}`);
            send('size', ['0', '1920', '1080']);
            // Start input test after short delay
            setTimeout(startInputTest, 3000);
            break;

        case 'sync':
            syncCount++;
            lastSyncTime = Date.now();
            // CRITICAL: Respond to sync to keep connection alive
            log('info', `Sync #${syncCount} received (timestamp: ${args[0]})`);
            send('sync', [args[0]]);
            break;

        case 'error':
            log('error', `guacd error: ${args[0]} (code: ${args[1]})`);
            break;

        case 'disconnect':
            log('info', 'guacd sent disconnect');
            state = 'DISCONNECTED';
            break;
    }
}

function sendHandshakeAndConnect(): void {
    // Per Guacamole protocol spec, client must send these BEFORE connect:
    // - size (display dimensions)
    // - audio (supported audio codecs)
    // - video (supported video codecs)  
    // - image (supported image formats)
    // - connect (terminates handshake)

    log('info', 'Sending handshake instructions...');

    // Send optimal display size
    send('size', ['1920', '1080', '96']);

    // Send supported audio codecs (we don't support any for now)
    send('audio', []);

    // Send supported video codecs (none)
    send('video', []);

    // Send supported image formats
    send('image', ['image/png', 'image/jpeg', 'image/webp']);

    // Build connect args based on what guacd expects
    const connectArgs: string[] = [];

    for (const argName of expectedArgs) {
        switch (argName) {
            case 'VERSION_1_5_0':
                connectArgs.push('VERSION_1_5_0');
                break;
            case 'hostname':
                connectArgs.push(VNC_HOST);
                break;
            case 'port':
                connectArgs.push(VNC_PORT);
                break;
            case 'password':
                connectArgs.push(VNC_PASSWORD);
                break;
            default:
                connectArgs.push('');
                break;
        }
    }

    log('info', `Sending connect with ${connectArgs.length} args`);
    state = 'WAITING_READY';
    send('connect', connectArgs);
}

// --------------------------------------------------
// Input Testing
// --------------------------------------------------

async function startInputTest(): Promise<void> {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║      INPUT TEST - Keyboard                        ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    log('info', 'Testing keyboard input...');

    // Test pressing 'a' key
    // X11 keysym for 'a' is 0x61 (97)
    const KEY_A = '97';

    // Key down
    log('info', 'Sending key down: a (keysym 97)');
    send('key', [KEY_A, '1']);
    stats.keyEventsSent++;

    await sleep(500);

    if (state === 'DISCONNECTED') {
        log('error', 'FAILED: Disconnected after key down');
        return;
    }

    // Key up
    log('info', 'Sending key up: a (keysym 97)');
    send('key', [KEY_A, '0']);
    stats.keyEventsSent++;

    await sleep(500);

    if (state === 'DISCONNECTED') {
        log('error', 'FAILED: Disconnected after key up');
        return;
    }

    // Send multiple keys
    log('info', 'Sending multiple keys: h, e, l, l, o');
    const keys = [
        { keysym: '104', char: 'h' },  // h
        { keysym: '101', char: 'e' },  // e
        { keysym: '108', char: 'l' },  // l
        { keysym: '108', char: 'l' },  // l
        { keysym: '111', char: 'o' },  // o
    ];

    for (const key of keys) {
        send('key', [key.keysym, '1']); // down
        await sleep(50);
        send('key', [key.keysym, '0']); // up
        await sleep(100);
        stats.keyEventsSent += 2;

        if (state === 'DISCONNECTED') {
            log('error', `FAILED: Disconnected while typing '${key.char}'`);
            return;
        }
    }

    await sleep(1000);

    if (state === 'CONNECTED') {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║      ✓ KEYBOARD TEST PASSED                       ║');
        console.log('╚═══════════════════════════════════════════════════╝');

        // Now test mouse
        await testMouse();
    }
}

async function testMouse(): Promise<void> {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║      INPUT TEST - Mouse                           ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    log('info', 'Testing mouse input...');

    // Single mouse move
    log('info', 'Sending mouse move: (100, 100)');
    send('mouse', ['100', '100', '0']);
    stats.mouseEventsSent++;

    await sleep(500);

    if (state === 'DISCONNECTED') {
        log('error', 'FAILED: Disconnected after first mouse event');
        printStats();
        return;
    }

    // More mouse moves
    for (let i = 1; i <= 5; i++) {
        const x = 100 + i * 20;
        const y = 100 + i * 10;
        log('info', `Sending mouse move ${i}: (${x}, ${y})`);
        send('mouse', [x.toString(), y.toString(), '0']);
        stats.mouseEventsSent++;
        await sleep(200);

        if (state === 'DISCONNECTED') {
            log('error', `FAILED: Disconnected after mouse event ${i}`);
            printStats();
            return;
        }
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║      ✓ MOUSE TEST PASSED                          ║');
    console.log('╚═══════════════════════════════════════════════════╝');

    printStats();

    // Graceful exit
    activeSocket?.end();
    process.exit(0);
}

function printStats(): void {
    console.log('');
    console.log('=== Statistics ===');
    console.log(`Instructions sent:     ${stats.instructionsSent}`);
    console.log(`Instructions received: ${stats.instructionsReceived}`);
    console.log(`Key events sent:       ${stats.keyEventsSent}`);
    console.log(`Mouse events sent:     ${stats.mouseEventsSent}`);
    console.log(`Sync responses:        ${syncCount}`);
    console.log(`State:                 ${state}`);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
runTest().catch(err => {
    log('error', `Fatal error: ${err}`);
    process.exit(1);
});
