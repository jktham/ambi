import { lerp } from "./utils";

export class Vec2 {
	data: number[];
	size: number = 2;

	/** defaults to zero vector */
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
	
	dist(op: Vec2): number {
		return this.sub(op).length();
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2);
	}

	normalize(): Vec2 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}

	negate(): Vec2 {
		return this.mul(-1);
	}

	copy(): Vec2 {
		return new Vec2(...this.data);
	}

	static splat(v: number): Vec2 {
		return new Vec2(v, v);
	}

	static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
		return new Vec2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
	}
}

export class Vec3 {
	data: number[];
	size: number = 3;

	/** defaults to zero vector */
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
	
	dist(op: Vec3): number {
		return this.sub(op).length();
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
	}

	normalize(): Vec3 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}

	negate(): Vec3 {
		return this.mul(-1);
	}

	copy(): Vec3 {
		return new Vec3(...this.data);
	}

	static splat(v: number): Vec3 {
		return new Vec3(v, v, v);
	}

	static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
		return new Vec3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
	}
}

export class Vec4 {
	data: number[];
	size: number = 4;

	/** defaults to zero vector */
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
	
	dist(op: Vec4): number {
		return this.sub(op).length();
	}

	length(): number {
		return Math.sqrt(this.x**2 + this.y**2 + this.z**2 + this.w**2);
	}

	normalize(): Vec4 {
		let len = this.length();
		if (len == 0) { return this };
		return this.mul(1/len);
	}

	negate(): Vec4 {
		return this.mul(-1);
	}

	copy(): Vec4 {
		return new Vec4(...this.data);
	}

	static splat(v: number): Vec4 {
		return new Vec4(v, v, v, v);
	}

	static lerp(a: Vec4, b: Vec4, t: number): Vec4 {
		return new Vec4(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t), lerp(a.w, b.w, t));
	}
}

/** right handed, +y up, -z forward */
export class Mat4 {
	data: number[];
	size: number = 16;

