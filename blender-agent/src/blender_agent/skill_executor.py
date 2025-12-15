"""Skill executor for the Blender Agent.

Hybrid approach:
- Core skills are implemented as Python functions (fast, reliable)
- Custom skills can be stored as scripts in the database (flexible)
"""

import asyncio
import json
import time
from typing import Any, Callable

from .skills import get_db, Skill


# Registry of core skill handlers (Python functions)
_core_handlers: dict[str, Callable] = {}


def core_skill(name: str):
    """Decorator to register a core skill handler."""
    def decorator(func: Callable):
        _core_handlers[name] = func
        return func
    return decorator


class SkillExecutor:
    """Executes skills via the Blender socket server."""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 9876):
        self.host = host
        self.port = port
        self.db = get_db()
    
    async def execute(self, skill_name: str, params: dict | None = None) -> dict:
        """Execute a skill by name.
        
        Uses hybrid approach:
        1. If skill has a registered Python handler, use it
        2. If skill has code in DB, execute via execute_python
        3. Otherwise, try direct method call to Blender
        """
        params = params or {}
        skill = self.db.get_skill(skill_name)
        
        start_time = time.time()
        success = False
        result = None
        
        try:
            # Option 1: Core handler (Python function)
            if skill_name in _core_handlers:
                result = await _core_handlers[skill_name](self, params)
                success = True
            
            # Option 2: DB-stored script
            elif skill and skill.code:
                result = await self._execute_script(skill.code, params)
                success = True
            
            # Option 3: Direct method call (for simple skills)
            else:
                result = await self._send_request(skill_name, params)
                success = True
            
            # Update usage stats
            if skill:
                self.db.increment_usage(skill_name)
            
            return {"success": True, "result": result}
            
        except Exception as e:
            result = {"error": str(e)}
            return {"success": False, "error": str(e)}
            
        finally:
            # Log execution
            if skill:
                duration_ms = int((time.time() - start_time) * 1000)
                self.db.log_execution(
                    skill.id,
                    params,
                    result,
                    success,
                    duration_ms,
                )
    
    async def _send_request(self, method: str, params: dict) -> Any:
        """Send a JSON-RPC request to the Blender socket server."""
        import uuid
        
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(self.host, self.port),
            timeout=5.0,
        )
        
        try:
            request = {
                "jsonrpc": "2.0",
                "id": str(uuid.uuid4()),
                "method": method,
                "params": params,
            }
            
            message = json.dumps(request) + "\n"
            writer.write(message.encode("utf-8"))
            await writer.drain()
            
            response_line = await asyncio.wait_for(
                reader.readline(),
                timeout=30.0,
            )
            
            if not response_line:
                raise ConnectionError("Connection closed by Blender")
            
            response = json.loads(response_line.decode("utf-8"))
            
            if "error" in response:
                raise Exception(response["error"].get("message", "Unknown error"))
            
            return response.get("result")
            
        finally:
            writer.close()
            await writer.wait_closed()
    
    async def _execute_script(self, code: str, params: dict) -> Any:
        """Execute a script stored in the database."""
        # Wrap user code to pass params and capture result
        wrapped_code = f"""
import json
params = {json.dumps(params)}
{code}
"""
        return await self._send_request("execute_python", {"code": wrapped_code})
    
    async def list_available_skills(self) -> list[dict]:
        """List all available skills with their metadata."""
        skills = self.db.list_skills()
        return [
            {
                "name": s.name,
                "category": s.category,
                "chapter": s.chapter,
                "description": s.description,
                "verified": s.verified,
                "has_handler": s.name in _core_handlers,
                "has_script": bool(s.code),
            }
            for s in skills
        ]


# ============================================================
# CORE SKILL HANDLERS (Phase 1: First Steps)
# ============================================================

@core_skill("select_object")
async def handle_select_object(executor: SkillExecutor, params: dict) -> dict:
    """Select an object by name."""
    name = params.get("name")
    if not name:
        raise ValueError("Object name is required")
    
    code = f"""
import bpy
obj = bpy.data.objects.get("{name}")
if not obj:
    raise ValueError("Object not found: {name}")
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
result = {{"selected": "{name}"}}
"""
    return await executor._send_request("execute_python", {"code": code})


@core_skill("duplicate_object")
async def handle_duplicate_object(executor: SkillExecutor, params: dict) -> dict:
    """Duplicate the active object."""
    name = params.get("name")
    new_name = params.get("new_name")
    
    code = f"""
import bpy
obj = bpy.data.objects.get("{name}")
if not obj:
    raise ValueError("Object not found: {name}")

# Select and duplicate
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.duplicate()
new_obj = bpy.context.active_object
{"new_obj.name = '" + new_name + "'" if new_name else ""}
result = {{"original": "{name}", "duplicate": new_obj.name, "location": list(new_obj.location)}}
"""
    return await executor._send_request("execute_python", {"code": code})


@core_skill("set_3d_cursor")
async def handle_set_3d_cursor(executor: SkillExecutor, params: dict) -> dict:
    """Set the 3D cursor position."""
    location = params.get("location", [0, 0, 0])
    
    code = f"""
import bpy
bpy.context.scene.cursor.location = {location}
result = {{"cursor_location": list(bpy.context.scene.cursor.location)}}
"""
    return await executor._send_request("execute_python", {"code": code})


@core_skill("create_collection")
async def handle_create_collection(executor: SkillExecutor, params: dict) -> dict:
    """Create a new collection."""
    name = params.get("name", "New Collection")
    
    code = f"""
import bpy
collection = bpy.data.collections.new("{name}")
bpy.context.scene.collection.children.link(collection)
result = {{"collection": collection.name}}
"""
    return await executor._send_request("execute_python", {"code": code})


@core_skill("move_to_collection")
async def handle_move_to_collection(executor: SkillExecutor, params: dict) -> dict:
    """Move an object to a collection."""
    object_name = params.get("object_name")
    collection_name = params.get("collection_name")
    
    code = f"""
import bpy
obj = bpy.data.objects.get("{object_name}")
collection = bpy.data.collections.get("{collection_name}")
if not obj:
    raise ValueError("Object not found: {object_name}")
if not collection:
    raise ValueError("Collection not found: {collection_name}")

# Remove from current collections and add to new one
for col in obj.users_collection:
    col.objects.unlink(obj)
collection.objects.link(obj)
result = {{"object": obj.name, "collection": collection.name}}
"""
    return await executor._send_request("execute_python", {"code": code})


# Convenience function to get executor
_executor: SkillExecutor | None = None

def get_executor() -> SkillExecutor:
    """Get the shared skill executor instance."""
    global _executor
    if _executor is None:
        _executor = SkillExecutor()
    return _executor
