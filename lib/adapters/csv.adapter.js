/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    'lib/adapters/adapter',
    'd3',
    'js/options'
], function (Adapter, d3, Options) {
    
    function CSV (options) {
        
        options         = options         || {};
        options.url     = options.url     || "";
        options.hasKeys = options.hasKeys || false;
        
        delete options.query;
        
        Adapter.apply(this, arguments);
        
        this.options = new Options(this.options);
        
        this.name = "csv";
    }
    
    CSV.prototype = Object.create(Adapter.prototype);
    
    CSV.prototype.read = function (callback) {
        var url = this.options.url;
        if(url)
            return this.load(url, callback);
        
        if(typeof callback === "function")
              callback();
    }
    
    CSV.prototype.load = function load (url, callback) {
        
        return Adapter.prototype.load.call(this, url, function (err, result) {
            
            var context = this,
                update  = this.selection.getContext("update"),
                error;
            
            if (result) {
            
                try
                {
                    d3.csv.parseRows(result, function (row, y) {
                        
                        context.set(-1, y - 1, 0, row);

                        if(y > 0) update(y - 1);
                        
                    });
                    
                }
                catch(error_) {
                    error = error_;
                }
                
                if(typeof callback === "function")
                  callback(error);
                else if(error) throw error;
            }
            
        });
        
    }
    
    return CSV;
})