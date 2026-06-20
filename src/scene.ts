import type { Camera, CameraMode } from "./camera";
import type { Engine } from "./engine";
import type { Entity } from "./entity";
import type { Trigger } from "./trigger";
import { Uniforms } from "./uniforms";
import { Vec2, Vec3, Vec4 } from "./vec";

export class Scene {
	engine: Engine; // engine handle, in case we need to do stuff from inside the scene
	
	name: string = "none";
	resolution: Vec2 = new Vec2(960, 540);
	spawnPos: Vec3 = new Vec3();
	spawnRot: Vec2 = new Vec2();
	cameraMode: CameraMode = "fly"; // "fly" ignores colliders, "walk" is locked in plane

	postShader: string = "post/base.frag.wgsl"; // path to .wgsl file in public/shaders/
	postUniforms: Uniforms = new Uniforms();
	postTextures: string[] = [];
	postConfig: Vec4 = new Vec4();

	entities: Entity[] = [];
	triggers: Trigger[] = [];

	constructor(engine: Engine) {
		this.engine = engine;
	}

	/** called before scene load, no assets available yet */
	init() {

	}

	/** called every frame after scene is loaded */
	update(time: number, deltaTime: number, camera: Camera) {
		
	}

	/** called once when player hits interact button */
	interact(time: number, camera: Camera) {

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
