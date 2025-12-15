"""Blender Agent Add-on - Socket Server for Remote Control

This add-on creates a TCP socket server inside Blender that accepts JSON-RPC
commands from the MCP server, enabling AI agents to control Blender.

Note: This is a Blender 5.0 Extension. Metadata is defined in blender_manifest.toml.
"""

import bpy
import json
import os
import socket
import subprocess
import sys
import threading
import traceback
from typing import Any, Callable

# Import handlers from modules
from .handlers import fundamentals, modeling, uv, rigging, shading, lighting, camera, rendering
from .handlers import dynamic_skills

# Module-level handler map for dynamic_skills module access
_handler_map: dict = {}


# Configuration
HOST = "127.0.0.1"
PORT = 9876
BUFFER_SIZE = 65536

# MCP Server process
_mcp_process: subprocess.Popen | None = None


class BlenderAgentServer:
    """TCP server that handles JSON-RPC requests from the MCP server."""
    
    def __init__(self):
        self.socket: socket.socket | None = None
        self.running = False
        self.thread: threading.Thread | None = None
        self.handlers: dict[str, Callable] = {}
        self._register_handlers()
    
    def _register_handlers(self):
        """Register all available command handlers."""
        self.handlers = {
            # Fundamentals
            "ping": fundamentals.handle_ping,
            "get_scene_info": fundamentals.handle_get_scene_info,
            "create_object": fundamentals.handle_create_object,
            "delete_object": fundamentals.handle_delete_object,
            "transform_object": fundamentals.handle_transform_object,
            "set_material": fundamentals.handle_set_material,
            "render": fundamentals.handle_render,
            "get_blender_version": fundamentals.handle_get_blender_version,
            "get_extension_version": fundamentals.handle_get_extension_version,
            "save_file": fundamentals.handle_save_file,
            "set_viewport": fundamentals.handle_set_viewport,
            "quit_blender": fundamentals.handle_quit_blender,
            "new_file": fundamentals.handle_new_file,
            "show_status": fundamentals.handle_show_status,
            "open_file": fundamentals.handle_open_file,
            "duplicate_object": fundamentals.handle_duplicate_object,
            # Modeling
            "set_mode": modeling.handle_set_mode,
            "select_mesh_elements": modeling.handle_select_mesh_elements,
            "extrude": modeling.handle_extrude,
            "loop_cut": modeling.handle_loop_cut,
            "bevel": modeling.handle_bevel,
            "inset": modeling.handle_inset,
            "add_modifier": modeling.handle_add_modifier,
            "apply_modifier": modeling.handle_apply_modifier,
            "delete_faces": modeling.handle_delete_faces,
            "get_mesh_info": modeling.handle_get_mesh_info,
            "shade_smooth": modeling.handle_shade_smooth,
            "get_selection_info": modeling.handle_get_selection_info,
            "select_boundary_faces": modeling.handle_select_boundary_faces,
            "grow_selection": modeling.handle_grow_selection,
            "shrink_selection": modeling.handle_shrink_selection,
            "move_selection": modeling.handle_move_selection,
            "snap_to_mesh": modeling.handle_snap_to_mesh,
            "find_inside_mesh": modeling.handle_find_inside_mesh,
            "add_selection_noise": modeling.handle_add_selection_noise,
            # UV
            "mark_seam": uv.handle_mark_seam,
            "clear_seam": uv.handle_clear_seam,
            "unwrap": uv.handle_unwrap,
            "project_from_view": uv.handle_project_from_view,
            # Rigging
            "create_armature": rigging.handle_create_armature,
            "add_bone": rigging.handle_add_bone,
            "parent_to_armature": rigging.handle_parent_to_armature,
            "set_bone_parent": rigging.handle_set_bone_parent,
            # Shading
            "create_material": shading.handle_create_material,
            "assign_material": shading.handle_assign_material,
            "set_material_color": shading.handle_set_material_color,
            "set_material_property": shading.handle_set_material_property,
            "add_image_texture": shading.handle_add_image_texture,
            # Lighting & Rendering
            "create_light": lighting.handle_create_light,
            "set_light_property": lighting.handle_set_light_property,
            "set_world_color": lighting.handle_set_world_color,
            "set_render_engine": lighting.handle_set_render_engine,
            "configure_render": lighting.handle_configure_render,
            "render_image": lighting.handle_render_image,
            # Camera
            "create_camera": camera.handle_create_camera,
            "set_camera_position": camera.handle_set_camera_position,
            "frame_object": camera.handle_frame_object,
            "reset_viewport": camera.handle_reset_viewport,
            "set_viewport_shading": camera.handle_set_viewport_shading,
            "set_viewport_view": camera.handle_set_viewport_view,
            # Rendering (compound)
            "render_product_views": rendering.handle_render_product_views,
            # Dynamic skills
            "register_skill": dynamic_skills.handle_register_skill,
            "list_skills": dynamic_skills.handle_list_skills,
            "unregister_skill": dynamic_skills.handle_unregister_skill,
            "get_skill_statistics": dynamic_skills.handle_get_skill_statistics,
            "get_call_graph": dynamic_skills.handle_get_call_graph,
        }
        # Expose handler map for dynamic_skills module
        global _handler_map
        _handler_map = self.handlers
        
        # Register core handlers in statistics table
        dynamic_skills.register_core_handlers(list(self.handlers.keys()))
    
    def start(self):
        """Start the socket server in a background thread."""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_server, daemon=True)
        self.thread.start()
        print(f"[Blender Agent] Server started on {HOST}:{PORT}")
    
    def stop(self):
        """Stop the socket server."""
        self.running = False
        if self.socket:
            try:
                self.socket.close()
            except Exception:
                pass
        if self.thread:
            self.thread.join(timeout=1.0)
        print("[Blender Agent] Server stopped")
    
    def _run_server(self):
        """Main server loop (runs in background thread)."""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.settimeout(1.0)
        
        try:
            self.socket.bind((HOST, PORT))
            self.socket.listen(1)
            
            while self.running:
                try:
                    client, addr = self.socket.accept()
                    print(f"[Blender Agent] Client connected from {addr}")
                    self._handle_client(client)
                except socket.timeout:
                    continue
                except Exception as e:
                    if self.running:
                        print(f"[Blender Agent] Accept error: {e}")
        except Exception as e:
            print(f"[Blender Agent] Server error: {e}")
        finally:
            if self.socket:
                self.socket.close()
    
    def _handle_client(self, client: socket.socket):
        """Handle a connected client."""
        client.settimeout(None)
        buffer = ""
        
        try:
            while self.running:
                data = client.recv(BUFFER_SIZE)
                if not data:
                    break
                
                buffer += data.decode("utf-8")
                
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    if line.strip():
                        response = self._process_request(line)
                        client.sendall((json.dumps(response) + "\n").encode("utf-8"))
        except Exception as e:
            print(f"[Blender Agent] Client error: {e}")
        finally:
            client.close()
    
    def _process_request(self, request_line: str) -> dict:
        """Process a JSON-RPC request and return a response."""
        try:
            request = json.loads(request_line)
            
            if "method" not in request:
                return {"jsonrpc": "2.0", "id": request.get("id"), "error": {"code": -32600, "message": "Invalid request"}}
            
            method = request["method"]
            params = request.get("params", {})
            request_id = request.get("id")
            
            # Check if method is a core handler
            handler = self.handlers.get(method)
            dynamic_skill = None
            
            if not handler:
                # Check for dynamic skill
                dynamic_skill = dynamic_skills.get_dynamic_skill(method)
                if not dynamic_skill:
                    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32601, "message": f"Method not found: {method}"}}
            
            # Execute handler using Blender's thread-safe timer
            result_container = [None]
            error_container = [None]
            done_event = threading.Event()
            
            def execute_in_main():
                try:
                    if handler:
                        # Track core handler call
                        import time
                        start_time = time.time()
                        result_container[0] = handler(params)
                        elapsed_ms = int((time.time() - start_time) * 1000)
                        dynamic_skills.track_core_handler_call(method, elapsed_ms)
                    else:
                        result_container[0] = dynamic_skills.execute_dynamic_skill(dynamic_skill, params)
                except Exception as e:
                    error_container[0] = str(e)
                    traceback.print_exc()
                done_event.set()
                return None
            
            bpy.app.timers.register(execute_in_main, first_interval=0)
            done_event.wait(timeout=30.0)
            
            if error_container[0]:
                return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32603, "message": error_container[0]}}
            
            return {"jsonrpc": "2.0", "id": request_id, "result": result_container[0]}
            
        except json.JSONDecodeError:
            return {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}
        except Exception as e:
            return {"jsonrpc": "2.0", "id": None, "error": {"code": -32603, "message": str(e)}}


