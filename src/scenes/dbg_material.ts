import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugMaterialScene extends Scene {
	constructor() {
		super();

		this.name = "dbg_material";
		this.spawnPos = new Vec3(0, 0, 5);

		this.preload = {
			shaders: ["world/phong_material.frag.wgsl", "world/skybox.frag.wgsl", "world/phong.frag.wgsl"],
			textures: ["brick_diffuse.jpg", "blue.png", "gray.png", "brick_normal.jpg", "brick_roughness.jpg", "brick_specular.jpg", "house.jpg", "test_roughness.png", "test_specular.png", "test.png"],
			meshes: ["test_mat.obj", "cube.obj", "quad.obj"],
			colliders: [],
			fonts: [],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.transform(new Vec3(-4.5, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("test_mat.obj");
		obj.textures = [
			await assets.loadTexture("brick_diffuse.jpg"), 
			await assets.loadTexture("blue.png"), 
			await assets.loadTexture("gray.png"), 
			await assets.loadTexture("gray.png")
		];
		obj.fragShader = await assets.loadShader("world/phong_material.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.transform(new Vec3(-1.5, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("test_mat.obj");
		obj.textures = [
			await assets.loadTexture("brick_diffuse.jpg"), 
			await assets.loadTexture("brick_normal.jpg"), 
			await assets.loadTexture("gray.png"), 
			await assets.loadTexture("gray.png")
		];
		obj.fragShader = await assets.loadShader("world/phong_material.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.transform(new Vec3(1.5, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("test_mat.obj");
		obj.textures = [
			await assets.loadTexture("brick_diffuse.jpg"), 
			await assets.loadTexture("brick_normal.jpg"), 
			await assets.loadTexture("brick_roughness.jpg"), 
			await assets.loadTexture("brick_specular.jpg")
		];
		obj.fragShader = await assets.loadShader("world/phong_material.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.transform(new Vec3(4.5, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("test_mat.obj");
		obj.textures = [
			await assets.loadTexture("house.jpg"), 
			await assets.loadTexture("brick_normal.jpg"), 
			await assets.loadTexture("test_roughness.png"), 
			await assets.loadTexture("test_specular.png")
		];
		obj.fragShader = await assets.loadShader("world/phong_material.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = new PhongUniforms();
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		let lightOffset = new Vec3(2*Math.cos(time/2), 2, 2*Math.sin(time/2));
		
		for (let obj of this.getObjects("circleLight")) {
			(obj.fragUniforms as PhongUniforms).light.pos = obj.model.translation().add(lightOffset);
			obj.changed = true;
		}

	}
}