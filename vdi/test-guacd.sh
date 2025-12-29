#!/bin/bash
# Test guacd -> VNC connection directly

HOST="localhost"
PORT="4822"
VNC_HOST="host.docker.internal"
VNC_PORT="15901"
VNC_PASS="rubigo"

echo "Testing guacd -> VNC connection..."
echo "guacd: $HOST:$PORT"
echo "VNC:   $VNC_HOST:$VNC_PORT"
echo ""

# Build the connect instruction
# Format: length.value for each arg
# Args in order: VERSION, hostname, port, read-only, encodings, username, password, ...
# We'll fill required ones and leave rest empty

VERSION="VERSION_1_5_0"
CONNECT="7.connect"
CONNECT+=",${#VERSION}.$VERSION"
CONNECT+=",${#VNC_HOST}.$VNC_HOST"
CONNECT+=",${#VNC_PORT}.$VNC_PORT"
CONNECT+=",0."  # read-only
CONNECT+=",0."  # encodings
CONNECT+=",0."  # username
CONNECT+=",${#VNC_PASS}.$VNC_PASS"
# Fill remaining 37 args with empty strings
for i in {1..37}; do
    CONNECT+=",0."
done
CONNECT+=";"

echo "Step 1: Sending select..."
(
    echo "6.select,3.vnc;"
    sleep 1
    echo "Step 2: Sending connect..." >&2
    echo "$CONNECT"
    sleep 2
    echo "Step 3: Waiting for response..." >&2
) | nc -q 5 $HOST $PORT 2>&1 | while read -r line; do
    if [[ "$line" == *"ready"* ]]; then
        echo "✓ SUCCESS: VNC connected!"
        echo "Response: $line"
    elif [[ "$line" == *"error"* ]]; then
        echo "✗ ERROR from guacd:"
        echo "$line"
    else
        echo "Response: ${line:0:100}..."
    fi
done
