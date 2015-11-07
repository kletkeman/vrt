/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

varying vec4 color;
varying vec4 point;

void main () {
   gl_FragColor = color * (0.5 + 0.5 * (point.z + 1. / 2.));
}