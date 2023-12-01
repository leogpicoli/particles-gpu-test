uniform sampler2D u_Screen;
uniform vec2 u_resolution;
varying vec2 v_TextureCoords;

void main() {
    vec4 color = texture2D(u_Screen, v_TextureCoords);
    if (color.a < 0.05){
      gl_FragColor = vec4(0., 0., 0., 0.);
      return;
      //discard;
    }

    // fetch a patch around v_TextureCoords to get the distance to border
    float distanceToBorder = 4.;
    for (float x = -4.0; x <= 4.0; x+=1.0){
      for (float y = -4.0; y <= 4.0; y+=1.0){
        vec2 dxy = vec2(x, y);
        vec2 duv = dxy / u_resolution;
        vec4 colorNeighboor = texture2D(u_Screen, v_TextureCoords + duv);
        float isNeighboorInside = step(0.01, colorNeighboor.r);
        float distanceNeighboor = length(dxy);
        distanceToBorder = mix(min(distanceToBorder, distanceNeighboor), distanceToBorder, isNeighboorInside);
      }
    }
    /*if (distanceToBorder < 4.0){
      discard;
    }*/

    // we delay the application of the tailing:
    float isInParticleTailed = smoothstep(0.05, 1.4, distanceToBorder);
    float isInParticle = mix(isInParticleTailed, 1.0, smoothstep(0.5, 1.0, color.g));

    // decay matches the degradation over time of the tail. Stored in the green channel
    // add applied to the alpha channel only in the final render
    float decay = color.g * 0.99;
    gl_FragColor = vec4(color.r, decay, 0., isInParticle);
    
    // DEBUG RENDERS:
    //gl_FragColor = vec4(distanceToBorder / 4.0, 0., 0., color.a);
    //gl_FragColor = vec4(distanceToBorder / 4.0, 0., 0., isInParticle);
}
