/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

attribute vec3 position;

varying float angle;

void main () {
    angle = position.z;
    gl_Position = vec4(position.xy, 1., 1.);
}