"""
Render what the Bevy globe SHOULD look like with emissive material:
- Black base color
- Blue emissive glow (0.1, 0.4, 0.7)
- Unlit/no shading
"""
import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create sphere (globe) at origin
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=64, ring_count=32, location=(0, 0, 0))
globe = bpy.context.active_object
globe.name = "Globe"

# Create emissive material (mimicking Bevy unlit + emissive)
mat = bpy.data.materials.new(name="GlobeEmissive")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear default nodes
nodes.clear()

# Create emission shader (this is what unlit + emissive should look like)
emission = nodes.new('ShaderNodeEmission')
emission.inputs['Color'].default_value = (0.1, 0.4, 0.7, 1.0)  # Blue
emission.inputs['Strength'].default_value = 1.0
emission.location = (0, 0)

# Output
output = nodes.new('ShaderNodeOutputMaterial')
output.location = (200, 0)

links.new(emission.outputs['Emission'], output.inputs['Surface'])

globe.data.materials.append(mat)
bpy.ops.object.shade_smooth()

# Camera at (3, 1.5, 3) looking at origin (matching Bevy)
bpy.ops.object.camera_add(location=(3, -3, 1.5))
camera = bpy.context.active_object
camera.name = "Camera"

# Look at origin
constraint = camera.constraints.new(type='TRACK_TO')
empty = bpy.ops.object.empty_add(location=(0, 0, 0))
target = bpy.context.active_object
target.name = "Target"
constraint.target = target
constraint.track_axis = 'TRACK_NEGATIVE_Z'
constraint.up_axis = 'UP_Y'

bpy.context.scene.camera = camera

# Dark space background
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.02, 0.04, 0.08, 1.0)

# Render settings
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 64
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 600
bpy.context.scene.render.filepath = "/home/kstewart/.gemini/antigravity/brain/030ab20f-1b9f-4122-acbe-457177854edc/expected_globe_emissive.png"

# Render
bpy.ops.render.render(write_still=True)

print("Render complete: expected_globe_emissive.png")
