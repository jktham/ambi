import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { Camera } from "../camera";
import { PhongUniforms } from "../uniforms";

export class DebugShadowScene extends Scene {
	name = "dbg_shadow";
	spawnPos = new Vec3(0, -2, 6);
	shadowSource? = new Camera();
	
	phong = new PhongUniforms();
	shadow_bias = 0.000005;

	constructor() {
		super();

		this.shadowSource!.fov = 80.0;
		this.shadowSource!.near = 0.01;
		this.shadowSource!.far = 100.0;
	}

	init() {
		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(-4, -2, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test_trans2.png", "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.zsort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -4, 0), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png", "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.zsort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(4, -2, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png", "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.zsort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		obj.shadows = false;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png", "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong_shadow.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 20, 20*Math.sin(time/2));
		this.phong.light.pos = lightPos;
		for (let obj of this.objects) {
			obj.changed = true;
		}

		this.shadowSource!.model = Mat4.translate(lightPos).mul(Mat4.rotateLookAt(lightPos, new Vec3(0, 0, 0)));

	}
}