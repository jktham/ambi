export class Vec2 {
	data: number[];
	size: number = 2;

	constructor(x: number = 0, y: number = 0) {
		this.data = [x, y];
	}

	get x(): number {return this.data[0]};
	get y(): number {return this.data[1]};
	set x(value: number) {this.data[0] = value};
	set y(value: number) {this.data[1] = value};

	add(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(this.x+op.x, this.y+op.y);
		} else {
			return new Vec2(this.x+op, this.y+op);
		}
	}

	sub(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(this.x-op.x, this.y-op.y);
		} else {
			return new Vec2(this.x-op, this.y-op);
		}
	}

	mul(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(this.x*op.x, this.y*op.y);
		} else {
			return new Vec2(this.x*op, this.y*op);
		}
	}

	div(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(this.x/op.x, this.y/op.y);
		} else {
			return new Vec2(this.x/op, this.y/op);
		}
	}

	dot(op: Vec2): number {
		return this.x*op.x + this.y*op.y;
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2);
	}

	normalize(): Vec2 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}
}

export class Vec3 {
	data: number[];
	size: number = 3;

	constructor(x: number = 0, y: number = 0, z: number = 0) {
		this.data = [x, y, z];
	}

	get x(): number {return this.data[0]};
	get y(): number {return this.data[1]};
	get z(): number {return this.data[2]};
	set x(value: number) {this.data[0] = value};
	set y(value: number) {this.data[1] = value};
	set z(value: number) {this.data[2] = value};

	add(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(this.x+op.x, this.y+op.y, this.z+op.z);
		} else {
			return new Vec3(this.x+op, this.y+op, this.z+op);
		}
	}

	sub(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(this.x-op.x, this.y-op.y, this.z-op.z);
		} else {
			return new Vec3(this.x-op, this.y-op, this.z-op);
		}
	}

	mul(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(this.x*op.x, this.y*op.y, this.z*op.z);
		} else {
			return new Vec3(this.x*op, this.y*op, this.z*op);
		}
	}

	div(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(this.x/op.x, this.y/op.y, this.z/op.z);
		} else {
			return new Vec3(this.x/op, this.y/op, this.z/op);
		}
	}

	dot(op: Vec3): number {
		return this.x*op.x + this.y*op.y + this.z*op.z;
	}
	
	cross(op: Vec3): Vec3 {
		return new Vec3(
			this.y * op.z - this.z * op.y, 
			this.z * op.x - this.x * op.z, 
			this.x * op.y - this.y * op.x
		);
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
	}

	normalize(): Vec3 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}
}

export class Vec4 {
	data: number[];
	size: number = 4;

	constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
		this.data = [x, y, z, w];
	}

	get x(): number {return this.data[0]};
	get y(): number {return this.data[1]};
	get z(): number {return this.data[2]};
	get w(): number {return this.data[3]};
	set x(value: number) {this.data[0] = value};
	set y(value: number) {this.data[1] = value};
	set z(value: number) {this.data[2] = value};
	set w(value: number) {this.data[3] = value};

	add(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(this.x+op.x, this.y+op.y, this.z+op.z);
		} else {
			return new Vec4(this.x+op, this.y+op, this.z+op);
		}
	}

	sub(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(this.x-op.x, this.y-op.y, this.z-op.z, this.w-op.w);
		} else {
			return new Vec4(this.x-op, this.y-op, this.z-op, this.w-op);
		}
	}

	mul(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(this.x*op.x, this.y*op.y, this.z*op.z, this.w*op.w);
		} else {
			return new Vec4(this.x*op, this.y*op, this.z*op, this.w*op);
		}
	}

	div(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(this.x/op.x, this.y/op.y, this.z/op.z, this.w/op.w);
		} else {
			return new Vec4(this.x/op, this.y/op, this.z/op, this.w/op);
		}
	}

	dot(op: Vec4): number {
		return this.x*op.x + this.y*op.y + this.z*op.z + this.w*op.w;
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2 + this.z**2 + this.w**2);
	}

	normalize(): Vec4 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}
}

export class Mat4 {
	data: number[];
	size: number = 16;

	constructor(data?: number[]) {
		if (!data) {
			this.data = [
				1, 0, 0, 0, 
				0, 1, 0, 0, 
				0, 0, 1, 0, 
				0, 0, 0, 1
			];
		} else if (data.length != 16) {
			throw new Error("Mat4 constructor not length 16");
		} else {
			this.data = data;
		}
	}

