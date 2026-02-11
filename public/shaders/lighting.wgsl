fn phong(color: vec4f, pos: vec3f, normal: vec3f, view_pos: vec3f, ambient_factor: f32, diffuse_factor: f32, specular_factor: f32, specular_exponent: f32, light_pos: vec3f, light_color: vec4f) -> vec4f {
	let norm = normalize(normal);
	let light_dir = normalize(light_pos - pos);
	let view_dir = normalize(view_pos - pos);
	let reflect_dir = reflect(-light_dir, norm);

	let ambient = ambient_factor;
	let diffuse = diffuse_factor * max(dot(norm, light_dir), 0.0);
	let specular = specular_factor * pow(max(dot(view_dir, reflect_dir), 0.0), specular_exponent);

	return color * vec4f(light_color.rgb * (ambient + diffuse + specular), 1.0);
}
