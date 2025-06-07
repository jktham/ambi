import { Mat4, Vec3, Vec4 } from "./vec";

export class GameObject {
	public mesh: string = "triangle.json";
	public texture: string = "test.json";
	public vertMode: number = 0;
	public fragMode: number = 0;
	public color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
	public vertUniforms: Float32Array = new Float32Array(16);
	public fragUniforms: Float32Array = new Float32Array(16);
	public model: Mat4 = new Mat4();
}

export class Scene {
	public worldObjects: GameObject[] = [];

	public init() {
		let obj = new GameObject();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		this.worldObjects.push(obj);

		obj = new GameObject();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		this.worldObjects.push(obj);

		obj = new GameObject();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		this.worldObjects.push(obj);
	}

	public update(time: number, deltaTime: number) {
		this.worldObjects[0].model = this.worldObjects[0].model.mul(Mat4.rotate(0, 0, deltaTime));
		this.worldObjects[1].model = Mat4.translate(new Vec3(-1, 0, -2)).mul(Mat4.translate(new Vec3(0, 1, 0).mul(Math.sin(time))));
	}
}