	mul(op: number | Mat4): Mat4 {
		if (op instanceof Mat4) {
			return new Mat4([
				this.data[0] * op.data[0] + this.data[1] * op.data[4] + this.data[2] * op.data[8] + this.data[3] * op.data[12],
				this.data[0] * op.data[1] + this.data[1] * op.data[5] + this.data[2] * op.data[9] + this.data[3] * op.data[13],
				this.data[0] * op.data[2] + this.data[1] * op.data[6] + this.data[2] * op.data[10] + this.data[3] * op.data[14],
				this.data[0] * op.data[3] + this.data[1] * op.data[7] + this.data[2] * op.data[11] + this.data[3] * op.data[15],
				this.data[4] * op.data[0] + this.data[5] * op.data[4] + this.data[6] * op.data[8] + this.data[7] * op.data[12],
				this.data[4] * op.data[1] + this.data[5] * op.data[5] + this.data[6] * op.data[9] + this.data[7] * op.data[13],
				this.data[4] * op.data[2] + this.data[5] * op.data[6] + this.data[6] * op.data[10] + this.data[7] * op.data[14],
				this.data[4] * op.data[3] + this.data[5] * op.data[7] + this.data[6] * op.data[11] + this.data[7] * op.data[15],
				this.data[8] * op.data[0] + this.data[9] * op.data[4] + this.data[10] * op.data[8] + this.data[11] * op.data[12],
				this.data[8] * op.data[1] + this.data[9] * op.data[5] + this.data[10] * op.data[9] + this.data[11] * op.data[13],
				this.data[8] * op.data[2] + this.data[9] * op.data[6] + this.data[10] * op.data[10] + this.data[11] * op.data[14],
				this.data[8] * op.data[3] + this.data[9] * op.data[7] + this.data[10] * op.data[11] + this.data[11] * op.data[15],
				this.data[12] * op.data[0] + this.data[13] * op.data[4] + this.data[14] * op.data[8] + this.data[15] * op.data[12],
				this.data[12] * op.data[1] + this.data[13] * op.data[5] + this.data[14] * op.data[9] + this.data[15] * op.data[13],
				this.data[12] * op.data[2] + this.data[13] * op.data[6] + this.data[14] * op.data[10] + this.data[15] * op.data[14],
				this.data[12] * op.data[3] + this.data[13] * op.data[7] + this.data[14] * op.data[11] + this.data[15] * op.data[15],
			]);
		} else {
			return new Mat4([
				this.data[0]*op, this.data[1]*op, this.data[2]*op, this.data[3]*op,
				this.data[4]*op, this.data[5]*op, this.data[6]*op, this.data[7]*op,
				this.data[8]*op, this.data[9]*op, this.data[10]*op, this.data[11]*op,
				this.data[12]*op, this.data[13]*op, this.data[14]*op, this.data[15]*op
			]);
		}
	}

	transform(op: Vec3): Vec3 {
		return new Vec3(
			this.data[0] * op.x + this.data[1] * op.y + this.data[2] * op.z + this.data[3] * 1,
			this.data[4] * op.x + this.data[5] * op.y + this.data[6] * op.z + this.data[7] * 1,
			this.data[8] * op.x + this.data[9] * op.y + this.data[10] * op.z + this.data[11] * 1,
		);
	}

