"""Rigging handlers - armature and bone operations.

Includes: create_armature, add_bone, parent_to_armature, set_bone_parent.
"""

import bpy


def handle_create_armature(params: dict) -> dict:
    """Create a new armature object."""
    name = params.get("name", "Armature")
    location = params.get("location", [0, 0, 0])
    
    armature_data = bpy.data.armatures.new(name)
    armature_obj = bpy.data.objects.new(name, armature_data)
    
    bpy.context.collection.objects.link(armature_obj)
    armature_obj.location = location
    
    bpy.ops.object.select_all(action='DESELECT')
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    
    return {
        "success": True,
        "name": armature_obj.name,
        "location": list(armature_obj.location),
    }


def handle_add_bone(params: dict) -> dict:
    """Add a bone to an armature."""
    armature_name = params.get("armature_name")
    bone_name = params.get("name", "Bone")
    head = params.get("head", [0, 0, 0])
    tail = params.get("tail", [0, 0, 1])
    parent_bone = params.get("parent")
    
    armature_obj = bpy.data.objects.get(armature_name) if armature_name else bpy.context.active_object
    if not armature_obj or armature_obj.type != 'ARMATURE':
        raise ValueError("No armature specified or active")
    
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    armature_data = armature_obj.data
    bone = armature_data.edit_bones.new(bone_name)
    bone.head = head
    bone.tail = tail
    
    if parent_bone:
        parent = armature_data.edit_bones.get(parent_bone)
        if parent:
            bone.parent = parent
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return {
        "success": True,
        "armature": armature_obj.name,
        "bone": bone_name,
        "head": list(head),
        "tail": list(tail),
    }


def handle_parent_to_armature(params: dict) -> dict:
    """Parent a mesh to an armature with automatic weights."""
    mesh_name = params.get("mesh_name")
    armature_name = params.get("armature_name")
    parent_type = params.get("type", "ARMATURE_AUTO")
    
    mesh_obj = bpy.data.objects.get(mesh_name)
    armature_obj = bpy.data.objects.get(armature_name)
    
    if not mesh_obj:
        raise ValueError(f"Mesh not found: {mesh_name}")
    if not armature_obj or armature_obj.type != 'ARMATURE':
        raise ValueError(f"Armature not found: {armature_name}")
    
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    
    bpy.ops.object.parent_set(type=parent_type)
    
    return {
        "success": True,
        "mesh": mesh_obj.name,
        "armature": armature_obj.name,
        "type": parent_type,
    }


def handle_set_bone_parent(params: dict) -> dict:
    """Set the parent of a bone."""
    armature_name = params.get("armature_name")
    bone_name = params.get("bone_name")
    parent_name = params.get("parent_name")
    connected = params.get("connected", False)
    
    armature_obj = bpy.data.objects.get(armature_name) if armature_name else bpy.context.active_object
    if not armature_obj or armature_obj.type != 'ARMATURE':
        raise ValueError("No armature specified or active")
    
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    armature_data = armature_obj.data
    bone = armature_data.edit_bones.get(bone_name)
    if not bone:
        bpy.ops.object.mode_set(mode='OBJECT')
        raise ValueError(f"Bone not found: {bone_name}")
    
    if parent_name:
        parent = armature_data.edit_bones.get(parent_name)
        if not parent:
            bpy.ops.object.mode_set(mode='OBJECT')
            raise ValueError(f"Parent bone not found: {parent_name}")
        bone.parent = parent
        bone.use_connect = connected
    else:
        bone.parent = None
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return {
        "success": True,
        "bone": bone_name,
        "parent": parent_name,
        "connected": connected,
    }
