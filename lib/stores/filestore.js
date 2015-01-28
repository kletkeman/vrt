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
    , vrt
) {
    
    const BSON = bson.pure().BSON, __etcdir__ = path.resolve(path.dirname(module.uri), '../../etc/');
    
    function FileStore () {
        Store.apply(this, arguments);
    }
    
    /**
    * Inherits from Store.
    */

    FileStore.prototype = Object.create(Store.prototype);
    
    FileStore.prototype.writeBSON =
    function (filename, obj, callback) {
        
        filename = path.resolve(path.dirname(module.uri), filename);
                
        return fs[typeof callback === 'function' ? 'writeFile' : 'writeFileSync'](filename, BSON.serialize(obj, false, true, false), callback);
    };
    
    FileStore.prototype.readBSON =
    function (filename, callback) {
        
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
    
    FileStore.prototype.list =
    function(callback) {                       
        
        var  context = this, list = [];
        
        return fs.readdir(__etcdir__, function (err, filenames) {
            
            if(err) {
                if(typeof callback === 'function') return callback(err);
                throw err;
            }
            
            $.each(filenames, function (_, filename) {
                if(filename.match(/filestore.widget.*.bson/gi))
                    list.push(filename.substr(17, filename.length - 17 - 5));
            });
            
            if(typeof callback === 'function') return callback(err, list);
            
        });
    }

    FileStore.prototype.get =
    function(id, callback) {
        return this.readBSON(__etcdir__ + '/' + "filestore.widget."+id+".bson", callback);
    }
    
    FileStore.prototype.create =
    function(dataset, callback) {
        
        return this.writeBSON('../../etc/filestore.widget.'+dataset.id+'.bson', dataset, function(err) {
            
            if(err) {
                if(typeof callback === 'function') return callback(err);
                throw err;
            }
            
            if(typeof callback === 'function')
                callback(err, dataset); 
        });
    }

    FileStore.prototype.destroy =
    function(id, callback) {
        return fs[typeof callback === 'function' ? 'unlink' : 'unlinkSync'](__etcdir__ + '/FileStore.widget.'+id+'.bson', callback);
    }
    
    FileStore.prototype.typeNames =
    function (callback) {
      return fs.readdir(path.resolve(path.dirname(module.uri), '../types/base'), function (err, types) {
          callback(err, err? null : types.sort()
               .map(function(filename) {
                  return path.basename(filename, '.js');
               }))
      });     
    }
    
    FileStore.prototype.save =
    function (dataset, callback) {
        return this.writeBSON('../../etc/filestore.widget.'+dataset.id+'.bson', dataset, callback);
    }

    return FileStore;

});
