import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";

export class DebugScene extends Scene {
	public name: string = "debug";
	
	public init() {
		this.objects = [];

		let obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		obj.color = new Vec4(1.0, 0.0, 0.0, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.collider = "monke.obj";
		obj.bbox = [obj.model.transform(new Vec3()).sub(2), obj.model.transform(new Vec3()).add(2)];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.mask = 200;
		this.objects.push(obj);

		obj = new WorldObject();
		obj.tag = "monke_instanced";
		obj.mesh = "monke.obj";
		obj.vertShader = "world/instanced.vert.wgsl";
		obj.vertUniforms = new InstancedUniforms();
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.mask = 100;

		let count = 1000;
		let range = 100;
		(obj.vertUniforms as InstancedUniforms).instanceCount = count;
		for (let i=0; i<count; i++) {
			let model = Mat4.translate(new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2)).mul(Mat4.rotate(new Vec3(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI)));
			(obj.vertUniforms as InstancedUniforms).models.push(model);
			(obj.vertUniforms as InstancedUniforms).normals.push(model.inverse().transpose());
		}
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-5, -5, -10), new Vec3(), 10);
		obj.mesh = "quad.json";
		obj.textures = ["house.jpg"];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);
	}

	public update(time: number, deltaTime: number) {
		this.objects[0].model = this.objects[0].model.mul(Mat4.rotate(new Vec3(0, 0, deltaTime)));
		this.objects[1].model = Mat4.translate(new Vec3(-1, 0, -2)).mul(Mat4.translate(new Vec3(0, 1, 0).mul(Math.sin(time))));

		let monkeUniforms = (this.getObject("monke_instanced")?.vertUniforms as InstancedUniforms);
		for (let i=0; i<monkeUniforms.instanceCount; i++) {
			let model = monkeUniforms.models[i].mul(Mat4.rotate(new Vec3(deltaTime, deltaTime, deltaTime)));
			monkeUniforms.models[i] = model;
			monkeUniforms.normals[i] = model.inverse().transpose();
		}

		let light = new Vec3(Math.cos(time)*10, 10, Math.sin(time)*10);
		for (let obj of this.objects) {
			(obj.fragUniforms as PhongUniforms).lightPos = light;
		}

		if (time > 3 && this.getAllObjects("added_after_init").length == 0) {
			let obj = new WorldObject();
			obj.tag = "added_after_init";
			obj.model = Mat4.trs(new Vec3(-5, -5, -10), new Vec3(), 1);
			obj.mesh = "monke.obj";
			obj.collider = "monke.obj";
			obj.bbox = [obj.model.transform(new Vec3()).sub(2), obj.model.transform(new Vec3()).add(2)];
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = new PhongUniforms();
			this.objects.push(obj);
		}
	}
}