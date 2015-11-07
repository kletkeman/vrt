/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform sampler2D color;
uniform bool      gradient;
uniform vec2      resolution;
uniform float     horizon;

void main () {
    
    vec2  coords = gl_FragCoord.xy / resolution;
    
    vec4 sample  = texture2D(sampler, coords);
    vec3 rgb     = sample.rgb;
    
    float value = sample.a;
    float y     = coords.y;
    
    float a     = horizon < 0. ? 
        (value < abs(horizon) ? value : abs(horizon)) : ((1. - value) * horizon);
    float b     = horizon < 0. ? 
        (value > abs(horizon) ? value : abs(horizon)) : (a + value);
    
    if( y >= a && y <= b)
        gl_FragColor = texture2D(color, vec2(value, 0.));   
    else
        gl_FragColor = vec4(0., 0., 0., 0.);

}