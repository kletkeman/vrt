/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
    Indexed DB Store
    
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
    
) { debug = debug("lib:idbstore");
   
    var db;
   
    function init_request_upgrade () {
        db.result.createObjectStore("widgets", { keyPath: "id" });
    }
   
    function init_request_success () {
        db = db.result; vrt.ready(-1);
    }
   
    function event_handler (context, request, callback) {
        
        var args = Array.prototype.slice.call(arguments, 3);
        
        return function () {
            
            if(typeof callback === "function")
                callback.apply(context, args.length ? args : [request.error, request.result]);
            else if (args[0])
                throw args[0];
        }
    }

    function IDBStore () {
        
        Store.apply(this, arguments);
        
        if(db)
           db.close();
        
        db = indexedDB.open("vrt", 1);
        
        vrt.ready(1);
        
        db.onupgradeneeded = init_request_upgrade;
        db.onsuccess       = init_request_success;
        db.onerror         = debug;
        
    }

    IDBStore.prototype =  Object.create(Store.prototype);

    IDBStore.prototype.create = function(config, callback) {

        var transaction = db.transaction("widgets", "readwrite"),
            request     = transaction.objectStore("widgets")
                                     .add(config);
        
        request.onsuccess = event_handler(this, request, callback);
            
        transaction.oncomplete = debug;
        transaction.onerror    = debug;

    }

    IDBStore.prototype.destroy = function(id, callback) {

        var transaction = db.transaction("widgets", "readwrite"),
            request     = transaction.objectStore("widgets")
                                     .delete(id);
        
        request.onsuccess = event_handler(this, request, callback);
        
        transaction.oncomplete = debug;
        transaction.onerror    = debug;
    }

    IDBStore.prototype.get = function(id, callback) {
        
        var transaction = db.transaction("widgets", "readonly"),
            request     = transaction.objectStore("widgets")
                                     .get(id);
        
        request.onsuccess = event_handler(this, request, callback);
        request.onerror   = event_handler(this, request, callback);
        
        transaction.oncomplete = debug;
        transaction.onerror    = debug;
    }
    
    function iterator (context, request, callback) {
        
        var list = [];
        
        return function (event) {
            
            var cursor = event.target.result;
            
            if(cursor) {
                
                list.push(cursor.value.id);
                cursor.continue();
            }
            else 
                event_handler(context, request, callback, null, list)();
            
        }
    }

    IDBStore.prototype.list = function (callback) {

        var transaction = db.transaction("widgets", "readonly"),
            request     = transaction.objectStore("widgets")
                                     .openCursor();
        
        request.onsuccess = iterator(this, request, callback);
        request.onerror   = event_handler(this, request, callback);
    }

    IDBStore.prototype.reload = function(callback) {

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
        
    }

    IDBStore.prototype.save = function(widget, callback) {
        
        var context     = this,
            transaction = db.transaction("widgets", "readwrite"),
            store       = transaction.objectStore("widgets"),
            request     = store.get(widget.id);
        
        transaction.oncomplete = debug;
        transaction.onerror    = debug;
        
        request.onsuccess = function () {
            
            request = store.put(widget.toJSON());
            
            request.onsuccess = event_handler(context, request, callback);
            request.onerror   = event_handler(context, request, callback);
            
        };
        
        request.onerror   = event_handler(this, request, callback);
        
    }

    IDBStore.prototype.typeNames = function (callback) {
        
        var types = [
            "bargraph",	"gauge", "image", "linegraph", "widget",
            "datetime",	"heatmap", "meter"
        ];
        
        if(typeof callback === "function")
            callback(null, types);

    }
    
    return IDBStore;
    
});
