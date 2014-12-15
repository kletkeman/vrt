/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform sampler2D domain;
uniform sampler2D values;

uniform vec2 resolution;
uniform vec2 cell;
uniform vec4 bounds;
uniform vec2 repeat;

float get_value (vec4 vector, float index) {
    
    int  i = int(index);
    
    if      (i == 0) return vector.s;
    else if (i == 1) return vector.t;
    else if (i == 2) return vector.p;
    
    return vector.q;
}

void main () {
    
    vec2 coords = gl_FragCoord.xy / resolution;    
    vec2 index  = vec2(coords.x, 1. - coords.y) / ( cell / resolution);
    vec4 b      = vec4(bounds.st, bounds.st + bounds.pq);
    
    if( (index.x >= b.s && index.x < b.p) &&
        (index.y >= b.t && index.y < b.q) )
    {
        coords = (index * ((cell / repeat) / resolution));
        
        gl_FragColor = texture2D(
            domain,
            vec2(
                get_value(
                    texture2D(
                        values,
                        vec2(
                            coords.y,
                            coords.x
                        )
                    ), 
                    mod(
                        index.y,
                        4.
                    )
                ),
                0.
            )
        );
    }
    else
    {
        gl_FragColor = texture2D(sampler, coords);
    }

}