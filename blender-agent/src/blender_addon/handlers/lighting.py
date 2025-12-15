"""Lighting and Rendering handlers - lights, world, and render settings.

Includes: create_light, set_light_property, set_world_color,
set_render_engine, configure_render, render_image.
"""

import bpy


def handle_create_light(params: dict) -> dict:
    """Create a new light object."""
    light_type = params.get("type", "POINT").upper()  # POINT, SUN, SPOT, AREA
    name = params.get("name", "Light")
    location = params.get("location", [0, 0, 5])
    energy = params.get("energy", 1000)
    color = params.get("color", [1, 1, 1])
    
    valid_types = ["POINT", "SUN", "SPOT", "AREA"]
    if light_type not in valid_types:
        raise ValueError(f"Invalid light type: {light_type}. Valid: {valid_types}")
    
    # Create light data and object
    light_data = bpy.data.lights.new(name=name, type=light_type)
    light_data.energy = energy
    light_data.color = color[:3]
    
    light_obj = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = location
    
    # Select and make active (using low-level API to avoid context issues)
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    light_obj.select_set(True)
    bpy.context.view_layer.objects.active = light_obj
    
    return {
        "success": True,
        "name": light_obj.name,
        "type": light_type,
        "location": list(light_obj.location),
        "energy": energy,
    }


def handle_set_light_property(params: dict) -> dict:
    """Set properties of a light."""
    light_name = params.get("light_name")
    property_name = params.get("property")
    value = params.get("value")
    
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj or light_obj.type != 'LIGHT':
        raise ValueError(f"Light not found: {light_name}")
    
    light_data = light_obj.data
    
    # Map common property names
    property_map = {
        "energy": "energy",
        "color": "color",
        "size": "shadow_soft_size",
        "radius": "shadow_soft_size",
        "angle": "spot_size",  # For spot lights
        "blend": "spot_blend",  # For spot lights
    }
    
    prop = property_map.get(property_name.lower(), property_name)
    
    if hasattr(light_data, prop):
        setattr(light_data, prop, value)
    else:
        raise ValueError(f"Light property not found: {property_name}")
    
    return {
        "success": True,
        "light": light_name,
        "property": prop,
        "value": value,
    }


def handle_set_world_color(params: dict) -> dict:
    """Set the world background color."""
    color = params.get("color", [0.05, 0.05, 0.05])
    strength = params.get("strength", 1.0)
    
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    
    if bg_node:
        # Ensure color has 4 components
        if len(color) == 3:
            color = list(color) + [1.0]
        bg_node.inputs["Color"].default_value = color
        bg_node.inputs["Strength"].default_value = strength
    
    return {
        "success": True,
        "world": world.name,
        "color": color[:3],
        "strength": strength,
    }


def handle_set_render_engine(params: dict) -> dict:
    """Set the render engine."""
    engine = params.get("engine", "CYCLES").upper()
    
    valid_engines = ["CYCLES", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"]
    if engine not in valid_engines:
        raise ValueError(f"Invalid engine: {engine}. Valid: {valid_engines}")
    
    bpy.context.scene.render.engine = engine
    
    return {
        "success": True,
        "engine": engine,
    }


def handle_configure_render(params: dict) -> dict:
    """Configure render settings."""
    resolution_x = params.get("resolution_x")
    resolution_y = params.get("resolution_y")
    samples = params.get("samples")
    use_denoising = params.get("use_denoising")
    film_transparent = params.get("film_transparent")
    
    scene = bpy.context.scene
    
    if resolution_x:
        scene.render.resolution_x = resolution_x
    if resolution_y:
        scene.render.resolution_y = resolution_y
    
    # Cycles-specific settings
    if scene.render.engine == "CYCLES":
        if samples:
            scene.cycles.samples = samples
        if use_denoising is not None:
            scene.cycles.use_denoising = use_denoising
    
    # EEVEE-specific settings
    if scene.render.engine == "BLENDER_EEVEE_NEXT":
        if samples:
            scene.eevee.taa_render_samples = samples
    
    if film_transparent is not None:
        scene.render.film_transparent = film_transparent
    
    return {
        "success": True,
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "engine": scene.render.engine,
    }


def handle_render_image(params: dict) -> dict:
    """Render an image to a file."""
    filepath = params.get("filepath", "/tmp/render.png")
    animation = params.get("animation", False)
    
    scene = bpy.context.scene
    scene.render.filepath = filepath
    
    if animation:
        bpy.ops.render.render(animation=True)
        return {
            "success": True,
            "filepath": filepath,
            "animation": True,
            "frame_range": [scene.frame_start, scene.frame_end],
        }
    else:
        bpy.ops.render.render(write_still=True)
        return {
            "success": True,
            "filepath": filepath,
            "animation": False,
        }
