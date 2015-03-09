/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

attribute vec2 position;

varying vec4 point;

void main () {
    gl_Position = point = vec4(position, 0., 1.);
}