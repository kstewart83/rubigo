import bpy

# Clear all objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create a UV sphere
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=1.0,
    segments=32,
    ring_count=16,
    location=(0, 0, 0)
)

# Get the sphere object
sphere = bpy.context.active_object
sphere.name = "Globe"

# Create a simple material with a blue-green color
mat = bpy.data.materials.new(name="GlobeMaterial")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    # Ocean blue color
    bsdf.inputs["Base Color"].default_value = (0.1, 0.3, 0.5, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.6
    bsdf.inputs["Metallic"].default_value = 0.0

# Apply material to sphere
sphere.data.materials.append(mat)

# Set smooth shading
bpy.ops.object.shade_smooth()

# Export to GLB
output_path = "/home/kstewart/development/network-simulation/crates/ui-app/assets/geo/globe.glb"
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_apply=True
)

print(f"Exported globe to: {output_path}")
