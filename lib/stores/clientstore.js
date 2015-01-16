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
) { debug = debug("store:clientstore");

    function ClientStore () {

        Store.apply(this, arguments);
        this.data.queue = [];

    };

    ClientStore.prototype.__proto__ =  Store.prototype;

    ClientStore.prototype.Tree =  function() {};

    ClientStore.prototype.Tree.prototype.__proto__ = Store.prototype.Tree.prototype;

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

    ClientStore.prototype.data = function(id, callback) {

        var last_length = 0, context = this;

        if(this.data.queue.map(function(d) {return d[0];}).indexOf(id) > -1)
            return;
        else if(this.data.working)
            return this.data.queue.push(arguments);

        this.data.working = true;

        if(!this.data.queue.length && arguments.callee.caller.name !== "onsuccess_data_ajax_callback")
            this.data.msg = vrt.controls.message("Loading data, please wait...");

        function parse(e) {

            var r = typeof e === 'string' ? e : e.currentTarget.response, char; 

            r.substr(last_length).split("\n")
             .forEach(function(d) {

                try {
                    if(typeof callback === 'function')
                        return callback(null, JSON.parse(d), last_length === r.length);
                } catch(e) {

                    if( (char = d.match(/\W/)) && (char = char[0])) {
                            last_length = (r.length - d.length);
                    }
                    else if(d.length && d.match(/[ \n\t\r]/gi) !== d.length) {
                        if(typeof callback === 'function')
                            return callback(e);
                        throw e;
                    }
                }
            });

            if(!char)
                last_length = r.length
        };

        debug('Loading data for widget with id: '+id);

        return $.ajax(vrt.url('/api/v1/' + id + '/data'),
              {
              async: true,
              success : function (data) {

                if(!last_length)
                    parse(data);

                if(typeof callback === 'function')
                    callback(null, null, true);

                context.data.working = false;

                if(context.data.queue.length)
                    setTimeout(function onsuccess_data_ajax_callback() {
                        context.data.apply(context, context.data.queue.shift());		  	
                    }, 0);
                else if(context.data.msg) {
                    context.data.msg.remove();
                    delete context.data.msg;
                }

              },
              xhrFields: {
                  onprogress: parse 
              }

            })
            .fail(function(xhr, statustext, err) {
                throw err;
            });

    };

    ClientStore.prototype.delete = function(id, filter_index, path, callback) {

        var context = this, error, response;

        return $.ajax(vrt.url('/api/v1/' + id + '/data/delete'),
              {
              type: 'POST',
              contentType: 'application/json',
              dataType: 'text',
              processData: false,
              data: JSON.stringify({
                  filter : (typeof filter_index === 'object' ? filter_index : undefined),
                  index : (Number.isFinite(filter_index) ? filter_index : undefined),
                  path : path
              }),
              async: typeof callback === 'function',
              success : function (data) {

                response = JSON.parse(data);
                error = context.error(response);

                if(typeof callback === 'function')
                    callback(error, response)
                else if(error)
                    throw error;
              }

            })
            .fail(function(xhr, statustext, err) {
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

        var context = this;
        
        this.reload.progress && this.reload.progress.remove();	
        this.reload.progress = vrt.controls.message('Loading objects : 0%');	
        
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

                    context.reload.progress.remove(), vrt.controls.status("Loaded " + len + " widgets");

                    if(typeof callback === 'function')
                        callback();
                    
                }
                else {

                    context.reload.progress.remove();
                    context.reload.progress = vrt.controls.message('Loading objects : ' + Math.ceil( (100 / len) * i) + '%');


                }

                if(id)
                  return vrt.get(id, load);
                               

            })();	
             
        });
        
    };

    ClientStore.prototype.push = function(x, y, id, data, callback) {

        var error, context = this, response;

        return $.ajax({
              url: vrt.url('./api/v1/' + id),
              type: 'POST',
              contentType: 'application/json',
              dataType: 'text',
              processData: false,
              data: JSON.stringify(data),
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
