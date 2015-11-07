
/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform float time;

uniform float value;

uniform sampler2D colors;

uniform vec2 mouse;
uniform vec2 resolution;

varying vec4 point;

void main () {
    
    float y = (point.y + 1.) / 2.;
    
    gl_FragColor = texture2D(colors, vec2( y, 0.));
    
    if(y > value)
        gl_FragColor /= 4.;
    else
         gl_FragColor = texture2D(colors, vec2( value, 0.));
    
}