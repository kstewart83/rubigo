"""Modeling handlers - mesh editing operations.

Includes: set_mode, select_mesh_elements, extrude, loop_cut, bevel, inset,
add_modifier, apply_modifier.
"""

import bpy


def handle_set_mode(params: dict) -> dict:
    """Set the mode for an object (OBJECT, EDIT, SCULPT, etc)."""
    object_name = params.get("object_name")
    mode = params.get("mode", "OBJECT").upper()
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj:
        raise ValueError("No object specified or active")
    
    current_mode = bpy.context.object.mode if bpy.context.object else 'OBJECT'
    if current_mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    bpy.ops.object.mode_set(mode=mode)
    
    return {"success": True, "object": obj.name, "mode": mode}


def handle_select_mesh_elements(params: dict) -> dict:
    """Select mesh elements (vertices, edges, faces)."""
    select_type = params.get("type", "all")
    element_type = params.get("element_type", "VERT")
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode to select mesh elements")
    
    if select_type == "all":
        bpy.ops.mesh.select_all(action='SELECT')
    elif select_type == "none":
        bpy.ops.mesh.select_all(action='DESELECT')
    elif select_type == "invert":
        bpy.ops.mesh.select_all(action='INVERT')
    
    mesh = bpy.context.edit_object.data
    bpy.context.edit_object.update_from_editmode()
    
    return {
        "success": True,
        "selected_verts": sum(1 for v in mesh.vertices if v.select),
        "selected_edges": sum(1 for e in mesh.edges if e.select),
        "selected_faces": sum(1 for f in mesh.polygons if f.select),
    }


def handle_extrude(params: dict) -> dict:
    """Extrude selected geometry."""
    direction = params.get("direction", [0, 0, 1])
    amount = params.get("amount", 1.0)
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode for extrusion")
    
    bpy.ops.mesh.extrude_region_move(
        TRANSFORM_OT_translate={"value": tuple(d * amount for d in direction)}
    )
    
    return {"success": True, "direction": direction, "amount": amount}


def handle_loop_cut(params: dict) -> dict:
    """Add loop cuts to the mesh using subdivide."""
    cuts = params.get("cuts", 1)
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode for loop cut")
    
    bpy.ops.mesh.subdivide(number_cuts=cuts)
    
    return {"success": True, "cuts": cuts, "method": "subdivide"}


def handle_bevel(params: dict) -> dict:
    """Bevel selected edges or vertices."""
    offset = params.get("offset", 0.1)
    segments = params.get("segments", 1)
    affect = params.get("affect", "EDGES")
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode for bevel")
    
    bpy.ops.mesh.bevel(offset=offset, segments=segments, affect=affect)
    
    return {"success": True, "offset": offset, "segments": segments}


def handle_inset(params: dict) -> dict:
    """Inset selected faces."""
    thickness = params.get("thickness", 0.1)
    depth = params.get("depth", 0.0)
    
    if bpy.context.object.mode != 'EDIT':
        raise ValueError("Must be in EDIT mode for inset")
    
    bpy.ops.mesh.inset(thickness=thickness, depth=depth)
    
    return {"success": True, "thickness": thickness, "depth": depth}


