import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";

export class DebugTransparencyScene extends Scene {
	name = "dbg_trns";
	spawnPos = new Vec3(0, 0, 5);
	
	init() {
		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test_trans.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 0.2);
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(-0.5, 3, 0), new Vec3(), 1);
		obj.mesh = "sphere.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(1.0, 0.0, 0.0, 0.3);
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0.5, 3, 0), new Vec3(), 1);
		obj.mesh = "sphere.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.0, 0.0, 1.0, 0.3);
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.z = 900.0;
		this.entities.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 60, 20*Math.sin(time/2));
		for (let obj of this.entities) {
			(obj.fragUniforms as PhongUniforms).light_pos = lightPos;
			obj.changed = true;
		}

	}
}