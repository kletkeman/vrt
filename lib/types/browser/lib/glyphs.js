/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
      'debug'
    , 'd3'
], function (debug, d3) { debug = debug("lib:glyphs");
    

    function glyphs (fontSize, color) {
        
            fontSize = fontSize || 10,
            color    = color || "rgb(0,0,0)";

            var chars  = d3.range(32, 126).map(function (d) {
                    return String.fromCharCode(d);
                }),
                canvas = document.createElement("canvas"),
                ctx    = canvas.getContext("2d"),
                size   = Math.ceil(Math.sqrt(chars.length)),
                m     = {},
                wh, w;

            color    = color || 'black';
            fontSize = fontSize || 8;

            canvas.width = canvas.height = size * (wh = fontSize);

            with(ctx) {
                imageSmoothingEnabled = true;
                textAlign             = 'center';
                textBaseline          = 'middle';
                fillStyle             = color;
                font                  = fontSize + "px Arial";
            }

            for (var y = 0; y < size; y++) {
                for (var x = 0, char, charcode; x < size; x++) {
                    if ((char = chars[((y * size) + x)])) {

                        charcode = char.charCodeAt(0);
                        
                        w = ctx.measureText(char).width;

                        m[charcode] = new Float32Array([
                            (x * wh) / canvas.width,
                            (y * wh) / canvas.height,
                            0., 0.]);

                        m[charcode][2] = m[charcode][0] + (wh / canvas.width);
                        m[charcode][3] = m[charcode][1] + (wh / canvas.height);

                        ctx.fillText(char, (x * wh) + (wh / 2), (y * wh) + (wh / 2));

                        //debug.enabled && debug(char, ctx.measureText(char));

                    }
                }
            }

            if (debug.enabled) {
                debug("glyphs.image", canvas.toDataURL());
                debug("glyphs.size", fontSize);
            }

            return {
                
                size        : fontSize,
                image       : ctx.getImageData(0, 0, canvas.width, canvas.height),
                coordinates : function (text) {

                    var data = new Float32Array(new ArrayBuffer(text.length * 4 * 4));

                    for (var i = 0, li, charcode, len = text.length; i < len; i++) {
                        charcode = text.charCodeAt(i);

                        li = i * 4;

                        data[li] = m[charcode][0];
                        data[li + 1] = m[charcode][1];
                        data[li + 2] = m[charcode][2];
                        data[li + 3] = m[charcode][3];

                    }

                    return data;
                }
            };
        }
    
    return glyphs;

});