def handle_delete_faces(params: dict) -> dict:
    """Delete mesh faces by normal direction or current selection.
    
    Parameters:
        object_name: Object to modify (optional, uses active)
        direction: Delete faces facing this direction (e.g., [0, -1, 0] for -Y/front)
        threshold: Dot product threshold for direction matching (default 0.9)
        use_selection: If True, delete currently selected faces instead
    """
    import bmesh
    from mathutils import Vector
    
    object_name = params.get("object_name")
    direction = params.get("direction")  # e.g., [0, -1, 0] for front faces
    threshold = params.get("threshold", 0.9)
    use_selection = params.get("use_selection", False)
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj or obj.type != "MESH":
        raise ValueError("No mesh object specified or active")
    
    # Ensure we're in object mode to access mesh data properly
    was_edit_mode = bpy.context.object and bpy.context.object.mode == 'EDIT'
    if was_edit_mode:
        bpy.ops.object.mode_set(mode='OBJECT')
    
    # Make object active
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    bm = bmesh.from_edit_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    
    faces_to_delete = []
    
    if use_selection:
        # Delete currently selected faces
        faces_to_delete = [f for f in bm.faces if f.select]
    elif direction:
        # Delete faces matching direction
        dir_vec = Vector(direction).normalized()
        for face in bm.faces:
            dot = face.normal.dot(dir_vec)
            if dot > threshold:
                faces_to_delete.append(face)
    else:
        raise ValueError("Must specify 'direction' or 'use_selection=True'")
    
    count = len(faces_to_delete)
    bmesh.ops.delete(bm, geom=faces_to_delete, context='FACES')
    
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return {
        "success": True,
        "object": obj.name,
        "faces_deleted": count,
        "direction": direction,
    }


def handle_add_modifier(params: dict) -> dict:
    """Add a modifier to an object."""
    object_name = params.get("object_name")
    modifier_type = params.get("type", "SUBSURF").upper()
    modifier_name = params.get("name")
    settings = params.get("settings", {})
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj:
        raise ValueError("No object specified or active")
    
    mod = obj.modifiers.new(name=modifier_name or modifier_type, type=modifier_type)
    
    for key, value in settings.items():
        if hasattr(mod, key):
            setattr(mod, key, value)
    
    return {
        "success": True,
        "object": obj.name,
        "modifier": mod.name,
        "type": modifier_type,
    }


def handle_apply_modifier(params: dict) -> dict:
    """Apply a modifier to an object."""
    object_name = params.get("object_name")
    modifier_name = params.get("modifier_name")
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj:
        raise ValueError("No object specified or active")
    
    if modifier_name not in [m.name for m in obj.modifiers]:
        raise ValueError(f"Modifier not found: {modifier_name}")
    
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier_name)
    
    return {"success": True, "object": obj.name, "applied": modifier_name}


def handle_get_mesh_info(params: dict) -> dict:
    """Get mesh information including vertex/edge/face counts and dimensions.
    
    Category: inspect
    
    Args:
        object_name: Object to inspect (uses active if not specified)
    """
    object_name = params.get("object_name")
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj or obj.type != "MESH":
        raise ValueError("No mesh object specified or active")
    
    mesh = obj.data
    
    # Get dimensions in world space
    dims = obj.dimensions
    
    # Calculate center in world space
    from mathutils import Vector
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox, Vector()) / 8
    
    return {
        "success": True,
        "object": obj.name,
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "dimensions_mm": [d * 1000 for d in dims],  # Convert to mm
        "center": list(center),
    }


def handle_shade_smooth(params: dict) -> dict:
    """Apply smooth shading to an object.
    
    Category: standard
    
    Args:
        object_name: Object to apply smooth shading (uses active if not specified)
    """
    object_name = params.get("object_name")
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj or obj.type != "MESH":
        raise ValueError("No mesh object specified or active")
    
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    bpy.ops.object.shade_smooth()
    
    return {"success": True, "object": obj.name, "shading": "smooth"}


def handle_get_selection_info(params: dict) -> dict:
    """Get information about currently selected mesh elements.
    
    Category: inspect
    
    Returns info about selected vertices, faces, and selection bounds.
    Must be in Edit Mode.
    """
    import bmesh
    from mathutils import Vector
    
    obj = bpy.context.active_object
    if not obj or obj.type != "MESH":
        raise ValueError("No mesh object active")
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    bm = bmesh.from_edit_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    
    sel_verts = [v for v in bm.verts if v.select]
    sel_faces = [f for f in bm.faces if f.select]
    
    if sel_verts:
        coords = [(obj.matrix_world @ v.co) for v in sel_verts]
        min_z = min(c.z for c in coords)
        max_z = max(c.z for c in coords)
        center = sum(coords, Vector()) / len(coords)
    else:
        min_z = max_z = None
        center = None
    
    return {
        "success": True,
        "object": obj.name,
        "selected_vertices": len(sel_verts),
        "selected_faces": len(sel_faces),
        "selection_min_z": min_z,
        "selection_max_z": max_z,
        "selection_center": list(center) if center else None,
    }


