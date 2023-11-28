uniform sampler2D u_Screen;
uniform float u_Opacity;

varying vec2 v_TextureCoords;

void main() {
    vec4 color = texture2D(u_Screen, v_TextureCoords);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_Opacity) / 255.0);
}
