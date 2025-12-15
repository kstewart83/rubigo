"""
Simple Globe GLB Exporter for Bevy

Creates a minimal sphere with materials that Bevy can load reliably.
Uses simple, Bevy-compatible export settings.

Usage:
    blender --background --python scripts/create_simple_globe.py
"""

import bpy
import math

def clear_scene():
    """Remove all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_simple_globe():
    """Create a simple colored sphere that Bevy can load"""
    
    # Clear existing objects
    clear_scene()
    
    # Create UV Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=32, ring_count=16)
    sphere = bpy.context.active_object
    sphere.name = "Globe"
    
    # Create a simple material (use nodes for PBR compatibility)
    mat = bpy.data.materials.new(name="GlobeMaterial")
    mat.use_nodes = True
    
    # Get the principled BSDF node
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        # Set to ocean blue color
        bsdf.inputs["Base Color"].default_value = (0.05, 0.25, 0.5, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.7
        bsdf.inputs["Metallic"].default_value = 0.0
    
    # Assign material to sphere
    sphere.data.materials.append(mat)
    
    # Apply all transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    print(f"Created sphere: {sphere.name}")
    print(f"Material: {mat.name}")
    
    return sphere

def export_glb(filepath):
    """Export scene as GLB with Bevy-compatible settings"""
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        # Simplified settings for maximum compatibility
        export_yup=True,  # Y-up for Bevy
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
    )
    print(f"Exported to: {filepath}")

def main():
    print("=" * 50)
    print("Simple Globe GLB Exporter")
    print("=" * 50)
    
    # Create the globe
    create_simple_globe()
    
    # Export
    output_path = "crates/ui-app/assets/geo/earth_globe.glb"
    export_glb(output_path)
    
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    main()
