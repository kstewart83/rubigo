import bpy
import json
import csv
import math
import os
from mathutils import Vector

# --- Configuration ---
COUNTRIES_FILE = "/home/kstewart/development/network-simulation/countries_110m.geo.json"
STATES_FILE = "/home/kstewart/development/network-simulation/us_states_20m.geo.json"
CITIES_FILE = "/home/kstewart/development/network-simulation/worldcities_dev.csv"
OUTPUT_FILE = "/home/kstewart/development/network-simulation/gui-server/assets/geo/geoviz_earth.glb"

GLOBE_RADIUS = 1.0  # Normalized size for web viewing
# Slight offsets to prevent z-fighting
COUNTRY_RADIUS = GLOBE_RADIUS + 0.002
STATE_RADIUS = GLOBE_RADIUS + 0.003
CITY_RADIUS = GLOBE_RADIUS + 0.005

# Modern color palette (matching UI design)
COLORS = {
    "ocean": (0.02, 0.05, 0.12, 1.0),           # Deep navy
    "country_border": (0.0, 0.85, 0.95, 1.0),   # Cyan glow
    "state_border": (0.3, 0.5, 0.9, 1.0),       # Softer blue
    "city_marker": (1.0, 0.5, 0.1, 1.0),        # Orange/amber glow
    "city_pin": (0.15, 0.15, 0.2, 1.0),         # Dark base
    "atmosphere": (0.2, 0.6, 1.0, 0.15),        # Light blue atmosphere
}


def clear_scene():
    """Clears all objects in the current scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Clear orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)
    for block in bpy.data.curves:
        if block.users == 0:
            bpy.data.curves.remove(block)


def setup_collections():
    """Sets up the collection hierarchy."""
    if "Geospatial" not in bpy.data.collections:
        geo_col = bpy.data.collections.new("Geospatial")
        bpy.context.scene.collection.children.link(geo_col)
    else:
        geo_col = bpy.data.collections["Geospatial"]
        
    cols = ["Globe", "Countries", "States", "Cities"]
    created = {}
    for c in cols:
        if c not in bpy.data.collections:
            new_col = bpy.data.collections.new(c)
            geo_col.children.link(new_col)
            created[c] = new_col
        else:
            created[c] = bpy.data.collections[c]
    return created


def lat_lon_to_vector(lat, lon, radius):
    """Converts lat/lon to 3D Cartesian coordinates."""
    phi = math.radians(90 - lat)
    theta = math.radians(lon + 180)
    
    # Standard spherical to cartesian, adjusted for Blender's Z-up
    x = -radius * math.sin(phi) * math.cos(theta)
    y = -radius * math.sin(phi) * math.sin(theta)
    z = radius * math.cos(phi)
    
    return Vector((x, y, z))


def create_material(name, color, emission_strength=0.0, metallic=0.0, roughness=0.8):
    """Creates a PBR material with optional emission for modern look."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Clear default nodes
    nodes.clear()
    
    # Create output node
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (400, 0)
    
    if emission_strength > 0:
        # Emission material for glowing elements
        emission = nodes.new(type='ShaderNodeEmission')
        emission.inputs['Strength'].default_value = emission_strength
        emission.inputs['Color'].default_value = color
        emission.location = (0, 100)
        
        # Mix with a bit of diffuse for depth
        principled = nodes.new(type='ShaderNodeBsdfPrincipled')
        principled.inputs['Base Color'].default_value = color
        principled.inputs['Roughness'].default_value = roughness
        principled.inputs['Metallic'].default_value = metallic
        principled.location = (0, -100)
        
        mix = nodes.new(type='ShaderNodeMixShader')
        mix.inputs['Fac'].default_value = 0.7  # More emission than diffuse
        mix.location = (200, 0)
        
        links.new(emission.outputs[0], mix.inputs[1])
        links.new(principled.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], output.inputs['Surface'])
    else:
        # Standard PBR material
        principled = nodes.new(type='ShaderNodeBsdfPrincipled')
        principled.inputs['Base Color'].default_value = color
        principled.inputs['Roughness'].default_value = roughness
        principled.inputs['Metallic'].default_value = metallic
        principled.location = (0, 0)
        
        links.new(principled.outputs[0], output.inputs['Surface'])
    
    return mat


