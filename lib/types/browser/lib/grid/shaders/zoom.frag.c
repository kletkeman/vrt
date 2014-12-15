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
uniform vec2 magnification;
uniform vec2 offset;

void main () {
    
    gl_FragColor = texture2D(sampler, ((gl_FragCoord.xy / resolution) / magnification) + vec2(-offset.x, offset.y));
}