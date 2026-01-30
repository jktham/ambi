export function rnd(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
}

export function swap(arr: any[], i: number, j: number) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
}
