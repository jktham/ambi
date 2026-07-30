import type { Player, CameraMode } from "./player";
import type { Object } from "./object";
import type { Trigger } from "./trigger";
import { Uniforms } from "./uniforms";
import { Vec2, Vec3, Vec4 } from "./vec";
import type { Camera } from "./camera";
import type { Assets, FontPath, MaterialPath, MeshPath, Shader, ShaderPath, Texture, TexturePath } from "./assets";
import { defaultPostShader } from "./defaults";

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
