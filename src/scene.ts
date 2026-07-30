import type { Player, CameraMode } from "./player";
import type { Object } from "./object";
import type { Trigger } from "./trigger";
import { Uniforms } from "./uniforms";
import { Vec2, Vec3, Vec4 } from "./vec";
import type { Camera } from "./camera";
import type { Assets, FontPath, MaterialPath, MeshPath, Shader, ShaderPath, Texture, TexturePath } from "./assets";

const defaultPostShader: Shader = {
	path: "post/fb_color.frag.wgsl",
	code: `
		struct VertexIn {
			@location(0) pos: vec3f, // object space
			@location(1) normal: vec3f,
			@location(2) color: vec4f,
			@location(3) uv: vec2f,
			@location(4) tangent: vec3f, // GL tangent
		};

		struct VertexOut {
			@builtin(position) ndc: vec4f, // -1..1
			@location(0) pos: vec3f, // world space
			@location(1) normal: vec3f,
			@location(2) color: vec4f,
			@location(3) uv: vec2f,
			@location(4) tangent: vec3f, // GL tangent
			@location(5) bary: vec3f, // barycentric triangle coords, 0..1
			@location(6) shadow_space: vec4f, // -1..1
		};

		struct FragmentIn {
			@builtin(position) screen: vec4f, // 0..res
			@location(0) pos: vec3f, // world space
			@location(1) normal: vec3f,
			@location(2) color: vec4f,
			@location(3) uv: vec2f,
			@location(4) tangent: vec3f, // GL tangent
			@location(5) bary: vec3f, // barycentric triangle coords, 0..1
			@location(6) shadow_space: vec4f, // -1..1
		};

		struct FragmentOut {
			@location(0) color: vec4f,
			@location(1) pos_depth: vec4f,
			@location(2) normal_mask: vec4f,
		};

		/// world frag shader output
		struct FbData {
			color: vec4f,
			pos: vec3f,
			depth: f32,
			normal: vec3f,
			mask: u32,
		};

		/// global world pass uniforms
		struct GlobalUniforms {
			time: f32,
			frame: f32,
			fov: f32,
			resolution: vec2f,
			view_pos: vec3f,
			view: mat4x4f,
			view_inv: mat4x4f,
			projection: mat4x4f,
			shadow_transform: mat4x4f,
		};

		/// per object world pass uniforms
		struct ObjectUniforms {
			mask: f32,
			cull: f32,
			id: f32,
			uv_scale: f32,
			color: vec4f,
			vert_config: vec4f,
			frag_config: vec4f,
			model: mat4x4f,
			normal: mat4x4f,
		};

		/// base post pass uniforms
		struct PostUniforms {
			time: f32,
			frame: f32,
			resolution: vec2f,
			post_config: vec4f,
			view: mat4x4f,
			projection: mat4x4f,
		};

		/// encode world pass output data into framebuffers
		fn encodeFbData(data: FbData) -> FragmentOut {
			var out: FragmentOut;
			out.color = data.color;
			out.pos_depth = vec4f(data.pos, data.depth);
			out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
			return out;
		}

		/// decode post pass input framebuffers back into data
		fn decodeFbData(pixel: vec2i, fb_color: texture_storage_2d<rgba8unorm, read>, fb_pos_depth: texture_storage_2d<rgba32float, read>, fb_normal_mask: texture_storage_2d<rgba8unorm, read>) -> FbData {
			var data: FbData;
			let color = textureLoad(fb_color, pixel);
			let pd = textureLoad(fb_pos_depth, pixel);
			let nm = textureLoad(fb_normal_mask, pixel);

			data.color = color;
			data.pos = pd.xyz;
			data.depth = pd.w;
			data.normal = nm.xyz * 2.0 - 1.0;
			data.mask = u32(nm.w * 255.0);

			return data;
		}

		fn decideDiscard(color: vec4f, pos: vec3f, normal: vec3f, view_pos: vec3f, cull: f32) {
			if (color.a == 0.0) {
				discard;
			}

			if (cull != 0.0) {
				let view_dir = normalize(view_pos - pos);
				let face = dot(normalize(normal), view_dir);
				if (face * cull < 0.0) {
					discard;
				}
			}
		}


		@group(0) @binding(0) var<uniform> u_post: PostUniforms;

		@group(1) @binding(0) var t_sampler: sampler;
		@group(1) @binding(1) var t_sampler_direct: sampler;

		@group(2) @binding(0) var fb_color: texture_storage_2d<rgba8unorm, read>;
		@group(2) @binding(1) var fb_pos_depth: texture_storage_2d<rgba32float, read>;
		@group(2) @binding(2) var fb_normal_mask: texture_storage_2d<rgba8unorm, read>;

		@fragment 
		fn main(in: FragmentIn) -> @location(0) vec4f {
			_ = t_sampler;
			_ = t_sampler_direct;
			_ = u_post.time;
			let pixel = vec2i(in.screen.xy);
			let data = decodeFbData(pixel, fb_color, fb_pos_depth, fb_normal_mask);
			return data.color;
		}
	`,
};

export class Scene {
	name: string = "none";
	resolution: Vec2 = new Vec2(960, 540);
	/** "fly" is 6dof and ignores colliders, \
	 *  "walk" is locked in plane, \
	 *  "static" ignores movement input */
	cameraMode: CameraMode = "fly";
	spawnPos: Vec3 = new Vec3();
	/** pitch, yaw, roll */
	spawnRot: Vec3 = new Vec3();

	/** post fragment shader */
	postShader: Shader = defaultPostShader;
	postUniforms: Uniforms = new Uniforms();
	postTextures: Texture[] = [];
	postConfig: Vec4 = new Vec4();

	/** renders depth to $shadowmap builtin texture */
	shadowCamera?: Camera;
	/** renders color to $portal_i builtin texture */
	portalCameras: Camera[] = [];

	objects: Object[] = [];
	triggers: Trigger[] = [];

	/** list of assets to preload before scene init */
	preload: {
		shaders?: ShaderPath[],
		textures?: TexturePath[],
		meshes?: MeshPath[],
		colliders?: MeshPath[],
		bboxes?: MeshPath[],
		materials?: MaterialPath[],
		fonts?: FontPath[],
	} = {
		shaders: [],
		textures: [],
		meshes: [],
		colliders: [],
		bboxes: [],
		materials: [],
		fonts: [],
	}

	/** called before scene load */
	async init(assets: Assets) {

	}

	/** called every frame after scene is loaded */
	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		
	}

	/** called once when player hits interact button */
	async interact(time: number, player: Player, assets: Assets) {

	}

	/** get first object with tag */
	getObject(tag: string): Object | undefined {
		let found = this.objects.find((obj) => obj.tags.includes(tag));
		return found;
	}

	/** get all objects with tag */
	getObjects(tag: string): Object[] {
		let found = this.objects.filter((obj) => obj.tags.includes(tag));
		return found;
	}
}
