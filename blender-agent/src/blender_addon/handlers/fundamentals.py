"""Fundamentals handlers - basic scene operations.

Includes: ping, get_scene_info, create_object, delete_object,
transform_object, set_material, render, execute_python,
get_blender_version, get_extension_version, save_file, set_viewport,
quit_blender.
"""

import bpy
import json
import math
from pathlib import Path


def handle_ping(params: dict) -> dict:
    """Handle ping request."""
    return {"status": "ok", "message": "Blender Agent is running"}


def handle_get_scene_info(params: dict) -> dict:
    """Get information about the current scene."""
    include_materials = params.get("include_materials", False)
    include_transforms = params.get("include_transforms", True)
    
    scene = bpy.context.scene
    objects = []
    
    for obj in scene.objects:
        obj_info = {
            "name": obj.name,
            "type": obj.type,
        }
        
        if include_transforms:
            obj_info["location"] = list(obj.location)
            obj_info["rotation"] = [math.degrees(r) for r in obj.rotation_euler]
            obj_info["scale"] = list(obj.scale)
        
        if include_materials and hasattr(obj.data, "materials"):
            obj_info["materials"] = [m.name if m else None for m in obj.data.materials]
        
        objects.append(obj_info)
    
    return {
        "scene_name": scene.name,
        "object_count": len(objects),
        "objects": objects,
        "frame_current": scene.frame_current,
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
    }


def handle_create_object(params: dict) -> dict:
    """Create a new object in the scene."""
    obj_type = params.get("type", "cube").lower()
    name = params.get("name")
    location = tuple(params.get("location", [0, 0, 0]))
    scale = tuple(params.get("scale", [1, 1, 1]))
    
    type_map = {
        "cube": ("mesh.primitive_cube_add", {}),
        "sphere": ("mesh.primitive_uv_sphere_add", {}),
        "cylinder": ("mesh.primitive_cylinder_add", {}),
        "plane": ("mesh.primitive_plane_add", {}),
        "cone": ("mesh.primitive_cone_add", {}),
        "torus": ("mesh.primitive_torus_add", {}),
        "monkey": ("mesh.primitive_monkey_add", {}),
        "empty": ("object.empty_add", {"type": "PLAIN_AXES"}),
        "camera": ("object.camera_add", {}),
        "light": ("object.light_add", {"type": "POINT"}),
    }
    
    if obj_type not in type_map:
        raise ValueError(f"Unknown object type: {obj_type}")
    
    op_name, op_params = type_map[obj_type]
    op = getattr(bpy.ops, op_name.split(".")[0])
    method = getattr(op, op_name.split(".")[1])
    method(location=location, **op_params)
    
    obj = bpy.context.active_object
    if name:
        obj.name = name
    obj.scale = scale
    
    return {
        "success": True,
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "scale": list(obj.scale),
    }


def handle_delete_object(params: dict) -> dict:
    """Delete an object from the scene."""
    name = params.get("name")
    
    if not name:
        raise ValueError("Object name is required")
    
    obj = bpy.data.objects.get(name)
    if not obj:
        raise ValueError(f"Object not found: {name}")
    
    bpy.data.objects.remove(obj, do_unlink=True)
    
    return {"success": True, "deleted": name}