def process_geojson(filepath, collection, radius, material, name_prefix="Feature"):
    """Process GeoJSON and create 3D border curves."""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r') as f:
        data = json.load(f)
        
    print(f"Processing {len(data['features'])} features from {filepath}...")
    
    count = 0
    for feature in data['features']:
        props = feature.get('properties', {})
        name = props.get('NAME') or props.get('name') or f"{name_prefix}_{count}"
        geo = feature.get('geometry')
        
        if not geo: 
            continue
            
        geo_type = geo['type']
        coords = geo['coordinates']
        
        # Collect all rings for this feature
        rings = []
        
        if geo_type == 'Polygon':
            rings.extend(coords)
        elif geo_type == 'MultiPolygon':
            for poly in coords:
                rings.extend(poly)
        
        if not rings:
            continue
            
        # Create curve object with bevel for visibility
        curve_data = bpy.data.curves.new(name=name, type='CURVE')
        curve_data.dimensions = '3D'
        curve_data.resolution_u = 2
        curve_data.bevel_depth = 0.003  # Thin line bevel
        curve_data.bevel_resolution = 2
        
        curve_obj = bpy.data.objects.new(name, curve_data)
        collection.objects.link(curve_obj)
        curve_obj.active_material = material
        
        for ring in rings:
            if len(ring) < 2:
                continue
            
            spline = curve_data.splines.new('POLY')
            spline.points.add(len(ring) - 1)
            
            for i, point in enumerate(ring):
                lon, lat = point
                vec = lat_lon_to_vector(lat, lon, radius)
                spline.points[i].co = (vec.x, vec.y, vec.z, 1.0)
            
            spline.use_cyclic_u = True
            
        count += 1
        if count % 50 == 0:
            print(f"Processed {count} features...")
    
    print(f"Created {count} border curves.")


def process_cities(filepath, collection, radius, pin_material, glow_material):
    """Create city markers with pins and glowing tops."""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    print(f"Processing cities from {filepath}...")
    
    # Create marker geometry - a pin with a glowing sphere on top
    # Pin base (cylinder)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.008, 
        depth=0.04, 
        location=(0, 0, 0)
    )
    pin_mesh = bpy.context.active_object.data
    pin_mesh.name = "CityPinMesh"
    bpy.ops.object.delete()
    
    # Glowing top (sphere)
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.012, 
        segments=12, 
        ring_count=8,
        location=(0, 0, 0)
    )
    glow_mesh = bpy.context.active_object.data
    glow_mesh.name = "CityGlowMesh"
    bpy.ops.object.delete()
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0 
        for row in reader:
            try:
                lat = float(row['lat'])
                lon = float(row['lng'])
                name = row['city']
                population = int(row.get('population', 0) or 0)
                
                # Scale marker size slightly by population
                scale_factor = 1.0 + (min(population, 10000000) / 20000000)
                
                vec = lat_lon_to_vector(lat, lon, radius)
                up = vec.normalized()
                
                # Create pin
                pin_obj = bpy.data.objects.new(f"Pin_{name}", pin_mesh)
                pin_obj.location = vec + up * 0.02  # Raise pin above surface
                pin_obj.scale = (scale_factor, scale_factor, scale_factor)
                pin_obj.active_material = pin_material
                
                # Orient to surface normal
                pin_obj.rotation_mode = 'QUATERNION'
                pin_obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(up)
                
                collection.objects.link(pin_obj)
                
                # Create glowing top
                glow_obj = bpy.data.objects.new(f"Glow_{name}", glow_mesh)
                glow_obj.location = vec + up * 0.045  # Position on top of pin
                glow_obj.scale = (scale_factor, scale_factor, scale_factor)
                glow_obj.active_material = glow_material
                glow_obj.rotation_mode = 'QUATERNION'
                glow_obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(up)
                
                collection.objects.link(glow_obj)
                
                count += 1
            except Exception as e:
                print(f"Skipping city {row.get('city', '?')}: {e}")
    
    print(f"Created {count} city markers.")


