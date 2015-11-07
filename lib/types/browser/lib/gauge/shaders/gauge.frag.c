/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

#version 100

#ifdef GL_ES
precision highp float;
#endif

#define PI 3.141592653589793

uniform float time;
uniform float startAngle;
uniform float endAngle;

uniform float value;

uniform sampler2D text;
uniform sampler2D colors;

uniform vec2 mouse;
uniform vec2 resolution;

varying float angle;

void main () {
    
    gl_FragColor = texture2D(colors, vec2( 1. - angle / endAngle, 0.));
    
    if(angle < (endAngle * (1. - value)))
        gl_FragColor /= 4.;
    else 
        gl_FragColor = texture2D(colors, vec2( value, 0.));
}