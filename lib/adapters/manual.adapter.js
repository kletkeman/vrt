/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'd3'
    , 'lib/adapters/adapter'
    , 'lib/api'
], function (d3, Adapter, vrt) {
    
    function Manual (options) {
        
        options  = options || {};
        
        Adapter.call(this, options);
        
        this.name = "manual";
    }
    
    Manual.prototype = Object.create(Adapter.prototype);
    
    return Manual;
})