/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define(['debug'], function (debug) {
    
    debug = debug("lib:zoomable");

    function zoom(dx, dy, incremental) {

        var magnification2f, x, y;

        with(gl = (this.canvas.node().getContext("webgl"))) {
            with(this.__WebGLObjects) {

                magnification2f = zoom.parameter('magnification');

                if (!arguments.length)
                    return magnification2f;

                x = dx || 0;
                y = dy || 0;

                if (incremental !== false) {
                    x += magnification2f[0];
                    y += magnification2f[1];
                }

                zoom.use()
                    .parameter('magnification', '2f', [
                        (x = magnification2f[0] = Math.max(x, 1.)),
                        (y = magnification2f[1] = Math.max(y, 1.))
                ]);

            }
        }

        debug("zoom", x, y);

        return this.shift((-dx / x) * (1. / x), (dy / y) * (1. / y), magnification2f, incremental), magnification2f;
    }

    function shift(dx, dy, magnification2f, incremental) {

        var offset2f, x, y;

        with(gl = (this.canvas.node().getContext("webgl"))) {
            with(this.__WebGLObjects) {

                offset2f = zoom.parameter('offset');
                magnification2f = magnification2f || zoom.parameter('magnification');

                if (!arguments.length)
                    return offset2f;

                x = dx || 0;
                y = dy || 0;

                if (incremental !== false) {
                    x += offset2f[0];
                    y += offset2f[1];
                }

                zoom.use()
                    .parameter('offset', '2f', [
                        (offset2f[0] = Math.max(
                            Math.min(x, 0.), -1 + (1 / magnification2f[0])
                        )),
                        (offset2f[1] = Math.min(
                            Math.max(y, 0.),
                            1 - (1 / magnification2f[1])
                        ))
                ]);

                zoom.render();

            }
        }

        debug("shift", x, y);

        return offset2f;
    }
    
    return {
        'zoom'  : zoom,
        'shift' : shift
    }


});