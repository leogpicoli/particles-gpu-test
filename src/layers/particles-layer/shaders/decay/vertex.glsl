varying vec2 v_TextureCoords;

void main()
{
    gl_Position = vec4(2.0 * position - 1.0, 1.0);

    v_TextureCoords = position.xy;
}