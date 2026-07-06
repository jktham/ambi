fn rnd(seed: f32) -> f32 {
	return fract(sin(seed) * 43758.5453123);
}

fn rndvec3(seed: f32) -> vec3f {
	return vec3f(
		rnd(seed + 0.0),
		rnd(seed + 1.0),
		rnd(seed + 2.0)
	);
}

fn rndvec4(seed: f32) -> vec4f {
	return vec4f(
		rnd(seed + 0.0),
		rnd(seed + 1.0),
		rnd(seed + 2.0),
		rnd(seed + 3.0)
	);
}

fn gold_noise(xy: vec2f, seed: f32) -> f32 {
	let PHI = 1.61803398874989484820459; 
	return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}
