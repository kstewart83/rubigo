"""Rendering handlers - compound rendering operations.

Includes: render_product_views (compound skill combining camera + render primitives).
"""

import bpy
import math
from mathutils import Vector


# Standard view configurations: (location_offset, rotation_euler)
# Location is relative to object center, scaled by framing distance
ORTHO_VIEWS = {
    "front": ((0, -1, 0), (math.radians(90), 0, 0)),
    "rear": ((0, 1, 0), (math.radians(90), 0, math.radians(180))),
    "top": ((0, 0, 1), (0, 0, 0)),
    "bottom": ((0, 0, -1), (math.radians(180), 0, 0)),
    "left": ((-1, 0, 0), (math.radians(90), 0, math.radians(-90))),
    "right": ((1, 0, 0), (math.radians(90), 0, math.radians(90))),
}

PERSP_VIEWS = {
    "persp_top_front_left": ((-1, -1, 0.7), (math.radians(55), 0, math.radians(-45))),
    "persp_top_front_right": ((1, -1, 0.7), (math.radians(55), 0, math.radians(45))),
    "persp_bottom_front_left": ((-1, -1, -0.5), (math.radians(120), 0, math.radians(-45))),
    "persp_bottom_front_right": ((1, -1, -0.5), (math.radians(120), 0, math.radians(45))),
    "persp_top_rear_left": ((-1, 1, 0.7), (math.radians(55), 0, math.radians(-135))),
    "persp_top_rear_right": ((1, 1, 0.7), (math.radians(55), 0, math.radians(135))),
    "persp_bottom_rear_left": ((-1, 1, -0.5), (math.radians(120), 0, math.radians(-135))),
    "persp_bottom_rear_right": ((1, 1, -0.5), (math.radians(120), 0, math.radians(135))),
}

CALLER_NAME = "render_product_views"


def handle_render_product_views(params: dict) -> dict:
    """Render multiple standardized views of an object.
    
    This is a compound skill that uses camera and lighting primitives.
    Renders 6 orthographic + 8 perspective views by default.
    All internal handler calls are tracked for statistics.
    """
    # Lazy import to avoid circular dependency
    from . import call_handler
    
    object_name = params.get("object_name")
    output_dir = params.get("output_dir", "/tmp/renders")
    prefix = params.get("prefix", "render")
    resolution = params.get("resolution", [800, 600])
    samples = params.get("samples", 64)
    views = params.get("views")  # None = all views
    margin = params.get("margin", 2.5)
    background_color = params.get("background_color", [0.02, 0.02, 0.05, 1])
    
    # Get the object
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object not found: {object_name}")
    
    # Calculate object bounds for camera positioning
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox, Vector()) / 8
    radius = max((v - center).length for v in bbox)
    cam_distance = radius * 3
    
    # Create camera using handler (tracked)
    if not bpy.data.objects.get("ProductRenderCam"):
        call_handler("create_camera", {
            "name": "ProductRenderCam",
            "location": [0, 0, 0],
            "type": "PERSP"
        }, caller=CALLER_NAME)
    
    cam = bpy.data.objects.get("ProductRenderCam")
    bpy.context.scene.camera = cam
    cam.data.clip_start = 0.001
    cam.data.clip_end = 100.0
    
    # Create key light using handler (tracked)
    if not bpy.data.objects.get("ProductKeyLight"):
        call_handler("create_light", {
            "name": "ProductKeyLight",
            "type": "SUN",
            "energy": 3,
            "rotation": [math.degrees(math.radians(50)), math.degrees(math.radians(30)), math.degrees(math.radians(40))]
        }, caller=CALLER_NAME)
    
    # Create fill light using handler (tracked)
    if not bpy.data.objects.get("ProductFillLight"):
        call_handler("create_light", {
            "name": "ProductFillLight",
            "type": "SUN",
            "energy": 1.5,
            "rotation": [math.degrees(math.radians(60)), math.degrees(math.radians(-20)), math.degrees(math.radians(-50))]
        }, caller=CALLER_NAME)
    
    # Set world background using handler (tracked)
    call_handler("set_world_color", {
        "color": background_color[:3]
    }, caller=CALLER_NAME)
    
    # Configure render settings using handler (tracked)
    call_handler("configure_render", {
        "resolution_x": resolution[0],
        "resolution_y": resolution[1],
        "samples": samples
    }, caller=CALLER_NAME)
    
    # Determine which views to render
    all_views = {}
    all_views.update(ORTHO_VIEWS)
    all_views.update(PERSP_VIEWS)
    
    if views:
        render_views = {k: v for k, v in all_views.items() if k in views}
    else:
        render_views = all_views
    
    rendered_files = []
    
    for view_name, (offset, rotation) in render_views.items():
        is_ortho = view_name in ORTHO_VIEWS
        
        # Set camera type
        cam.data.type = "ORTHO" if is_ortho else "PERSP"
        
        if is_ortho:
            dims = obj.dimensions
            abs_offset = (abs(offset[0]), abs(offset[1]), abs(offset[2]))
            
            if abs_offset[2] > abs_offset[0] and abs_offset[2] > abs_offset[1]:
                visible_max = max(dims.x, dims.y)
            elif abs_offset[1] > abs_offset[0] and abs_offset[1] > abs_offset[2]:
                visible_max = max(dims.x, dims.z)
            else:
                visible_max = max(dims.y, dims.z)
            
            cam.data.ortho_scale = visible_max * margin
            view_distance = cam_distance
        else:
            cam.data.lens = 50
            fov = cam.data.angle
            view_distance = (radius * margin) / math.tan(fov / 2)
        
        # Position camera using handler (tracked)
        offset_vec = Vector(offset).normalized() * view_distance
        cam_location = center + offset_vec
        
        call_handler("set_camera_position", {
            "name": "ProductRenderCam",
            "location": list(cam_location)
        }, caller=CALLER_NAME)
        
        # Set camera rotation
        if is_ortho:
            cam.rotation_euler = rotation
        else:
            direction = center - cam.location
            rot_quat = direction.to_track_quat('-Z', 'Y')
            cam.rotation_euler = rot_quat.to_euler()
        
        # Render using handler (tracked)
        filepath = f"{output_dir}/{prefix}_{view_name}.png"
        call_handler("render_image", {
            "filepath": filepath
        }, caller=CALLER_NAME)
        rendered_files.append(filepath)
    
    return {
        "success": True,
        "object": object_name,
        "views_rendered": len(rendered_files),
        "files": rendered_files,
    }
