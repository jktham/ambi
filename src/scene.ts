import { Uniforms } from "./uniforms";
import { Mat4, Vec4 } from "./vec";

export class WorldObject {
	public mesh: string = "triangle.json";
	public texture: string = "test.png";
	public color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public model: Mat4 = new Mat4();

	public vertShader: string = "world/base.vert.wgsl";
	public fragShader: string = "world/base.frag.wgsl";
	public vertUniforms: Uniforms = new Uniforms();
	public fragUniforms: Uniforms = new Uniforms();
}

export class Scene {
	public name: string = "none";
	public worldObjects: WorldObject[] = [];

	public postShader: string = "post/base.frag.wgsl";
	public postUniforms: Uniforms = new Uniforms();

	public init() {

	}

	public update(time: number, deltaTime: number) {
		
	}
}
