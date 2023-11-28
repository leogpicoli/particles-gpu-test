attribute float a_ParticleIndex;
uniform float u_ParticlesRes;
uniform sampler2D u_ParticlesTexture;

void main()
{
    vec2 uv_Particle = vec2(
        fract(a_ParticleIndex / u_ParticlesRes),
        floor(a_ParticleIndex / u_ParticlesRes) / u_ParticlesRes
    );

    vec4 c_Particle = texture2D(u_ParticlesTexture, uv_Particle);

    vec2 pos_Particle = vec2(
        c_Particle.r / 255.0 + c_Particle.b,
        c_Particle.g / 255.0 + c_Particle.a
    );

    pos_Particle = 2.0 * (pos_Particle - 0.5);
 
    gl_PointSize = 1.0;
    gl_Position = vec4(pos_Particle, 0.0, 1.0);
}