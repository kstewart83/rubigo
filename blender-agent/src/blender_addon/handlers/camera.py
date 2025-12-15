"""Camera handlers - camera control and framing.

Includes: create_camera, set_camera_position, frame_object.
"""

import bpy
import math
from mathutils import Vector


def handle_create_camera(params: dict) -> dict:
    """Create a new camera object."""
    name = params.get("name", "Camera")
    location = params.get("location", [0, -5, 2])
    rotation = params.get("rotation", [math.radians(80), 0, 0])
    camera_type = params.get("type", "PERSP").upper()  # PERSP, ORTHO, PANO
    lens = params.get("lens", 50)  # mm for perspective
    ortho_scale = params.get("ortho_scale", 6)  # for orthographic
    
    # Create camera data
    cam_data = bpy.data.cameras.new(name)
    cam_data.type = camera_type
    
    if camera_type == "PERSP":
        cam_data.lens = lens
    elif camera_type == "ORTHO":
        cam_data.ortho_scale = ortho_scale
    
    # Create camera object
    cam_obj = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam_obj)
    
    cam_obj.location = location
    cam_obj.rotation_euler = rotation
    
    return {
        "success": True,
        "name": cam_obj.name,
        "type": camera_type,
        "location": list(cam_obj.location),
        "rotation": list(cam_obj.rotation_euler),
    }


def handle_set_camera_position(params: dict) -> dict:
    """Set camera position and orientation."""
    camera_name = params.get("camera_name")
    location = params.get("location")
    rotation = params.get("rotation")
    look_at = params.get("look_at")  # Object name to point at
    
    cam = bpy.data.objects.get(camera_name) if camera_name else bpy.context.scene.camera
    if not cam or cam.type != 'CAMERA':
        raise ValueError(f"Camera not found: {camera_name}")
    
    if location:
        cam.location = location
    
    if look_at:
        # Point camera at object
        target = bpy.data.objects.get(look_at)
        if not target:
            raise ValueError(f"Look-at target not found: {look_at}")
        
        direction = Vector(target.location) - Vector(cam.location)
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
    elif rotation:
        cam.rotation_euler = rotation
    
    return {
        "success": True,
        "camera": cam.name,
        "location": list(cam.location),
        "rotation": list(cam.rotation_euler),
    }


def handle_frame_object(params: dict) -> dict:
    """Automatically frame camera to fit an object."""
    object_name = params.get("object_name")
    camera_name = params.get("camera_name")
    margin = params.get("margin", 1.2)  # 1.2 = 20% margin around object
    
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object not found: {object_name}")
    
    cam = bpy.data.objects.get(camera_name) if camera_name else bpy.context.scene.camera
    if not cam or cam.type != 'CAMERA':
        raise ValueError(f"Camera not found: {camera_name}")
    
    # Get object bounding box in world coordinates
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    
    # Calculate bounding sphere radius
    center = sum(bbox, Vector()) / 8
    radius = max((v - center).length for v in bbox)
    
    # For orthographic camera, set ortho_scale
    if cam.data.type == 'ORTHO':
        cam.data.ortho_scale = radius * 2 * margin
    else:
        # For perspective, adjust distance based on FOV
        fov = cam.data.angle  # radians
        distance = (radius * margin) / math.tan(fov / 2)
        
        # Move camera along its local -Z axis
        direction = Vector((0, 0, -1))
        direction.rotate(cam.rotation_euler)
        cam.location = center - direction * distance
    
    return {
        "success": True,
        "camera": cam.name,
        "object": obj.name,
        "ortho_scale": cam.data.ortho_scale if cam.data.type == 'ORTHO' else None,
        "location": list(cam.location),
    }


def handle_reset_viewport(params: dict) -> dict:
    """Reset viewport to default home view with all objects framed.
    
    Category: standard
    
    Args:
        animate: Whether to animate the transition (default: False)
        duration: Animation duration in seconds (default: 0.3)
    """
    animate = params.get("animate", False)
    duration = params.get("duration", 0.3)
    
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for region in area.regions:
                if region.type == "WINDOW":
                    override = {"area": area, "region": region}
                    with bpy.context.temp_override(**override):
                        bpy.ops.view3d.view_all()
                    break
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.region_3d.view_perspective = "PERSP"
                    space.region_3d.view_distance = 10
                    break
            break
    
    return {"success": True, "message": "Viewport reset"}


def handle_set_viewport_shading(params: dict) -> dict:
    """Set viewport shading mode.
    
    Category: standard
    
    Args:
        mode: WIREFRAME, SOLID, MATERIAL, or RENDERED
    """
    mode = params.get("mode", "SOLID").upper()
    
    if mode not in ["WIREFRAME", "SOLID", "MATERIAL", "RENDERED"]:
        raise ValueError(f"Invalid shading mode: {mode}")
    
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.shading.type = mode
                    break
            break
    
    return {"success": True, "mode": mode}


def handle_set_viewport_view(params: dict) -> dict:
    """Set viewport to a standard view.
    
    Category: standard
    
    Args:
        view: FRONT, BACK, TOP, BOTTOM, LEFT, RIGHT
        object_name: Optional object to frame after setting view
        animate: Whether to animate the transition (default: False)
        duration: Animation duration in seconds (default: 0.3)
    """
    view = params.get("view", "FRONT").upper()
    object_name = params.get("object_name")
    animate = params.get("animate", False)
    duration = params.get("duration", 0.3)
    
    if view not in ["FRONT", "BACK", "TOP", "BOTTOM", "LEFT", "RIGHT"]:
        raise ValueError(f"Invalid view: {view}")
    
    # Select object if specified
    if object_name:
        obj = bpy.data.objects.get(object_name)
        if obj:
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
    
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for region in area.regions:
                if region.type == "WINDOW":
                    override = {"area": area, "region": region}
                    with bpy.context.temp_override(**override):
                        bpy.ops.view3d.view_axis(type=view)
                        if object_name:
                            bpy.ops.view3d.view_selected()
                    break
            break
    
    return {"success": True, "view": view, "object": object_name}
