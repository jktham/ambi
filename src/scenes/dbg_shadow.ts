import { Scene } from "../scene";
import { Entity } from "../entity";
import { PhongShadowUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { Camera } from "../camera";

export class DebugShadowScene extends Scene {
	name = "dbg_shadow";
	spawnPos = new Vec3(0, 0, 5);
	shadowSource? = new Camera();
	
	phong = new PhongShadowUniforms();

	constructor() {
		super();

		this.shadowSource!.fov = 80.0;
		this.shadowSource!.near = 0.01;
		this.shadowSource!.far = 100.0;

		this.phong.shadow_bias = 0.000005;
	}

	init() {
		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(-4, -2, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test_trans2.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -4, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(4, -2, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.zsort = true;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		obj.castShadow = false;
		this.entities.push(obj);

		obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.entities.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 20, 20*Math.sin(time/2));
		this.phong.light_pos = lightPos;
		for (let obj of this.entities) {
			obj.changed = true;
		}

		this.shadowSource!.model = Mat4.translate(lightPos).mul(Mat4.rotateTarget(lightPos, new Vec3(0, 0, 0)));

	}
}