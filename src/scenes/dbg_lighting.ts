import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugLightingScene extends Scene {
	constructor() {
		super();

		this.name = "dbg_lighting";
		this.spawnPos = new Vec3(0, 4, 8);

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["default.png"],
			meshes: ["cube.obj", "quad.obj"],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-12, 0, 0), new Vec3(), 2.5);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");

		let phong = new PhongUniforms();
		obj.fragUniforms = phong;
		phong.light.pos = obj.model.translation().add(new Vec3(0, 3.0, 0));
		phong.material.ambient = new Vec3(1, 0, 0);
		phong.material.diffuse = new Vec3(0, 1, 0);
		phong.material.specular = new Vec3(0, 0, 1);
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-6, 0, 0), new Vec3(), 2.5);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");

		phong = new PhongUniforms();
		obj.fragUniforms = phong;
		phong.light.pos = obj.model.translation().add(new Vec3(0, 3.0, 0));
		phong.light.diffuse = new Vec3(0, 1, 0);
		phong.light.specular = new Vec3(0, 0, 1);
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 2.5);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");

		phong = new PhongUniforms();
		obj.fragUniforms = phong;
		phong.light.pos = obj.model.translation().add(new Vec3(0, 3.0, 0));
		phong.light.falloff_constant = 1.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(6, 0, 0), new Vec3(), 2.5);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");

		phong = new PhongUniforms();
		obj.fragUniforms = phong;
		phong.light.pos = obj.model.translation().add(new Vec3(0, 3.0, 0));
		phong.light.falloff_linear = 1.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(12, 0, 0), new Vec3(), 2.5);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");

		phong = new PhongUniforms();
		obj.fragUniforms = phong;
		phong.light.pos = obj.model.translation().add(new Vec3(0, 3.0, 0));
		phong.light.falloff_exponential = 1.0;
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {

	}
}