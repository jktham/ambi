import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { Trigger } from "../trigger";
import { Bbox } from "../bbox";

export class DebugTriggerScene extends Scene {
	name = "dbg_trigger";
	spawnPos = new Vec3(0, 0, 5);

	phong = new PhongUniforms();
	
	init() {
		// simple cube, manual bbox
		let obj = new Entity();
		obj.tags = ["1"];
		obj.model = Mat4.trs(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		let trg = new Trigger();
		trg.bbox = new Bbox([new Vec3(-3, 0, 0).sub(new Vec3(1, 1, 1)), new Vec3(-3, 0, 0).add(new Vec3(1, 1, 1))]);
		trg.onEnter = () => {
			let target = this.getEntity("1")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.changed = true;
		}
		trg.onLeave = () => {
			let target = this.getEntity("1")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.changed = true;
		}
		this.triggers.push(trg);

		// mesh, mesh bbox
		obj = new Entity();
		obj.tags = ["2"];
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		trg = new Trigger();
		trg.bbox = new Bbox();
		trg.bbox.model = obj.model;
		trg.bbox.mesh = obj.mesh;
		trg.onEnter = () => {
			let target = this.getEntity("2")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.changed = true;
		}
		trg.onLeave = () => {
			let target = this.getEntity("2")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.changed = true;
		}
		this.triggers.push(trg);

		// transformed cube, mesh bbox
		obj = new Entity();
		obj.tags = ["3"];
		obj.model = Mat4.trs(new Vec3(3, 0, 0), new Vec3(Math.PI / 4.0, Math.PI / 4.0, Math.PI / 4.0), 0.6);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		trg = new Trigger();
		trg.bbox = new Bbox();
		trg.bbox.model = obj.model;
		trg.bbox.mesh = obj.mesh;
		trg.onEnter = () => {
			let target = this.getEntity("3")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.changed = true;
		}
		trg.onLeave = () => {
			let target = this.getEntity("3")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.changed = true;
		}
		this.triggers.push(trg);

		// moving
		obj = new Entity();
		obj.tags = ["4"];
		obj.model = Mat4.trs(new Vec3(0, 0, -5), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.2, 0.2, 0.8, 0.5);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		trg = new Trigger();
		trg.bbox = new Bbox();
		trg.bbox.model = obj.model;
		trg.bbox.mesh = obj.mesh;
		trg.onEnter = () => {
			let target = this.getEntity("4")!;
			target.color = new Vec4(0.2, 0.8, 0.2, 0.5);
			target.changed = true;
		}
		trg.onLeave = () => {
			let target = this.getEntity("4")!;
			target.color = new Vec4(0.8, 0.2, 0.2, 0.5);
			target.changed = true;
		}
		this.triggers.push(trg);

		// skybox
		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.entities.push(obj);

		// floor
		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.entities.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 60, 20*Math.sin(time/2));
		this.phong.light_pos = lightPos;
		for (let obj of this.entities) {
			obj.changed = true;
		}

		// move 4
		let obj4 = this.getEntity("4")!;
		let origin = Mat4.trs(new Vec3(0, 0, -5), new Vec3(0, 0, Math.PI / 4.0), 1);
		let offset = Mat4.translate(new Vec3(1, 0, 0).mul(Math.sin(time)*5.0));
		obj4.model.data = offset.mul(origin).data; // dont change reference, so bbox model gets updated as well
		obj4.changed = true;

	}
}