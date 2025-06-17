import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { type Uniforms, InstancedUniforms, PostPS1Uniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class PierScene extends Scene {
	public name: string = "pier";
	public resolution: Vec2 = new Vec2(320, 180);
	public spawnPos: Vec3 = new Vec3(8, 1.8, -0.5);
	public spawnRot: Vec2 = new Vec2(-Math.PI / 2.0, 0);
	public cameraMode: CameraMode = "walk";

	public postShader: string = "post/ps1.frag.wgsl";
	public postUniforms: Uniforms = new PostPS1Uniforms();

	constructor() {
		super();
		(this.postUniforms as PostPS1Uniforms).fogStart = -2.0;
		(this.postUniforms as PostPS1Uniforms).fogEnd = 10.0;
		(this.postUniforms as PostPS1Uniforms).fogColor = new Vec4(0.60, 0.60, 0.60, 1.0);
	}

	public init() {
		let pier = new WorldObject();
		pier.mesh = "pier.obj";
		pier.texture = "wood.jpg";
		pier.fragShader = "world/ps1.frag.wgsl";
		pier.vertShader = "world/ps1.vert.wgsl";
		this.worldObjects.push(pier);

		let water = new WorldObject();
		water.mesh = "pier_water.obj";
		water.texture = "snow.jpg";
		water.fragShader = "world/ps1.frag.wgsl";
		water.vertShader = "world/ps1.vert.wgsl";
		this.worldObjects.push(water);

		let ground = new WorldObject();
		ground.mesh = "pier_ground.obj";
		ground.texture = "ground.jpg";
		ground.fragShader = "world/ps1.frag.wgsl";
		ground.vertShader = "world/ps1.vert.wgsl";
		this.worldObjects.push(ground);

		let sky = new WorldObject();
		sky.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = "cube.obj";
		sky.texture = "test.png";
		sky.fragShader = "world/skybox.frag.wgsl";
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.worldObjects.push(sky);

		let snow = new WorldObject();
		snow.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 0.01);
		snow.mesh = "snow.obj";
		snow.texture = "blank.png";
		snow.color = new Vec4(0.9, 0.9, 0.9, 1.0);
		snow.vertShader = "world/instanced.vert.wgsl";
		snow.vertUniforms = new InstancedUniforms();
		(snow.vertUniforms as InstancedUniforms).instanceCount = 1000;
		for (let i=0; i<(snow.vertUniforms as InstancedUniforms).instanceCount; i++) {
			let range = 20;
			let model = Mat4.trs(
				new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2), 
				new Vec3(0, Math.PI * Math.random() * 2, 0), 
				1
			);
			(snow.vertUniforms as InstancedUniforms).models.push(model);
			(snow.vertUniforms as InstancedUniforms).normals.push(model.transpose());
		}
		this.worldObjects.push(snow);
	}

	public update(time: number, deltaTime: number) {
		for (let i=0; i<(this.worldObjects[4].vertUniforms as InstancedUniforms).instanceCount; i++) {
			let model = (this.worldObjects[4].vertUniforms as InstancedUniforms).models[i];
			let fall = Mat4.translate(new Vec3(0, -0.2 * deltaTime, 0.1 * deltaTime));
			model = model.mul(fall);
			if (model.transform(new Vec3()).y < -2) {
				model = model.mul(Mat4.translate(new Vec3(0, 10, -5)));
			}
			(this.worldObjects[4].vertUniforms as InstancedUniforms).models[i] = model;
			(this.worldObjects[4].vertUniforms as InstancedUniforms).normals[i] = model.transpose();
		}
	}
}
