import { Engine } from "./engine";

async function main() {
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	const params = new URLSearchParams(window.location.search);

	const engine = new Engine(canvas);
	await engine.run(params.get("scene") || "debug");
}

main();
