import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongShadowUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { Camera } from "../camera";

export class DebugShadowScene extends Scene {
	name = "dbg_shdw";
	spawnPos = new Vec3(0, 0, 5);
	shadowSource? = new Camera();

	constructor() {
		super();

		this.shadowSource!.position = new Vec3(0, 10, 0);
		this.shadowSource!.rotation = new Vec2(0, Math.PI / 2.0);
		this.shadowSource!.fov = 60.0;
		this.shadowSource!.near = 0.01;
		this.shadowSource!.far = 100.0;
	}

	init() {
		let phong = new PhongShadowUniforms();
		phong.shadow_bias = 0.000005;

		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(-5, -2, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -4, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(5, -2, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 100);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 100);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = phong;
		obj.z = 900.0;
		this.entities.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 20, 20*Math.sin(time/2));
		for (let obj of this.entities) {
			(obj.fragUniforms as PhongShadowUniforms).light_pos = lightPos;
			obj.changed = true;
		}

		this.shadowSource!.position = lightPos;
		let pitch = Math.atan2(lightPos.y, Math.sqrt(lightPos.x**2 + lightPos.z**2));
		let yaw = Math.atan2(lightPos.x, lightPos.z);
		this.shadowSource!.rotation = new Vec2(-yaw, pitch);

	}
}