import type { CameraMode } from "./camera";
import { Uniforms } from "./uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class WorldObject {
	public mesh: string = "triangle.json";
	public texture: string = "test.png";
	public color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public model: Mat4 = new Mat4();
	public mask: number = 0.5;

	public vertShader: string = "world/base.vert.wgsl";
	public fragShader: string = "world/base.frag.wgsl";
	public vertUniforms: Uniforms = new Uniforms();
	public fragUniforms: Uniforms = new Uniforms();
}

export class Scene {
	public name: string = "none";
	public resolution: Vec2 = new Vec2(960, 540);
	public spawnPos: Vec3 = new Vec3();
	public spawnRot: Vec2 = new Vec2();
	public cameraMode: CameraMode = "fly";

	public worldObjects: WorldObject[] = [];

	public postShader: string = "post/base.frag.wgsl";
	public postUniforms: Uniforms = new Uniforms();

	public init() {

	}

	public update(time: number, deltaTime: number) {
		
	}
}