# Global server instance
_server: BlenderAgentServer | None = None


class BlenderAgentPreferences(bpy.types.AddonPreferences):
    """Preferences for Blender Agent extension."""
    
    bl_idname = __package__ or "blender_agent"
    
    project_path: bpy.props.StringProperty(
        name="Project Path",
        description="Path to the Blender Agent project for MCP server",
        default="",
        subtype='DIR_PATH',
    )
    
    auto_start_mcp: bpy.props.BoolProperty(
        name="Auto-start MCP Server",
        description="Automatically start the MCP server when Blender starts",
        default=False,
    )
    
    def draw(self, context):
        layout = self.layout
        layout.prop(self, "project_path")
        layout.prop(self, "auto_start_mcp")
        
        row = layout.row()
        if _mcp_process and _mcp_process.poll() is None:
            row.operator("blender_agent.stop_mcp_server", text="Stop MCP Server", icon='CANCEL')
            row.label(text="MCP Server Running", icon='CHECKMARK')
        else:
            row.operator("blender_agent.start_mcp_server", text="Start MCP Server", icon='PLAY')
        
        layout.separator()
        layout.label(text=f"Socket Server: {HOST}:{PORT}")
        if _server and _server.running:
            layout.label(text="Status: Running", icon='CHECKMARK')
        else:
            layout.label(text="Status: Stopped", icon='X')


