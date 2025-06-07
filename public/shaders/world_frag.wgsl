struct VertexOut {
	@builtin(position) pos: vec4f,
	@location(0) normal: vec3f,
	@location(1) color: vec4f,
	@location(2) uv: vec2f
};

struct DefaultUniforms {
	time: f32,
	frame: f32,
	vertMode: f32,
	fragMode: f32,
	color: vec4f,
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f,
}

@group(0) @binding(0) var<uniform> du: DefaultUniforms;
@group(1) @binding(0) var<storage, read> vu: array<f32, 16>;
@group(2) @binding(0) var<storage, read> fu: array<f32, 16>;

@group(3) @binding(0) var textureSampler: sampler;
@group(3) @binding(1) var texture: texture_2d<f32>;

@fragment 
fn fs(in: VertexOut) -> @location(0) vec4f {
	let dontDiscard = vec2f(vu[0], fu[0]);
	return in.color * textureSample(texture, textureSampler, in.uv);
}