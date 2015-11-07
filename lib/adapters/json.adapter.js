/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'd3'
    , 'lib/adapters/adapter'
    , 'lib/api'
    , 'js/options'
], function (d3, Adapter, vrt, Options) {
    
    function JSON (options) {
        
        options  = options || {};
        
        options.url   = "http://api.openweathermap.org/data/2.5/weather?q=London,uk";
        options.query = "*.*";
        
        Adapter.call(this, options);
        
        this.options = new Options(this.options);
        
        this.name = "json";
    }
    
    JSON.prototype = Object.create(Adapter.prototype);
    
    JSON.prototype.load =
    function load (url, callback) {
        
        var context = this;
        
         return Adapter.prototype.load.call(this, url, function (error, result) {
             
             if(result);
                context.data(window.JSON.parse(result));
             
             if(typeof callback === "function")
                 callback.call(context, error);
             else if(error)
                 throw error;
             
         });
    }
    
    JSON.prototype.read = function (callback) {
        
        return this.load(this.options.url, function (err) {
            
            if(err) {
                if(typeof callback === "function")
                    return callback(err);
                throw err;
            }
            
            return Adapter.prototype.read.call(this, callback);
            
        });
    }
    
    return JSON;
})