class BLENDER_AGENT_OT_start_mcp_server(bpy.types.Operator):
    """Start the MCP server subprocess"""
    bl_idname = "blender_agent.start_mcp_server"
    bl_label = "Start MCP Server"
    
    def execute(self, context):
        global _mcp_process
        
        prefs = context.preferences.addons[__package__].preferences
        project_path = bpy.path.abspath(prefs.project_path)
        
        if not project_path or not os.path.exists(project_path):
            self.report({'ERROR'}, "Please set a valid project path in preferences")
            return {'CANCELLED'}
        
        try:
            _mcp_process = subprocess.Popen(
                ["uv", "run", "blender-agent"],
                cwd=project_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            self.report({'INFO'}, "MCP Server started")
        except Exception as e:
            self.report({'ERROR'}, f"Failed to start MCP server: {e}")
            return {'CANCELLED'}
        
        return {'FINISHED'}


class BLENDER_AGENT_OT_stop_mcp_server(bpy.types.Operator):
    """Stop the MCP server subprocess"""
    bl_idname = "blender_agent.stop_mcp_server"
    bl_label = "Stop MCP Server"
    
    def execute(self, context):
        global _mcp_process
        
        if _mcp_process:
            _mcp_process.terminate()
            _mcp_process = None
            self.report({'INFO'}, "MCP Server stopped")
        
        return {'FINISHED'}


classes = [
    BlenderAgentPreferences,
    BLENDER_AGENT_OT_start_mcp_server,
    BLENDER_AGENT_OT_stop_mcp_server,
]


def register():
    """Register the add-on."""
    global _server
    
    for cls in classes:
        bpy.utils.register_class(cls)
    
    _server = BlenderAgentServer()
    _server.start()


def unregister():
    """Unregister the add-on."""
    global _server, _mcp_process
    
    if _server:
        _server.stop()
        _server = None
    
    if _mcp_process:
        _mcp_process.terminate()
        _mcp_process = None
    
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
