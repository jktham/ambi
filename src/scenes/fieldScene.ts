import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PostPS1Uniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class FieldScene extends Scene {
	name = "field";
	resolution = new Vec2(320, 180);
	spawnPos = new Vec3(0, 1.8, 0);
	spawnRot = new Vec2(-Math.PI / 2.0, 0);
	cameraMode = "walk" as CameraMode;

	postShader = "post/ps1_fog.frag.wgsl";
	postUniforms = new PostPS1Uniforms();

	grassOrigins: Mat4[] = [];
	grassSwayOffsets: number[] = [];
	grassSwaySpeeds: number[] = [];
	grassSwayScales: number[] = [];

	constructor() {
		super();
		(this.postUniforms as PostPS1Uniforms).fogStart = -5.0;
		(this.postUniforms as PostPS1Uniforms).fogEnd = 20.0;
		(this.postUniforms as PostPS1Uniforms).fogColor = new Vec4(0.20, 0.20, 0.20, 1.0);
	}

	init() {
		let ground = new WorldObject();
		ground.mesh = "field/ground.obj";
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

		let grass = new WorldObject();
		grass.tag = "grass";
		grass.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 0.01);
		grass.color = new Vec4(0.6, 0.6, 0.6, 1.0);
		grass.mesh = "field/grass.obj";
		grass.textures = ["leaves.jpg"];
		grass.fragShader = "world/ps1.frag.wgsl";
		grass.vertShader = "world/ps1_instanced.vert.wgsl";

		let grassUniforms = new InstancedUniforms();
		grassUniforms.instanceCount = 4000;
		for (let i=0; i<grassUniforms.instanceCount; i++) {
			let range = 60;
			let model = Mat4.trs(
				new Vec3(Math.random()*range - range/2, 0, Math.random()*range - range/2), 
				new Vec3(0, Math.PI * Math.random() * 2, Math.PI * Math.random() * 0.2), 
				0.8 + Math.random() * 0.8
			);
			this.grassOrigins.push(model);
			this.grassSwayOffsets.push(Math.random() * Math.PI * 2.0);
			this.grassSwaySpeeds.push(0.3 + Math.random() * 1.2);
			this.grassSwayScales.push(0.1 + Math.random() * Math.PI * 0.1);

			grassUniforms.models.push(model);
			grassUniforms.normals.push(model.inverse().transpose());
		}
		grass.vertUniforms = grassUniforms;
		this.objects.push(grass);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		let grassUniforms = (this.getObject("grass")?.vertUniforms as InstancedUniforms);
		for (let i=0; i<grassUniforms.instanceCount; i++) {
			let model = this.grassOrigins[i];
			let sway = Mat4.rotate(new Vec3(0, 0, Math.sin(this.grassSwaySpeeds[i] * time + this.grassSwayOffsets[i]) * this.grassSwayScales[i]));
			model = model.mul(sway);
			grassUniforms.models[i] = model;
			// grassUniforms.normals[i] = model.inverse().transpose();
		}
	}
}
