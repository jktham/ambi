import { Bbox } from "./bbox";
import type { Assets } from "./assets";
import type { Entity } from "./entity";
import {  Vec3 } from "./vec";

type Collision = {
    position: Vec3,
    velocity: Vec3,
    intersect: Vec3,
    dist: number,
    normal: Vec3,
};

/** holds collider data */
export class Collisions {
	private assets: Assets;

	private entities: Entity[] = [];
	private colliders: Map<string, Vec3[][]> = new Map();

	constructor(assets: Assets) {
		this.assets = assets;
	}

	/** load collision data (concrete vertices) from scene entities */
	async loadColliders(entities: Entity[]) {
		this.entities = entities;
		for (let object of this.entities) {
			if (object.collider && !this.colliders.has(object.collider)) {
				const collider = await this.assets.loadCollider(object.collider);
				this.colliders.set(object.collider, collider);
			}
		}
	}

	/** apply collisions to desired player velocity */
	applyCollisions(position: Vec3, velocity: Vec3, iterations: number): Vec3 {
		let collisions = this.getCollisions(position, velocity);
		collisions.sort((a, b) => a.dist - b.dist);

		for (let c of collisions) {
			if (velocity.dot(c.normal) > 0) {
				c.normal = c.normal.mul(-1);
			}
			position = position.add(velocity.normalize().mul(c.dist));
			position = position.add(c.normal.mul(0.01));
			let remainder = velocity.normalize().mul(Math.max(0.0, velocity.length()-c.dist));
			let reflected = remainder.sub(c.normal.mul(remainder.dot(c.normal)));

			if (reflected.length() > 0.0 && iterations > 0) {
				return this.applyCollisions(position, reflected, iterations-1);
			}

			return position;
		}

		return position.add(velocity);
	}

	private getCollisions(position: Vec3, velocity: Vec3): Collision[] {
		let collisions: Collision[] = [];
		let cameraBbox = new Bbox([position.sub(velocity.length()*2), position.add(velocity.length()*2)]);

		for (let object of this.entities) {
			if (object.collider && object.collidable) {
				if (object.bbox) {
					if (!object.bbox.intersectsBbox(cameraBbox)) continue;
				}

				let collider = this.colliders.get(object.collider);
				if (collider) {
					let transformed = collider.map(face => face.map(vert => object.model.transform(vert)));
					
					for (let face of transformed) {
						let [v0, v1, v2] = face;
						let u = v1.sub(v0);
						let v = v2.sub(v0);
						let normal = u.cross(v).normalize();

						let dist = v0.sub(position).dot(normal) / velocity.normalize().dot(normal);
						if (isNaN(dist)) dist = -1;
						let intersect = position.add(velocity.normalize().mul(dist));

						if (dist >= 0.0 && dist <= velocity.length()) {
							let signs = [0, 0, 0];
							for (let i=0; i<3; i++) {
								let p = intersect.sub(face[i]);
								let u = face[(i+1) % 3].sub(face[i]);
								let v = face[(i+2) % 3].sub(face[i]);
								let s = p.cross(u).dot(p.cross(v));
								signs[i] = s;
							}
							if (signs.every(s => s < 0)) {
								let c: Collision = {
									position: position,
									velocity: velocity,
									intersect: intersect,
									dist: dist,
									normal: normal,
								};
								collisions.push(c);
							}
						}
					}
				}
			}
		}

		return collisions;
	}
}
