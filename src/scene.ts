import type { Player, CameraMode } from "./player";
import type { Entity } from "./entity";
import type { Trigger } from "./trigger";
import { Uniforms } from "./uniforms";
import { Vec2, Vec3, Vec4 } from "./vec";
import type { Camera } from "./camera";

export class Scene {
	name: string = "none";
	resolution: Vec2 = new Vec2(960, 540);
	spawnPos: Vec3 = new Vec3();
	spawnRot: Vec2 = new Vec2();
	/** "fly" is 6dof and ignores colliders, \
	 *  "walk" is locked in plane, \
	 *  "static" ignores movement input */
	cameraMode: CameraMode = "fly";

	/** path to .frag.wgsl file in public/shaders/ */
	postShader: string = "post/fb_color.frag.wgsl";
	postUniforms: Uniforms = new Uniforms();
	postTextures: string[] = [];
	postConfig: Vec4 = new Vec4();

	/** casts shadows from this camera, if not set skips shadow render pass */
	shadowSource?: Camera;

	entities: Entity[] = [];
	triggers: Trigger[] = [];

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
	getEntity(tag: string): Entity | undefined {
		let found = this.entities.find((obj) => obj.tags.includes(tag));
		return found;
	}

	/** get all objects with tag */
	getEntities(tag: string): Entity[] {
		let found = this.entities.filter((obj) => obj.tags.includes(tag));
		return found;
	}
}
