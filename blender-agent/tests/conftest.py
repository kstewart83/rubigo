"""Pytest configuration and fixtures for Blender skill tests.

Provides fixtures for:
- Connecting to Blender socket server
- Loading .blend fixture files
- Comparing scenes and renders
"""

import asyncio
import json
import uuid
from pathlib import Path
from typing import Any

import pytest


# Paths
FIXTURES_DIR = Path(__file__).parent / "fixtures"
BLEND_FIXTURES = FIXTURES_DIR / "blend"
RENDER_FIXTURES = FIXTURES_DIR / "renders"


class BlenderConnection:
    """Async connection to the Blender socket server."""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 9876):
        self.host = host
        self.port = port
    
    async def send(self, method: str, params: dict | None = None) -> Any:
        """Send a request to Blender and return the result."""
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(self.host, self.port),
            timeout=5.0,
        )
        
        try:
            request = {
                "jsonrpc": "2.0",
                "id": str(uuid.uuid4()),
                "method": method,
                "params": params or {},
            }
            
            writer.write((json.dumps(request) + "\n").encode())
            await writer.drain()
            
            response_line = await asyncio.wait_for(reader.readline(), timeout=30.0)
            response = json.loads(response_line.decode())
            
            if "error" in response:
                raise Exception(response["error"].get("message", "Unknown error"))
            
            return response.get("result")
            
        finally:
            writer.close()
            await writer.wait_closed()
    
    async def load_fixture(self, name: str) -> dict:
        """Load a .blend fixture file."""
        filepath = BLEND_FIXTURES / f"{name}.blend"
        if not filepath.exists():
            raise FileNotFoundError(f"Fixture not found: {filepath}")
        
        # Open the file in Blender
        code = f"""
import bpy
bpy.ops.wm.open_mainfile(filepath="{filepath}")
result = {{"loaded": "{name}", "objects": len(bpy.data.objects)}}
"""
        return await self.send("execute_python", {"code": code})
    
    async def get_scene_objects(self) -> list[dict]:
        """Get all objects in the current scene."""
        result = await self.send("get_scene_info", {"include_transforms": True})
        return result.get("objects", [])
    
    async def render_viewport(self, output_path: Path, view: str = "front") -> Path:
        """Render the viewport and save to file."""
        await self.send("set_viewport", {"view": view, "perspective": "ortho"})
        await self.send("render", {"filepath": str(output_path)})
        return output_path


@pytest.fixture
def blender():
    """Synchronous wrapper for BlenderConnection."""
    conn = BlenderConnection()
    
    class SyncBlender:
        def send(self, method: str, params: dict | None = None):
            return asyncio.get_event_loop().run_until_complete(
                conn.send(method, params)
            )
        
        def load_fixture(self, name: str):
            return asyncio.get_event_loop().run_until_complete(
                conn.load_fixture(name)
            )
        
        def get_scene_objects(self):
            return asyncio.get_event_loop().run_until_complete(
                conn.get_scene_objects()
            )
    
    return SyncBlender()


@pytest.fixture
def async_blender():
    """Async BlenderConnection for use with pytest-asyncio."""
    return BlenderConnection()


def compare_objects(actual: list[dict], expected: list[dict], tolerance: float = 0.01) -> bool:
    """Compare two lists of objects for equality within tolerance."""
    if len(actual) != len(expected):
        return False
    
    for act, exp in zip(sorted(actual, key=lambda x: x["name"]), 
                        sorted(expected, key=lambda x: x["name"])):
        if act["name"] != exp["name"]:
            return False
        if act["type"] != exp["type"]:
            return False
        
        # Compare locations with tolerance
        for i in range(3):
            if abs(act["location"][i] - exp["location"][i]) > tolerance:
                return False
    
    return True
