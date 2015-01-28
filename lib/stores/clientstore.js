/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
      'debug'
    , 'lib/store'
    , 'lib/api'
    , 'jquery'
    
], function(
      debug
    , Store
    , vrt
    , $
) { debug = debug("lib:clientstore");

    function ClientStore () {
        Store.apply(this, arguments);
    }

    ClientStore.prototype =  Object.create(Store.prototype);

    ClientStore.prototype.error = function(data) {
        if(Array.isArray(data.error))
            data.error = data.error.reduce(function (previous, current, i, e) {
                
                previous.message += i + ' : ' + current.message + (i < e.length - 1 ? ', ' : '');
                previous.stack   += current.stack + (i < e.length - 1 ? "\n" : "");
                
                return previous;
                
            }, {message: '', stack: ''});
        return data.error ? (vrt.log.error(data.error.stack), vrt.controls.status('Error : ('+data.error.message+')'), $.extend(new Error(data.error.message), {stack: data.error.stack})) : undefined;
    }

    ClientStore.prototype.create = function(config, callback) {

        var error, context = this, response;

        return $.ajax({
              url: vrt.url('/api/v1/create'),
              type: 'POST',
              contentType: 'application/json',
              dataType: 'text',
              processData: false,
              data: JSON.stringify(config),
              async: typeof callback === 'function',
              success: function(data) {

                response = JSON.parse(data);
                error = context.error(response);


                if(typeof callback === 'function')
                    callback(error, response)
                else if(error)
                    throw error;

              }
            })
            .fail(function(xhr, statustext, err) {

                if(typeof callback === 'function')
                    callback(err);
                else
                    throw err;
            });

        if(error)
            throw error;

        return response;

    };

    ClientStore.prototype.destroy = function(id, callback) {

        var error, context = this, response;

        return $.ajax({
              url: vrt.url('/api/v1/destroy'),
              type: 'POST',
              contentType: 'application/json',
              dataType: 'text',
              processData: false,
              data: JSON.stringify({'id' : id}),
              async: typeof callback === 'function',
              success: function(data) {

                response = JSON.parse(data);
                error = context.error(response);			

                if(typeof callback === 'function')
                    callback(error, response)
                else if(error)
                    throw error;

              }
            })
            .fail(function(xhr, statustext, err) {

                if(typeof callback === 'function')
                    callback(err);
                else
                    throw err;
            });

        if(error)
            throw error;

        return response;

    };

    ClientStore.prototype.get = function(id, callback) {

        var response, context = this, error;

        $.ajax({
              url: vrt.url('/api/v1/' + id),
              dataType: 'json',
              async: typeof callback === 'function',
              success: function(data) {

                error = context.error(data);

                if(typeof callback === 'function')
                    callback(error, data);
                else if(error)
                    throw error;

                response = data;

              }
            })
            .fail(function(xhr, statustext, err) {
                if(typeof callback === 'function')
                    return callback(err);
                throw err;
            });

        if(error)
            throw error;

        return response;
    };

    ClientStore.prototype.list = function (callback) {

        var args = Array.prototype.slice.call(arguments),
            response, error, context = this;

        if(typeof args[0] === 'object')
            return Store.prototype.list.apply(this, arguments);

        $.ajax({
              url: vrt.url('/api/v1/list'),
              dataType: 'json',
              async: typeof callback === 'function',
              success: function(data) {
                  
                response = data;
                error = context.error(data);

                if(typeof callback === 'function')
                    callback(error, data);
                else if(error)
                    throw error;

                response = data;
                  
              }
            })
            .fail(function(xhr, statustext, err) {
                throw err;
            });

        if(error)
            throw error;

        return response;

    };

    ClientStore.prototype.reload = function(callback) {

        var context  = this,
            progress = vrt.controls.dialog().insert("progress").nest();
        
        this.list(function (err, list) {
            
            var len     = list.length, 
                i       = 0;
            
            if(err) {
                if(typeof callback === 'function')
                    return callback(err);
                throw err;
            }
            
            (function load () { i++;

                var id = list.pop();

                if(!id) {
                    
                    progress.destroy();
                    
                    vrt.controls.status("Loaded " + len + " widgets");
                    
                    if(typeof callback === 'function')
                        callback();
                    
                }
                else {

                    progress.set(Math.ceil( (100 / len) * i)).refresh();

                }

                if(id)
                  return vrt.get(id, load);
                               

            })();	
             
        });
        
    };

    ClientStore.prototype.save = function(dataset, callback) {

        var error, context = this, response;

        dataset = vrt.type(dataset.type).prototype.toJSON.call(dataset);

        return this.get(dataset.id, function(err, sataset) {

            if(err) throw err;

            for(var k in sataset)
                if(typeof dataset[k] === 'undefined') {
                    delete sataset[k];
                    continue;
                }
                else if(typeof sataset[k] === 'object' && typeof dataset[k] === 'object')
                    $.extend(true, sataset[k], dataset[k]);
                else
                    sataset[k] = dataset[k];

            delete sataset['id'];

            return $.ajax({
              url: vrt.url('/api/v1/' + dataset.id + '/save'),
              type: 'POST',
              contentType: 'application/json',
              dataType: 'text',
              processData: false,
              data: JSON.stringify(sataset),
              async: (typeof callback === 'function'),
              success: function(data) {

                response = JSON.parse(data);
                error = context.error(response);			

                if(typeof callback === 'function')
                    callback(error, response)
                else if(error)
                    throw error;

              }
            })
            .fail(function(xhr, statustext, err) {

                if(typeof callback === 'function')
                    callback(err);
                else
                    throw err;
            });

            if(error)
              throw error;

           return response;

        });
    };

    ClientStore.prototype.typeNames = function (callback) {

        var response, context = this;

        $.ajax({
              url: vrt.url('/api/v1/typeNames'),
              dataType: 'json',
              async: (typeof callback === 'function'),
              success: function(data) {

                error = context.error(data);

                if(typeof callback === 'function')
                    callback(error, data)
                else if(error)
                    throw error;

                response = data;

              }
            })
            .fail(function(xhr, statustext, err) {
                throw err;
            });

        return response;

    };
    
    return ClientStore;
    
});
