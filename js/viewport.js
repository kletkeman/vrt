/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

export function ViewPort (left, top, back, right, bottom, front) {

    var width  = 1,
        height = 1,
        depth  = 1;

    this.left   = left = left || 0;
    this.top    = top  = top  || 0;
    this.back   = back = back || 0;

    this.right  = right  = right  || 1;
    this.bottom = bottom = bottom || 1;
    this.front  = front  = front  || 1;

    this.width  = width;
    this.height = height;
    this.depth  = depth;

    this.reset = function () {

        left  = top    = back  = 0;
        right = bottom = front = 1;

        return this.multiply(width, height, depth);
    }

    this.multiply =
        function (w, h, d) {

            var l = left   * (w = w || width),
                t = top    * (h = h || height),
                r = right  * w,
                b = bottom * h;

            ;
            ;

            this.left   = Math.round(l);
            this.top    = Math.round(t);
            this.right  = Math.round(r);
            this.bottom = Math.round(b);

            l -= Math.floor(l);
            t -= Math.floor(t);
            r -= Math.floor(r);
            b -= Math.floor(b);

            this.top  += Math.floor(b - t);
            this.left += Math.floor(r - l);

            this.width  = width  = w;
            this.height = height = h;

            return this;
    }

    function pan (x, y, z) {

        var l = (right - left),
            t = (bottom - top);

            x = Math.min(1, Math.max(0, x || 0 ));
            y = Math.min(1, Math.max(0, y || 0 ));

            left = (1 - l) * x;
            top  = (1 - t) * y;

            right  = left + l;
            bottom = top + t;

            return this.multiply(width, height);

    }

    this.pan = pan;

    this.zoom =
        function zoom (x, y, z) {

            var l  = left / ((1 - right) + left),
                t  = top / ((1 - bottom) + top);

            x = Math.max(1, x || (1 / (right - left)) );
            y = Math.max(1, y || (1 / (bottom - top)) );

            x = 1 / x;
            y = 1 / y;

            left = (1 - x) * (l || 0);
            top  = (1 - y) * (t || 0);

            right  = left + x;
            bottom = top + y;

            return this.multiply(width, height);

    }

   function position () {
        return [
            left,
            top
        ];
    }

    position.left = function () {
        return left;
    }

    position.top = function () {
        return top;
    }

    this.position = position;

    function size () {
        return [
            right - left,
            bottom - top
        ];
    }

    size.horizontal = function () {
        return right - left;
    }

    size.vertical = function () {
        return bottom - top;
    }

    this.size = size;

}
