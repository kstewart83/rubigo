/**
 * Test guacd -> VNC connection directly
 */

const GUACD_HOST = "localhost";
const GUACD_PORT = 4822;
const VNC_HOST = "host.docker.internal";
const VNC_PORT = "15901";
const VNC_PASS = "rubigo";

console.log("Testing guacd -> VNC connection...");
console.log(`guacd: ${GUACD_HOST}:${GUACD_PORT}`);
console.log(`VNC: ${VNC_HOST}:${VNC_PORT}`);
console.log("");

const socket = await Bun.connect({
    hostname: GUACD_HOST,
    port: GUACD_PORT,
    socket: {
        data(socket, data) {
            const msg = data.toString();
            console.log("RECV:", msg.substring(0, 200) + (msg.length > 200 ? "..." : ""));

            if (msg.includes("4.args")) {
                console.log("\n✓ Got args, sending connect...\n");
                // Simple connect with just the essential params
                const connect = `7.connect,${VNC_HOST.length}.${VNC_HOST},${VNC_PORT.length}.${VNC_PORT},${VNC_PASS.length}.${VNC_PASS};`;
                console.log("SEND:", connect);
                socket.write(connect);
            }

            if (msg.includes("5.ready")) {
                console.log("\n🎉 SUCCESS: VNC connected!\n");
            }

            if (msg.includes("5.error") || msg.includes("4.error")) {
                console.log("\n❌ ERROR:", msg, "\n");
            }
        },
        open(socket) {
            console.log("Connected to guacd\n");
            const select = "6.select,3.vnc;";
            console.log("SEND:", select);
            socket.write(select);
        },
        close(socket) {
            console.log("\nConnection closed");
        },
        error(socket, error) {
            console.error("Error:", error);
        },
    },
});

// Keep alive for 5 seconds
await new Promise(resolve => setTimeout(resolve, 5000));
socket.end();
console.log("\nDone");
