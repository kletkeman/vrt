/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

#version 100

#ifdef GL_ES
precision highp float;
#endif  

attribute vec3 position;

uniform mat4 model;
uniform mat4 perspective;

uniform sampler2D colors;

varying vec4 color;
varying vec4 point;

void main () {
    
    color       = texture2D(colors, vec2( (position.y + 1.) / 2., 0.));
    gl_Position = point = model * perspective * vec4(position, 1.);
}