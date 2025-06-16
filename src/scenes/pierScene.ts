import { Scene, WorldObject } from "../scene";
import { type Uniforms, PostPS1Uniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class PierScene extends Scene {
	public name: string = "pier";

	public postShader: string = "post/ps1.frag.wgsl";
	public postUniforms: Uniforms = new PostPS1Uniforms();
	public resolution: Vec2 = new Vec2(320, 180);

	constructor() {
		super();
		(this.postUniforms as PostPS1Uniforms).fogStart = -2.0;
		(this.postUniforms as PostPS1Uniforms).fogEnd = 10.0;
		(this.postUniforms as PostPS1Uniforms).fogColor = new Vec4(0.60, 0.60, 0.60, 1.0);
	}

	public init() {
		let pier = new WorldObject();
		pier.model = Mat4.trs(new Vec3(0, -2, -5), new Vec3(0, -Math.PI / 2, 0), 1);
		pier.mesh = "pier.obj";
		pier.texture = "wood.jpg";
		pier.fragShader = "world/ps1.frag.wgsl";
		pier.vertShader = "world/ps1.vert.wgsl";
		this.worldObjects.push(pier);

		let water = new WorldObject();
		water.model = Mat4.trs(new Vec3(0, -3, -10), new Vec3(0, 0, 0), 10);
		water.mesh = "quad_subdiv.obj";
		water.texture = "snow.jpg";
		water.fragShader = "world/ps1.frag.wgsl";
		water.vertShader = "world/ps1.vert.wgsl";
		this.worldObjects.push(water);

		let ground = new WorldObject();
		ground.model = Mat4.trs(new Vec3(0, -12, 8), new Vec3(0, 0, 0), 10);
		ground.mesh = "cube_subdiv.obj";
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
