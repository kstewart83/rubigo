#!/usr/bin/env python3
"""MCP client for the Blender Agent socket server.

This script connects directly to the Blender socket server (bypassing MCP)
to execute commands and return JSON responses.

Usage:
    python3 mcp_client.py                     # Run all tests
    python3 mcp_client.py get_version         # Call specific method
    python3 mcp_client.py create_object '{"type": "sphere", "location": [1, 2, 3]}'
"""

import argparse
import asyncio
import json
import sys
import uuid


HOST = "127.0.0.1"
PORT = 9876


async def send_request(method: str, params: dict | None = None) -> dict:
    """Send a JSON-RPC request to Blender and return the response."""
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(HOST, PORT),
            timeout=5.0,
        )
    except asyncio.TimeoutError:
        return {"error": f"Timeout connecting to Blender at {HOST}:{PORT}"}
    except ConnectionRefusedError:
        return {"error": f"Connection refused. Is Blender running with the add-on enabled?"}
    except Exception as e:
        return {"error": f"Failed to connect: {e}"}
    
    try:
        request = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": method,
            "params": params or {},
        }
        
        message = json.dumps(request) + "\n"
        writer.write(message.encode("utf-8"))
        await writer.drain()
        
        response_line = await asyncio.wait_for(
            reader.readline(),
            timeout=30.0,
        )
        
        if not response_line:
            return {"error": "Connection closed by Blender"}
        
        response = json.loads(response_line.decode("utf-8"))
        return response
        
    finally:
        writer.close()
        await writer.wait_closed()


async def run_single_command(method: str, params_json: str | None = None):
    """Run a single command and print the result."""
    params = {}
    if params_json:
        try:
            params = json.loads(params_json)
        except json.JSONDecodeError as e:
            print(f"Error parsing params JSON: {e}", file=sys.stderr)
            sys.exit(1)
    
    result = await send_request(method, params)
    print(json.dumps(result, indent=2))


async def run_all_tests():
    """Run test commands against Blender."""
    print("=" * 60)
    print("Blender Agent Test Client")
    print("=" * 60)
    print()
    
    # Test 1: Ping
    print("1. Testing ping...")
    result = await send_request("ping")
    print(f"   Response: {json.dumps(result, indent=2)}")
    print()
    
    # Test 2: Get Version
    print("2. Testing get_version...")
    result = await send_request("get_version")
    print(f"   Response: {json.dumps(result, indent=2)}")
    print()
    
    # Test 3: Get Scene Info
    print("3. Testing get_scene_info...")
    result = await send_request("get_scene_info", {"include_transforms": True})
    print(f"   Response: {json.dumps(result, indent=2)}")
    print()
    
    print("=" * 60)
    print("Tests complete!")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Blender Agent Test Client - Direct socket connection to Blender",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 test_client.py                                    # Run all tests
  python3 test_client.py ping                               # Simple ping
  python3 test_client.py get_version                        # Get Blender version
  python3 test_client.py get_scene_info                     # Get scene objects
  python3 test_client.py create_object '{"type": "sphere"}' # Create a sphere
  python3 test_client.py transform_object '{"name": "Cube", "location": [1, 2, 3]}'
        """
    )
    parser.add_argument("method", nargs="?", help="Method to call (e.g., ping, get_version, create_object)")
    parser.add_argument("params", nargs="?", help="JSON parameters for the method")
    
    args = parser.parse_args()
    
    if args.method:
        asyncio.run(run_single_command(args.method, args.params))
    else:
        asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
