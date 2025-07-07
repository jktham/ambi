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
		phong.lightColor = new Vec4(1.0, 0.2, 0.2, 1);
		phong.specularFactor = 0.0;

		const size = 11;
		const scale = 1.0;
		let tiles = getTiles();
		let cells = generateCells(size, tiles);

		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let tile = cells[i][j].candidates[0];
				if (!tile) continue;

				let obj = new WorldObject();
				obj.model = Mat4.trs(new Vec3(i - Math.floor(size/2), 0.0, j - Math.floor(size/2)).mul(scale), new Vec3(0, tile.rotation*Math.PI/2.0, 0), scale / 10.0);
				obj.mesh = tile.mesh;
				obj.fragShader = "world/phong.frag.wgsl";
				obj.fragUniforms = phong;
				this.worldObjects.push(obj);
			}
		}

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

type Tile = {
	mesh: string;
	rotation: number; // 0-3
	constraints: number[]; // NESW
	weight: number;
}

type Cell = {
	candidates: Tile[];
}

function getTiles(): Tile[] {
	let tiles: Tile[] = [];

	for (let r of [0, 1, 2, 3]) {
		let t: Tile = {
			mesh: "brutal/tiles/path_straight.obj",
			rotation: r,
			constraints: [1, 0, 1, 0],
			weight: 1.5
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_cross.obj",
			rotation: r,
			constraints: [1, 1, 1, 1],
			weight: 1
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_fork.obj",
			rotation: r,
			constraints: [0, 1, 1, 1],
			weight: 1
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_end.obj",
			rotation: r,
			constraints: [0, 0, 1, 0],
			weight: 1
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_turn.obj",
			rotation: r,
			constraints: [0, 1, 1, 0],
			weight: 2
		};
		tiles.push(t);
	}

	return tiles;
}

function generateCells(size: number, tiles: Tile[]): Cell[][] {
	let cells: Cell[][] = new Array(size).fill([]).map(() => new Array(size));

	for (let i=0; i<size; i++) {
		for (let j=0; j<size; j++) {
			let c: Cell = {
				candidates: tiles
			};
			cells[i][j] = c;
		}
	}

	let maxEntropy = 0;
	let iterations = 0;
	while (maxEntropy != 1 && iterations < 1000) {
		iterations++;

		maxEntropy = 1;
		let minEntropy = Infinity;
		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let entropy = cells[i][j].candidates.length;
				maxEntropy = Math.max(maxEntropy, entropy);
				if (entropy > 1) minEntropy = Math.min(minEntropy, entropy);
			}
		}

		let minCoords: [number, number][] = [];
		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let entropy = cells[i][j].candidates.length;
				if (entropy == minEntropy) {
					minCoords.push([i, j]);
				}
			}
		}

		if (minCoords.length > 0) {
			let collapseCoords = minCoords[Math.floor(Math.random() * minCoords.length)];
			let collapseCell = cells[collapseCoords[0]][collapseCoords[1]];

			let weightedRandom = collapseCell.candidates.map((t) => Math.random() * t.weight);
			let choice = weightedRandom.indexOf(Math.max(...weightedRandom));
			collapseCell.candidates = [collapseCell.candidates[choice]];

			let neighbors: (Cell|undefined)[] = [
				collapseCoords[1]-1 >= 0 ? cells[collapseCoords[0]][collapseCoords[1]-1] : undefined, // N
				collapseCoords[0]+1 < size ? cells[collapseCoords[0]+1][collapseCoords[1]] : undefined, // E
				collapseCoords[1]+1 < size ? cells[collapseCoords[0]][collapseCoords[1]+1] : undefined, // S
				collapseCoords[0]-1 >= 0 ? cells[collapseCoords[0]-1][collapseCoords[1]] : undefined, // W
			];
			for (let i=0; i<4; i++) {
				let n = neighbors[i];
				let c = collapseCell.candidates[0];
				if (!n) continue;

				n.candidates = n.candidates.filter((t) => t.constraints[(i + t.rotation + 2) % 4] == c.constraints[(i + c.rotation) % 4]);
			}
		}
	}

	return cells;
}
