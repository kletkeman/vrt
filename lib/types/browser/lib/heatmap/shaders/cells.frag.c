/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform sampler2D colors;

uniform vec2 resolution;

void main () {
    
    vec2 coords = gl_FragCoord.xy / resolution;
    float value = texture2D(sampler, vec2(coords.y, coords.x)).a;
    
    gl_FragColor = texture2D(colors, vec2(value, 0.));
}