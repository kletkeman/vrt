define(['lib/api'], function (vrt) {

	/**
	 * Store constructor.
	 *
	 * @api public
	 */

	var Store = function() {
		this.tree = new this.Tree();
	};

	Store.prototype.Tree = function() {};

	Store.prototype.Tree.prototype.get = function() {

		var path, callback, args = Array.prototype.slice.call(arguments, 0, 2);

		callback = args.pop();
		path = String(args.shift());

		if(typeof callback !== 'function')
			return;

		if(!path || path === '*')
			callback(undefined, this);

		path = path.split(".");

		for(var i = 0, len = path.length, tree = this, name; i < len; i++) {

			name = path[i];

			if(typeof tree[name] !== 'object')
				tree = new (function(key, value, undefined) {if(value !== undefined) this[key] = value;})(name, tree[name]);
			else
				tree = tree[name];

			if(i === len - 1)
				return callback(undefined, tree);
		}

	    return callback(undefined, {});
	};

	Store.prototype.Tree.prototype.delete = function(path, callback) {
			
		path = String(path).split(".");
		
		for(var i = 0, len = path.length, tree = this,  name; i < len; i++) {
				
			name = path[i];
				
				if(i === len - 1)
					delete tree[name];
					
				tree = tree[name];
		}

		if(typeof callback === 'function')		
			callback();
			
	};

	Store.prototype.Tree.prototype.write = function(path, data, callback) {

		path = String(path).split(".");
	
		for(var i = 0, len = path.length, tree = this, name; i < len; i++) {
			
			name = path[i];
			tree[name] = tree[name] || {};
			
			if(i === len - 1) {
				if(typeof data === 'object')
					$.extend(true, tree[name], data);
				else 
					tree[name] = data;
			}
			
			tree = tree[name];
		}

		if(typeof callback === 'function')		
			return callback();
        
        return this;
	};
    
    Store.prototype.Tree.prototype.break = function(level) {
        
        var stack = [], length, list = {};
        
        function walk(d) {
            
            length = stack.push(null);
            
            for (var k in d) {
                
                stack[stack.length - 1] = k;
                
                if(typeof d[k] === 'object')
                    walk(d[k])
                else
                    list[stack.join('.')] = d[k];
            }
            
            stack.pop();
				
            return list;
        };
        
        walk(this);
        
        if(level < 0) {
            
            var _list = {}, path, _k;
            
            for (var k in list) {
                
                if((length = (stack = k.split('.')).length) >= 2 && (length + level) >= 1) {
                    
                    _k = stack.slice(level).join('.');
                    
                    Store.prototype.Tree.prototype.write.call((_list[(path = stack.slice(0, stack.length + level).join('.'))] = _list[path] || {}), _k, list[k]);
                }
                else
                    _list[k] = list[k];
                
            }
            
            list = _list;
        }
        
        return list;
    };

	/**
	 * Publish data to client
	 *
	 * @param {String} id
	 * @param {String} eventHandlerName
	 * @param {Array} args
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.publish = function(id, eventHandlerName, args, callback) { };

	/**
	 * Receive data from server
	 *
	 * @param {String} id
	 * @param {String} eventHandlerName
	 * @param {Object} data
	 * @return undefined
	 * @api public
	 */

	Store.prototype.receive = function(id, eventHandlerName, data) { };

	/**
	 * Get object configuration
	 *
	 * @param {String} id
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.get = function(id, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Get data
	 * 
	 * Subsequent calls to callback with arguments(err, data, eof);
	 *
	 * if callback is a Function data will contain an object with a key with format [x].[y] that describes position in array(s)
	 * when eof is true there is no more data
	 *
	 * callback can also be a writable stream, stream will receive same data as if it was a function
	 *
	 * @param {String} id
	 * @param {Function,[Stream]} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.data = function(id, callback) { };

	/**
	 * Push object data
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {String} id
	 * @param {Object} data
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.push = function(x, y, id, data, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Update object data
	 *
	 * @param {id} String
	 * @param {Object} selector
	 * @param {Object} data
	 * @param {Function} callback
	 *
	 * Updates only first match found
	 *
	 * @return undefined
	 * @api public
	 */

	Store.prototype.update = function(id, selector, data, callback) {

		var context = this;

		this.select(id, selector, function(err, found) {

			if (err) {
							
				if(typeof callback !== 'function') throw err;
				return callback(err);
			}	
			
			var args = [];
			
			for(var path in found) {
				args = path.split('.').map(function(n) { return Number(n); }); break;
			}

			while(args.length < 2) args.push(undefined);
					
			args.push(id);
			args.push(data);
			args.push(callback);

			return context.push.apply(context, args);

		});

	};

	/**
	 * Store configuration if it does not exists in the store
	 * 
	 * This function should call instance.onCreate() if configuration does not exist in the store
	 * 
	 * DataSet.collection contains a hashset of all instances with instance.id as the key
	 * All processes should have an instance of the type in memory, eventually
	 *
	 * @param {Object} instance
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.create = function(instance, callback) {
		if(typeof callback === 'function')
			callback(null, instance);
	};
    
    /**
     * Delete data
     *
     * @param {String} id
     * @param {Object,Number} filter_index
     * @param {String} path
     * @param {Function} callback
     * @return {Object}
     * @api public
     *    
     */
    
    Store.prototype.delete = function(id, filter_index, path, callback) {
		if(typeof callback === 'function')
			callback();
	};
    
     /**
     * Helper function
     *
     * @param {Object,Number} filter_index
     * @param {String} path
     * @return undefined
     * @api public
     *    
     */
    
    Store.delete = function(filter_index, path, dataPropertyName) {
        
        var filter = (typeof filter_index === 'object' ? filter_index : undefined),
            index = (typeof filter_index === 'number' ? filter_index : undefined),
            f, context = this, affected = [];
        
        path = (typeof path === 'string' ? path.split(".") : path);        
        
        function dataProperty(dataPropertyName, data) {
            
            var d = context, dataPropertyName = (typeof dataPropertyName === 'string' ? dataPropertyName.split(".") : "");
            
            for(var i = 0, len = dataPropertyName.length, p = dataPropertyName[i]; i < len; i++, p = dataPropertyName[i]) {

                if(typeof d === 'object') {
                    if(p === dataPropertyName[len - 1])
                        return data !== undefined ? (d[p] = data) : d[p];
                    else d = d[p];
                }


            }
            
        };
        
        d = dataProperty(dataPropertyName);
        
        function deleteProperty(d, i) {
            
            var root = d, modified = false;
            
            for(var i = 0, len = path.length, p = path[i]; i < len; i++, p = path[i]) {

                if(typeof d === 'object') {
                    if(p === path[len - 1]) {
                        modified = (d[p] !== undefined);
                        delete d[p];
                    }
                    else d = d[p];
                }

            }
            
            if(modified)
                affected.push(root);

        };

        if(Array.isArray(d) && (filter || index !== undefined ) ) {

            d = d.filter(function(d, i) {

                if( index !== undefined  )
                    return (f = ( path ? (i === index) : (i !== index) )), (path||f||affected.push(d)), f;

                f = true;

                if(filter)
                    for( var k in filter )
                        f &= (d[k] !== filter[k]);

                return (f = (path ? !f : f)), (path||f||affected.push(d)), f;

            });
        }

        if( d && ( (filter || index !== undefined ) && !path) )
            dataProperty(dataPropertyName, d);
        else if(Array.isArray(d) && path ) {
            d.forEach(deleteProperty);
        }
        else if(d instanceof Object && path) deleteProperty(d);
        
        return {'index': index, 'filter': filter, 'path': path, 'affected': affected};
        
        
    };
    
    /**
     * Deletes the object configuration and data
     *
     * @param {String} id
     * @param {Function} callback
     * @return undefined
     * @api public
     *    
     */
    
    Store.prototype.destroy = function(id, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Save configuration
	 *
	 * @param {Object} dataset
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.save = function(dataset, callback) { 
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * List objects
	 * Optional first parameter with properties to match with object and filter results.
	 *
	 * @param {Object} properties
	 * @param {Function} callback
	 * @return {Array}
	 * @api public
	 */

	Store.prototype.list = function() {

		var args = Array.prototype.slice.call(arguments),
			list = [],
			properties = args[0],
			callback = args[1] || args[0];

		for(var id in vrt.collection) {

			if(!(typeof properties === 'object') || (function() {
		    	
		    	var obj = vrt.collection[id],
		        	match = true;

		        for(var name in properties)
		        	match &= (properties[name] === obj[name]);

		        return match;

		      })()) list.push(id);
		};

		if(typeof callback === 'function')
			callback(null, list);

		return list;
	};
	
    /**
     * Select data
     *
     * @param {String} id
     * @param {Object} selector
     * @param {Array} data
     * @param {Function} callback
	 *
     * (id, selector, [data, callback])
     *
     * @api public
     */

    Store.prototype.select = function (id, selector) {

    	var data     = Array.isArray(arguments[2]) ? arguments[2] : [],
    		callback = (typeof arguments[2] === 'function' ? arguments[2] : arguments[3]),
    		stack    = [], err;

    	if(typeof selector !== 'object')
    		throw new Error("TypeError: Missing required argument 'selector' [Object]");

    	function walk(d2, d1) {

			d1 = d1 || {length: 0};

			stack.push(null);

			for (var i = 0, len = d2.length, m; i < len; i++) {

				stack[stack.length - 1] = i;

				if(Array.isArray(d2[i])) {
					walk(d2[i], d1);
					continue;
				} 

				m = true;

				for (var name in selector)
					m &= (d2[i] && selector[name] === d2[i][name]);

					if (m) {
						(d1[stack.join('.')] = d2[i]);
						d1.length++;
					}
			
			}

			stack.pop();

			if(!stack.length && !d1.length)
				d1 = false;
			else
				delete d1.length;

			return d1;

		};


		if(typeof callback === 'function' && !data)
		    return this.get(id, function(err, obj) {
		
		  		if (err) {
						 
				 	if(typeof callback !== 'function') throw err;
					 return callback(err);
				}

				
				return callback(null, walk(obj.data));

		  	});
		else if(data) {
			if(typeof callback === 'function')	
				return callback(null, walk(data));
			return walk(data);
		}

    };

	/**
	 * Reload objects
	 *
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.reload = function(callback) {
		if(typeof callback === 'function')
			callback();
	};


	/**
	 * Get available types
	 *
	 * @return Array
	 * @api public
	 */

	Store.prototype.typeNames = function() { 
    return []; 
  };
    
  return Store;
    
});
