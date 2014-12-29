/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

precision mediump float;
attribute vec2 position;
void main () {
    gl_Position = vec4(position, 0., 1.);
}