	inverse(): Mat4 {
		let r: number[] = new Array(16).fill(0);
		let m = this.data;

		r[0] = m[5]*m[10]*m[15] - m[5]*m[14]*m[11] - m[6]*m[9]*m[15] + m[6]*m[13]*m[11] + m[7]*m[9]*m[14] - m[7]*m[13]*m[10];
		r[1] = -m[1]*m[10]*m[15] + m[1]*m[14]*m[11] + m[2]*m[9]*m[15] - m[2]*m[13]*m[11] - m[3]*m[9]*m[14] + m[3]*m[13]*m[10];
		r[2] = m[1]*m[6]*m[15] - m[1]*m[14]*m[7] - m[2]*m[5]*m[15] + m[2]*m[13]*m[7] + m[3]*m[5]*m[14] - m[3]*m[13]*m[6];
		r[3] = -m[1]*m[6]*m[11] + m[1]*m[10]*m[7] + m[2]*m[5]*m[11] - m[2]*m[9]*m[7] - m[3]*m[5]*m[10] + m[3]*m[9]*m[6];

		r[4] = -m[4]*m[10]*m[15] + m[4]*m[14]*m[11] + m[6]*m[8]*m[15] - m[6]*m[12]*m[11] - m[7]*m[8]*m[14] + m[7]*m[12]*m[10];
		r[5] = m[0]*m[10]*m[15] - m[0]*m[14]*m[11] - m[2]*m[8]*m[15] + m[2]*m[12]*m[11] + m[3]*m[8]*m[14] - m[3]*m[12]*m[10];
		r[6] = -m[0]*m[6]*m[15] + m[0]*m[14]*m[7] + m[2]*m[4]*m[15] - m[2]*m[12]*m[7] - m[3]*m[4]*m[14] + m[3]*m[12]*m[6];
		r[7] = m[0]*m[6]*m[11] - m[0]*m[10]*m[7] - m[2]*m[4]*m[11] + m[2]*m[8]*m[7] + m[3]*m[4]*m[10] - m[3]*m[8]*m[6];

		r[8] = m[4]*m[9]*m[15] - m[4]*m[13]*m[11] - m[5]*m[8]*m[15] + m[5]*m[12]*m[11] + m[7]*m[8]*m[13] - m[7]*m[12]*m[9];
		r[9] = -m[0]*m[9]*m[15] + m[0]*m[13]*m[11] + m[1]*m[8]*m[15] - m[1]*m[12]*m[11] - m[3]*m[8]*m[13] + m[3]*m[12]*m[9];
		r[10] = m[0]*m[5]*m[15] - m[0]*m[13]*m[7] - m[1]*m[4]*m[15] + m[1]*m[12]*m[7] + m[3]*m[4]*m[13] - m[3]*m[12]*m[5];
		r[11] = -m[0]*m[5]*m[11] + m[0]*m[9]*m[7] + m[1]*m[4]*m[11] - m[1]*m[8]*m[7] - m[3]*m[4]*m[9] + m[3]*m[8]*m[5];

		r[12] = -m[4]*m[9]*m[14] + m[4]*m[13]*m[10] + m[5]*m[8]*m[14] - m[5]*m[12]*m[10] - m[6]*m[8]*m[13] + m[6]*m[12]*m[9];
		r[13] = m[0]*m[9]*m[14] - m[0]*m[13]*m[10] - m[1]*m[8]*m[14] + m[1]*m[12]*m[10] + m[2]*m[8]*m[13] - m[2]*m[12]*m[9];
		r[14] = -m[0]*m[5]*m[14] + m[0]*m[13]*m[6] + m[1]*m[4]*m[14] - m[1]*m[12]*m[6] - m[2]*m[4]*m[13] + m[2]*m[12]*m[5];
		r[15] = m[0]*m[5]*m[10] - m[0]*m[9]*m[6] - m[1]*m[4]*m[10] + m[1]*m[8]*m[6] + m[2]*m[4]*m[9] - m[2]*m[8]*m[5];

		let det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
		for (let i = 0; i < 16; i++) r[i] /= det;

		return new Mat4(r);
	}

	transpose(): Mat4 {
		let m = this.data;
		return new Mat4([
			m[0], m[4], m[8], m[12], 
			m[1], m[5], m[9], m[13], 
			m[2], m[6], m[10], m[14], 
			m[3], m[7], m[11], m[15]
		]);
	}

	static translate(offset: Vec3): Mat4 {
		return new Mat4([
			1, 0, 0, offset.x, 
			0, 1, 0, offset.y, 
			0, 0, 1, offset.z, 
			0, 0, 0, 1
		]);
	}

	static scale(factor: number | Vec3): Mat4 {
		if (factor instanceof Vec3) {
			return new Mat4([
				factor.x, 0, 0, 0, 
				0, factor.y, 0, 0, 
				0, 0, factor.z, 0, 
				0, 0, 0, 1
			]);
		} else {
			return new Mat4([
				factor, 0, 0, 0, 
				0, factor, 0, 0, 
				0, 0, factor, 0, 
				0, 0, 0, 1
			]);
		}
	}

	static rotate(euler: Vec3): Mat4 {
		let X = new Mat4([
			1, 0, 0, 0, 
			0, Math.cos(euler.x), -Math.sin(euler.x), 0, 
			0, Math.sin(euler.x), Math.cos(euler.x), 0, 
			0, 0, 0, 1
		]);
		let Y = new Mat4([
			Math.cos(euler.y), 0, Math.sin(euler.y), 0, 
			0, 1, 0, 0, 
			-Math.sin(euler.y), 0, Math.cos(euler.y), 0, 
			0, 0, 0, 1
		]);
		let Z = new Mat4([
			Math.cos(euler.z), -Math.sin(euler.z), 0, 0, 
			Math.sin(euler.z), Math.cos(euler.z), 0, 0, 
			0, 0, 1, 0, 
			0, 0, 0, 1
		]);
		return X.mul(Y).mul(Z);
	}

	static trs(translation: Vec3 = new Vec3(), rotation: Vec3 = new Vec3(), scale: number | Vec3 = 1) {
		let T = Mat4.translate(translation);
		let R = Mat4.rotate(rotation);
		let S = Mat4.scale(scale);
		return T.mul(R).mul(S);
	}

}