def handle_transform_object(params: dict) -> dict:
    """Transform an object (location, rotation, scale).
    
    Args:
        name: Object name (required)
        location: Target location [x, y, z]
        rotation: Target rotation in degrees [rx, ry, rz]
        scale: Target scale [sx, sy, sz]
        animate: If True, smoothly animate the transform (default: False)
        duration: Animation duration in seconds (default: 0.5)
    """
    from mathutils import Vector, Euler
    
    name = params.get("name")
    animate = params.get("animate", False)
    duration = params.get("duration", 0.5)
    
    if not name:
        raise ValueError("Object name is required")
    
    obj = bpy.data.objects.get(name)
    if not obj:
        raise ValueError(f"Object not found: {name}")
    
    if not animate:
        # Immediate transform (original behavior)
        if "location" in params:
            obj.location = tuple(params["location"])
        if "rotation" in params:
            obj.rotation_euler = tuple(math.radians(r) for r in params["rotation"])
        if "scale" in params:
            obj.scale = tuple(params["scale"])
    else:
        # Animated transform using timer
        steps = int(duration * 60)  # 60fps
        interval = duration / steps
        
        start_loc = Vector(obj.location)
        start_rot = Euler(obj.rotation_euler)
        start_scale = Vector(obj.scale)
        
        end_loc = Vector(params.get("location", list(start_loc)))
        end_rot = Euler([math.radians(r) for r in params.get("rotation", [math.degrees(r) for r in start_rot])])
        end_scale = Vector(params.get("scale", list(start_scale)))
        
        state = {"step": 0}
        
        def animate_step():
            t = state["step"] / steps
            t = t * t * (3 - 2 * t)  # Smooth easing
            
            obj.location = start_loc.lerp(end_loc, t)
            obj.rotation_euler = Euler([
                start_rot.x + (end_rot.x - start_rot.x) * t,
                start_rot.y + (end_rot.y - start_rot.y) * t,
                start_rot.z + (end_rot.z - start_rot.z) * t,
            ])
            obj.scale = start_scale.lerp(end_scale, t)
            
            for area in bpy.context.screen.areas:
                area.tag_redraw()
            
            state["step"] += 1
            if state["step"] <= steps:
                return interval
            return None
        
        bpy.app.timers.register(animate_step, first_interval=0.01)
    
    return {
        "success": True,
        "name": obj.name,
        "location": list(obj.location),
        "rotation": [math.degrees(r) for r in obj.rotation_euler],
        "scale": list(obj.scale),
        "animated": animate,
    }


def handle_set_material(params: dict) -> dict:
    """Set or create a material on an object."""
    obj_name = params.get("object_name")
    mat_name = params.get("material_name", "Material")
    color = params.get("color", [0.8, 0.8, 0.8, 1.0])
    
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        raise ValueError(f"Object not found: {obj_name}")
    
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
    
    if mat.use_nodes:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
    
    if mat.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(mat)
    
    return {
        "success": True,
        "object": obj_name,
        "material": mat.name,
        "color": color,
    }


def handle_render(params: dict) -> dict:
    """Render the scene to an image file."""
    filepath = params.get("filepath", "/tmp/blender_render.png")
    resolution_x = params.get("resolution_x", 1920)
    resolution_y = params.get("resolution_y", 1080)
    samples = params.get("samples", 128)
    
    scene = bpy.context.scene
    scene.render.filepath = filepath
    scene.render.resolution_x = resolution_x
    scene.render.resolution_y = resolution_y
    
    if scene.render.engine == "CYCLES":
        scene.cycles.samples = samples
    
    bpy.ops.render.render(write_still=True)
    
    return {
        "success": True,
        "filepath": filepath,
        "resolution": [resolution_x, resolution_y],
    }


def handle_execute_python(params: dict) -> dict:
    """Execute arbitrary Python code."""
    code = params.get("code", "")
    
    namespace = {"bpy": bpy, "result": None}
    exec(code, namespace)
    
    result = namespace.get("result")
    if result is not None:
        try:
            json.dumps(result)
            return {"success": True, "result": result}
        except (TypeError, ValueError):
            return {"success": True, "result": str(result)}
    
    return {"success": True}


def handle_get_blender_version(params: dict) -> dict:
    """Get the current Blender version information.
    
    Category: inspect
    """
    return {
        "version": bpy.app.version_string,
        "version_tuple": list(bpy.app.version),
        "api_version": list(bpy.app.version),
    }


def handle_get_extension_version(params: dict) -> dict:
    """Get the Blender Agent extension version.
    
    Category: inspect
    """
    import tomllib
    manifest_path = Path(__file__).parent.parent / "blender_manifest.toml"
    extension_version = "unknown"
    if manifest_path.exists():
        with open(manifest_path, "rb") as f:
            manifest = tomllib.load(f)
            extension_version = manifest.get("version", "unknown")
    
    return {
        "version": extension_version,
        "name": "blender-agent",
    }


def handle_save_file(params: dict) -> dict:
    """Save the current Blender file."""
    filepath = params.get("filepath")
    
    if filepath:
        bpy.ops.wm.save_as_mainfile(filepath=filepath)
        return {"success": True, "filepath": filepath, "saved_as": True}
    else:
        if bpy.data.filepath:
            bpy.ops.wm.save_mainfile()
            return {"success": True, "filepath": bpy.data.filepath, "saved_as": False}
        else:
            raise ValueError("No filepath set. Use 'filepath' parameter for new files.")


