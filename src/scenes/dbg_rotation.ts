import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { clamp, rad } from "../utils";

export class DebugRotationScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_rotation";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);
	}
	
	init() {
		let obj = new Object();
		obj.tags = ["static"];
		obj.model = Mat4.transform(new Vec3(-6, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["intrinsic"];
		obj.model = Mat4.transform(new Vec3(-3, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["extrinsic"];
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["heading"];
		obj.model = Mat4.transform(new Vec3(3, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["lookat"];
		obj.model = Mat4.transform(new Vec3(6, 0, 0), new Vec3(), 1.0);
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);

		// skybox
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 100);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.objects.push(obj);

		// floor
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let projectiles = this.getObjects("projectile");
		for (let obj of projectiles) {
			obj.model = obj.model.mul(Mat4.translate(new Vec3(0, 0, -1).mul(30.0 * deltaTime)));
			let d = clamp(obj.lifetime!, 0.0, 1.0);
			obj.color = Vec4.splat(d);
			obj.changed = true;
		}

		let intrinsic = this.getObject("intrinsic")!;
		intrinsic.model = Mat4.translate(intrinsic.model.translation()).mul(Mat4.rotateIntrinsic(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));
		intrinsic.changed = true;

		let extrinsic = this.getObject("extrinsic")!;
		extrinsic.model = Mat4.translate(extrinsic.model.translation()).mul(Mat4.rotateExtrinsic(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));
		extrinsic.changed = true;

		let heading = this.getObject("heading")!;
		heading.model = Mat4.translate(heading.model.translation()).mul(Mat4.rotateHeading(new Vec3(rad(45), rad(45*time), rad(Math.sin(time*100)*10))));
		heading.changed = true;

		let lookat = this.getObject("lookat")!;
		lookat.model = Mat4.translate(lookat.model.translation()).mul(Mat4.rotateLookAt(lookat.model.translation(), player.position));
		lookat.changed = true;

		// test decompose identity
		for (let obj of this.objects) {
			obj.model = Mat4.transform(...obj.model.decompose());
		}

	}

	interact(time: number, player: Player) {
		let obj = new Object();
		obj.tags = ["projectile"];
		obj.lifetime = 3.0;
		obj.model = player.camera.model.mul(Mat4.transform(new Vec3(0, 0, -2), new Vec3(), 0.5));
		obj.mesh = "gimbal.obj";
		obj.textures = ["white.png"];
		this.objects.push(obj);
		
	}
}