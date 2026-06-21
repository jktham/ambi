import { Vec2, Vec3, Mat4 } from "./vec";

export class Camera {
	fov: number = 100.0;
	aspect: number = 16.0/9.0;

	position: Vec3 = new Vec3();
	rotation: Vec2 = new Vec2();

	view: Mat4 = new Mat4();
	projection: Mat4 = new Mat4();

	constructor() {
		this.updateMatrices();
	}

	/** update view and projection matrices */
	updateMatrices() {
		this.view = this.computeView(this.position, this.rotation);
		this.projection = this.computeProjection(this.fov, this.aspect);
	}

	/** compute view matrix from position and rotation */
	computeView(position: Vec3, rotation: Vec2): Mat4 {
		return Mat4.rotate(new Vec3(rotation.y, rotation.x, 0)).mul(Mat4.translate(position.mul(1)).inverse());
	}

	/** compute projection matrix from fov and aspect ratio */
	computeProjection(fov: number, aspect: number): Mat4 {
		const near = 0.001;
		const far = 1000.0;
		const phi = Math.tan((1.0 - fov / 180.0) * Math.PI / 2.0);

		return new Mat4([
			phi, 0.0, 0.0, 0.0,
			0.0, phi * aspect, 0.0, 0.0,
			0.0, 0.0, near / (far - near), far * near / (far - near), // reverse z
			0.0, 0.0, -1.0, 0.0
		]);
	}

}