/// returns diffuse and specular (without exponent) factors
fn phong_factors(pos: vec3f, normal: vec3f, view_pos: vec3f, light_pos: vec3f) -> vec2f {
	let norm = normalize(normal);
	let light_dir = normalize(light_pos - pos);
	let view_dir = normalize(view_pos - pos);
	let reflect_dir = reflect(-light_dir, norm);

	let diffuse = max(dot(norm, light_dir), 0.0);
	let specular = max(dot(view_dir, reflect_dir), 0.0);

	return vec2f(diffuse, specular);
}

fn luminance(color: vec4f) -> f32 {
	return dot(color, vec4f(0.2126, 0.7152, 0.0722, 0.0));
}
