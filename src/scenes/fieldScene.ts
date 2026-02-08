import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PostPS1Uniforms } from "../uniforms";
import { rnd } from "../utils";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class FieldScene extends Scene {
	name = "field";
	resolution = new Vec2(320, 180);
	spawnPos = new Vec3(0, 1.8, 0);
	spawnRot = new Vec2(-Math.PI / 2.0, 0);
	cameraMode = "walk" as CameraMode;

	postShader = "post/ps1_fog.frag.wgsl";
	postUniforms = new PostPS1Uniforms();

	CHUNK_SIZE = 30.0;
	GRASS_COUNT = 1000;
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
		for (let chunkOffset of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)]) {
			let ground = new WorldObject();;
			ground.mesh = "field/ground.obj";
			ground.textures = ["ground.jpg"];
			ground.fragShader = "world/ps1.frag.wgsl";
			ground.vertShader = "world/ps1.vert.wgsl";
			ground.model = Mat4.trs(
				new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2), 
				new Vec3(0, 0, 0), 
				this.CHUNK_SIZE
			);
			this.objects.push(ground);
		}

		let sky = new WorldObject();
		sky.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = "cube.obj";
		sky.textures = ["test.png"];
		sky.fragShader = "world/skybox.frag.wgsl";
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.objects.push(sky);

		let grass = new WorldObject();
		grass.tags = ["grass"];
		grass.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		grass.color = new Vec4(0.6, 0.6, 0.6, 1.0);
		grass.mesh = "field/grass.obj";
		grass.textures = ["leaves.jpg"];
		grass.fragShader = "world/ps1.frag.wgsl";
		grass.vertShader = "world/ps1_instanced.vert.wgsl";

		let grassUniforms = new InstancedUniforms();
		grassUniforms.instanceCount = this.GRASS_COUNT*4;
		for (let i=0; i<this.GRASS_COUNT; i++) {
			let origin = Mat4.trs(
				new Vec3(rnd(-this.CHUNK_SIZE/2, this.CHUNK_SIZE/2), 0, rnd(-this.CHUNK_SIZE/2, this.CHUNK_SIZE/2)), 
				new Vec3(0, rnd(0, Math.PI * 2), rnd(0, Math.PI * 0.2)), 
				rnd(0.8, 1.6)
			);
			this.grassOrigins.push(origin);
			this.grassSwayOffsets.push(rnd(0, Math.PI * 2.0));
			this.grassSwaySpeeds.push(rnd(0.3, 1.5));
			this.grassSwayScales.push(rnd(0.1, Math.PI * 0.1));
		}
		for (let chunkOffset of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)]) {
			for (let i=0; i<this.GRASS_COUNT; i++) {
				let model = Mat4.translate(new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2)).mul(this.grassOrigins[i]);
				grassUniforms.models.push(model);
				grassUniforms.normals.push(model.inverse().transpose());
			}
		}
		grass.vertUniforms = grassUniforms;
		this.objects.push(grass);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		let grass = this.getObject("grass")!;
		let grassUniforms = grass.vertUniforms as InstancedUniforms;
		for (let [k, chunkOffset] of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)].entries()) {
			for (let i=0; i<this.GRASS_COUNT; i++) {
				let model = Mat4.translate(new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2)).mul(this.grassOrigins[i]);
				let sway = Mat4.rotate(new Vec3(0, 0, Math.sin(this.grassSwaySpeeds[i] * time + this.grassSwayOffsets[i]) * this.grassSwayScales[i]));
				grassUniforms.models[this.GRASS_COUNT*k + i] = model.mul(sway);
				// grassUniforms.normals[i] = model.inverse().transpose();
			}
		}
		grass.changed = true;

		if (position.x > this.CHUNK_SIZE/2) position.x -= this.CHUNK_SIZE;
		if (position.x < -this.CHUNK_SIZE/2) position.x += this.CHUNK_SIZE;
		if (position.z > this.CHUNK_SIZE/2) position.z -= this.CHUNK_SIZE;
		if (position.z < -this.CHUNK_SIZE/2) position.z += this.CHUNK_SIZE;
	}
}
