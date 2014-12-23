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

uniform float alpha;
uniform vec2 dir;

const float ds = 10.;

float dx;
float dy;

vec4 result;
vec2 coords;

void main () {
    
    coords = gl_FragCoord.xy / resolution; 
    
    for(float x = -ds; x <= ds; x++) {
        
        dx = (x * (1. - alpha) * dir.x) / resolution.x;
        
        for(float y = -ds; y <= ds; y++) {
            
            dy = (y * (1. - alpha) * dir.y) / resolution.y;
            
            result += texture2D(sampler, vec2(coords.x + dx, coords.y + dy));
        }
    }
    
    gl_FragColor = result / pow((ds * 2.) + 1., 2.);
                                
}