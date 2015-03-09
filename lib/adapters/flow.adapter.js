/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'lib/adapters/adapter'
    , 'socket.io'
    , 'jquery'
    , 'd3'
    , 'lib/api'
], function (Adapter, io, $, d3, vrt) {
    
    const adapter = new Adapter();
    
    function Flow () {
        
        
        
        this.on("sync", function () {
            console.log(arguments);
        });
        
        this.name = "flow";
    }
    
    Flow.prototype = adapter;
    
    Flow.prototype.load = 
    function load (url, callback) {
        
        return d3.json(url, function (err, d) {
            
            adapter.data(d);
            
            if(typeof callback === "function")
              callback(err);
            else if(err) throw err;
            
        });
    }
    
    vrt.ready(function () {
        
        Flow.prototype.load.call(null, vrt.url("/api/v1/data"),
        function (err) {
            
            if(err)
                return vrt.message(err.message, "danger");
            
            vrt.register("data", function (args) {
                adapter.write.apply(adapter, args.slice(1));
            });
            
        });
        
    });
    
    return Flow;
    
})