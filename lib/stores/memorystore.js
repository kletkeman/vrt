/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
      'debug'
    , 'bson'
    , 'jquery'
    , 'path'
    , 'module'
    , 'fs'
    , 'lib/store'
    , 'stream'
    , 'lib/api'
],
function(
      debug
    , bson
    , $
    , path
    , module
    , fs
    , Store
    , Stream
    , vrt
) {
    
    var BSON = bson.pure().BSON, __etcdir__ = path.resolve(path.dirname(module.uri), '../../etc/');
    
    Stream = Stream.Stream;

    function MemoryStore () {
                        
        Store.apply(this, arguments);
        this._data = {};
        
        process.on('exit', function exit () {
            
            this.writeBSON('../../etc/memorystore.tree.bson', this.tree);
            this.writeBSON('../../etc/memorystore.data.bson', this._data);
            
        }.bind(this));

    };
    
    /**
    * Inherits from Store.
    */

    MemoryStore.prototype.__proto__ = Store.prototype;
    
    MemoryStore.prototype.writeBSON = function (filename, obj, callback) {
        
        if(this.disableFilesystemDumps) return;
        
        filename = path.resolve(path.dirname(module.uri), filename);
                
        return fs[typeof callback === 'function' ? 'writeFile' : 'writeFileSync'](filename, BSON.serialize(obj, false, true, false), callback);
    };
    
    MemoryStore.prototype.readBSON = function (filename, callback) {
        
        var result;
        
        filename = path.resolve(path.dirname(module.uri), filename);
        
        if(typeof callback === 'function')
            return fs.readFile(filename, function (err, contents) {
                
                if(err)
                    return callback(err);
                
                return callback(undefined, BSON.deserialize(contents));
                
            });
        
        try { 
            result   = BSON.deserialize(fs.readFileSync(filename)); 
        } catch (e) { vrt.log.error(e); result = {}; } 
        finally { 
            return result;
        }
        
    };
    
    MemoryStore.prototype.reload = function(callback) {                       
        
        var  context = this;
        
        $.extend(this.tree, this.readBSON('../../etc/memorystore.tree.bson'));
        $.extend(this._data,  this.readBSON('../../etc/memorystore.data.bson'));
        $.each(fs.readdirSync(__etcdir__), function (_, filename) {
            if(filename.match(/memorystore.widget.*.bson/gi))
                vrt.create(context.readBSON(__etcdir__ + '/' + filename), false);
        });
    
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


            })([].concat(data).map(function(d) { return Array.isArray(d) ? [].concat(d) : d; }), undefined, 0);

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
        
        return this.writeBSON('../../etc/memorystore.widget.'+dataset.id+'.bson', dataset, function(err) {
            
            if(err) {
                if(typeof callback === 'function') return callback(err);
                throw err;
            }
            
            if(typeof callback === 'function')
                callback(err, dataset); 
        });
    };

    MemoryStore.prototype.destroy = function(id, callback) {

        delete this._data[id];
        
        return fs[typeof callback === 'function' ? 'unlink' : 'unlinkSync'](__etcdir__ + '/memorystore.widget.'+id+'.bson', callback);

    };
    
    MemoryStore.prototype.typeNames = function () {
      return fs.readdirSync(path.resolve(path.dirname(module.uri), '../types/base'))
               .sort()
               .map(function(filename) {
                  return path.basename(filename, '.js');
               });
    };
    
    MemoryStore.prototype.save = function (dataset, callback) {
        return this.writeBSON('../../etc/memorystore.widget.'+dataset.id+'.bson', dataset, callback);
    };

    return MemoryStore;

});
