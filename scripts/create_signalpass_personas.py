import bpy
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "apps", "web", "public", "models", "signalpass-personas.glb")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def mat(name, color, roughness=0.42, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return material


INK = mat("Ink", (0.035, 0.055, 0.11), 0.32)
PAPER = mat("Warm Paper", (0.91, 0.86, 0.76), 0.76)
PAPER_LIGHT = mat("Card Paper", (0.98, 0.95, 0.86), 0.68)
COBALT = mat("Cobalt", (0.12, 0.28, 0.88), 0.3)
VIOLET = mat("Monad Violet", (0.38, 0.19, 0.92), 0.3)
MINT = mat("Signal Mint", (0.24, 0.9, 0.69), 0.28)
ORANGE = mat("Signal Orange", (0.96, 0.36, 0.12), 0.38)
SKIN_A = mat("Avery Skin", (0.68, 0.38, 0.2), 0.56)
SKIN_B = mat("Riley Skin", (0.86, 0.55, 0.34), 0.56)
HAIR_A = mat("Avery Hair", (0.035, 0.025, 0.02), 0.6)
HAIR_B = mat("Riley Hair", (0.12, 0.055, 0.025), 0.58)
BLUE_CLOTH = mat("Avery Knit", (0.16, 0.22, 0.52), 0.72)
VIOLET_CLOTH = mat("Riley Knit", (0.34, 0.18, 0.56), 0.72)
WHITE = mat("Sneaker", (0.96, 0.93, 0.84), 0.62)


def smooth(obj):
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True


def bevel(obj, amount=0.08, segments=4):
    modifier = obj.modifiers.new("Soft edges", "BEVEL")
    modifier.width = amount
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def cube(name, location, scale, material, radius=0.08, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if radius:
        bevel(obj, radius)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def sphere(name, location, scale, material, parent=None, segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=20, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, material, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    bevel(obj, 0.05, 3)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def text_obj(name, body, location, size, material, parent=None, align="CENTER"):
    curve = bpy.data.curves.new(name, type="FONT")
    curve.body = body
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.012
    curve.bevel_depth = 0.004
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.radians(90), 0, 0)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def animate_blink(obj, phase=0):
    obj.scale = (0.075, 0.13, 0.035)
    obj.keyframe_insert(data_path="scale", frame=1 + phase)
    obj.scale = (0.075, 0.13, 0.035)
    obj.keyframe_insert(data_path="scale", frame=28 + phase)
    obj.scale = (0.075, 0.012, 0.035)
    obj.keyframe_insert(data_path="scale", frame=31 + phase)
    obj.scale = (0.075, 0.13, 0.035)
    obj.keyframe_insert(data_path="scale", frame=35 + phase)
    obj.scale = (0.075, 0.13, 0.035)
    obj.keyframe_insert(data_path="scale", frame=72 + phase)
    obj.scale = (0.075, 0.012, 0.035)
    obj.keyframe_insert(data_path="scale", frame=75 + phase)
    obj.scale = (0.075, 0.13, 0.035)
    obj.keyframe_insert(data_path="scale", frame=79 + phase)
    # Blender 5.x stores action curves in layered channels; default Bézier
    # interpolation is already suitable for the small facial motion.


def animate_group(obj, amount=0.05, phase=0):
    obj.rotation_euler = (0, 0, -amount)
    obj.keyframe_insert(data_path="rotation_euler", frame=1 + phase)
    obj.rotation_euler = (0, 0, amount)
    obj.keyframe_insert(data_path="rotation_euler", frame=36 + phase)
    obj.rotation_euler = (0, 0, -amount)
    obj.keyframe_insert(data_path="rotation_euler", frame=72 + phase)


def make_person(prefix, x, body_material, skin_material, hair_material, phase=0, mirrored=False):
    root = bpy.data.objects.new(prefix, None)
    bpy.context.collection.objects.link(root)
    # Child meshes below use world-like coordinates so the shared group stays
    # at the scene origin and does not double-apply each persona's x offset.
    root.location = (0, 0, 0)
    root.rotation_euler[2] = 0

    torso = cube(f"{prefix}_Torso", (x, 1.1, 0.0), (0.48, 0.62, 0.32), body_material, 0.16, root)
    head = sphere(f"{prefix}_Head", (x, 2.05, 0.02), (0.55, 0.57, 0.47), skin_material, root)

    hair = bpy.data.objects.new(f"{prefix}_Hair", None)
    bpy.context.collection.objects.link(hair)
    hair.parent = root
    hair.location = (x, 2.42, -0.02)
    for i, offset in enumerate((-0.28, -0.1, 0.1, 0.28)):
        sphere(f"{prefix}_Hair_{i}", (offset, 0.06 if i % 2 else 0, 0), (0.22, 0.18, 0.38), hair_material, hair)
    animate_group(hair, 0.055, phase)

    eye_l = sphere(f"{prefix}_Eye_L", (x - 0.18, 2.07, 0.46), (0.075, 0.13, 0.035), INK, root)
    eye_r = sphere(f"{prefix}_Eye_R", (x + 0.18, 2.07, 0.46), (0.075, 0.13, 0.035), INK, root)
    animate_blink(eye_l, phase)
    animate_blink(eye_r, phase)
    nose = sphere(f"{prefix}_Nose", (x, 1.96, 0.47), (0.05, 0.06, 0.045), skin_material, root)
    mouth = cylinder(f"{prefix}_Smile", (x, 1.86, 0.46), 0.08, 0.025, INK, root)
    mouth.rotation_euler[0] = math.radians(90)

    arm_x = x + (-0.63 if mirrored else 0.63)
    arm = cube(f"{prefix}_Arm", (arm_x, 1.16, 0.02), (0.16, 0.52, 0.18), body_material, 0.11, root)
    arm.rotation_euler[2] = math.radians(-24 if mirrored else 24)
    hand = sphere(f"{prefix}_Hand", (arm_x + (-0.16 if mirrored else 0.16), 1.5, 0.03), (0.17, 0.14, 0.13), skin_material, root)
    cube(f"{prefix}_Leg_L", (x - 0.22, 0.36, 0.02), (0.18, 0.42, 0.2), body_material, 0.09, root)
    cube(f"{prefix}_Leg_R", (x + 0.22, 0.36, 0.02), (0.18, 0.42, 0.2), body_material, 0.09, root)
    cube(f"{prefix}_Shoe_L", (x - 0.23, 0.03, 0.13), (0.25, 0.16, 0.32), WHITE, 0.08, root)
    cube(f"{prefix}_Shoe_R", (x + 0.23, 0.03, 0.13), (0.25, 0.16, 0.32), WHITE, 0.08, root)
    return root


def build_scene():
    clear_scene()
    scene_root = bpy.data.objects.new("SignalPass_Homepage_Scene", None)
    bpy.context.collection.objects.link(scene_root)

    avery = make_person("Avery", -1.65, BLUE_CLOTH, SKIN_A, HAIR_A, 0, False)
    riley = make_person("Riley", 1.65, VIOLET_CLOTH, SKIN_B, HAIR_B, 8, True)
    avery.parent = scene_root
    riley.parent = scene_root

    card = cube("Introduction_Card_3D", (0, 1.76, 0.52), (0.98, 1.2, 0.085), PAPER_LIGHT, 0.13, scene_root)
    card.rotation_euler[2] = math.radians(-2.5)
    card.keyframe_insert(data_path="rotation_euler", frame=1)
    card.rotation_euler[2] = math.radians(2.5)
    card.keyframe_insert(data_path="rotation_euler", frame=72)

    cube("Card_Inset", (0, 0, 0.11), (0.83, 0.88, 0.018), PAPER, 0.08, card)
    text_obj("Card_Title", "INTRODUCTION", (0, 0.66, 0.13), 0.17, INK, card)
    text_obj("Card_Subtitle", "SHARED CONTEXT", (0, 0.36, 0.13), 0.09, VIOLET, card)
    text_obj("Card_Footer", "YOUR CALL", (0, -0.74, 0.13), 0.1, INK, card)
    for idx, color in enumerate((COBALT, VIOLET, MINT)):
        sphere(f"Card_Signal_{idx}", (-0.32 + idx * 0.32, -0.02, 0.14), (0.09, 0.09, 0.035), color, card)

    signal = bpy.data.objects.new("Private_Signal", None)
    bpy.context.collection.objects.link(signal)
    signal.parent = scene_root
    for i, x in enumerate((-1.0, -0.54, 0.54, 1.0)):
        sphere(f"Signal_Node_{i}", (x, 1.74 + (0.12 if i % 2 else -0.12), 0.48), (0.055, 0.055, 0.055), VIOLET if i % 2 else MINT, signal)

    # Blender is Z-up while the authored paper sketch uses Y for vertical.
    # Rotate once at the export root so the GLB arrives upright in Three.js.
    scene_root.rotation_euler[0] = math.radians(90)
    return scene_root


def export():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 120
    bpy.context.scene.render.fps = 24
    bpy.context.scene.world.color = (0.03, 0.04, 0.08)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT.replace(".glb", ".blend"))
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT,
        export_format="GLB",
        export_animations=True,
        export_frame_range=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_apply=False,
    )


build_scene()
export()
