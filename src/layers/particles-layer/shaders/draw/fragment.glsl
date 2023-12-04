void main()
{   
    float d = 1.0 - distance(gl_PointCoord.xy, vec2(0.5));
    d = smoothstep(0.3, 1.0, d);
    gl_FragColor = vec4(1.0, 1.0, 1.0, d);
    // gl_FragColor = vec4(1.0, 1.0, 1.0, 0.2);
}