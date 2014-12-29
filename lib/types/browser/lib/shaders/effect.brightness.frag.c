/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform vec2 resolution;

uniform float brightness;
uniform float cutoff;

vec3 weight = vec3(1./3., 1./3., 1./3.);

void main () {
    
    vec4 result = texture2D(sampler, gl_FragCoord.xy / resolution);
    
    if( dot(result.rgb,  weight) > cutoff )
       result = vec4(
            (brightness * (1. - result.r)) + result.r,
            (brightness * (1. - result.g)) + result.g,
            (brightness * (1. - result.b)) + result.b,
            1.
        );
       
    gl_FragColor = result;
}