	/** defaults to identity matrix */
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
			return new Mat4([ // unrolled for performance
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

	/** returns transformed (x, y, z, 1) vector */
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

	/** transformed zero vector */
	origin(): Vec3 {
		return this.transform(new Vec3(0, 0, 0));
	}

	/** basis vectors of linear transform component */
	basis(): [Vec3, Vec3, Vec3] {
		let m = this.data;
		let x = new Vec3(m[0], m[4], m[8]);
		let y = new Vec3(m[1], m[5], m[9]);
		let z = new Vec3(m[2], m[6], m[10]);
		return [x, y, z];
	}

	/** decompose matrix into translation, intrinsic (XYZ) rotation (xyz rad), scale (unsigned) */
	decompose(): [Vec3, Vec3, Vec3] {
		let m = this.data;
		let translation = new Vec3(m[3], m[7], m[11]);

		let [x, y, z] = this.basis();
		let scale = new Vec3(
			x.length(),
			y.length(),
			z.length(),
		);

		x = x.div(scale.x);
		y = y.div(scale.y);
		z = z.div(scale.z);
		let rotation = new Vec3( // https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix
			Math.atan2(-z.y, z.z),
			Math.asin(z.x),
			Math.atan2(-y.x, x.x),
		);

		// gimbal lock
		let eps = 1e-6;
		if (Math.sin(rotation.y) > 1 - eps) {
			rotation.z = 0;
			rotation.x = Math.atan2(x.y, y.y);
		}
		if (Math.sin(rotation.y) < -1 + eps) {
			rotation.z = 0;
			rotation.x = Math.atan2(-x.y, y.y);
		}

		return [translation, rotation, scale];
	}

	copy(): Mat4 {
		return new Mat4([...this.data]);
	}

	/** create translation matrix */
	static translate(t: Vec3): Mat4 {
		return new Mat4([
			1, 0, 0, t.x, 
			0, 1, 0, t.y, 
			0, 0, 1, t.z, 
			0, 0, 0, 1
		]);
	}

	/** create scaling matrix */
	static scale(s: number | Vec3): Mat4 {
		if (s instanceof Vec3) {
			return new Mat4([
				s.x, 0, 0, 0, 
				0, s.y, 0, 0, 
				0, 0, s.z, 0, 
				0, 0, 0, 1
			]);
		} else {
			return new Mat4([
				s, 0, 0, 0, 
				0, s, 0, 0, 
				0, 0, s, 0, 
				0, 0, 0, 1
			]);
		}
	}

	static rotateX(r: number): Mat4 {
		return new Mat4([
			1, 0, 0, 0,
			0, Math.cos(r), -Math.sin(r), 0,
			0, Math.sin(r), Math.cos(r), 0,
			0, 0, 0, 1,
		]);
	}

	static rotateY(r: number): Mat4 {
		return new Mat4([
			Math.cos(r), 0, Math.sin(r), 0,
			0, 1, 0, 0,
			-Math.sin(r), 0, Math.cos(r), 0,
			0, 0, 0, 1,
		]);
	}

	static rotateZ(r: number): Mat4 {
		return new Mat4([
			Math.cos(r), -Math.sin(r), 0, 0,
			Math.sin(r), Math.cos(r), 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
		]);
	}

	/** create intrinsic (XYZ) rotation matrix from xyz rad */
	static rotateIntrinsic(r: Vec3): Mat4 {
		let [X, Y, Z] = [Mat4.rotateX(r.x), Mat4.rotateY(r.y), Mat4.rotateZ(r.z)];
		return X.mul(Y.mul(Z)); // XYZ https://en.wikipedia.org/wiki/Rotation_matrix#General_3D_rotations
	}

	/** create extrinsic (ZYX) rotation matrix from xyz rad */
	static rotateExtrinsic(r: Vec3): Mat4 {
		let [X, Y, Z] = [Mat4.rotateX(r.x), Mat4.rotateY(r.y), Mat4.rotateZ(r.z)];
		return Z.mul(Y.mul(X)); // ZYX https://en.wikipedia.org/wiki/Rotation_matrix#General_3D_rotations
	}

	/** create heading (YXZ) rotation matrix from xyz rad (pitch, yaw, roll) */
	static rotateHeading(r: Vec3): Mat4 {
		let [X, Y, Z] = [Mat4.rotateX(r.x), Mat4.rotateY(r.y), Mat4.rotateZ(r.z)];
		return Y.mul(X.mul(Z)); // yaw-pitch-roll https://en.wikipedia.org/wiki/Davenport_chained_rotations#Tait%E2%80%93Bryan_chained_rotations
	}

	/** create rotation matrix looking at target from eye (-z towards target), up_dir defaults to +y */
	static rotateLookAt(eye: Vec3, target: Vec3, up_dir: Vec3 = new Vec3(0, 1, 0)): Mat4 {
		let front = target.sub(eye).normalize().negate();
		let right = up_dir.cross(front).normalize();
		let up = front.cross(right).normalize();

		// right handed, no translation
		return Mat4.changeOfBasis(right, up, front);
	}

	/** create transformation matrix from translation, intrinsic (XYZ) rotation (xyz rad) and scale */
	static trs(translation: Vec3 = new Vec3(), rotation: Vec3 = new Vec3(), scale: number | Vec3 = 1): Mat4 {
		let T = Mat4.translate(translation);
		let R = Mat4.rotateIntrinsic(rotation);
		let S = Mat4.scale(scale);
		return T.mul(R.mul(S)); // TRS
	}

	/** create linear transformation matrix from xyz basis vectors */
	static changeOfBasis(x: Vec3, y: Vec3, z: Vec3): Mat4 {
		return new Mat4([
			x.x, y.x, z.x, 0,
			x.y, y.y, z.y, 0,
			x.z, y.z, z.z, 0,
			0, 0, 0, 1
		]);
	}

}

