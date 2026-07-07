import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { clamp } from "../utils";

export class DebugProjectileScene extends Scene {
	name = "dbg_prjc";
	spawnPos = new Vec3(0, 0, 5);

	phong = new PhongUniforms();
	
	init() {
		// skybox
		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 100);
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

		let projectiles = this.getEntities("projectile");
		for (let obj of projectiles) {
			obj.model = obj.model.mul(Mat4.translate(new Vec3(0, 0, -1).mul(30.0 * deltaTime)));
			let v = clamp(obj.lifetime!, 0.0, 1.0);
			obj.color = new Vec4(v, v, v, v);
		}

	}

	interact(time: number, player: Player) {
		let obj = new Entity();
		obj.tags = ["projectile"];
		obj.lifetime = 3.0;
		obj.model = player.camera.model.mul(Mat4.trs(new Vec3(0, 0, -2), new Vec3(), 0.5));
		obj.mesh = "sphere.obj";
		obj.cull = 1;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.entities.push(obj);
		
	}
}