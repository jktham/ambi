import { Scene } from "./scene";
import { BrutalScene } from "./scenes/brutal";
import { DebugScene } from "./scenes/debug";
import { DebugDitherScene } from "./scenes/debug_dither";
import { DebugOutlineScene } from "./scenes/debug_outline";
import { PierScene } from "./scenes/pier";
import { PostAsciiUniforms, PostDitherUniforms, PostOutlineUniforms, PostPsxUniforms, PostSsaoUniforms, Uniforms } from "./uniforms";
import { MuseumScene } from "./scenes/museum";
import { FieldScene } from "./scenes/field";
import { DebugTransparencyScene } from "./scenes/debug_trans";
import { DebugEchoScene } from "./scenes/debug_echo";
import type { Engine } from "./engine";

export const scenes: Map<string, new (engine: Engine) => Scene> = new Map([
	["none", Scene],
	["museum", MuseumScene],
	["pier", PierScene],
	["brutal", BrutalScene],
	["field", FieldScene],
	["debug", DebugScene],
	["debug_dither", DebugDitherScene],
	["debug_outline", DebugOutlineScene],
	["debug_trans", DebugTransparencyScene],
	["debug_echo", DebugEchoScene],
]);

// <path, [uniforms constructor, textures]>
export const postShaders: Map<string, [new () => Uniforms, string[]]> = new Map([
	["scene", [Uniforms, []]],
	["post/base.frag.wgsl", [Uniforms, []]],
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
	["crusty", "80x45"],
	["psx", "320x180"],
	["mid", "960x540"],
	["hd", "1920x1080"],
	["4k", "3840x2160"],
]);
