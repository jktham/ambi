import { Mat4, Vec2, Vec3, Vec4 } from "./vec";

export class Uniforms {
	readonly size: number = 0;

	public toArray(): Float32Array {
		return new Float32Array();
	}
}

export class BaseUniforms extends Uniforms {
	readonly size = 76;

	public time = 0;
	public frame = 0;
	public color = new Vec4();
	public viewPos = new Vec3();
	public model = new Mat4();
	public view = new Mat4();
	public projection = new Mat4();
	public normal = new Mat4();

	public toArray(): Float32Array {
		let data = new Float32Array(this.size);
		data[0] = this.time;
		data[1] = this.frame;
		data.subarray(4, 4+4).set(this.color.data);
		data.subarray(8, 8+3).set(this.viewPos.data);
		data.subarray(12, 12+16).set(this.model.transpose().data);
		data.subarray(28, 28+16).set(this.view.transpose().data);
		data.subarray(44, 44+16).set(this.projection.transpose().data);
		data.subarray(60, 60+16).set(this.normal.transpose().data);
		return data;
	}
}

export class PhongUniforms extends Uniforms {
	readonly size = 12;

	public ambientFactor = 0.1;
	public diffuseFactor = 0.6;
	public specularFactor = 0.3;
	public specularExponent = 32.0;
	public lightPos = new Vec3();
	public lightColor = new Vec4(1.0, 1.0, 1.0, 1.0);

	public toArray(): Float32Array {
		let data = new Float32Array(this.size);
		data[0] = this.ambientFactor;
		data[1] = this.diffuseFactor;
		data[2] = this.specularFactor;
		data[3] = this.specularExponent;
		data.subarray(4, 4+3).set(this.lightPos.data);
		data.subarray(8, 8+4).set(this.lightColor.data);
		return data;
	}
}

export class PostBaseUniforms extends Uniforms {
	readonly size = 4;

	public time = 0;
	public frame = 0;
	public resolution = new Vec2();

	public toArray(): Float32Array {
		let data = new Float32Array(this.size);
		data[0] = this.time;
		data[1] = this.frame;
		data.subarray(2, 2+2).set(this.resolution.data);
		return data;
	}
}