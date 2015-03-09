/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['jquery', 'lib/data3', 'js/viewport', 'eventemitter'], function ($, Data3, ViewPort, EventEmitter) {

    function Adapter (options, selection) {

        var data    = {};
        
        Data3.call(this);
        EventEmitter.call(this);
        
        options   = options || {};
        selection = selection instanceof Selection ? selection : options.selection;
        
        this.viewport   = new ViewPort();
        this.selection  = selection instanceof Selection ? selection : new Selection([], null, this);
        this._types     = {};

        this.options = $.extend({
            url   : "",
            query : "",
            slice : 0
        }, options);
        
        this.data = function (d) {
            return (data = d || data);
        }
        
    }
    
    Adapter.prototype = Object.create(EventEmitter.prototype);
    
    Adapter.prototype.destroy = function () { }

    function push(tree, name, path, value) {
        
        var now = Date.now();
        
        tree[name] = value;
        
        this.emit("push", now, path+"."+name, value);
        this.emit("sync", now, tree, path, name, value);
    }
    
    function iterator (obj, accessor) {
        
        var k, length, i = 0;
        
        if(Array.isArray(obj)) {
            
            for(k = 0, length = obj.length; k < length; k++)
                if(accessor.call(this, String(k), obj[k], i++) === false) return;
            
        }
        else {
            
            for(k in obj)
                if(accessor.call(this, k, obj[k], i++) === false) return;
        }
    }

    function jsonQuerySelector(tree, paths, accessor, i, trail) {

        var path,
            end, name, length;
        
        trail = trail || [];
        
        i     = i     || 0;

        while (paths.length) {

            path = String(paths.shift()).split(".");

            for (length = path.length; i < length;) {

                name    = path[i];
                end     = i === length - 1;
                
                if (name === '*') {
                    
                    trail = trail.concat(path.slice(0, i));
                    
                    iterator.call(this, tree, function (k, d, y) {
                        
                        if(typeof d === "object") {
                            
                            trail.push(k);
                            
                            jsonQuerySelector.call(this, d, [(i ? path.slice(0, i).join(".") + "." : "") + k + "." + path.slice(i + 1, path.length).join(".")], accessor, i + 1, trail);
                            
                            trail.pop();
                        }
                        
                        if(typeof d !== "object")
                           paths.unshift(
                                (i ? path.slice(0, i).join(".") + "." : "") + k + (end ? "" : "." + path.slice(i + 1, path.length).join("."))
                            );
                        
                    });
                    
                    trail = trail.slice(0, -i);
                    
                    break;
                    
                }
                else if (typeof tree[name] === 'undefined') break;
                else if(typeof tree[name] === 'object') {
                    
                    tree = tree[name];
                    i++;
                    
                }
                else if (end) {
                    accessor.call(this, name, tree[name], i, trail);
                    break;
                }
                else
                    break;

            }
        }
        
    }
    
    function load_event_handler (context, callback) {
        
        var args = Array.prototype.slice.call(arguments, 2);
        
        return function handler (file) {
            
            if(file.constructor.name === "File" || (file = this.response))
                return load.call(context, file, callback);
            else if(typeof callback === "function")
                callback.apply(context, args.length ? args : [this.error, this.result]);
            else if(args[0])
                throw args[0];
        }
    }
    
    function http_request (context, url, callback) {
        
        with( new XMLHttpRequest() ) {

            open('GET', url, true);

            responseType = 'blob';

            onload       = load_event_handler(context, callback);
            onerror      = load_event_handler(context, callback);

            send();

        }
    }
    
    function load (url, callback) {
        
        var context = this,
            reader;
        
        this.clear();
        
        if( url && typeof url === "object" ) {
           
            if( url.constructor.name === "File" || url.constructor.name === "Blob" ) {
            
                reader        = new FileReader();
                reader.onload = load_event_handler(this, callback);
        
                return reader.readAsText(url);
                
            }
            else {
                
                if(typeof chrome === "object" && chrome.fileSystem)
                    this.options.url = chrome.fileSystem.retainEntry(url);
                
                url.file(load_event_handler(this, callback));
                
            }
            
        }
        else if(typeof chrome === "object" && chrome.fileSystem) {
            
            if(!url)
                
                chrome.fileSystem.chooseEntry({}, function (entry) {
                    load.call(context, entry, callback);
                });
            
            else
                
                chrome.fileSystem.isRestorable(url, function restorable (entry) {

                    if(entry === true)
                        chrome.fileSystem.restoreEntry(url, restorable);
                    else if (entry === false)
                        http_request(context, url, callback);
                    else
                        load.call(context, entry, callback);
                });
            
        }
        else if (url)
            http_request(this, url, callback);
        
    }
    
    Adapter.prototype.load = load;
    
    function Selection (mapping, accessor, adapter) {
 
        var viewport = adapter.viewport,
            selection  = this,
            j, argumentz;
        
        Object.defineProperties(this, {
            mapping : {
                get : function () {
                    return mapping;
                },
                set : function (m) {
                    return (mapping = m);
                }
            },
            accessor : {
                get : function () {
                    return accessor;
                },
                set : function (a) {
                    return (accessor = a);
                }
            },
            adapter : {
                get : function () {
                    return adapter;
                },
                set : function (a) {
                    viewport = adapter.viewport;
                    return (adapter = a);
                }
            }
        })
        
        this.toJSON = function () {
            return mapping;
        }
        
        function map (value, x, y, z) {
                
            var range, convert;
            
            if(typeof accessor !== "function")
                return false;
                
            else if (mapping) {
                
                convert = mapping[x * 3 + 2];
                range   = mapping[x * 3 + 1];
                
                if ( !convert ) return false;
                
                if( Array.isArray(range) ) {
                        
                    if(argumentz.length - 1 < x)
                        argumentz.push(new Array());
                        
                    argumentz[argumentz.length - 1].push( convert(value, y) );
                    
                    if(++j < (viewport.right - viewport.left) )
                        return true;
                        
                }
                else   
                    argumentz.push( convert(value, y) );
                    
                if ( (x >= (mapping.length / 3) - 1) ) {
                    
                    viewport.multiply.apply(viewport, adapter.dimensions());
                    accessor.apply(selection, argumentz.splice(0, argumentz.length).concat([y]));
                        
                    j = 0;
                        
                    return false;
                }
                    
                return true;
            }
                
            return false;

        }
            
        function update (y, z) {
            return iterator(adapter.row(y, z), null, y);
        }
            
        function iterator (row, key, y) {
            
            if(y < viewport.top || y >= viewport.bottom)
                return;
            
            var x          = 0,
                z          = 0,  m, l, i,
                length     = mapping.length,
                dimensions = adapter.dimensions();
                    
            for(i = 0; i < length; i+=3) {
                        
                m = mapping[i + 1];
                
                if (typeof m === "object") {
                    
                    if( Array.isArray(m) ) {

                        m[0] = typeof m[0] !== "number" ? 0    : m[0];
                        m[1] = typeof m[1] !== "number" ? m[0] : Math.min(row.length, m[1]);

                        viewport.multiply( ( m[1] - m[0] ) + 1 );

                        for(x = viewport.left + m[0], l = viewport.right + m[0]; x < l; x++) {

                            if ( map( x === 0 ? (row[x] || y) : row[x], i / 3, y, z) === false)
                                break;
                        }

                        continue;
                        
                    }
                    
                    m.top  = typeof m.top  === "number" ? m.top  : 0;
                    m.left = typeof m.left === "number" ? m.left : 1;
                    
                    map( adapter.get(m.left - 1, m.top), i / 3, y, z);
                            
                }
                else if (m >= 0) {
                            
                    if(!Number.isFinite(m))
                        throw "Invalid number";
                            
                    x = m;
                    map(x === 0 ? (row[x] || y) : row[x], i / 3, y, z);
                    
                }    
            }   
        }
        
        this.getContext = function selection_mapping_context (name) {
            
            j = 0, argumentz = [];
            return name === "update" ? update : name === "iterator" ? iterator : null;
            
        }
        
    }
    
    Adapter.prototype.select = function (mapping, accessor) {
        
        var selection = this.selection,
            viewport  = this.viewport,
            context   = this;
     
        switch(arguments.length) {
                
                case 1:
                
                    if(typeof mapping === "function") {
                        accessor = mapping;
                        mapping = null;
                    }
                
                case 2:
                
                    if(Array.isArray(mapping))
                        selection.mapping  = mapping;
                    
                    if(typeof accessor === "function")
                        selection.accessor = accessor;
                
                default:
                
                    selection.adapter = this;
                
        }
        
        accessor  = selection.getContext("iterator");
            
        this.forEachSlice(function (matrix, z) {
            matrix.forEachRow(accessor);
            return false;
        });
        
        viewport.multiply.apply(viewport, this.dimensions());
        
        return selection;
    }
    
    Adapter.prototype.toJSON = function () {
        return {
            'name'      : this.name,
            'options'   : this.options
        };
    }

    Adapter.prototype.read =
        function (callback) {

            var context = this,
                
                columns  = [],
                rows     = [],
                
                sp       = this.options.slice || 0,
                error, x, y, z, query;
        
            callback = typeof callback === "function" ? callback  : undefined;
            query    = this.options.query || "";

            query = query.split(",").map(function (q) { return q.trim(); });
        
            this.clear();

            try {

               jsonQuerySelector.call(this, this.data(), query, function (key, value, _, trail) {
                   
                   if( (x = columns.indexOf(key)) === -1) {
                       
                       x = columns.length;
                       columns.push(key);
                       
                   }
                   
                   context.set(x, -1, 0, key);
                   
                   if( ( z = rows.indexOf(key = trail.slice(0, sp).join("."))) === -1) {
                       
                       z = rows.length;
                       rows.push(key, []);
                   }
                   
                   if( ( y = rows[z+1].indexOf(key = trail.slice(sp, trail.length).join("."))) === -1) {
                       
                       rows[z+1].push(key);
                       y = rows[z+1].length - 1;
                       
                   }
                   
                   z /= 2;
                   
                   context.set(-1, y, z, key);
                   context.set(x, y, z, value);
                   
                    
                });

            } catch (e) {
                error = e;
            }

            if (typeof callback === "function")
                callback.call(this, error);
            else if(error)
                throw error;
        
            return this;
        
    }
    
    function write(path, value, callback) {

            var tree  = this.data(),
                type  = this._types,
                error;

            path = String(path).split(".");

            for (var i = 0, len = path.length, name; i < len; i++) {

                name       = path[i];
                
                tree[name] = tree[name] || {};
                type[name] = type[name] || {};

                if (i === len - 1) {

                    if (typeof value === 'object') {

                        for (var k in value)
                            write.call(this, path.join(".") + "." + k, value[k], callback);

                    } else {

                        type = type[name] =
                            typeof type[name] !== "string" ? (typeof value) : type[name];

                        if (typeof type === "string" && typeof value !== type) {
                            error = new Error("Wrong type, should be " + type + ". It is not allowed to have more than one data type in a column.");
                            break;
                        }

                        push.call(this, tree, name, path.slice(0,i).join("."), value);
                    }

                    break;

                }

                tree = tree[name];
                type = type[name];

            }

            if (typeof callback === "function")
                callback.call(this, error);

            return this;
    }
    
    Adapter.prototype.write = write;    

    return Adapter;

});