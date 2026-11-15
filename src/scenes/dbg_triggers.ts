import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { AreaTrigger, PortalTrigger } from "../trigger";
import { Bbox } from "../bbox";
import type { Assets } from "../assets";
import { rad } from "../utils";

export class DebugTriggersScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_triggers";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(2, 10, 5);

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["default.png"],
			meshes: ["cube.obj", "monke.obj", "quad.obj"],
			bboxes: ["cube.obj", "monke.obj"],
		};
	}
	
	async init(assets: Assets) {
		// simple cube, manual bbox
		let obj = new Object();
		obj.tags = ["1"];
		obj.model = Mat4.transform(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		let trg = new AreaTrigger();
		trg.bbox = new Bbox([new Vec3(-3, 0, 0).sub(new Vec3(1, 1, 1)), new Vec3(-3, 0, 0).add(new Vec3(1, 1, 1))]);
		trg.onEnter = () => {
			let target = this.getObject("1")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		trg.onLeave = () => {
			let target = this.getObject("1")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(trg);

		// mesh, mesh bbox
		obj = new Object();
		obj.tags = ["2"];
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		trg = new AreaTrigger();
		trg.bbox = await assets.loadBbox("monke.obj");
		trg.model = obj.model;
		trg.onEnter = () => {
			let target = this.getObject("2")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		trg.onLeave = () => {
			let target = this.getObject("2")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(trg);

		// transformed cube, mesh bbox
		obj = new Object();
		obj.tags = ["3"];
		obj.model = Mat4.transform(new Vec3(3, 0, 0), new Vec3(Math.PI / 4.0, Math.PI / 4.0, Math.PI / 4.0), 0.6);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		trg = new AreaTrigger();
		trg.bbox = await assets.loadBbox(obj.mesh.path);
		trg.model = obj.model;
		trg.onEnter = () => {
			let target = this.getObject("3")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		trg.onLeave = () => {
			let target = this.getObject("3")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(trg);

		// moving
		obj = new Object();
		obj.tags = ["4"];
		obj.model = Mat4.transform(new Vec3(0, 0, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		trg = new AreaTrigger();
		trg.bbox = await assets.loadBbox(obj.mesh.path);
		trg.model = obj.model;
		trg.onEnter = () => {
			let target = this.getObject("4")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		trg.onLeave = () => {
			let target = this.getObject("4")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(trg);

		// portal flat
		obj = new Object();
		obj.tags = ["5"];
		obj.model = Mat4.transform(new Vec3(0, 3, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		let ptrg = new PortalTrigger();
		ptrg.model = obj.model;
		ptrg.onEnter = () => {
			let target = this.getObject("5")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		ptrg.onLeave = () => {
			let target = this.getObject("5")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(ptrg);

		// portal transformed
		obj = new Object();
		obj.tags = ["6"];
		obj.model = Mat4.transform(new Vec3(-3, 3, 0), new Vec3(0, rad(45), rad(45)), new Vec3(0.6, 1.2, 100));
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		ptrg = new PortalTrigger();
		ptrg.model = obj.model;
		ptrg.onEnter = () => {
			let target = this.getObject("6")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		ptrg.onLeave = () => {
			let target = this.getObject("6")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(ptrg);

		// portal rotating
		obj = new Object();
		obj.tags = ["7"];
		obj.model = Mat4.transform(new Vec3(3, 3, 0), new Vec3(rad(-45), 0, 0), 1);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		ptrg = new PortalTrigger();
		ptrg.model = obj.model;
		ptrg.onEnter = () => {
			let target = this.getObject("7")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		ptrg.onLeave = () => {
			let target = this.getObject("7")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(ptrg);

		// portal moving
		obj = new Object();
		obj.tags = ["8"];
		obj.model = Mat4.transform(new Vec3(0, 3, -5), new Vec3(0, rad(90), 0), 1);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z_sort = true;
		this.objects.push(obj);

		ptrg = new PortalTrigger();
		ptrg.model = obj.model;
		ptrg.onEnter = () => {
			let target = this.getObject("8")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.update = true;
		}
		ptrg.onLeave = () => {
			let target = this.getObject("8")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.update = true;
		}
		this.triggers.push(ptrg);

		// skybox
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		// floor
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		// move 4
		let obj4 = this.getObject("4")!;
		let origin4 = Mat4.transform(new Vec3(0, 0, -5), new Vec3(0, 0, rad(45)), 1);
		let offset4 = Mat4.translate(new Vec3(1, 0, 0).mul(Math.sin(time)*5.0));
		obj4.model.data = offset4.mul(origin4).data; // dont change reference, so bbox model gets updated as well
		obj4.update = true;

		// move 8
		let obj8 = this.getObject("8")!;
		let origin8 = Mat4.transform(new Vec3(0, 3, -5), new Vec3(0, rad(90), 0), 1);
		let offset8 = Mat4.translate(new Vec3(-1, 0, 0).mul(Math.sin(time)*5.0));
		obj8.model.data = offset8.mul(origin8).data;
		obj8.update = true;

		// rotate 7
		let obj7 = this.getObject("7")!;
		let origin7 = Mat4.transform(new Vec3(3, 3, 0), new Vec3(rad(-45), 0, 0), 1);
		let offset7 = Mat4.rotateIntrinsic(new Vec3(0, time, time));
		obj7.model.data = origin7.mul(offset7).data;
		obj7.update = true;
	}
}