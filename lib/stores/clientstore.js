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
   
    (function (progress, queue, request, active) {
        
        function abort (id) {
            
            var length = queue.length, queued;
            
            debug("abort (id)", id);
            
            if(request && active === id) {
                
                request.abort();
                
                debug("aborted XMLHttpRequest", id, request);
                
                active = null;
                request = null;
                
            }
            
            while ( id && length-- && (queued = queue.shift()) ) {
                
                if(queued[0] !== id)
                    queue.push(queued);
                
            }
            
            if(!queue.length && !active) {
                
                if(progress)
                    progress.destroy();
                
                progress = null;
                
            }            
        }
        
        ClientStore.prototype.abort = abort;

        ClientStore.prototype.data = function data (id, callback) {

            var last_length = 0, context = this;

            if(queue.map(function(d) {return d[0];}).indexOf(id) > -1)
                return;
            else if(active)
                return queue.push(arguments);
            
            active = id;
            
            (progress = progress || vrt.controls.dialog().insert("progress").nest().set( 0 ).refresh());

            function parse (e) {
                
                var r = typeof e === 'string' ? e : e.currentTarget.response, char, length;
                
                debug("parse data start (id, position)", active, last_length);

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
                
                if(!char) (last_length = r.length);
                
                debug("parse data end (id, position)", active, last_length);
            };

            debug('Loading data for widget with id: '+id);

            return (request = $.ajax(vrt.url('/api/v1/' + id + '/data'),
                  {
                
                  async   : true,
                  success : function (response) {

                    if(!last_length)
                        parse.call(this, response);
                    
                    if(typeof callback === 'function')
                        callback(null, null, true);

                    request = null;
                    active  = null;
                      
                    progress.set( Math.round( (1 / (queue.length + 1) ) * 100 ) ).refresh();

                    if(queue.length) {

                        setTimeout( function () {
                            debug("processing next queued item", queue[0]);
                            data.apply(context, queue.shift());	
                        }, 0);

                    } 
                    else {
                        debug("queue empty, exiting");
                        abort();
                    }

                  },
                  xhrFields: {
                      onprogress: parse 
                  }

                })
                .fail(function(xhr, statustext, err) {
                    debug(active, statustext, err, xhr);
                }));

        };
        
    })(null, []);

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
