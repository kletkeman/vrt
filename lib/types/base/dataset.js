;!(function(module, Guid) {

  function DataSet(fields) {
    
    if(Guid && typeof Guid.create === 'function') {
      this.id = Guid.create().toString();
	  fields.id = fields.id || this.id;
	  fields.step = typeof fields.step === 'undefined' ? 1e4 : fields.step;
	}

    this.options = {};
    
    if(!(fields instanceof Object))
      throw new Error('TypeError: Missing argument');

    $.extend(this, fields);

    if(typeof this.onCreate === 'function')
      this.onCreate();
    
    // Required properties for all Datasets
    var required = {};
    $.extend(required, arguments.callee.caller.required);
    $.extend(required, arguments.callee.required);

    this.type = this.constructor.name.toLowerCase();
    
    // Check if required properties exists and has the correct type
    for(var propname in required)
      if( (typeof this[propname] === 'undefined' || this[propname].constructor.name !== required[propname].name) && !(this[propname] instanceof required[propname]) )
        throw new Error(typeof this[propname] !== 'undefined' ?
         'Propery `' + propname + '` has wrong type. Type is [' + (typeof this[propname]).capitalize() + '], should be [' + required[propname].name + ']' :
         'Missing property `' + propname + '` [' + required[propname].name + ']');

    
    if(Guid && typeof Guid.isGuid === 'function' && !Guid.isGuid(this.id))
      throw new Error('Property `id` [String] is not a valid UUID');

    var bufferSize = this.bufferSize;

    Object.defineProperty(this, 'bufferSize', {
      set : function(value) {

          bufferSize = value;

          if(!bufferSize)
            this.data = {};
          else 
            this.data = Array.isArray(this.data) ? this.data : [this.data];
        },
        get : function() {
          return bufferSize;
        },
        enumerable : true
      
    })

  };

  DataSet.prototype.set = function(name, value) {
  
    if(typeof name !== 'string' || typeof value === 'undefined')
      throw new Error('Invalid argument(s): Must provide a name (string) and a value.');
    else if(typeof this[name] === 'undefined')
      throw new Error('Property "'+name+'" does not exist');
    else if(['id', 'stacked', 'group', 'sortkey'].indexOf(name) > -1)
      throw new Error('Cannot set property "'+name+'" ILLEGAL');

    this[name] = value;
    
  };

  DataSet.prototype.read = function(callback) {
  return vrt.get(this.id, function(err, obj) {
    callback(err, obj.data);
  });
};

  DataSet.prototype.write = function() {

    var args = Array.prototype.slice.call(arguments),
      x        = args[0],
      data     = args[0],
      callback = args[1],
      context  = this;

    if(typeof x === 'number' && arguments.length === 1)
      return function() { 
        var args = Array.prototype.slice.call(arguments),
          y        = args[0],
          data     = args[0],
          callback = args[1];

        if(typeof y === 'number' && arguments.length === 1)
          return function(data, callback) {
            return vrt.push(x)(y)(context.id, data, callback);
          };

        return vrt.push(x)(context.id, data, callback);
      };

    return vrt.push(this.id, data, callback);
  };

  DataSet.prototype.select = function() {
	 return vrt.store.select.apply(vrt.store, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.update = function() {
   return vrt.store.update.apply(vrt.store, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.save = function() {
    return vrt.save.apply(vrt, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.verify = function(data) {
    for(var name in this.format)
      if( (typeof data[name] === 'undefined' || data[name].constructor.name !== this.format[name].name) )
        throw new Error('Data has wrong format, correct format is : ' + (function(f) {var desc = {};for(var n in f) desc[n] = f[n].name; return JSON.stringify(desc);})(this.format));
  };

  DataSet.prototype.toJSON = function() {
	
	var that = $.extend(true, {}, this);
	
	delete that.toJSON;
  delete that.format;
	
	if(typeof that.schema === 'object') {
		for(var path in that.schema) {
			if(typeof that.schema[path] === 'object' && typeof that.schema[path].defaults === 'object')
			{
				that.schema[path].defaults = $.extend(true, {}, that.schema[path].defaults);
				
				for(var key in that.schema[path].defaults)
				{
					if(typeof that.schema[path].defaults[key] === 'function')
					{
						that.schema[path].defaults[key] = that.schema[path].defaults[key].toString();
						
						var m, f;
						if( m = /function (\w+)\(\) \{ \[native code\] \}/i.exec(f = that.schema[path].defaults[key]) )
						{
							that.schema[path].defaults[key] = new Function("d", "return " + m[1] + "(d);").toString();
						}
					}
				}
			}
		}

    that.schema = JSON.stringify(that.schema);
  }
		
	return that;

  };

  DataSet.prototype.fromJSON = function() {

    var that = $.extend(true, {}, this);

    function walk(obj) {

        for(var key in obj) {
 
          if(typeof obj[key] === 'object') {
            walk(obj[key]);
          }
          else if(typeof obj[key] === 'string' && obj[key].match(/^(function(.*)\((.*)\))/gi))           
            obj[key] = (new Function('return ' + obj[key]))();

        }
    };

    if(typeof that.schema === 'string')
      (that.schema = JSON.parse(that.schema)) && walk(that.schema);

    return that;

  };

  DataSet.required = {
    
    sortKey : Number,
    group : String,
    onCreate : Function,
    onReceive : Function,
    onError : Function,
    type : String,
    id : String,  
    height : String,
    width : String,
    title : String,
    description : String,
    bufferSize : Number,
    options: Object,
    read : Function,
    write : Function,
    save : Function,
    format : Object,
    step : Number

  };

  DataSet.collection = {};

  if(module.exports)
    module.exports = DataSet;
  else 
    module.vrt.Api.DataSet = DataSet;

})(typeof module === 'undefined' ? window : module, typeof Guid === 'undefined' ? undefined : Guid);