#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color0: texture_2d<f32>;
@group(1) @binding(2) var t_color1: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	if (u_base.frame % 2 == 0) {
		data.color = in.color * textureSample(t_color0, t_sampler, in.uv);
	} else {
		data.color = in.color * textureSample(t_color1, t_sampler, in.uv);
	}
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);
	return encodeFbData(data);
}
