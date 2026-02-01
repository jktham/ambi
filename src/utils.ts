import { Vec3 } from "./vec";

export function rnd(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
}

// [min, max)
export function rndint(min: number, max: number): number {
    return Math.floor(rnd(min, max));
}

export function rndvec(min: Vec3, max: Vec3): Vec3 {
    return new Vec3(
        rnd(min.x, max.x),
        rnd(min.y, max.y),
        rnd(min.z, max.z)
    );
}

export function swap(arr: any[], i: number, j: number) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}
