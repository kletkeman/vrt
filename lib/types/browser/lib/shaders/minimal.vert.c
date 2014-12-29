/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

precision mediump float;
attribute vec2 vertex_p;
void main () {
    gl_Position = vec4(vertex_p, 0., 1.);
}