def handle_select_boundary_faces(params: dict) -> dict:
    """Select faces at the boundary/edge of a mesh.
    
    Category: standard
    
    Selects faces that have open edges (edges with only one face).
    
    Args:
        object_name: Object to operate on (uses active if not specified)
    """
    import bmesh
    
    object_name = params.get("object_name")
    
    obj = bpy.data.objects.get(object_name) if object_name else bpy.context.active_object
    if not obj or obj.type != "MESH":
        raise ValueError("No mesh object found")
    
    bpy.context.view_layer.objects.active = obj
    if bpy.context.object.mode != "EDIT":
        bpy.ops.object.mode_set(mode="EDIT")
    
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.context.tool_settings.mesh_select_mode = (False, False, True)
    
    bm = bmesh.from_edit_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    
    boundary_edges = [e for e in bm.edges if len(e.link_faces) == 1]
    boundary_faces = set()
    
    for e in boundary_edges:
        for f in e.link_faces:
            f.select = True
            boundary_faces.add(f)
    
    bmesh.update_edit_mesh(obj.data)
    
    return {
        "success": True,
        "object": obj.name,
        "boundary_edges": len(boundary_edges),
        "faces_selected": len(boundary_faces),
    }


def handle_grow_selection(params: dict) -> dict:
    """Expand selection to include neighboring mesh elements.
    
    Category: standard
    
    Args:
        iterations: Number of times to grow (default: 1)
    """
    iterations = params.get("iterations", 1)
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    for _ in range(iterations):
        bpy.ops.mesh.select_more()
    
    return {"success": True, "iterations": iterations}


def handle_shrink_selection(params: dict) -> dict:
    """Shrink selection by removing outermost elements.
    
    Category: standard
    
    Args:
        iterations: Number of times to shrink (default: 1)
    """
    iterations = params.get("iterations", 1)
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    for _ in range(iterations):
        bpy.ops.mesh.select_less()
    
    return {"success": True, "iterations": iterations}


def handle_move_selection(params: dict) -> dict:
    """Move selected vertices by offset.
    
    Category: standard
    
    Args:
        offset: [x, y, z] offset to move by
    """
    import bmesh
    from mathutils import Vector
    
    offset = params.get("offset", [0, 0, 0])
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    obj = bpy.context.active_object
    bm = bmesh.from_edit_mesh(obj.data)
    sel_verts = [v for v in bm.verts if v.select]
    
    for v in sel_verts:
        v.co += Vector(offset)
    
    bmesh.update_edit_mesh(obj.data)
    
    return {"success": True, "vertices_moved": len(sel_verts), "offset": offset}


def handle_snap_to_mesh(params: dict) -> dict:
    """Move selected vertices toward closest point on target mesh.
    
    Category: standard
    
    Args:
        target_object: Name of mesh to snap to
        offset: Distance above surface (default: 0.01)
        blend: 0-1 blend factor (default: 1.0 = full snap)
    """
    import bmesh
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    
    target_name = params.get("target_object")
    offset = params.get("offset", 0.01)
    blend = params.get("blend", 1.0)
    
    obj = bpy.context.active_object
    target = bpy.data.objects.get(target_name)
    
    if not obj or obj.type != "MESH":
        raise ValueError("Active object must be mesh")
    if not target or target.type != "MESH":
        raise ValueError(f"Target not found: {target_name}")
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    depsgraph = bpy.context.evaluated_depsgraph_get()
    target_eval = target.evaluated_get(depsgraph)
    target_mesh = target_eval.to_mesh()
    bvh = BVHTree.FromPolygons(
        [v.co for v in target_mesh.vertices],
        [p.vertices for p in target_mesh.polygons]
    )
    
    bm = bmesh.from_edit_mesh(obj.data)
    sel_verts = [v for v in bm.verts if v.select]
    
    for v in sel_verts:
        world_pos = obj.matrix_world @ v.co
        local_pos = target.matrix_world.inverted() @ world_pos
        
        location, normal, index, distance = bvh.find_nearest(local_pos)
        if location:
            snap_point = target.matrix_world @ (location + Vector(normal) * offset)
            local_snap = obj.matrix_world.inverted() @ snap_point
            v.co = v.co.lerp(local_snap, blend)
    
    bmesh.update_edit_mesh(obj.data)
    target_eval.to_mesh_clear()
    
    return {
        "success": True,
        "vertices_snapped": len(sel_verts),
        "target": target_name,
        "offset": offset,
    }


