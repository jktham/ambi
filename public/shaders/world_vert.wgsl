struct VertexIn {
	@location(0) pos: vec3f,
	@location(1) normal: vec3f,
	@location(2) color: vec4f,
	@location(3) uv: vec2f
};

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
	normal: mat4x4f
}

@group(0) @binding(0) var<uniform> du: DefaultUniforms;
@group(1) @binding(0) var<storage, read> vu: array<f32, 16>;
@group(2) @binding(0) var<storage, read> fu: array<f32, 16>;

@vertex 
fn main(in: VertexIn) -> VertexOut {
	let dontDiscard = vec2f(vu[0], fu[0]);
	switch (du.vertMode) {
		default: {
			return base(in);
		}
		case 0: { // base
			return base(in);
		}
	}
}

fn base(in: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.ndc = du.projection * du.view * du.model * vec4f(in.pos, 1.0);
	out.pos = (du.model * vec4f(in.pos, 1.0)).xyz;
	out.normal = (du.normal * vec4f(in.normal, 0.0)).xyz;
	out.color = in.color * du.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
