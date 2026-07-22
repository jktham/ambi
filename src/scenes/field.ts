import type { Player } from "../player";
import { Scene } from "../scene";
import { Object } from "../object";
import { InstancedUniforms, PostPsxUniforms } from "../uniforms";
import { rad, rnd } from "../utils";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class FieldScene extends Scene {
	CHUNK_SIZE = 30.0;
	GRASS_COUNT = 1000;
	grassOrigins: Mat4[] = [];
	grassModels: Mat4[] = [];
	grassSwayOffsets: number[] = [];
	grassSwaySpeeds: number[] = [];
	grassSwayScales: number[] = [];

	constructor() {
		super();

		this.name = "field";
		this.resolution = new Vec2(320, 180);
		this.cameraMode = "walk";
		this.spawnPos = new Vec3(0, 1.8, 0);
		this.spawnRot = new Vec3(0, rad(90), 0);

		// always initialize postuniforms in constructor, important for override reset
		this.postShader = "post/psx_fog.frag.wgsl";
		let postUniforms = new PostPsxUniforms();
		postUniforms.fog_start = -5.0;
		postUniforms.fog_end = 12.0;
		postUniforms.fog_color = new Vec4(0.20, 0.20, 0.20, 1.0);
		this.postUniforms = postUniforms;
	}

	init() {
		for (let chunkOffset of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)]) {
			let ground = new Object();;
			ground.mesh = "field/ground.obj";
			ground.textures = ["ground.jpg"];
			ground.fragShader = "world/psx.frag.wgsl";
			ground.vertShader = "world/psx.vert.wgsl";
			ground.model = Mat4.trs(
				new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2), 
				new Vec3(0, 0, 0), 
				this.CHUNK_SIZE
			);
			this.objects.push(ground);
		}

		let sky = new Object();
		sky.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = "cube.obj";
		sky.textures = ["test.png"];
		sky.fragShader = "world/skybox.frag.wgsl";
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.objects.push(sky);

		for (let i=0; i<this.GRASS_COUNT; i++) {
			let origin = Mat4.trs(
				new Vec3(rnd(-this.CHUNK_SIZE/2, this.CHUNK_SIZE/2), 0, rnd(-this.CHUNK_SIZE/2, this.CHUNK_SIZE/2)), 
				new Vec3(0, rnd(0, Math.PI * 2), rnd(0, Math.PI * 0.2)), 
				rnd(0.8, 1.6)
			);
			this.grassOrigins.push(origin);
			this.grassModels.push(origin);
			this.grassSwayOffsets.push(rnd(0, Math.PI * 2.0));
			this.grassSwaySpeeds.push(rnd(0.3, 1.5));
			this.grassSwayScales.push(rnd(0.1, Math.PI * 0.1));
		}

		for (let chunkOffset of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)]) {
			let grass = new Object();
			grass.tags = ["grass"];
			grass.model = Mat4.translate(new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2));
			grass.color = new Vec4(0.6, 0.6, 0.6, 1.0);
			grass.mesh = "field/grass.obj";
			grass.textures = ["leaves.jpg"];
			grass.fragShader = "world/psx.frag.wgsl";
			grass.vertShader = "world/psx_instanced.vert.wgsl";

			let grassUniforms = new InstancedUniforms();
			grassUniforms.instanceCount = this.GRASS_COUNT;
			
			for (let i=0; i<this.GRASS_COUNT; i++) {
				grassUniforms.models.push(this.grassModels[i]);
				grassUniforms.normals.push(this.grassModels[i].inverse().transpose());
			}
			grass.vertUniforms = grassUniforms;
			this.objects.push(grass);
		}
	}

	update(time: number, deltaTime: number, player: Player) {
		for (let i=0; i<this.GRASS_COUNT; i++) {
			let sway = Mat4.rotateIntrinsic(new Vec3(0, 0, Math.sin(this.grassSwaySpeeds[i] * time + this.grassSwayOffsets[i]) * this.grassSwayScales[i]));
			this.grassModels[i] = this.grassOrigins[i].mul(sway);
		}

		let grass = this.getObjects("grass")!;
		for (let g of grass) {
			let grassUniforms = g.vertUniforms as InstancedUniforms;
			for (let i=0; i<this.GRASS_COUNT; i++) {
				grassUniforms.models[i] = this.grassModels[i];
				// grassUniforms.normals[i] = this.grassModels[i].inverse().transpose();
			}
			g.changed = true;
		}

		if (player.position.x > this.CHUNK_SIZE/2) player.position.x -= this.CHUNK_SIZE;
		if (player.position.x < -this.CHUNK_SIZE/2) player.position.x += this.CHUNK_SIZE;
		if (player.position.z > this.CHUNK_SIZE/2) player.position.z -= this.CHUNK_SIZE;
		if (player.position.z < -this.CHUNK_SIZE/2) player.position.z += this.CHUNK_SIZE;
	}
}
