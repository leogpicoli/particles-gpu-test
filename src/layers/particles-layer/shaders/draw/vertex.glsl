#define R 6378137.0
#define PI 3.141592653589793
#define TO_DEG (180.0 / PI)
#define HALF 0.5
#define G (HALF / (PI * R))

attribute float a_ParticleIndex;
uniform float u_ParticlesRes;
uniform sampler2D u_ParticlesTexture;
uniform sampler2D u_Currents;

uniform vec3 u_MinCurrent;
uniform vec3 u_MaxCurrent;

uniform vec2 u_Resolution;
uniform float u_MapScale;
uniform vec2 u_MapPane;
uniform vec2 u_MapOrigin;
uniform vec2 u_SouthWestLimit;
uniform vec2 u_NorthEastLimit; 

vec2 remap(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
    vec2 t = (value - inMin) / (inMax - inMin);
    return mix(outMin, outMax, t);
}

float remap(float value, float inMin, float inMax, float outMin, float outMax) {
    float t = (value - inMin) / (inMax - inMin);
    return mix(outMin, outMax, t);
}

const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

vec2 texToLonLat(vec2 textureCoords) {
    vec2 pixelCoords = textureCoords * u_Resolution;
    vec2 point = pixelCoords - u_MapPane + u_MapOrigin;

    vec2 n = vec2(
        (point.x / u_MapScale - HALF) / G,
        (point.y / u_MapScale - HALF) / -G
    );

    float lat = (2.0 * atan(exp(n.y / R)) - PI / 2.0) * TO_DEG;
    float lon = (n.x / R) * TO_DEG;
    
    // Correction factor
    // lon -= lon / 200.0;

    return vec2(lon, lat);
}

bool isOutOfBounds(vec2 lonlat) {
    if (lonlat.x < u_SouthWestLimit.x) {
        return true;
    }
    if (lonlat.x > u_NorthEastLimit.x) {
        return true;
    }
    if (lonlat.y < u_SouthWestLimit.y) {
        return true;
    }
    if (lonlat.y > u_NorthEastLimit.y) {
        return true;
    }

    return false;
}

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

    vec2 lonLat = texToLonLat(vec2(pos_Particle.x, 1.0 - pos_Particle.y));

    vec2 currentTexCoords = remap(lonLat, u_SouthWestLimit, u_NorthEastLimit, vec2(0.0), vec2(1.0));
    vec4 cCurrent = texture2D(u_Currents, currentTexCoords);
    vec2 current = mix(u_MinCurrent.xy, u_MaxCurrent.xy, cCurrent.rg);

    if (cCurrent.a < 1.0)
        return;

    pos_Particle = 2.0 * (pos_Particle - 0.5);

    float currentIntensity = length(current);
    // gl_PointSize = remap(currentIntensity, 0.0, u_MaxCurrent.z, 1.0, 2.5);
    // gl_PointSize = 1.0 + 1.5 * smoothstep(0.0, 0.1, currentIntensity);
    gl_PointSize = 2.0;
    gl_Position = vec4(pos_Particle, 0.0, 1.0);
}