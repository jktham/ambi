import type { CameraMode } from "./camera";
import { Uniforms } from "./uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class WorldObject {
	id: number;
	tag: string = "";

	mesh: string = "triangle.json";
	textures: string[] = ["test.png"];
	color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	model: Mat4 = new Mat4();
	mask: number = 0;
	
	collider?: string = undefined;
	bbox?: [Vec3, Vec3] = undefined;

	vertShader: string = "world/base.vert.wgsl";
	fragShader: string = "world/base.frag.wgsl";
	vertUniforms: Uniforms = new Uniforms();
	fragUniforms: Uniforms = new Uniforms();

	constructor() {
		this.id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
	}
}

export class Scene {
	name: string = "none";
	resolution: Vec2 = new Vec2(960, 540);
	spawnPos: Vec3 = new Vec3();
	spawnRot: Vec2 = new Vec2();
	cameraMode: CameraMode = "fly";

	postShader: string = "post/base.frag.wgsl";
	postUniforms: Uniforms = new Uniforms();
	postTextures: string[] = [];

	objects: WorldObject[] = [];

	init() {

	}

	update(time: number, deltaTime: number) {
		
	}

	getObject(tag: string): WorldObject | undefined {
		let found = this.objects.find((obj) => obj.tag == tag);
		return found;
	}

	getAllObjects(tag: string): WorldObject[] {
		let found = this.objects.filter((obj) => obj.tag == tag);
		return found;
	}
}
