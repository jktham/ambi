import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { type Uniforms, PostPS1Uniforms } from "../uniforms";
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
	}

	public update(time: number, deltaTime: number) {
		
	}
}
