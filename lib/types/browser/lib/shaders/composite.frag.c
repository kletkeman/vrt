/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


#version 100

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D sampler;
uniform sampler2D source;

uniform int operation;

uniform vec2 resolution;

void main () {
    
    vec2 coords  = gl_FragCoord.xy / resolution;
    
    vec4 layer0  = texture2D(sampler, coords);
    vec4 layer1  = texture2D(source,  coords);

    if      (operation == 1) {} // source-in
    else if (operation == 2) {} // source-out
    else if (operation == 3) {} // source-atop
    else if (operation == 4) {} // destination-over
    else if (operation == 5) {} // destination-in
    else if (operation == 6) {} // destination-out
    else if (operation == 7) {} // destination-atop
    else if (operation == 8) {} // lighter
    else if (operation == 9) {} // darker
    else if (operation ==10) {} // copy
    else if (operation ==11) {} // xor
    else if (operation ==12) {  // difference
        
        gl_FragColor = vec4( 
            (layer0 * (1. - layer1.a)).rgb + ( (layer1.rgb * layer1.a) - (layer0.rgb * layer1.a) ),
            layer0.a + layer1.a
        );
    
    }
    else if (operation ==13) {  // add
        
        gl_FragColor = vec4(
            (layer0.rgb * layer0.a) + (layer1.rgb * layer1.a),
            (layer0.a + (1. - layer1.a)) / 2.
        );
    }
    else                        // source-over
        gl_FragColor = vec4(layer0.rgb * (1. - layer1.a) + layer1.rgb, 1.);
    
}