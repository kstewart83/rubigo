"""UV handlers - UV unwrapping operations.

Includes: mark_seam, clear_seam, unwrap, project_from_view.
"""

import bpy


def handle_mark_seam(params: dict) -> dict:
    """Mark selected edges as UV seams."""
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode to mark seams")
    
    bpy.ops.mesh.select_mode(type='EDGE')
    bpy.ops.mesh.mark_seam(clear=False)
    
    return {"success": True, "action": "mark_seam"}


def handle_clear_seam(params: dict) -> dict:
    """Clear UV seams from selected edges."""
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode to clear seams")
    
    bpy.ops.mesh.mark_seam(clear=True)
    
    return {"success": True, "action": "clear_seam"}


def handle_unwrap(params: dict) -> dict:
    """Unwrap selected faces using the default unwrap method."""
    method = params.get("method", "ANGLE_BASED")
    margin = params.get("margin", 0.001)
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode to unwrap")
    
    bpy.ops.uv.unwrap(method=method, margin=margin)
    
    return {"success": True, "method": method, "margin": margin}


def handle_project_from_view(params: dict) -> dict:
    """Project UVs from the current view."""
    orthographic = params.get("orthographic", True)
    scale_to_bounds = params.get("scale_to_bounds", False)
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode to project from view")
    
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for region in area.regions:
                if region.type == 'WINDOW':
                    override = {'area': area, 'region': region}
                    with bpy.context.temp_override(**override):
                        bpy.ops.uv.project_from_view(
                            orthographic=orthographic,
                            scale_to_bounds=scale_to_bounds,
                        )
                    return {
                        "success": True,
                        "orthographic": orthographic,
                        "scale_to_bounds": scale_to_bounds,
                    }
    
    raise ValueError("No 3D viewport found for projection")