def create_globe_base(radius, collection):
    """Create the ocean sphere with modern PBR material."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, 
        segments=64, 
        ring_count=32
    )
    globe = bpy.context.active_object
    globe.name = "Earth_Ocean"
    
    # Move to collection
    for col in globe.users_collection:
        col.objects.unlink(globe)
    collection.objects.link(globe)
    
    # Create modern ocean material with subtle metallic sheen
    mat = create_material(
        "OceanMaterial", 
        COLORS["ocean"],
        emission_strength=0.0,
        metallic=0.3,
        roughness=0.6
    )
    globe.active_material = mat
    bpy.ops.object.shade_smooth()
    
    return globe


def create_atmosphere(radius, collection):
    """Create a subtle atmosphere glow effect."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius * 1.02,  # Slightly larger than globe
        segments=32, 
        ring_count=16
    )
    atmo = bpy.context.active_object
    atmo.name = "Atmosphere"
    
    for col in atmo.users_collection:
        col.objects.unlink(atmo)
    collection.objects.link(atmo)
    
    # Create transparent atmosphere material
    mat = bpy.data.materials.new(name="AtmosphereMaterial")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (400, 0)
    
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.inputs['Base Color'].default_value = COLORS["atmosphere"]
    principled.inputs['Alpha'].default_value = 0.1
    principled.inputs['Roughness'].default_value = 1.0
    principled.location = (0, 0)
    
    links.new(principled.outputs[0], output.inputs['Surface'])
    
    atmo.active_material = mat
    bpy.ops.object.shade_smooth()
    
    return atmo


def setup_lighting():
    """Setup modern lighting for the globe."""
    # Key light (sun)
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 5))
    sun = bpy.context.active_object
    sun.name = "KeyLight"
    sun.data.energy = 3.0
    sun.data.color = (1.0, 0.98, 0.95)
    
    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, -2, 2))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 50.0
    fill.data.color = (0.8, 0.9, 1.0)  # Slightly blue
    fill.data.size = 5.0
    
    # Rim/back light for edge definition
    bpy.ops.object.light_add(type='AREA', location=(-2, 3, -1))
    rim = bpy.context.active_object
    rim.name = "RimLight"
    rim.data.energy = 100.0
    rim.data.color = (0.4, 0.7, 1.0)  # Cool blue rim
    rim.data.size = 3.0


def setup_camera():
    """Setup camera with good viewing angle."""
    bpy.ops.object.camera_add(
        location=(2.5, -2.5, 1.5),
        rotation=(math.radians(60), 0, math.radians(45))
    )
    camera = bpy.context.active_object
    camera.name = "MainCamera"
    bpy.context.scene.camera = camera
    
    return camera


def export_glb(filepath):
    """Export scene as GLB for web use."""
    # Ensure output directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_cameras=True,
        export_lights=True,
    )
    print(f"Exported to {filepath}")


def main():
    print("\n" + "="*50)
    print("GEOSPATIAL VISUALIZATION GENERATOR")
    print("="*50 + "\n")
    
    clear_scene()
    collections = setup_collections()
    
    # Create materials
    mat_country = create_material(
        "CountryBorder", 
        COLORS["country_border"], 
        emission_strength=3.0
    )
    mat_state = create_material(
        "StateBorder", 
        COLORS["state_border"], 
        emission_strength=1.5
    )
    mat_pin = create_material(
        "CityPin", 
        COLORS["city_pin"],
        metallic=0.5,
        roughness=0.3
    )
    mat_glow = create_material(
        "CityGlow", 
        COLORS["city_marker"], 
        emission_strength=5.0
    )
    
    # 1. Base Globe (ocean)
    print("\n[1/6] Creating globe base...")
    create_globe_base(GLOBE_RADIUS, collections["Globe"])
    
    # 2. Atmosphere
    print("[2/6] Creating atmosphere...")
    create_atmosphere(GLOBE_RADIUS, collections["Globe"])
    
    # 3. Countries
    print("[3/6] Processing country borders...")
    if os.path.exists(COUNTRIES_FILE):
        process_geojson(
            COUNTRIES_FILE, 
            collections["Countries"], 
            COUNTRY_RADIUS, 
            mat_country, 
            "Country"
        )
        
    # 4. US States
    print("[4/6] Processing US state borders...")
    if os.path.exists(STATES_FILE):
        process_geojson(
            STATES_FILE, 
            collections["States"], 
            STATE_RADIUS, 
            mat_state, 
            "State"
        )
        
    # 5. Cities
    print("[5/6] Processing city markers...")
    if os.path.exists(CITIES_FILE):
        process_cities(
            CITIES_FILE, 
            collections["Cities"], 
            CITY_RADIUS, 
            mat_pin,
            mat_glow
        )
    
    # 6. Lighting & Camera
    print("[6/6] Setting up lighting and camera...")
    setup_lighting()
    setup_camera()
    
    # Configure render settings for quality preview
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    
    print("\n" + "="*50)
    print("GENERATION COMPLETE")
    print("="*50)
    print(f"\nTo export, run: export_glb('{OUTPUT_FILE}')")
    print("Or call main() followed by export_glb() in Blender console.")


if __name__ == "__main__":
    main()
    # Automatically export
    export_glb(OUTPUT_FILE)
