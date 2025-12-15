"""
Create a preview of the Bevy test scene: red cube at origin with bright lighting.
"""
import bpy
import mathutils
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Create a red cube at origin
bpy.ops.mesh.primitive_cube_add(size=0.5, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "TestCube"

# Create red material
mat = bpy.data.materials.new(name="BrightRed")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (1.0, 0.2, 0.2, 1.0)
bsdf.inputs["Emission Color"].default_value = (1.0, 0.2, 0.2, 1.0)
bsdf.inputs["Emission Strength"].default_value = 0.3
cube.data.materials.append(mat)

# Camera at (3, 2, 3) looking at origin
bpy.ops.object.camera_add(location=(3, -3, 2))  # Note: Blender uses different Y convention
camera = bpy.context.active_object
camera.name = "Camera"
# Point at origin
direction = mathutils.Vector((0, 0, 0)) - camera.location
camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# Use a constraint to look at origin
constraint = camera.constraints.new(type='TRACK_TO')
constraint.target = cube
constraint.track_axis = 'TRACK_NEGATIVE_Z'
constraint.up_axis = 'UP_Y'

bpy.context.scene.camera = camera

# Set background color (dark blue)
bpy.context.scene.world.use_nodes = True
bg = bpy.context.scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.1, 0.1, 0.2, 1.0)

# Add strong lighting
# Sun light
bpy.ops.object.light_add(type='SUN', location=(5, 5, 5))
sun = bpy.context.active_object
sun.data.energy = 5.0

# Ambient light via area light
bpy.ops.object.light_add(type='AREA', location=(0, 0, 5))
area = bpy.context.active_object
area.data.energy = 500

# Render settings
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 32
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 600
bpy.context.scene.render.filepath = "/home/kstewart/.gemini/antigravity/brain/030ab20f-1b9f-4122-acbe-457177854edc/bevy_expected_render.png"

# Render
bpy.ops.render.render(write_still=True)

print("Render complete: bevy_expected_render.png")
