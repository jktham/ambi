import { Bbox } from "../bbox";
import { Scene } from "../scene";
import { Object } from "../object";
import { Trigger } from "../trigger";
import { InstancedUniforms, PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugObjectScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_object";

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/instanced.vert.wgsl"],
			textures: ["test.png", "house.jpg"],
			meshes: ["monke.obj", "quad.json"],
			colliders: ["monke.obj"],
			bboxes: ["monke.obj"],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.model = Mat4.translate(new Vec3(0, 1, -1.5));
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.translate(new Vec3(-1, 0, -2));
		obj.color = new Vec4(1.0, 0.0, 0.0, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.translate(new Vec3(1, 0, -2));
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.collider = await assets.loadCollider("monke.obj");
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.mask = 200;
		
		let monkeBbox = await assets.loadBbox("monke.obj");
		monkeBbox.model = obj.model;
		obj.bbox = monkeBbox;

		this.objects.push(obj);


		obj = new Object();
		obj.tags = ["monke_instanced"];
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.vertShader = await assets.loadShader("world/instanced.vert.wgsl");
		obj.vertUniforms = new InstancedUniforms();
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.mask = 100;

		let count = 1000;
		let range = 100;
		(obj.vertUniforms as InstancedUniforms).instanceCount = count;
		for (let i=0; i<count; i++) {
			let model = Mat4.translate(new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2)).mul(Mat4.rotateIntrinsic(new Vec3(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI)));
			(obj.vertUniforms as InstancedUniforms).models.push(model);
			(obj.vertUniforms as InstancedUniforms).normals.push(model.inverse().transpose());
		}
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-5, -5, -10), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.json");
		obj.textures = [await assets.loadTexture("house.jpg")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		this.triggers = [];
		let t = new Trigger();
		t.bbox = monkeBbox;
		t.onEnter = () => console.log("enter");
		t.onLeave = () => console.log("leave");
		this.triggers.push(t);

	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		this.objects[0].model = this.objects[0].model.mul(Mat4.rotateIntrinsic(new Vec3(0, 0, deltaTime)));
		this.objects[0].changed = true;
		this.objects[1].model = Mat4.translate(new Vec3(-1, 0, -2)).mul(Mat4.translate(new Vec3(0, 1, 0).mul(Math.sin(time))));
		this.objects[1].changed = true;

		let monke = this.getObject("monke_instanced")!;
		let monkeUniforms = monke.vertUniforms as InstancedUniforms;
		for (let i=0; i<monkeUniforms.instanceCount; i++) {
			let model = monkeUniforms.models[i].mul(Mat4.rotateIntrinsic(new Vec3(deltaTime, deltaTime, deltaTime)));
			monkeUniforms.models[i] = model;
			monkeUniforms.normals[i] = model.inverse().transpose();
		}
		monke.changed = true;

		let lightPos = new Vec3(Math.cos(time)*10, 10, Math.sin(time)*10);
		this.phong.light.pos = lightPos;
		for (let obj of this.objects) {
			obj.changed = true;
		}

		if (time > 3 && this.getObjects("added_after_init").length == 0) {
			let obj = new Object();
			obj.tags = ["added_after_init"];
			obj.model = Mat4.transform(new Vec3(-5, -5, -10), new Vec3(), 1);
			obj.mesh = await assets.loadMesh("monke.obj");
			obj.collider = await assets.loadCollider("monke.obj");
			obj.bbox = new Bbox([obj.model.mulVec(new Vec3()).sub(2), obj.model.mulVec(new Vec3()).add(2)]);
			obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
			obj.fragUniforms = this.phong;
			this.objects.push(obj);
		}
	}
}