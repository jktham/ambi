import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { clamp, rad } from "../utils";

export class DebugProjectileScene extends Scene {
	name = "dbg_prjc";
	spawnPos = new Vec3(0, 0, 5);

	phong = new PhongUniforms();
	
	init() {
		let obj = new Entity();
		obj.tags = ["static"];
		obj.model = Mat4.trs(new Vec3(-4, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.entities.push(obj);

		obj = new Entity();
		obj.tags = ["intrinsic"];
		obj.model = Mat4.trs(new Vec3(-1.5, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.entities.push(obj);

		obj = new Entity();
		obj.tags = ["extrinsic"];
		obj.model = Mat4.trs(new Vec3(1.5, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.entities.push(obj);

		obj = new Entity();
		obj.tags = ["heading"];
		obj.model = Mat4.trs(new Vec3(4, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.entities.push(obj);

		// skybox
		obj = new Entity();
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
			let d = clamp(obj.lifetime!, 0.0, 1.0);
			obj.color = Vec4.splat(d);
		}

		let intrinsic = this.getEntity("intrinsic")!;
		intrinsic.model = Mat4.translate(intrinsic.model.origin()).mul(Mat4.rotateIntrinsic(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));

		let extrinsic = this.getEntity("extrinsic")!;
		extrinsic.model = Mat4.translate(extrinsic.model.origin()).mul(Mat4.rotateExtrinsic(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));

		let heading = this.getEntity("heading")!;
		heading.model = Mat4.translate(heading.model.origin()).mul(Mat4.rotateHeading(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));

		// test decompose identity
		for (let obj of this.entities) {
			obj.model = Mat4.trs(...obj.model.decompose());
		}

	}

	interact(time: number, player: Player) {
		let obj = new Entity();
		obj.tags = ["projectile"];
		obj.lifetime = 3.0;
		obj.model = player.camera.model.mul(Mat4.trs(new Vec3(0, 0, -2), new Vec3(), 0.5));
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.entities.push(obj);
		
	}
}