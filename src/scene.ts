import { PhongUniforms, Uniforms } from "./uniforms";
import { Mat4, Vec3, Vec4 } from "./vec";

export class WorldObject {
	public mesh: string = "triangle.json";
	public texture: string = "test.png";
	public vertShader: string = "world_base.vert.wgsl";
	public fragShader: string = "world_base.frag.wgsl";

	public color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public model: Mat4 = new Mat4();

	public vertUniforms: Uniforms = new Uniforms();
	public fragUniforms: Uniforms = new Uniforms();
}

export class Scene {
	public worldObjects: WorldObject[] = [];

	public postShader: string = "post_base.frag.wgsl";
	public postUniforms: Uniforms = new Uniforms();

	public init() {
		this.worldObjects = [];

		let obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		obj.fragShader = "world_phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		obj.color = new Vec4(1.0, 0.0, 0.0, 1.0);
		obj.fragShader = "world_phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		obj.mesh = "monke.obj";
		obj.fragShader = "world_phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-5, -5, -10), new Vec3(), 10);
		obj.mesh = "quad.json";
		obj.texture = "house.jpg";
		obj.fragShader = "world_phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);
	}

	public update(time: number, deltaTime: number) {
		this.worldObjects[0].model = this.worldObjects[0].model.mul(Mat4.rotate(new Vec3(0, 0, deltaTime)));
		this.worldObjects[1].model = Mat4.translate(new Vec3(-1, 0, -2)).mul(Mat4.translate(new Vec3(0, 1, 0).mul(Math.sin(time))));

		let light = new Vec3(Math.cos(time)*10, 10, Math.sin(time)*10);
		for (let obj of this.worldObjects) {
			(obj.fragUniforms as PhongUniforms).lightPos = light;
		}
	}
}
