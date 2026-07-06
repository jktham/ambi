fn phong_factor(pos: vec3f, normal: vec3f, view_pos: vec3f, ambient_factor: f32, diffuse_factor: f32, specular_factor: f32, specular_exponent: f32, light_pos: vec3f) -> f32 {
	let norm = normalize(normal);
	let light_dir = normalize(light_pos - pos);
	let view_dir = normalize(view_pos - pos);
	let reflect_dir = reflect(-light_dir, norm);

	let ambient = ambient_factor;
	let diffuse = diffuse_factor * max(dot(norm, light_dir), 0.0);
	let specular = specular_factor * pow(max(dot(view_dir, reflect_dir), 0.0), specular_exponent);

	return ambient + diffuse + specular;
}

fn luminance(color: vec4f) -> f32 {
	return dot(color, vec4f(0.2126, 0.7152, 0.0722, 0.0));
}
