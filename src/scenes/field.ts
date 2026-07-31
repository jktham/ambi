import type { Player } from "../player";
import { Scene } from "../scene";
import { Object } from "../object";
import { InstancedUniforms, PostPsxFogUniforms } from "../uniforms";
import { rad, rnd } from "../utils";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Assets } from "../assets";

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
		let postUniforms = new PostPsxFogUniforms();
		postUniforms.fog_start = -5.0;
		postUniforms.fog_end = 12.0;
		postUniforms.fog_color = new Vec4(0.20, 0.20, 0.20, 1.0);
		postUniforms.glow_samples = 0;
		this.postUniforms = postUniforms;

		this.preload = {
			shaders: ["post/psx_fog.frag.wgsl", "world/psx.frag.wgsl", "world/psx.vert.wgsl", "world/skybox.frag.wgsl", "world/psx_instanced.vert.wgsl"],
			textures: ["materials/ground.jpg", "default.png", "materials/leaves.jpg"],
			meshes: ["field/ground.obj", "cube.obj", "field/grass.obj"],
		};
	}

	async init(assets: Assets) {
		this.postShader = await assets.loadShader("post/psx_fog.frag.wgsl");

		for (let chunkOffset of [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)]) {
			let ground = new Object();;
			ground.mesh = await assets.loadMesh("field/ground.obj");
			ground.textures = [await assets.loadTexture("materials/ground.jpg")];
			ground.fragShader = await assets.loadShader("world/psx.frag.wgsl");
			ground.vertShader = await assets.loadShader("world/psx.vert.wgsl");
			ground.model = Mat4.transform(
				new Vec3(chunkOffset.x * this.CHUNK_SIZE/2, 0, chunkOffset.y * this.CHUNK_SIZE/2), 
				new Vec3(0, 0, 0), 
				this.CHUNK_SIZE
			);
			this.objects.push(ground);
		}

		let sky = new Object();
		sky.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = await assets.loadMesh("cube.obj");
		sky.textures = [await assets.loadTexture("default.png")];
		sky.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.objects.push(sky);

		for (let i=0; i<this.GRASS_COUNT; i++) {
			let origin = Mat4.transform(
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
			grass.mesh = await assets.loadMesh("field/grass.obj");
			grass.textures = [await assets.loadTexture("materials/leaves.jpg")];
			grass.fragShader = await assets.loadShader("world/psx.frag.wgsl");
			grass.vertShader = await assets.loadShader("world/psx_instanced.vert.wgsl");

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

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
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
			g.update = true;
		}

		if (player.position.x > this.CHUNK_SIZE/2) player.position.x -= this.CHUNK_SIZE;
		if (player.position.x < -this.CHUNK_SIZE/2) player.position.x += this.CHUNK_SIZE;
		if (player.position.z > this.CHUNK_SIZE/2) player.position.z -= this.CHUNK_SIZE;
		if (player.position.z < -this.CHUNK_SIZE/2) player.position.z += this.CHUNK_SIZE;
	}
}
