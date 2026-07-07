import { Scene } from "./scene";
import { PierScene } from "./scenes/pier";
import { BrutalScene } from "./scenes/brutal";
import { MuseumScene } from "./scenes/museum";
import { FieldScene } from "./scenes/field";
import { DebugInstancingScene } from "./scenes/dbg_inst";
import { DebugDitherScene } from "./scenes/dbg_dthr";
import { DebugOutlineScene } from "./scenes/dbg_outl";
import { DebugTransparencyScene } from "./scenes/dbg_trns";
import { DebugEchoScene } from "./scenes/dbg_echo";
import { PostAsciiUniforms, PostDitherUniforms, PostOutlineUniforms, PostPsxUniforms, PostSsaoUniforms, Uniforms } from "./uniforms";
import { DebugPixelsScene } from "./scenes/dbg_pxls";
import { DebugTriggerScene } from "./scenes/dbg_trgr";
import { DebugShadowScene } from "./scenes/dbg_shdw";
import { DebugNormalMapScene } from "./scenes/dbg_nrml";
import type { FragShaderPath, TexturePath } from "./assets";
import { DebugProjectileScene } from "./scenes/dbg_prjc";

export const scenes: Map<string, new () => Scene> = new Map([
	["none", Scene],
	["museum", MuseumScene],
	["pier", PierScene],
	["brutal", BrutalScene],
	["field", FieldScene],
	["dbg_inst", DebugInstancingScene],
	["dbg_dthr", DebugDitherScene],
	["dbg_outl", DebugOutlineScene],
	["dbg_trns", DebugTransparencyScene],
	["dbg_echo", DebugEchoScene],
	["dbg_pxls", DebugPixelsScene],
	["dbg_trgr", DebugTriggerScene],
	["dbg_prjc", DebugProjectileScene],
	["dbg_shdw", DebugShadowScene],
	["dbg_nrml", DebugNormalMapScene],
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