def handle_find_inside_mesh(params: dict) -> dict:
    """Find vertices that are inside another mesh object.
    
    Category: inspect
    
    Args:
        object_name: Source mesh (uses active if not specified)
        target_object: Mesh to check against
        select: If True, select the inside vertices (default: True)
    """
    import bmesh
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    
    obj_name = params.get("object_name")
    target_name = params.get("target_object")
    select_them = params.get("select", True)
    
    obj = bpy.data.objects.get(obj_name) if obj_name else bpy.context.active_object
    target = bpy.data.objects.get(target_name)
    
    if not obj or obj.type != "MESH":
        raise ValueError("Source must be mesh")
    if not target or target.type != "MESH":
        raise ValueError(f"Target not found: {target_name}")
    
    bpy.context.view_layer.objects.active = obj
    if bpy.context.object.mode != "EDIT":
        bpy.ops.object.mode_set(mode="EDIT")
    
    if select_them:
        bpy.ops.mesh.select_all(action="DESELECT")
    
    depsgraph = bpy.context.evaluated_depsgraph_get()
    target_eval = target.evaluated_get(depsgraph)
    target_mesh = target_eval.to_mesh()
    bvh = BVHTree.FromPolygons(
        [v.co for v in target_mesh.vertices],
        [p.vertices for p in target_mesh.polygons]
    )
    
    bm = bmesh.from_edit_mesh(obj.data)
    inside_count = 0
    
    for v in bm.verts:
        world_pos = obj.matrix_world @ v.co
        local_pos = target.matrix_world.inverted() @ world_pos
        
        location, normal, index, dist = bvh.find_nearest(local_pos)
        if location:
            to_surface = location - local_pos
            if to_surface.dot(Vector(normal)) > 0:
                inside_count += 1
                if select_them:
                    v.select = True
    
    bmesh.update_edit_mesh(obj.data)
    target_eval.to_mesh_clear()
    
    return {
        "success": True,
        "object": obj.name,
        "target": target_name,
        "vertices_inside": inside_count,
        "selected": select_them,
    }


def handle_add_selection_noise(params: dict) -> dict:
    """Add random displacement to selected vertices.
    
    Category: standard
    
    Args:
        amount: Max displacement distance (default: 0.02)
        seed: Random seed (default: 42)
    """
    import bmesh
    import random
    from mathutils import Vector
    
    amount = params.get("amount", 0.02)
    seed = params.get("seed", 42)
    
    if bpy.context.object.mode != "EDIT":
        raise ValueError("Must be in Edit Mode")
    
    random.seed(seed)
    
    obj = bpy.context.active_object
    bm = bmesh.from_edit_mesh(obj.data)
    sel_verts = [v for v in bm.verts if v.select]
    
    for v in sel_verts:
        offset = Vector((
            random.uniform(-amount, amount),
            random.uniform(-amount, amount),
            random.uniform(-amount, amount)
        ))
        v.co += offset
    
    bmesh.update_edit_mesh(obj.data)
    
    return {
        "success": True,
        "object": obj.name,
        "vertices_modified": len(sel_verts),
        "amount": amount,
    }
