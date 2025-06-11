struct FragmentIn {
	@builtin(position) screen: vec4f,
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

struct FragmentOut {
	@location(0) color: vec4f,
	@location(1) posDepth: vec4f,
	@location(2) normalMask: vec4f
}

struct FbData {
	color: vec4f,
	pos: vec3f,
	depth: f32,
	normal: vec3f,
	mask: u32,
}

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
@group(0) @binding(1) var<storage, read> vu: array<f32, 16>;
@group(0) @binding(2) var<storage, read> fu: array<f32, 16>;

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	_ = vec2f(vu[0], fu[0]);

	switch (du.fragMode) {
		default: {
			var data: FbData;
			data.color = in.color;
			data.pos = in.pos;
			data.depth = length(du.viewPos - in.pos);
			data.normal = in.normal;
			data.mask = 0;
			return encodeFbData(data);
		}
		case 0: { // phong
			var data: FbData;
			data.color = phong(in) * textureSample(texture, textureSampler, in.uv);
			data.pos = in.pos;
			data.depth = length(du.viewPos - in.pos);
			data.normal = in.normal;
			data.mask = 0;
			return encodeFbData(data);
		}
	}
}

fn phong(in: FragmentIn) -> vec4f {
	let norm = normalize(in.normal);
	let lightDir = normalize(du.lightPos - in.pos);
	let viewDir = normalize(du.viewPos - in.pos);
	let reflectDir = reflect(-lightDir, norm);

	let ambient = du.ambientFactor;
	let diffuse = du.diffuseFactor * max(dot(norm, lightDir), 0.0);
	let specular = du.specularFactor * pow(max(dot(viewDir, reflectDir), 0.0), du.specularExponent);

	return in.color * du.lightColor * (ambient + diffuse + specular);
}

fn encodeFbData(data: FbData) -> FragmentOut {
	var out: FragmentOut;
	out.color = data.color;
	out.posDepth = vec4f(data.pos, data.depth);
	out.normalMask = vec4f(data.normal, f32(data.mask) / 255.0);
	return out;
}
