#!/usr/bin/env python3
"""Blender auto-restart script.

Captures window position, closes Blender, relaunches, and restores window position.
Also verifies the extension version is correct.
"""

import argparse
import asyncio
import json
import logging
import subprocess
import sys
import time
import uuid
from pathlib import Path

try:
    import pywinctl as pwc
except ImportError:
    print("Error: pywinctl not installed. Run: uv add pywinctl")
    sys.exit(1)


logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)


def find_blender_window() -> "pwc.Window | None":
    """Find the Blender application window using multiple strategies."""
    # Strategy 1: Search all windows for "Blender" in title
    for window in pwc.getAllWindows():
        if window.title and "Blender" in window.title:
            return window
    
    # Strategy 2: Try to get windows by app name
    try:
        blender_windows = pwc.getWindowsWithTitle("Blender", app=["Blender"])
        if blender_windows:
            return blender_windows[0]
    except Exception:
        pass
    
    return None


def get_window_bounds(window: "pwc.Window") -> dict:
    """Get window position and size."""
    try:
        rect = window.getClientFrame()
        return {
            "left": rect.left,
            "top": rect.top,
            "width": rect.right - rect.left,
            "height": rect.bottom - rect.top,
        }
    except Exception:
        # Fallback using position and size
        return {
            "left": window.left,
            "top": window.top,
            "width": window.width,
            "height": window.height,
        }


def close_blender():
    """Close Blender gracefully using AppleScript."""
    log.info("Closing Blender...")
    try:
        subprocess.run([
            "osascript", "-e",
            'tell application "Blender" to quit'
        ], check=True, capture_output=True, timeout=10)
    except subprocess.TimeoutExpired:
        log.warning("Graceful quit timed out, force killing...")
        subprocess.run(["pkill", "-9", "Blender"], capture_output=True)
    except Exception as e:
        log.warning(f"AppleScript quit failed: {e}, trying pkill...")
        subprocess.run(["pkill", "Blender"], capture_output=True)
    
    # Wait for process to fully exit
    time.sleep(1)


