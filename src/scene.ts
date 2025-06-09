import type { FragMode, VertMode } from "./resources";
import { Mat4, Vec3, Vec4 } from "./vec";

export class WorldObject {
	public mesh: string = "triangle.json";
	public texture: string = "test.png";
	public vertMode: VertMode = "base";
	public fragMode: FragMode = "phong";

	public color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public model: Mat4 = new Mat4();

	public lightPos: Vec3 = new Vec3();
	public lightColor: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public ambientFactor: number = 0.1;
	public diffuseFactor: number = 0.6;
	public specularFactor: number = 0.3;
	public specularExponent: number = 32.0;

	public vertUniforms: Float32Array = new Float32Array(16);
	public fragUniforms: Float32Array = new Float32Array(16);
}

export class Scene {
	public worldObjects: WorldObject[] = [];

	public init() {
		let obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		obj.color = new Vec4(1.0, 0.0, 0.0, 1.0);
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		obj.mesh = "monke.obj";
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-5, -5, -10), new Vec3(), 10);
		obj.mesh = "quad.json";
		obj.texture = "house.jpg";
		this.worldObjects.push(obj);
	}

	public update(time: number, deltaTime: number) {
		this.worldObjects[0].model = this.worldObjects[0].model.mul(Mat4.rotate(new Vec3(0, 0, deltaTime)));
		this.worldObjects[1].model = Mat4.translate(new Vec3(-1, 0, -2)).mul(Mat4.translate(new Vec3(0, 1, 0).mul(Math.sin(time))));

		let light = new Vec3(Math.cos(time)*10, 10, Math.sin(time)*10);
		for (let obj of this.worldObjects) {
			obj.lightPos = light;
		}
	}
}
