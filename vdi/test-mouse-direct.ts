#!/usr/bin/env bun
/**
 * Direct test of guacd mouse input
 * 
 * This script connects directly to guacd via TCP (bypassing our WebSocket tunnel)
 * to test if mouse input causes a disconnect.
 */

import { Socket } from 'net';

const GUACD_HOST = 'localhost';
const GUACD_PORT = 4822;
const VNC_HOST = 'host.docker.internal';
const VNC_PORT = '15901';
const VNC_PASSWORD = 'rubigo';

// Build Guacamole instruction
function buildInstruction(opcode: string, args: string[]): string {
    const parts = [opcode, ...args];
    return parts.map(p => `${String(p).length}.${p}`).join(',') + ';';
}

// Parse Guacamole instruction
function parseInstruction(data: string): { opcode: string; args: string[] } | null {
    if (!data.includes(';')) return null;
    const instrStr = data.substring(0, data.indexOf(';'));
    const parts: string[] = [];
    let pos = 0;
    while (pos < instrStr.length) {
        const dotPos = instrStr.indexOf('.', pos);
        if (dotPos === -1) break;
        const len = parseInt(instrStr.substring(pos, dotPos));
        parts.push(instrStr.substring(dotPos + 1, dotPos + 1 + len));
        pos = dotPos + 1 + len + 1;
    }
    if (parts.length === 0) return null;
    return { opcode: parts[0], args: parts.slice(1) };
}

console.log('=== Direct guacd Mouse Test ===');
console.log(`Connecting to guacd at ${GUACD_HOST}:${GUACD_PORT}...`);

const socket = new Socket();
let buffer = '';
let phase = 'select';
let mouseTestCount = 0;

socket.connect(GUACD_PORT, GUACD_HOST, () => {
    console.log('Connected to guacd');
    console.log('Sending: select vnc');
    socket.write(buildInstruction('select', ['vnc']));
});

socket.on('data', (data) => {
    buffer += data.toString();

    // Process complete instructions
    while (buffer.includes(';')) {
        const semiIdx = buffer.indexOf(';');
        const instrStr = buffer.substring(0, semiIdx + 1);
        buffer = buffer.substring(semiIdx + 1);

        const instr = parseInstruction(instrStr);
        if (!instr) continue;

        const preview = instrStr.length > 80 ? instrStr.substring(0, 80) + '...' : instrStr;

        // Skip noisy image data
        if (!['img', 'blob', 'end', 'sync'].includes(instr.opcode)) {
            console.log(`<-- ${instr.opcode}: ${preview}`);
        }

        if (instr.opcode === 'args' && phase === 'select') {
            console.log('Got args, sending connect...');
            // Build empty args for each expected parameter
            const connectArgs = [
                'VERSION_1_5_0',  // version
                VNC_HOST,         // hostname
                VNC_PORT,         // port
                '',               // read-only
                '',               // encodings
                '',               // username
                VNC_PASSWORD,     // password
                '',               // swap-red-blue
                '',               // color-depth
                '',               // cursor
                '',               // autoretry
                '',               // clipboard-encoding
                '',               // disable-copy
                '',               // disable-paste
                '',               // dest-host
                '',               // dest-port
                '',               // enable-audio
                '',               // audio-servername
                '',               // enable-sftp
                '',               // sftp-hostname
                '',               // sftp-port
                '',               // sftp-host-key
                '',               // sftp-username
                '',               // sftp-password
                '',               // sftp-private-key
                '',               // sftp-passphrase
                '',               // sftp-directory
                '',               // sftp-root-directory
                '',               // sftp-server-alive-interval
                '',               // recording-path
                '',               // recording-name
                '',               // recording-exclude-output
                '',               // recording-exclude-mouse
                '',               // recording-include-keys
                '',               // create-recording-path
                '',               // wol-send-packet
                '',               // wol-mac-addr
                '',               // wol-broadcast-addr
                '',               // wol-wait-time
                '',               // force-lossless
            ];
            console.log(`Sending connect with ${connectArgs.length} args`);
            socket.write(buildInstruction('connect', connectArgs));
            phase = 'connect';
        }

        if (instr.opcode === 'ready') {
            console.log('Got ready! Connection established.');
            console.log('Sending size...');
            socket.write(buildInstruction('size', ['0', '1920', '1080']));
            phase = 'ready';

            // Start mouse test after short delay
            setTimeout(() => {
                console.log('\n=== STARTING MOUSE TEST ===');
                sendMouseEvent();
            }, 2000);
        }

        if (instr.opcode === 'size' && phase === 'ready') {
            console.log(`Display size: ${instr.args.slice(1).join('x')}`);
        }

        if (instr.opcode === 'sync') {
            // Respond to sync
            socket.write(buildInstruction('sync', [instr.args[0]]));
        }
    }
});

function sendMouseEvent() {
    if (mouseTestCount >= 10) {
        console.log('\n=== MOUSE TEST PASSED! ===');
        console.log('Successfully sent 10 mouse events without disconnect');
        socket.end();
        return;
    }

    mouseTestCount++;
    const x = 100 + mouseTestCount * 10;
    const y = 100 + mouseTestCount * 5;
    console.log(`--> mouse(x=${x}, y=${y}, mask=0) [${mouseTestCount}/10]`);
    socket.write(buildInstruction('mouse', [x.toString(), y.toString(), '0']));

    // Send next mouse event after 500ms
    setTimeout(sendMouseEvent, 500);
}

socket.on('close', () => {
    console.log('\n=== CONNECTION CLOSED ===');
    console.log(`Mouse events sent before close: ${mouseTestCount}`);
    if (mouseTestCount < 10) {
        console.log('FAILED: Connection closed before completing mouse test');
    }
    process.exit(mouseTestCount < 10 ? 1 : 0);
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
    process.exit(1);
});
