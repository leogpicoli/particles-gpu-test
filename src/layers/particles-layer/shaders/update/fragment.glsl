#define R 6378137.0
#define PI 3.141592653589793
#define TO_DEG (180.0 / PI)
#define HALF 0.5
#define G (HALF / (PI * R))

uniform sampler2D u_ParticlesTexture;
uniform sampler2D u_Currents;
uniform vec2 u_MinCurrent;
uniform vec2 u_MaxCurrent;
uniform float u_RandomSeed;

uniform vec2 u_Resolution;
uniform float u_MapScale;
uniform vec2 u_MapPane;
uniform vec2 u_MapOrigin;
uniform vec2 u_SouthWestLimit;
uniform vec2 u_NorthEastLimit; 

varying vec2 v_TextureCoords;

vec2 remap(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
    vec2 t = (value - inMin) / (inMax - inMin);
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

vec2 getParticleCoords(vec2 tCoords) {
    vec4 colorParticle = texture2D(u_ParticlesTexture, tCoords);

    return vec2(
        colorParticle.r / 255.0 + colorParticle.b,
        colorParticle.g / 255.0 + colorParticle.a
    );
}

float u_SpeedFactor = 0.0005;
float u_DropRate = 0.003;
float u_DropRateBump = 0.01;

void main()
{
    // v_Position holds the uv coords of the particles texture
    vec2 pCoords = getParticleCoords(v_TextureCoords);

    vec2 lonLat = texToLonLat(vec2(pCoords.x, 1.0 - pCoords.y));

    vec2 currentTexCoords = remap(lonLat, u_SouthWestLimit, u_NorthEastLimit, vec2(0.0), vec2(1.0));
    vec4 cCurrent = texture2D(u_Currents, currentTexCoords);
    vec2 current = mix(u_MinCurrent, u_MaxCurrent, cCurrent.rg);

    vec2 pOffset = vec2(current.x, current.y) * u_SpeedFactor;

    pCoords = fract(1.0 + pCoords + pOffset);

    vec2 pSeed = (pCoords + v_TextureCoords) * u_RandomSeed;

    float pSpeed = length(current) / length(u_MaxCurrent);
    float dropRate = u_DropRate + pSpeed * u_DropRateBump;
    float drop = step(1.0 - dropRate, rand(pSeed));

    vec2 randomPos = vec2(
        rand(pSeed + 1.3),
        rand(pSeed + 2.1)
    );

    pCoords = mix(pCoords, randomPos, drop);
    pCoords = mix(pCoords, randomPos, 1.0 - cCurrent.a);

    if (isOutOfBounds(lonLat))
        pCoords = randomPos;

    gl_FragColor = vec4(
        fract(pCoords * 255.0),
        floor(pCoords * 255.0) / 255.0);
}