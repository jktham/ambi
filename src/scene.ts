import { Mat4, Vec3 } from "./vec";

export class Scene {
	public worldObjects: GameObject[] = [];

	public init() {
		let obj = new GameObject();
		obj.model = Mat4.translate(new Vec3([0, 1, -1.5]));
		this.worldObjects.push(obj);

		obj = new GameObject();
		obj.model = Mat4.translate(new Vec3([-1, 0, -2]));
		this.worldObjects.push(obj);

		obj = new GameObject();
		obj.model = Mat4.translate(new Vec3([1, 0, -2]));
		this.worldObjects.push(obj);
	}

	public update(dt: number) {
		this.worldObjects[0].model = this.worldObjects[0].model.mul(Mat4.rotate(0, 0, dt));
	}
}

export class GameObject {
	public model: Mat4 = new Mat4();
}
