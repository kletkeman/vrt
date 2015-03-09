/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    'lib/adapters/adapter'
    , 'lib/api'
], function (Adapter, vrt) {
    
    function Memory () {
        
        Adapter.apply(this, arguments);
        /*
        var io = vrt.register("data");
        
        this.on("push", function () {
            io.emit("event", Array.prototype.slice.call(arguments));
        });
        */
        this.name = "memory";
    }
    
    Memory.prototype = Object.create(Adapter.prototype);
    
    return Memory;
})