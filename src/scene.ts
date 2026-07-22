import type { Player, CameraMode } from "./player";
import type { Object } from "./object";
import type { Trigger } from "./trigger";
import { Uniforms } from "./uniforms";
import { Vec2, Vec3, Vec4 } from "./vec";
import type { Camera } from "./camera";
import type { Assets, FragShaderPath, TexturePath } from "./assets";

export class Scene {
	name: string = "none";
	resolution: Vec2 = new Vec2(960, 540);
	spawnPos: Vec3 = new Vec3();
	/** pitch, yaw, roll */
	spawnRot: Vec3 = new Vec3();
	/** "fly" is 6dof and ignores colliders, \
	 *  "walk" is locked in plane, \
	 *  "static" ignores movement input */
	cameraMode: CameraMode = "fly";

	/** post fragment shader */
	postShader: FragShaderPath = "post/fb_color.frag.wgsl";
	postUniforms: Uniforms = new Uniforms();
	postTextures: TexturePath[] = [];
	postConfig: Vec4 = new Vec4();

	/** cast shadows from this camera, if not set skips shadow render pass. renders to $shadowmap builtin texture */
	shadowCamera?: Camera;

	/** renders to $portal_i builtin texture */
	portalCameras: Camera[] = [];

	objects: Object[] = [];
	triggers: Trigger[] = [];

	/** called before init, generate dynamic assets and place them in asset cache */
	generateAssets(assets: Assets) {

	}

	/** called before scene load, no assets available yet */
	init() {

	}

	/** called every frame after scene is loaded */
	update(time: number, deltaTime: number, player: Player) {
		
	}

	/** called once when player hits interact button */
	interact(time: number, player: Player) {

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
