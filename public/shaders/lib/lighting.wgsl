struct PhongMaterial {
	ambient: vec3f,
	diffuse: vec3f,
	specular: vec3f,
	shininess: f32,
};

struct PointLight {
	pos: vec3f,
	diffuse: vec3f,
	specular: vec3f,
	falloff_constant: f32,
	falloff_linear: f32,
	falloff_exponential: f32,
};

struct PhongUniforms {
	material: PhongMaterial,
	light: PointLight,
}

/// returns diffuse and specular (without exponent) factors
fn phong_factors(pos: vec3f, normal: vec3f, view_pos: vec3f, light_pos: vec3f) -> vec2f {
	let norm = normalize(normal);
	let light_dir = normalize(light_pos - pos);
	let view_dir = normalize(view_pos - pos);
	let reflect_dir = reflect(-light_dir, norm);

	let diff = max(dot(norm, light_dir), 0.0);
	let spec = max(dot(view_dir, reflect_dir), 0.0);

	return vec2f(diff, spec);
}

/// returns attenuated lighting color, without transparency and texture
fn phong_color(pos: vec3f, normal: vec3f, view_pos: vec3f, material: PhongMaterial, light: PointLight) -> vec3f {
	let factors = phong_factors(pos, normal, view_pos, light.pos);
	let diff = factors.x;
	let spec = factors.y;

	let ambient = material.ambient;
	let diffuse = diff * material.diffuse;
	let specular = pow(spec, material.shininess) * material.specular;

	let d = length(pos - light.pos);
	let falloff = 1.0 / (light.falloff_constant + light.falloff_linear * d + light.falloff_exponential * d*d);

	let lighting = ambient + (diffuse * light.diffuse + specular * light.specular) * falloff;
	return lighting;
}

fn luminance(color: vec4f) -> f32 {
	return dot(color, vec4f(0.2126, 0.7152, 0.0722, 0.0));
}
