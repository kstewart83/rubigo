"""MCP Server for Blender Agent."""

import logging
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent

from .blender_client import get_client, BlenderConnectionError

logger = logging.getLogger(__name__)


def create_server() -> Server:
    """Create and configure the MCP server with Blender tools."""
    server = Server("blender-agent")
    
    @server.list_tools()
    async def list_tools() -> list[Tool]:
        """Return the list of available Blender tools."""
        return [
            Tool(
                name="blender_get_scene_info",
                description="Get information about the current Blender scene including objects, materials, and settings.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "include_materials": {
                            "type": "boolean",
                            "description": "Include material information for each object. Defaults to false if not provided.",
                        },
                        "include_transforms": {
                            "type": "boolean",
                            "description": "Include transform (location, rotation, scale) for each object. Defaults to true if not provided.",
                        },
                    },
                    "required": [],
                },
            ),
            Tool(
                name="blender_create_object",
                description="Create a new primitive object in the Blender scene.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "description": "Type of primitive to create. Must be one of: cube, sphere, cylinder, cone, torus, plane, circle, monkey",
                        },
                        "name": {
                            "type": "string",
                            "description": "Name for the new object. Optional - Blender will auto-name if not provided.",
                        },
                        "location": {
                            "type": "array",
                            "description": "Location as [x, y, z] array of 3 numbers. Defaults to [0, 0, 0] if not provided.",
                        },
                        "scale": {
                            "type": "array",
                            "description": "Scale as [x, y, z] array of 3 numbers. Defaults to [1, 1, 1] if not provided.",
                        },
                    },
                    "required": ["type"],
                },
            ),
            Tool(
                name="blender_delete_object",
                description="Delete an object from the Blender scene by name.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name of the object to delete",
                        },
                    },
                    "required": ["name"],
                },
            ),
            Tool(
                name="blender_transform_object",
                description="Transform an object (move, rotate, or scale).",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name of the object to transform",
                        },
                        "location": {
                            "type": "array",
                            "description": "New location as [x, y, z] array of 3 numbers. Optional.",
                        },
                        "rotation": {
                            "type": "array",
                            "description": "New rotation as [x, y, z] array of 3 numbers in degrees. Optional.",
                        },
                        "scale": {
                            "type": "array",
                            "description": "New scale as [x, y, z] array of 3 numbers. Optional.",
                        },
                    },
                    "required": ["name"],
                },
            ),
            Tool(
                name="blender_set_material",
                description="Apply a material with a base color to an object.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "object_name": {
                            "type": "string",
                            "description": "Name of the object to apply material to",
                        },
                        "material_name": {
                            "type": "string",
                            "description": "Name for the material. Optional - will be auto-generated if not provided.",
                        },
                        "color": {
                            "type": "array",
                            "description": "RGBA color as [r, g, b, a] array of 4 numbers from 0.0 to 1.0",
                        },
                    },
                    "required": ["object_name", "color"],
                },
            ),
            Tool(
                name="blender_render",
                description="Render the current scene to an image file.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "filepath": {
                            "type": "string",
                            "description": "Output file path for the render (e.g., '/tmp/render.png')",
                        },
                        "resolution_x": {
                            "type": "integer",
                            "description": "Render width in pixels. Defaults to 1920 if not provided.",
                        },
                        "resolution_y": {
                            "type": "integer",
                            "description": "Render height in pixels. Defaults to 1080 if not provided.",
                        },
                        "samples": {
                            "type": "integer",
                            "description": "Number of render samples (higher = better quality, slower). Defaults to 128 if not provided.",
                        },
                    },
                    "required": ["filepath"],
                },
            ),
            Tool(
                name="blender_execute_python",
                description="Execute arbitrary Python code in Blender. Use with caution - has full access to Blender API.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Python code to execute in Blender",
                        },
                    },
                    "required": ["code"],
                },
            ),
            Tool(
                name="blender_get_version",
                description="Get the current Blender version. Useful for verifying the MCP server connection is working.",
                inputSchema={
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
            ),
        ]
    
    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        """Handle tool calls by forwarding them to Blender."""
        client = get_client()
        
        try:
            # Map MCP tool names to Blender methods
            method_map = {
                "blender_get_scene_info": "get_scene_info",
                "blender_create_object": "create_object",
                "blender_delete_object": "delete_object",
                "blender_transform_object": "transform_object",
                "blender_set_material": "set_material",
                "blender_render": "render",
                "blender_execute_python": "execute_python",
                "blender_get_version": "get_version",
            }
            
            method = method_map.get(name)
            if not method:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]
            
            result = await client.send_request(method, arguments)
            
            # Format the result nicely
            if isinstance(result, dict):
                import json
                result_text = json.dumps(result, indent=2)
            else:
                result_text = str(result)
            
            return [TextContent(type="text", text=result_text)]
            
        except BlenderConnectionError as e:
            return [TextContent(
                type="text",
                text=f"Failed to connect to Blender: {e}\n\n"
                     "Make sure Blender is running and the Blender Agent add-on is enabled."
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {e}")]
    
    return server
