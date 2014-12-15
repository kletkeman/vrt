/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform float time;

void main () {
  gl_FragColor = vec4(1.,0.,1.,1.);
}