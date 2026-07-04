import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { rad } from "../utils";

export class DebugNormalMapScene extends Scene {
	name = "dbg_nrml";
	spawnPos = new Vec3(0, 0, 5);
	
	init() {
		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(-3, 0, 0), new Vec3(rad(-90), 0, rad(-90)), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["brick_diffuse.jpg"];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(rad(-90), 0, rad(-90)), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["brick_diffuse.jpg", "brick_normal.jpg"];
		obj.fragShader = "world/phong_normal.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["brick_diffuse.jpg", "brick_normal.jpg"];
		obj.fragShader = "world/phong_normal.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
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
		let lightPos = new Vec3(20*Math.cos(time/2), 40, 20*Math.sin(time/2));
		for (let obj of this.entities) {
			(obj.fragUniforms as PhongUniforms).light_pos = lightPos;
			(obj.fragUniforms as PhongUniforms).specular_factor = 0.8;
			obj.changed = true;
		}

	}
}