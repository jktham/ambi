import { Scene, WorldObject } from "../scene";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";

export class Debug2Scene extends Scene {
	public name: string = "debug2";
	
	public init() {
		this.worldObjects = [];

		let obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		obj.color = new Vec4(1.0, 0.0, 0.0, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		obj.mesh = "monke.obj";
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.worldObjects.push(obj);

		for (let i=0; i<100; i++) {
			obj = new WorldObject();
			obj.model = Mat4.translate(new Vec3(Math.random()*20 - 10, Math.random()*20 - 10, Math.random()*20 - 10));
			obj.mesh = "monke.obj";
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = new PhongUniforms();
			this.worldObjects.push(obj);
		}

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-5, -5, -10), new Vec3(), 10);
		obj.mesh = "quad.json";
		obj.texture = "house.jpg";
		obj.fragShader = "world/phong.frag.wgsl";
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