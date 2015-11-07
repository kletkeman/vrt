/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform sampler2D glyphs;
uniform sampler2D text;
uniform sampler2D texture;

uniform vec4 clip;
uniform vec3 count;
uniform vec2 offset;

uniform vec2 resolution;

void main () {
    
    vec4  texel  = texture2D(sampler, gl_FragCoord.xy / resolution);
    vec2 coords  = vec2(gl_FragCoord.x, (resolution.y - gl_FragCoord.y)) / resolution;
    
    if( (coords.x >= clip.s && coords.y >= clip.t) &&
        (coords.x <= clip.p && coords.y <= clip.q) )
    {
        vec4 clap = clip; clap.tq -= offset.y / count.t;
        
        vec2 coords  = (coords - clap.st) / (clap.pq - clap.st);
        
        vec4 glyph   = texture2D(text, vec2(
            coords.x,
            (coords.y * ( count.t / count.p))
        ));
        
        texel        = texture2D(glyphs, vec2(
                        ( glyph.p - glyph.s ) * fract( (coords.x + offset.x) * count.s ) + glyph.s,
                        ( glyph.q - glyph.t ) * fract( coords.y * count.t ) + glyph.t
                      ));
        
        gl_FragColor = vec4(1., 1., 1., texel.a);
        
    }
    else
        gl_FragColor = texture2D(texture, gl_FragCoord.xy / resolution);
    
}