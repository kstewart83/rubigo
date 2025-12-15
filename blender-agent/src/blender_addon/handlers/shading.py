"""Shading handlers - material and texture operations.

Includes: create_material, assign_material, set_material_color, 
set_material_property, add_texture_node.
"""

import bpy


def handle_create_material(params: dict) -> dict:
    """Create a new material."""
    name = params.get("name", "Material")
    use_nodes = params.get("use_nodes", True)
    
    # Check if material already exists
    mat = bpy.data.materials.get(name)
    if mat:
        return {
            "success": True,
            "name": mat.name,
            "created": False,
            "message": "Material already exists",
        }
    
    # Create new material
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = use_nodes
    
    return {
        "success": True,
        "name": mat.name,
        "created": True,
        "use_nodes": mat.use_nodes,
    }


def handle_assign_material(params: dict) -> dict:
    """Assign a material to an object."""
    object_name = params.get("object_name")
    material_name = params.get("material_name")
    slot_index = params.get("slot_index")  # None for append, number for specific slot
    
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object not found: {object_name}")
    
    if not hasattr(obj.data, "materials"):
        raise ValueError(f"Object {object_name} does not support materials")
    
    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material not found: {material_name}")
    
    if slot_index is not None:
        # Assign to specific slot
        if slot_index >= len(obj.data.materials):
            # Extend slots if needed
            while len(obj.data.materials) <= slot_index:
                obj.data.materials.append(None)
        obj.data.materials[slot_index] = mat
    else:
        # Append to materials
        if mat.name not in [m.name for m in obj.data.materials if m]:
            obj.data.materials.append(mat)
    
    return {
        "success": True,
        "object": obj.name,
        "material": mat.name,
        "material_count": len(obj.data.materials),
    }


def handle_set_material_color(params: dict) -> dict:
    """Set the base color of a material."""
    material_name = params.get("material_name")
    color = params.get("color", [0.8, 0.8, 0.8, 1.0])
    
    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material not found: {material_name}")
    
    if not mat.use_nodes:
        mat.use_nodes = True
    
    # Find Principled BSDF node
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        raise ValueError("Material does not have a Principled BSDF node")
    
    # Ensure color has 4 components (RGBA)
    if len(color) == 3:
        color = list(color) + [1.0]
    
    bsdf.inputs["Base Color"].default_value = color
    
    return {
        "success": True,
        "material": mat.name,
        "color": list(color),
    }


def handle_set_material_property(params: dict) -> dict:
    """Set a property of a material (metallic, roughness, etc)."""
    material_name = params.get("material_name")
    property_name = params.get("property")  # metallic, roughness, ior, etc
    value = params.get("value")
    
    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material not found: {material_name}")
    
    if not mat.use_nodes:
        mat.use_nodes = True
    
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        raise ValueError("Material does not have a Principled BSDF node")
    
    # Map common property names to node input names
    property_map = {
        "metallic": "Metallic",
        "roughness": "Roughness",
        "ior": "IOR",
        "alpha": "Alpha",
        "emission_strength": "Emission Strength",
        "specular": "Specular IOR Level",
        "transmission": "Transmission Weight",
        "coat": "Coat Weight",
        "sheen": "Sheen Weight",
        "subsurface": "Subsurface Weight",
    }
    
    input_name = property_map.get(property_name.lower(), property_name)
    
    if input_name not in bsdf.inputs:
        available = [inp.name for inp in bsdf.inputs]
        raise ValueError(f"Property '{input_name}' not found. Available: {available}")
    
    bsdf.inputs[input_name].default_value = value
    
    return {
        "success": True,
        "material": mat.name,
        "property": input_name,
        "value": value,
    }


def handle_add_image_texture(params: dict) -> dict:
    """Add an image texture node to a material."""
    material_name = params.get("material_name")
    image_path = params.get("image_path")
    connect_to = params.get("connect_to", "Base Color")  # Which input to connect
    
    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material not found: {material_name}")
    
    if not mat.use_nodes:
        mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Create image texture node
    tex_node = nodes.new('ShaderNodeTexImage')
    tex_node.location = (-300, 300)
    
    # Load image if path provided
    if image_path:
        image = bpy.data.images.load(image_path)
        tex_node.image = image
    
    # Find Principled BSDF and connect
    bsdf = nodes.get("Principled BSDF")
    if bsdf and connect_to in bsdf.inputs:
        links.new(tex_node.outputs["Color"], bsdf.inputs[connect_to])
    
    return {
        "success": True,
        "material": mat.name,
        "node": tex_node.name,
        "connected_to": connect_to if bsdf else None,
    }
