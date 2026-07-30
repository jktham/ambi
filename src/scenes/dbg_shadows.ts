import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { Camera } from "../camera";
import { PhongUniforms } from "../uniforms";
import type { Assets } from "../assets";

export class DebugShadowsScene extends Scene {
	phong = new PhongUniforms();
	shadow_bias = 0.000005;

	constructor() {
		super();

		this.name = "dbg_shadows";
		this.spawnPos = new Vec3(0, -2, 6);
		
		this.shadowCamera = new Camera();
		this.shadowCamera!.fov = 80.0;
		this.shadowCamera!.near = 0.01;
		this.shadowCamera!.far = 100.0;

		this.preload = {
			shaders: ["world/phong_shadow.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["test_trans2.png", "default.png"],
			meshes: ["cube.obj", "monke.obj", "quad.obj"],
		};
	}

	async init(assets: Assets) {
		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-4, -2, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test_trans2.png"), "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong_shadow.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.z_sort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -4, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png"), "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong_shadow.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.z_sort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(4, -2, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png"), "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong_shadow.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.z_sort = true;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		obj.shadows = false;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("default.png"), "$shadowmap"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong_shadow.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.fragConfig.x = this.shadow_bias;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		let lightPos = new Vec3(20*Math.cos(time/2), 20, 20*Math.sin(time/2));
		this.phong.light.pos = lightPos;
		for (let obj of this.objects) {
			obj.changed = true;
		}

		this.shadowCamera!.model = Mat4.translate(lightPos).mul(Mat4.rotateLookAt(lightPos, new Vec3(0, 0, 0)));
		this.shadowCamera!.updateMatrices();

	}
}