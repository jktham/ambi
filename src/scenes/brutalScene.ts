import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";

export class BrutalScene extends Scene {
	public name: string = "brutal";
	public cameraMode: CameraMode = "walk";
	public spawnPos: Vec3 = new Vec3(0, 2.0, 0);

	public postShader: string = "post/noise.frag.wgsl";

	public init() {
		let phong = new PhongUniforms();
		phong.lightPos = new Vec3(100, 300, 200);
		phong.specularFactor = 0.0;

		let floor = new WorldObject();
		floor.mesh = "brutal/floor.obj";
		floor.texture = "concrete.jpg";
		floor.fragShader = "world/phong.frag.wgsl";
		floor.fragUniforms = phong;
		this.worldObjects.push(floor);

		let building = new WorldObject();
		building.mesh = "brutal/building.obj";
		building.texture = "concrete.jpg";
		building.fragShader = "world/phong.frag.wgsl";
		building.fragUniforms = phong;
		this.worldObjects.push(building);

		let sun = new WorldObject();
		sun.model = Mat4.trs(phong.lightPos, new Vec3(), 20.0);
		sun.mesh = "sphere.obj";
		sun.texture = "blank.png";
		sun.color = new Vec4(0.8, 0.1, 0.1, 1.0);
		this.worldObjects.push(sun);
	}

	public update(time: number, deltaTime: number) {
		
	}
}
