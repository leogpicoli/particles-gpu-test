

void main()
{   

    vec2 uv = gl_PointCoord.xy;
    float d = 2.0 * distance(vec2(0.5), uv);
    float isInside = smoothstep(1.0, 0.6, d);
    if (isInside <= 0.){
      discard;
    }

    float alpha = 1.0;//min(isInside, 0.5);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}