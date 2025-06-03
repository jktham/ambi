export class Camera {
	fov: number;
	view: number[];
	projection: number[];

	constructor() {
		this.fov = 90.0;
		this.view = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];

		const near = 0.01;
		const far = 1000.0;
		const aspect = 300.0 / 150.0;
		const phi = Math.tan(Math.PI * 0.5 - 0.5 * this.fov / 180.0 * Math.PI);

		this.projection = [
			phi / aspect, 0.0, 0.0, 0.0,
			0.0, phi, 0.0, 0.0,
			0.0, 0.0, far / (near - far), -1.0,
			0.0, 0.0, near * far / (near - far), 0.0,
		];
	}

}