import { Scene } from "./scene";
import { PierScene } from "./scenes/pier";
import { BrutalScene } from "./scenes/brutal";
import { MuseumScene } from "./scenes/museum";
import { FieldScene } from "./scenes/field";
import { DebugObjectScene } from "./scenes/dbg_object";
import { DebugDitherScene } from "./scenes/dbg_dither";
import { DebugOutlineScene } from "./scenes/dbg_outline";
import { DebugTransparencyScene } from "./scenes/dbg_transparency";
import { DebugEchoScene } from "./scenes/dbg_echo";
import { PostAsciiUniforms, PostDitherUniforms, PostOutlineUniforms, PostPsxUniforms, PostSsaoUniforms, Uniforms } from "./uniforms";
import { DebugPixelScene } from "./scenes/dbg_pixel";
import { DebugTriggerScene } from "./scenes/dbg_trigger";
import { DebugShadowScene } from "./scenes/dbg_shadow";
import { DebugMaterialScene } from "./scenes/dbg_material";
import type { FragShaderPath, TexturePath } from "./assets";
import { DebugRotationScene } from "./scenes/dbg_rotation";
import { DebugErrorScene } from "./scenes/dbg_error";
import { DebugLightingScene } from "./scenes/dbg_lighting";
import { DebugDynamicScene } from "./scenes/dbg_dynamic";

export const scenes: Map<string, new () => Scene> = new Map([
	["none", Scene],
	["museum", MuseumScene],
	["pier", PierScene],
	["brutal", BrutalScene],
	["field", FieldScene],
	["dbg_object", DebugObjectScene],
	["dbg_dither", DebugDitherScene],
	["dbg_outline", DebugOutlineScene],
	["dbg_transparency", DebugTransparencyScene],
	["dbg_echo", DebugEchoScene],
	["dbg_pixel", DebugPixelScene],
	["dbg_trigger", DebugTriggerScene],
	["dbg_rotation", DebugRotationScene],
	["dbg_shadow", DebugShadowScene],
	["dbg_material", DebugMaterialScene],
	["dbg_error", DebugErrorScene],
	["dbg_lighting", DebugLightingScene],
	["dbg_dynamic", DebugDynamicScene],
]);

// <path, [uniforms constructor, textures]>
export const postShaders: Map<FragShaderPath | "scene", [new () => Uniforms, TexturePath[]]> = new Map([
	["scene", [Uniforms, []]], // use scene default
	["post/fb_color.frag.wgsl", [Uniforms, []]],
	["post/fb_depth.frag.wgsl", [Uniforms, []]],
	["post/fb_normal.frag.wgsl", [Uniforms, []]],
	["post/fb_pos.frag.wgsl", [Uniforms, []]],
	["post/fb_mask.frag.wgsl", [Uniforms, []]],
	["post/psx_fog.frag.wgsl", [PostPsxUniforms, []]],
	["post/outline.frag.wgsl", [PostOutlineUniforms, []]],
	["post/ssao.frag.wgsl", [PostSsaoUniforms, ["noise/blue_0.png"]]],
	["post/noise.frag.wgsl", [Uniforms, []]],
	["post/dither.frag.wgsl", [PostDitherUniforms, ["noise/blue_0.png"]]],
	["post/ascii.frag.wgsl", [PostAsciiUniforms, ["chars/ascii_7x7x8.png"]]],
	["post/test.frag.wgsl", [Uniforms, ["house.jpg"]]],
]);

export const resolutionPresets: Map<string, string> = new Map([
	["divine", "1x1"],
	["yum", "32x18"],
	["crusty", "96x54"],
	["psx", "320x180"],
	["mid", "960x540"],
	["hd", "1920x1080"],
	["4k", "3840x2160"],
]);
