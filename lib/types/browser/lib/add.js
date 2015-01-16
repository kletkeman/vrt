/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([], function () {
    return function add(obj) {

        var args = Array.prototype.slice.call(arguments),
            result = 0;

        while ((obj = args.pop())) {

            if (obj.length)
                for (var i = 0, len = obj.length; i < len; i++)
                    result += obj[i];
            else
                result += obj;

        }

        return (add.result = result);

    }

})