def handle_set_viewport(params: dict) -> dict:
    """Set the 3D viewport view angle and settings."""
    view_type = params.get("view")
    view_perspective = params.get("perspective")
    distance = params.get("distance")
    location = params.get("location")
    
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            region_3d = space.region_3d
            
            if view_type:
                view_map = {
                    "front": "FRONT", "back": "BACK", "left": "LEFT",
                    "right": "RIGHT", "top": "TOP", "bottom": "BOTTOM", "camera": "CAMERA",
                }
                if view_type.lower() in view_map:
                    override = {'area': area, 'region': area.regions[-1]}
                    with bpy.context.temp_override(**override):
                        bpy.ops.view3d.view_axis(type=view_map[view_type.lower()])
            
            if view_perspective:
                if view_perspective.lower() == "ortho":
                    region_3d.view_perspective = 'ORTHO'
                elif view_perspective.lower() == "persp":
                    region_3d.view_perspective = 'PERSP'
            
            if distance is not None:
                region_3d.view_distance = float(distance)
            
            if location:
                region_3d.view_location = tuple(location)
            
            return {
                "success": True,
                "view_perspective": region_3d.view_perspective,
                "view_distance": region_3d.view_distance,
                "view_location": list(region_3d.view_location),
            }
    
    raise ValueError("No 3D viewport found")


def handle_quit_blender(params: dict) -> dict:
    """Gracefully quit Blender.
    
    This sends a response first, then schedules quit on a timer
    so the client receives acknowledgment before exit.
    """
    save_before_quit = params.get("save", False)
    delay_ms = params.get("delay_ms", 500)  # Default 500ms delay
    
    # Save if requested
    if save_before_quit and bpy.data.filepath:
        bpy.ops.wm.save_mainfile()
    
    # Schedule quit using a timer so we can return response first
    def do_quit():
        bpy.ops.wm.quit_blender()
        return None  # Don't repeat
    
    bpy.app.timers.register(do_quit, first_interval=delay_ms / 1000.0)
    
    return {
        "success": True,
        "message": f"Blender will quit in {delay_ms}ms",
        "saved": save_before_quit and bool(bpy.data.filepath),
    }


def handle_new_file(params: dict) -> dict:
    """Create a new blank Blender file with default objects.
    
    Category: standard
    
    Returns the scene name and default objects created.
    """
    bpy.ops.wm.read_homefile(use_empty=False)
    
    objects = [obj.name for obj in bpy.context.scene.objects]
    
    return {
        "success": True,
        "scene": bpy.context.scene.name,
        "objects": objects,
    }


def handle_open_file(params: dict) -> dict:
    """Open a Blender file.
    
    Category: standard
    
    Args:
        filepath: Path to the .blend file to open
    """
    filepath = params.get("filepath")
    if not filepath:
        raise ValueError("filepath is required")
    
    bpy.ops.wm.open_mainfile(filepath=filepath)
    
    return {
        "success": True,
        "filepath": filepath,
    }


def handle_show_status(params: dict) -> dict:
    """Show a status message in Blender's UI.
    
    Category: standard
    
    Args:
        message: The message to display
    """
    message = params.get("message", "")
    
    # Set status text in workspace
    bpy.context.workspace.status_text_set(message)
    
    # Also print to console for logging
    print(f"[STATUS] {message}")
    
    return {
        "success": True,
        "message": message,
    }


def handle_duplicate_object(params: dict) -> dict:
    """Duplicate an object with optional new name.
    
    Category: standard
    
    Args:
        object_name: Object to duplicate (uses active if not specified)
        new_name: Name for the duplicate (auto-generated if not specified)
    """
    object_name = params.get("object_name")
    new_name = params.get("new_name")
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj:
        raise ValueError(f"Object not found: {object_name}")
    
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    
    new_obj = bpy.context.active_object
    if new_name:
        new_obj.name = new_name
    
    return {
        "success": True,
        "original": obj.name,
        "duplicate": new_obj.name,
    }
