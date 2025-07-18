export class Vec2 {
	public data: number[];

	constructor(x: number = 0, y: number = 0) {
		this.data = [x, y];
	}

	public get x(): number {return this.data[0]};
	public get y(): number {return this.data[1]};
	public set x(value: number) {this.data[0] = value};
	public set y(value: number) {this.data[1] = value};

	public add(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(...this.data.map((v, i) => v + op.data[i]));
		} else {
			return new Vec2(...this.data.map(v => v + op));
		}
	}

	public sub(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(...this.data.map((v, i) => v - op.data[i]));
		} else {
			return new Vec2(...this.data.map(v => v - op));
		}
	}

	public mul(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(...this.data.map((v, i) => v * op.data[i]));
		} else {
			return new Vec2(...this.data.map(v => v * op));
		}
	}

	public div(op: number | Vec2): Vec2 {
		if (op instanceof Vec2) {
			return new Vec2(...this.data.map((v, i) => v / op.data[i]));
		} else {
			return new Vec2(...this.data.map(v => v / op));
		}
	}

	public dot(op: Vec2): number {
		return this.data.map((v, i) => v * op.data[i]).reduce((sum, v) => sum + v, 0);
	}

	public length(): number {
		return Math.sqrt(this.data.map(v => v**2).reduce((sum, v) => sum + v, 0));
	}

	public normalize(): Vec2 {
		return this.mul(1/this.length());
	}
}

export class Vec3 {
	public data: number[];

	constructor(x: number = 0, y: number = 0, z: number = 0) {
		this.data = [x, y, z];
	}

	public get x(): number {return this.data[0]};
	public get y(): number {return this.data[1]};
	public get z(): number {return this.data[2]};
	public set x(value: number) {this.data[0] = value};
	public set y(value: number) {this.data[1] = value};
	public set z(value: number) {this.data[2] = value};

	public add(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(...this.data.map((v, i) => v + op.data[i]));
		} else {
			return new Vec3(...this.data.map(v => v + op));
		}
	}

	public sub(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(...this.data.map((v, i) => v - op.data[i]));
		} else {
			return new Vec3(...this.data.map(v => v - op));
		}
	}

	public mul(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(...this.data.map((v, i) => v * op.data[i]));
		} else {
			return new Vec3(...this.data.map(v => v * op));
		}
	}

	public div(op: number | Vec3): Vec3 {
		if (op instanceof Vec3) {
			return new Vec3(...this.data.map((v, i) => v / op.data[i]));
		} else {
			return new Vec3(...this.data.map(v => v / op));
		}
	}

	public dot(op: Vec3): number {
		return this.data.map((v, i) => v * op.data[i]).reduce((sum, v) => sum + v, 0);
	}
	
	public cross(op: Vec3): Vec3 {
		return new Vec3(
			this.y * op.z - this.z * op.y, 
			this.z * op.x - this.x * op.z, 
			this.x * op.y - this.y * op.x
		);
	}

	public length(): number {
		return Math.sqrt(this.data.map(v => v**2).reduce((sum, v) => sum + v, 0));
	}

	public normalize(): Vec3 {
		if (this.length() == 0) { return this };
		return this.mul(1/this.length());
	}
}

export class Vec4 {
	public data: number[];

	constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
		this.data = [x, y, z, w];
	}

	public get x(): number {return this.data[0]};
	public get y(): number {return this.data[1]};
	public get z(): number {return this.data[2]};
	public get w(): number {return this.data[3]};
	public set x(value: number) {this.data[0] = value};
	public set y(value: number) {this.data[1] = value};
	public set z(value: number) {this.data[2] = value};
	public set w(value: number) {this.data[3] = value};

	public add(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(...this.data.map((v, i) => v + op.data[i]));
		} else {
			return new Vec4(...this.data.map(v => v + op));
		}
	}

	public sub(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(...this.data.map((v, i) => v - op.data[i]));
		} else {
			return new Vec4(...this.data.map(v => v - op));
		}
	}

	public mul(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(...this.data.map((v, i) => v * op.data[i]));
		} else {
			return new Vec4(...this.data.map(v => v * op));
		}
	}

	public div(op: number | Vec4): Vec4 {
		if (op instanceof Vec4) {
			return new Vec4(...this.data.map((v, i) => v / op.data[i]));
		} else {
			return new Vec4(...this.data.map(v => v / op));
		}
	}

	public dot(op: Vec4): number {
		return this.data.map((v, i) => v * op.data[i]).reduce((sum, v) => sum + v, 0);
	}

	public length(): number {
		return Math.sqrt(this.data.map(v => v**2).reduce((sum, v) => sum + v, 0));
	}

	public normalize(): Vec4 {
		return this.mul(1/this.length());
	}
}

export class Mat4 {
	public data: number[];

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

	public mul(op: number | Mat4): Mat4 {
		if (op instanceof Mat4) {
			let result: number[] = new Array(16).fill(0);
			for(let k=0; k<=12; k+=4){
				for(let i=0; i<4; i++){
					for (let j=0, b=0; j<4; j++, b+=4){
						result[k+i] += this.data[k+j] * op.data[b+i];
					}
				}
			}
			return new Mat4(result);
		} else {
			return new Mat4([...this.data].map((v) => v * op));
		}
	}

	public transform(op: Vec3): Vec3 {
		return new Vec3(
			this.data[0] * op.x + this.data[1] * op.y + this.data[2] * op.z + this.data[3] * 1,
			this.data[4] * op.x + this.data[5] * op.y + this.data[6] * op.z + this.data[7] * 1,
			this.data[8] * op.x + this.data[9] * op.y + this.data[10] * op.z + this.data[11] * 1,
		);
	}

	public inverse(): Mat4 {
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

	public transpose(): Mat4 {
		let m = this.data;
		return new Mat4([
			m[0], m[4], m[8], m[12], 
			m[1], m[5], m[9], m[13], 
			m[2], m[6], m[10], m[14], 
			m[3], m[7], m[11], m[15]
		]);
	}

	public static translate(offset: Vec3): Mat4 {
		return new Mat4([
			1, 0, 0, offset.x, 
			0, 1, 0, offset.y, 
			0, 0, 1, offset.z, 
			0, 0, 0, 1
		]);
	}

	public static scale(factor: number | Vec3): Mat4 {
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

	public static rotate(euler: Vec3): Mat4 {
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

	public static trs(translation: Vec3 = new Vec3(), rotation: Vec3 = new Vec3(), scale: number | Vec3 = 1) {
		let T = Mat4.translate(translation);
		let R = Mat4.rotate(rotation);
		let S = Mat4.scale(scale);
		return T.mul(R).mul(S);
	}

}

