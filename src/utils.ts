import { Vec3, Vec4 } from "./vec";

export function rnd(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
}

// [min, max)
export function rndint(min: number, max: number): number {
    return Math.floor(rnd(min, max));
}

export function rndvec3(min: Vec3, max: Vec3): Vec3 {
    return new Vec3(
        rnd(min.x, max.x),
        rnd(min.y, max.y),
        rnd(min.z, max.z)
    );
}

export function rndvec4(min: Vec4, max: Vec4): Vec4 {
    return new Vec4(
        rnd(min.x, max.x),
        rnd(min.y, max.y),
        rnd(min.z, max.z),
        rnd(min.w, max.w)
    );
}

export function rndarr<T>(arr: T[]): T {
    return arr[rndint(0, arr.length)];
}

export function rndseed(seed: number, min: number = 0, max: number = 1): number {
	return Math.abs(Math.sin(seed) * 43758.5453123) % 1 * (max - min) + min;
}

export function swap(arr: any[], i: number, j: number) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}