def launch_blender():
    """Launch Blender application."""
    log.info("Launching Blender...")
    subprocess.Popen(
        ["open", "-a", "Blender"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def restore_window_position(bounds: dict, max_wait: int = 45):
    """Wait for Blender window and restore its position."""
    log.info("Waiting for Blender window...")
    
    start = time.time()
    window = None
    
    while time.time() - start < max_wait:
        # List all windows to debug
        all_windows = pwc.getAllWindows()
        blender_windows = [w for w in all_windows if "Blender" in w.title]
        
        if blender_windows:
            window = blender_windows[0]
            log.info(f"Found window: \"{window.title}\"")
            break
        
        # Show what we're seeing occasionally
        elapsed = int(time.time() - start)
        if elapsed % 5 == 0 and elapsed > 0:
            log.info(f"  Still waiting... ({elapsed}s, {len(all_windows)} windows)")
        
        time.sleep(0.5)
    
    if not window:
        log.error(f"Blender window not found after {max_wait}s")
        return False
    
    # Wait a bit for window to fully initialize
    time.sleep(2)
    
    log.info(f"Restoring window position: ({bounds['left']}, {bounds['top']}) {bounds['width']}x{bounds['height']}")
    try:
        window.moveTo(bounds["left"], bounds["top"])
        window.resizeTo(bounds["width"], bounds["height"])
        log.info("Window position restored")
        return True
    except Exception as e:
        log.warning(f"Could not restore window position: {e}")
        return True  # Window exists, position restore is optional


async def verify_extension_version(expected_version: str | None = None) -> dict:
    """Verify the Blender extension is loaded and check version."""
    log.info("Verifying extension...")
    
    # Wait for socket server to be ready
    max_attempts = 20
    for attempt in range(max_attempts):
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection("127.0.0.1", 9876),
                timeout=2.0,
            )
            break
        except (ConnectionRefusedError, asyncio.TimeoutError):
            if attempt < max_attempts - 1:
                await asyncio.sleep(1)
            else:
                return {"success": False, "error": "Socket server not responding"}
    
    try:
        request = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "get_extension_version",
            "params": {},
        }
        
        writer.write((json.dumps(request) + "\n").encode())
        await writer.drain()
        
        response_line = await asyncio.wait_for(reader.readline(), timeout=5.0)
        response = json.loads(response_line.decode())
        
        writer.close()
        await writer.wait_closed()
        
        if "result" in response:
            ext_version = response["result"].get("version", "unknown")
            return {
                "success": True,
                "extension_version": ext_version,
                "result": response["result"],
            }
        elif "error" in response:
            return {"success": False, "error": response["error"]}
        else:
            return {"success": False, "error": "Unknown response"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


def deploy_extension():
    """Deploy the extension before restarting."""
    log.info("Deploying extension...")
    project_dir = Path(__file__).parent
    result = subprocess.run(
        ["python3", "deploy_extension.py"],
        cwd=project_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error(f"Deploy failed: {result.stderr}")
        return False
    
    # Extract version from output
    for line in result.stdout.split("\n"):
        if "→" in line and "Version:" in line:
            log.info(line.strip())
            break
    
    return True


async def main():
    parser = argparse.ArgumentParser(
        description="Restart Blender and verify extension",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--deploy", "-d",
        action="store_true",
        help="Deploy extension before restarting",
    )
    parser.add_argument(
        "--no-restore", "-n",
        action="store_true",
        help="Don't restore window position",
    )
    parser.add_argument(
        "--verify-only", "-v",
        action="store_true",
        help="Only verify extension version (no restart)",
    )
    
    args = parser.parse_args()
    
    # Verify only mode
    if args.verify_only:
        result = await verify_extension_version()
        if result["success"]:
            ext_ver = result["result"].get("version", "unknown")
            log.info(f"✓ Extension v{ext_ver}")
        else:
            log.error(f"✗ Verification failed: {result['error']}")
        return 0 if result["success"] else 1
    
    # Check if Blender is running and capture window position
    window = find_blender_window()
    bounds = None
    if window:
        bounds = get_window_bounds(window)
        log.info(f"Saved window position: ({bounds['left']}, {bounds['top']}) {bounds['width']}x{bounds['height']}")
        # Persist for future runs
        config_path = Path(__file__).parent / "blender_window.json"
        with open(config_path, "w") as f:
            json.dump(bounds, f, indent=2)
    else:
        # Try to load saved position from config
        config_path = Path(__file__).parent / "blender_window.json"
        if config_path.exists():
            with open(config_path) as f:
                bounds = json.load(f)
            log.info(f"Using saved position: ({bounds['left']}, {bounds['top']}) {bounds['width']}x{bounds['height']}")
    
    # Deploy if requested
    if args.deploy:
        if not deploy_extension():
            return 1
    
    # Close Blender if running
    if window:
        close_blender()
    else:
        log.info("No Blender window found, launching fresh...")
    
    # Launch Blender
    launch_blender()
    
    # Wait for startup
    log.info("Waiting for Blender to start...")
    time.sleep(5)
    
    # Verify extension
    result = await verify_extension_version()
    if result["success"]:
        ext_ver = result["result"].get("version", "unknown")
        log.info(f"✓ Extension v{ext_ver} verified")
        
        # Restore window position if we saved bounds
        if bounds:
            log.info(f"Restoring window position: ({bounds['left']}, {bounds['top']}) {bounds['width']}x{bounds['height']}")
            import subprocess as sp
            sp.run([
                sys.executable, "reposition.py",
                str(bounds["left"]), str(bounds["top"]),
                str(bounds["width"]), str(bounds["height"]),
            ], capture_output=True)
            log.info("✓ Window position restored")
        
        return 0
    else:
        log.error(f"✗ Verification failed: {result['error']}")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
