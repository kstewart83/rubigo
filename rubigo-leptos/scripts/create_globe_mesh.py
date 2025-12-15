"""
Globe GeoJSON to Blender Mesh Generator

This script imports GeoJSON country data and creates a 3D globe mesh
with land polygons projected onto a sphere surface.

Usage:
    blender --background --python scripts/create_globe_mesh.py -- --geojson countries_110m.geo.json --output crates/ui-app/assets/geo/earth_globe.glb
"""

import bpy
import bmesh
import json
import math
import sys
import os
from pathlib import Path

def clear_scene():
    """Remove all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def lat_lon_to_xyz(lat, lon, radius):
    """Convert latitude/longitude to 3D cartesian coordinates on a sphere"""
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    
    x = radius * math.cos(lat_rad) * math.sin(lon_rad)
    y = radius * math.sin(lat_rad)
    z = radius * math.cos(lat_rad) * math.cos(lon_rad)
    
    return (x, y, z)

def create_ocean_sphere(radius=1.0):
    """Create the base ocean sphere"""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=64, ring_count=32)
    sphere = bpy.context.active_object
    sphere.name = "Ocean"
    
    # Create ocean material
    mat = bpy.data.materials.new(name="OceanMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.18, 0.40, 1.0)  # Deep blue
    bsdf.inputs["Roughness"].default_value = 0.8
    
    sphere.data.materials.append(mat)
    return sphere

def create_land_material():
    """Create land material"""
    mat = bpy.data.materials.new(name="LandMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.38, 0.18, 1.0)  # Forest green
    bsdf.inputs["Roughness"].default_value = 0.9
    return mat

def parse_geojson(filepath):
    """Parse GeoJSON file and extract polygon coordinates"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    features = []
    
    if 'features' in data:
        for feature in data['features']:
            geometry = feature.get('geometry', {})
            geom_type = geometry.get('type', '')
            coords = geometry.get('coordinates', [])
            name = feature.get('properties', {}).get('NAME', 'Unknown')
            
            if geom_type == 'Polygon':
                features.append({
                    'name': name,
                    'type': 'Polygon',
                    'rings': coords  # [exterior, hole1, hole2, ...]
                })
            elif geom_type == 'MultiPolygon':
                for polygon in coords:
                    features.append({
                        'name': name,
                        'type': 'Polygon',
                        'rings': polygon
                    })
    
    return features

def create_polygon_mesh(name, exterior_coords, radius, offset=0.002):
    """Create a mesh for a single polygon projected onto sphere"""
    # Skip if too few points
    if len(exterior_coords) < 3:
        return None
    
    # Create mesh
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    
    bm = bmesh.new()
    
    # Create vertices projected onto sphere
    verts = []
    for coord in exterior_coords:
        lon, lat = coord[0], coord[1]
        pos = lat_lon_to_xyz(lat, lon, radius + offset)
        v = bm.verts.new(pos)
        verts.append(v)
    
    bm.verts.ensure_lookup_table()
    
    # Create face from vertices (simple fan triangulation for convex-ish shapes)
    try:
        if len(verts) >= 3:
            # For simple polygons, try to create a single face
            try:
                bm.faces.new(verts)
            except ValueError:
                # If that fails, try edge-only (outline)
                for i in range(len(verts)):
                    bm.edges.new([verts[i], verts[(i + 1) % len(verts)]])
    except Exception as e:
        print(f"Warning: Could not create face for {name}: {e}")
        bm.free()
        return None
    
    bm.to_mesh(mesh)
    bm.free()
    
    mesh.update()
    return obj

def triangulate_polygon_earclip(coords):
    """Simple ear-clipping triangulation for 2D polygons"""
    # This is a simplified version - Blender has better built-in triangulation
    pass

def create_land_from_geojson(geojson_path, radius=1.0):
    """Create land meshes from GeoJSON file"""
    print(f"Loading GeoJSON from: {geojson_path}")
    features = parse_geojson(geojson_path)
    print(f"Found {len(features)} polygon features")
    
    land_material = create_land_material()
    created_count = 0
    
    for i, feature in enumerate(features):
        if feature['type'] != 'Polygon':
            continue
        
        # Get exterior ring (first ring, holes are subsequent)
        rings = feature['rings']
        if not rings:
            continue
        
        exterior = rings[0]
        
        # Skip very small polygons
        if len(exterior) < 4:
            continue
        
        name = f"Land_{feature['name']}_{i}"
        obj = create_polygon_mesh(name, exterior, radius, offset=0.002)
        
        if obj:
            obj.data.materials.append(land_material)
            created_count += 1
        
        # Progress
        if i % 50 == 0:
            print(f"  Processed {i}/{len(features)} features...")
    
    print(f"Created {created_count} land meshes")
    return created_count

def join_land_meshes():
    """Join all land meshes into a single object for efficiency"""
    land_objects = [obj for obj in bpy.data.objects if obj.name.startswith("Land_")]
    
    if not land_objects:
        print("No land objects to join")
        return None
    
    # Select all land objects
    bpy.ops.object.select_all(action='DESELECT')
    for obj in land_objects:
        obj.select_set(True)
    
    bpy.context.view_layer.objects.active = land_objects[0]
    
    # Join into single mesh
    bpy.ops.object.join()
    
    result = bpy.context.active_object
    result.name = "Land"
    
    # Triangulate for proper WebGL rendering
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.quads_convert_to_tris()
    bpy.ops.object.mode_set(mode='OBJECT')
    
    print(f"Joined land meshes into single object")
    return result

def export_glb(filepath):
    """Export scene as GLB"""
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True
    )
    print(f"Exported to: {filepath}")

def main():
    # Parse arguments after "--"
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    # Default paths
    geojson_path = "countries_110m.geo.json"
    output_path = "crates/ui-app/assets/geo/earth_globe.glb"
    
    # Parse arguments
    i = 0
    while i < len(argv):
        if argv[i] == "--geojson" and i + 1 < len(argv):
            geojson_path = argv[i + 1]
            i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            output_path = argv[i + 1]
            i += 2
        else:
            i += 1
    
    print("=" * 50)
    print("Globe Mesh Generator")
    print("=" * 50)
    print(f"GeoJSON: {geojson_path}")
    print(f"Output: {output_path}")
    print()
    
    # Clear scene
    clear_scene()
    
    # Create ocean sphere
    print("Creating ocean sphere...")
    create_ocean_sphere(radius=1.0)
    
    # Create land from GeoJSON
    print("Creating land meshes from GeoJSON...")
    land_count = create_land_from_geojson(geojson_path, radius=1.0)
    
    if land_count > 0:
        # Join land meshes
        print("Joining land meshes...")
        join_land_meshes()
    
    # Export
    print("Exporting GLB...")
    export_glb(output_path)
    
    print()
    print("=" * 50)
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    main()
