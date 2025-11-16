import { Scene } from "./scene";
import { BrutalScene } from "./scenes/brutalScene";
import { DebugScene } from "./scenes/debugScene";
import { DebugDitherScene } from "./scenes/debugDitherScene";
import { DebugOutlineScene } from "./scenes/debugOutlineScene";
import { PierScene } from "./scenes/pierScene";
import { PostOutlineUniforms, PostPS1Uniforms, Uniforms } from "./uniforms";
import { MuseumScene } from "./scenes/museumScene";

export const scenes: Map<string, new () => Scene> = new Map([
	["none", Scene],
	["museum", MuseumScene],
	["pier", PierScene],
	["brutal", BrutalScene],
	["debug", DebugScene],
	["debug_dither", DebugDitherScene],
	["debug_outline", DebugOutlineScene],
]);

// <path, [uniforms constructor, textures]>
export const postShaders: Map<string, [new () => Uniforms, string[]]> = new Map([
	["scene", [Uniforms, []]],
	["post/base.frag.wgsl", [Uniforms, []]],
	["post/fb_depth.frag.wgsl", [Uniforms, []]],
	["post/fb_normal.frag.wgsl", [Uniforms, []]],
	["post/fb_pos.frag.wgsl", [Uniforms, []]],
	["post/fb_mask.frag.wgsl", [Uniforms, []]],
	["post/ps1_fog.frag.wgsl", [PostPS1Uniforms, []]],
	["post/outline.frag.wgsl", [PostOutlineUniforms, []]],
	["post/noise.frag.wgsl", [Uniforms, []]],
	["post/dither.frag.wgsl", [Uniforms, ["noise/blue_0.png"]]],
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
