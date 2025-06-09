struct VertexOut {
	@builtin(position) ndc: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct DefaultUniforms {
	time: f32,
	frame: i32,
	vertMode: i32,
	fragMode: i32,
	ambientFactor: f32,
	diffuseFactor: f32,
	specularFactor: f32,
	specularExponent: f32,
	lightPos: vec3f,
	lightColor: vec4f,
	viewPos: vec3f,
	color: vec4f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
	normal: mat3x3f
}

@group(0) @binding(0) var<uniform> du: DefaultUniforms;
@group(1) @binding(0) var<storage, read> vu: array<f32, 16>;
@group(2) @binding(0) var<storage, read> fu: array<f32, 16>;

@group(3) @binding(0) var textureSampler: sampler;
@group(3) @binding(1) var texture: texture_2d<f32>;

@fragment 
fn main(in: VertexOut) -> @location(0) vec4f {
	let dontDiscard = vec2f(vu[0], fu[0]);
	switch (du.fragMode) {
		default: {
			return in.color;
		}
		case 0: { // phong
			return phong(in) * textureSample(texture, textureSampler, in.uv);
		}
	}
}

fn phong(in: VertexOut) -> vec4f {
	let norm = normalize(in.normal);
	let lightDir = normalize(du.lightPos - in.pos);
	let viewDir = normalize(du.viewPos - in.pos);
	let reflectDir = reflect(-lightDir, norm);

	let ambient = du.ambientFactor;
	let diffuse = du.diffuseFactor * max(dot(norm, lightDir), 0.0);
	let specular = du.specularFactor * pow(max(dot(viewDir, reflectDir), 0.0), du.specularExponent);

	return in.color * du.lightColor * (ambient + diffuse + specular);
}
