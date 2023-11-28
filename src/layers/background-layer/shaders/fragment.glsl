// Defined by the L.BackgroundLayer.js dinamically 
// #define COLORS_LENGTH 1

#define R 6378137.0
#define PI 3.141592653589793
#define TO_DEG (180.0 / PI)
#define HALF 0.5
#define G (HALF / (PI * R))

struct TextureColor {
    float m;
    vec3 color;
};

varying vec2 vUvs;

uniform sampler2D currents;
uniform float time;
uniform float scale;

uniform vec2 southWestLimit;
uniform vec2 northEastLimit; 
uniform vec2 mapPane;
uniform vec2 mapOrigin;
uniform vec2 resolution;
uniform vec2 minCurrent;
uniform vec2 maxCurrent;

uniform bool readFromTexture;
uniform vec3 defaultColor;

uniform TextureColor textureColors [COLORS_LENGTH];

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

vec2 pixelToLonLat(vec2 pixelCoords) {
    vec2 point = pixelCoords - mapPane + mapOrigin;

    vec2 n = vec2(
        (point.x / scale - HALF) / G,
        (point.y / scale - HALF) / -G
    );

    float lat = (2.0 * atan(exp(n.y / R)) - PI / 2.0) * TO_DEG;
    float lon = (n.x / R) * TO_DEG;
    
    // Correction factor
    // lon -= lon / 200.0;

    return vec2(lon, lat);
}

bool isOutOfBounds(vec2 lonlat) {
    if (lonlat.x < southWestLimit.x) {
        return true;
    }
    if (lonlat.x > northEastLimit.x) {
        return true;
    }
    if (lonlat.y < southWestLimit.y) {
        return true;
    }
    if (lonlat.y > northEastLimit.y) {
        return true;
    }

    return false;
}

vec4 colour_ocean = vec4(64.0, 77.0, 144.0, 255.0) / 255.0;

void main(void) {
    if (!readFromTexture) {
        gl_FragColor = vec4(defaultColor / 255.0, 1.0);
        return;
    }

    vec2 uvs = vec2(vUvs.x, 1.0 - vUvs.y);
    vec2 pixelCoords = uvs * resolution;
    vec2 lonLatCoords = pixelToLonLat(pixelCoords);

    if (isOutOfBounds(lonLatCoords)) {
        gl_FragColor = colour_ocean;
        return;
    }
    
    uvs = vec2(
        remap(lonLatCoords.x, southWestLimit.x, northEastLimit.x, 0.0, 1.0),
        remap(lonLatCoords.y, southWestLimit.y, northEastLimit.y, 0.0, 1.0)
    );
  
    vec4 currentsSample = texture2D(currents, uvs);
    vec2 speed = mix(minCurrent, maxCurrent, currentsSample.rg); 
    float m = distance(speed, vec2(0.0)) * 1.4;

    if (currentsSample.a == 0.0) {
        gl_FragColor = colour_ocean;
        return;
    }

    vec3 colour = vec3(0.0);

    for (int i = 1;i < COLORS_LENGTH;i += 1) {
        TextureColor prevText = textureColors[i-1];
        TextureColor text = textureColors[i];

        if (m <= text.m) {
            colour = mix(prevText.color, text.color, remap(m, prevText.m, text.m, 0.0, 1.0));
            break; 
        }
    }

    gl_FragColor = vec4(colour / 255.0, 1.0);
}
