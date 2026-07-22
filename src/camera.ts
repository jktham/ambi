import { Mat4 } from "./vec";

export class Camera {
	fov: number = 100.0;
	aspect: number = 16.0/9.0;
	near: number = 0.001;
	far: number = 1000.0;

	model: Mat4 = new Mat4();
	view: Mat4 = new Mat4();
	projection: Mat4 = new Mat4();

	constructor() {
		this.updateMatrices();
	}

	/** update view and projection matrices */
	updateMatrices() {
		this.view = this.computeView();
		this.projection = this.computeProjection();
	}

	/** compute view matrix from model transform */
	private computeView(): Mat4 {
		return this.model.inverse();
	}

	/** compute projection matrix from near and far planes, fov and aspect ratio */
	private computeProjection(): Mat4 {
		const phi = Math.tan((1.0 - this.fov / 180.0) * Math.PI / 2.0);

		return new Mat4([
			phi, 0.0, 0.0, 0.0,
			0.0, phi * this.aspect, 0.0, 0.0,
			0.0, 0.0, this.near / (this.far - this.near), this.far * this.near / (this.far - this.near), // reverse z
			0.0, 0.0, -1.0, 0.0
		]);
	}

}