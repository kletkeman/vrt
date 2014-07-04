define(['bson', 'jquery', 'path', 'module', 'fs', 'lib/store', 'stream', 'lib/api'], function(bson, $, path, module, fs, Store, Stream, vrt) {
    
    var BSON = bson.pure().BSON;
    
    Stream = Stream.Stream;

    function MemoryStore() {
                
        Store.apply(this, arguments);
        this._data = {};
        
        process.on('exit', function exit () {
            
            vrt.log.debug("MemoryStore: Dumping to etc/ ...");
            try {
                fs.writeFileSync(path.resolve(path.dirname(module.uri), '../../etc/tree.bson'), BSON.serialize(this.tree, false, true, false)),
                fs.writeFileSync(path.resolve(path.dirname(module.uri), '../../etc/collection.bson'), BSON.serialize(vrt.collection, false, true, false));
                fs.writeFileSync(path.resolve(path.dirname(module.uri), '../../etc/data.bson'), BSON.serialize(this._data, false, true, false));
            } catch (e) { vrt.log.error(e); }
            
        }.bind(this));

    };
    
    /**
    * Inherits from Store.
    */

    MemoryStore.prototype.__proto__ = Store.prototype;
    
    MemoryStore.prototype.reload = function(callback) {
        
        var tree, collection, data;
        
        require = require.nodeRequire;
        
        try { 
            tree   = BSON.deserialize(fs.readFileSync(path.resolve(path.dirname(module.uri), '../../etc/tree.bson'))); 
        } catch (e) { tree = {}; } 
        finally { 
            this.tree = $.extend(this.tree, tree);
        }
        
        try { 
            data   = BSON.deserialize(fs.readFileSync(path.resolve(path.dirname(module.uri), '../../etc/data.bson'))); 
        } catch (e) { data = {}; } 
        finally { 
            this._data = $.extend(this._data, data);
        }
        
        try { 
            collection   = BSON.deserialize(fs.readFileSync(path.resolve(path.dirname(module.uri), '../../etc/collection.bson'))); 
        } catch (e) { collection = {}; }
        finally { 
            $.each(collection, function (_, fields) {
                vrt.create(fields, false);
            });
        }
        
        return Store.prototype.reload.apply(this, arguments);
        
    };

    MemoryStore.prototype.get = function(id, callback) {

        var error, obj = vrt.collection[id];

        if(typeof obj === 'undefined')
            error = new Error('Object with `id` ['+id+'] does not exist.');

        if(typeof callback === 'function')
            return callback(error, obj);
        else if(error)
            throw error;

        return obj;
    };

    MemoryStore.prototype.data = function (id, callback) {

        var context = this, 
            stack   = [], 
            data    = this._data[id] || null;

        function m (d) {
            return d[2];
        };

        function write (d, x, y) {

            d = arguments.length === 1 ? d : 
                Object.defineProperty({}, Array.prototype.slice.call(arguments, x === undefined ? 2 : 1, 3).join("."), 
                                      { 
                                          enumerable: true, 
                                          value: d 
                                      });

            if(callback instanceof Stream)
                return callback.write(d);
            else if(typeof callback === 'function')
                return callback(null, d);
        };

        function end (d) {

            if(callback instanceof Stream)
                    return callback.end.apply(this, d ? [d] : []);
                else if(typeof callback === 'function')
                    return callback(null, d, true);
        };

        if(Array.isArray(data))
            (function chunked ( data, x, y ) {

                if(!arguments.length)
                    return chunked.apply(null, stack.pop());

                stack.push(arguments);

                if((function walk (d) {

                    if(Array.isArray(d)) {

                        for(len=d.length,chunk=y+8;y<len;y++) {

                            if(y >= chunk)
                                return setImmediate(chunked), false;

                            if( Array.isArray( d[y] ) )
                                return stack.push([d[y], y++, 0]), setImmediate(chunked), false;

                            write(d[y], x, y);
                        }

                    }
                    else
                        write(d, x, y);

                    return true;

                })(data))
                {
                    stack.pop();

                    if(stack.length)
                        return setImmediate(chunked);

                    return end();
                }


            })([].concat(data), undefined, 0);

        else if (typeof data === 'object')
            return end(data);

    };

    MemoryStore.prototype.delete = function(id, filter_index, path, callback) {

        var info = Store.delete.call(this, filter_index, path, ['_data', id].join("."));

        if(typeof callback === 'function')
            return callback(undefined, info);

        return info;

    };

    MemoryStore.prototype.push = function(x, y, id, data, callback) {

        var dataset, err;

        if(dataset = this.get(id)) {

            this._data[id] = this._data[id] || (dataset.bufferSize ? [] : {});

            if(dataset.bufferSize) {

                if(typeof x === 'number') {

                    this._data[id][x] = Array.isArray(this._data[id][x]) ? 
                        this._data[id][x] : (typeof y !== 'number' ? 
                            (typeof data  ===  'object' && typeof this._data[id][x] === 'object' ? 
                                $.extend( true, this._data[id][x], data ) : data) : []);

                    if(typeof y === 'number')
                        this._data[id][x][y] = (typeof data  ===  'object' && typeof this._data[id][x][y] === 'object' ?
                            $.extend( true, this._data[id][x][y], data ) : data);

                    else if ( Array.isArray(this._data[id][x]) ) {

                        this._data[id][x].push(data);

                        while(dataset.bufferSize < this._data[id][x].length)
                            this._data[id][x].shift();
                    }
                }
                else {

                    this._data[id].push(data);

                    while(dataset.bufferSize < this._data[id].length)
                        this._data[id].shift();
                }
            }
            else if(typeof data === 'object')
                $.extend( true, this._data[id], data );
            else 
                err = new Error('Invalid data format ['+(typeof data).capitalize()+']');

            dataset.onReceive(data, x, y);

        }
        else
            err = new Error('Object with id `'+id+'` does not exist');

        if(typeof callback === 'function')
            callback(err, dataset);

        return dataset;
    };

    MemoryStore.prototype.select = function(id, selector, callback) {
        return Store.prototype.select.call(this, id, selector, this._data[id], callback);
    };

    MemoryStore.prototype.create = function(dataset, callback) {

        dataset.data = dataset.data || (dataset.bufferSize ? [] : {});

        if(typeof callback === 'function')
            callback(undefined, dataset);

        return dataset;
    };

    MemoryStore.prototype.destroy = function(id, callback) {

        delete this._data[id];

        if(typeof callback === 'function')
            return callback();
    };
    
    MemoryStore.prototype.typeNames = function () {
      return fs.readdirSync(path.resolve(path.dirname(module.uri), '../types/base'))
               .sort()
               .map(function(filename) {
                  return path.basename(filename, '.js');
               });
    };

    return MemoryStore;

});
