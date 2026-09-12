import bpy
import os
import sys


input_path, output_path = sys.argv[-2:]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=input_path)

# Keep the characters visually rich while removing the very heavy raw mesh.
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new('Web preview decimation', 'DECIMATE')
    modifier.ratio = 0.28
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)

# Web previews do not need 4K+ textures. Keep the same aspect ratio and cap
# each embedded image at 2048px on its longest edge.
for image in bpy.data.images:
    if image.type == 'RENDER_RESULT' or image.size[0] == 0 or image.size[1] == 0:
        continue
    longest = max(image.size[0], image.size[1])
    if longest > 2048:
        scale = 2048 / longest
        image.scale(max(1, round(image.size[0] * scale)), max(1, round(image.size[1] * scale)))

os.makedirs(os.path.dirname(output_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_animations=True,
    export_image_format='AUTO',
    export_materials='EXPORT',
    export_apply=False,
)
