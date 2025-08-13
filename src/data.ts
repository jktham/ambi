import { Scene } from "./scene";
import { BrutalScene } from "./scenes/brutalScene";
import { DebugScene } from "./scenes/debugScene";
import { DitherScene } from "./scenes/ditherScene";
import { OutlineScene } from "./scenes/outlineScene";
import { PierScene } from "./scenes/pierScene";
import { PostOutlineUniforms, PostPS1Uniforms, Uniforms } from "./uniforms";

export const scenes: Map<string, new () => Scene> = new Map([
	["none", Scene],
	["debug", DebugScene],
	["pier", PierScene],
	["brutal", BrutalScene],
	["dither", DitherScene],
	["outline", OutlineScene],
]);

export const postShaders: Map<string, new () => Uniforms> = new Map([
	["scene", Uniforms],
	["post/base.frag.wgsl", Uniforms],
	["post/fb_depth.frag.wgsl", Uniforms],
	["post/fb_normal.frag.wgsl", Uniforms],
	["post/fb_pos.frag.wgsl", Uniforms],
	["post/fb_mask.frag.wgsl", Uniforms],
	["post/ps1_fog.frag.wgsl", PostPS1Uniforms],
	["post/outline.frag.wgsl", PostOutlineUniforms],
	["post/noise.frag.wgsl", Uniforms],
	["post/dither.frag.wgsl", Uniforms],
	["post/test.frag.wgsl", Uniforms],
]);
