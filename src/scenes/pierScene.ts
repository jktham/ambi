import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PostPS1Uniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class PierScene extends Scene {
	name = "pier";
	resolution = new Vec2(320, 180);
	spawnPos = new Vec3(8, 1.8, -0.5);
	spawnRot = new Vec2(-Math.PI / 2.0, 0);
	cameraMode = "walk" as CameraMode;

	postShader = "post/ps1_fog.frag.wgsl";
	postUniforms = new PostPS1Uniforms();

	constructor() {
		super();
		(this.postUniforms as PostPS1Uniforms).fogStart = -2.0;
		(this.postUniforms as PostPS1Uniforms).fogEnd = 10.0;
		(this.postUniforms as PostPS1Uniforms).fogColor = new Vec4(0.60, 0.60, 0.60, 1.0);
	}

	init() {
		let pier = new WorldObject();
		pier.mesh = "pier/pier.obj";
		pier.collider = "pier/collider.obj";
		pier.textures = ["wood.jpg"];
		pier.fragShader = "world/ps1.frag.wgsl";
		pier.vertShader = "world/ps1.vert.wgsl";
		this.objects.push(pier);

		let water = new WorldObject();
		water.mesh = "pier/water.obj";
		water.textures = ["snow.jpg"];
		water.fragShader = "world/ps1.frag.wgsl";
		water.vertShader = "world/ps1.vert.wgsl";
		this.objects.push(water);

		let ground = new WorldObject();
		ground.mesh = "pier/ground.obj";
		ground.textures = ["ground.jpg"];
		ground.fragShader = "world/ps1.frag.wgsl";
		ground.vertShader = "world/ps1.vert.wgsl";
		this.objects.push(ground);

		let sky = new WorldObject();
		sky.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = "cube.obj";
		sky.textures = ["test.png"];
		sky.fragShader = "world/skybox.frag.wgsl";
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.objects.push(sky);

		let snow = new WorldObject();
		snow.tags = ["snow"];
		snow.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		snow.mesh = "pier/snow.obj";
		snow.textures = ["blank.png"];
		snow.color = new Vec4(0.9, 0.9, 0.9, 1.0);
		snow.fragShader = "world/ps1.frag.wgsl";
		snow.vertShader = "world/ps1_instanced.vert.wgsl";
		
		let snowUniforms = new InstancedUniforms();
		snowUniforms.instanceCount = 1000;
		for (let i=0; i<snowUniforms.instanceCount; i++) {
			let range = 20;
			let model = Mat4.trs(
				new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2), 
				new Vec3(0, Math.PI * Math.random() * 2, 0), 
				1
			);
			snowUniforms.models.push(model);
			snowUniforms.normals.push(model.inverse().transpose());
		}
		snow.vertUniforms = snowUniforms;
		this.objects.push(snow);

		let lantern = new WorldObject();
		lantern.mesh = "pier/lantern.obj";
		lantern.textures = ["cracked.jpg"];
		lantern.color = new Vec4(1.0, 0.9, 0.0, 1.0);
		lantern.mask = 255;
		lantern.fragShader = "world/ps1.frag.wgsl";
		lantern.vertShader = "world/ps1.vert.wgsl";
		this.objects.push(lantern);

		let lantern_holder = new WorldObject();
		lantern_holder.mesh = "pier/lantern_holder.obj";
		lantern_holder.textures = ["metal.jpg"];
		lantern_holder.color = new Vec4(0.2, 0.2, 0.2, 1.0);
		lantern_holder.fragShader = "world/ps1.frag.wgsl";
		lantern_holder.vertShader = "world/ps1.vert.wgsl";
		this.objects.push(lantern_holder);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		let snowUniforms = (this.getObject("snow")?.vertUniforms as InstancedUniforms);
		for (let i=0; i<snowUniforms.instanceCount; i++) {
			let model = snowUniforms.models[i];
			let fall = Mat4.translate(new Vec3(0, -0.2 * deltaTime, 0.1 * deltaTime));
			model = model.mul(fall);
			if (model.transform(new Vec3()).y < -2) {
				model = model.mul(Mat4.translate(new Vec3(0, 10, -5)));
			}
			snowUniforms.models[i] = model;
			snowUniforms.normals[i] = model.inverse().transpose();
		}
	}
}
