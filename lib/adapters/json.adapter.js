/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'd3'
    , 'lib/adapters/adapter'
    , 'lib/api'
], function (d3, Adapter, vrt) {
    
    function JSON (options) {
        
        options  = options || {};
        
        options.url   = "http://api.openweathermap.org/data/2.5/weather?q=London,uk";
        options.query = "*.*";
        
        Adapter.call(this, options);
        
        this.name = "json";
    }
    
    JSON.prototype = Object.create(Adapter.prototype);
    
    JSON.prototype.load =
    function load (url, callback) {
        
        var context = this;
        
        this.clear();

        return d3.json(url, function (err, d) {
            
            context.data(d);
            
            if(typeof callback === "function")
              callback.call(context, err);
            else if(err) throw err;
            
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