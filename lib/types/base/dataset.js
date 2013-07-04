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

  };

  DataSet.prototype.set = function(name, value) {
  
    if(typeof name !== 'string' || typeof value === 'undefined')
      throw new Error('Invalid argument(s): Must provide a name (string) and a value.');
    else if(typeof this[name] === 'undefined')
      throw new Error('Property "'+name+'" does not exist');

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

  DataSet.prototype.select = function(selector, callback) {
	return vrt.select(this.id, selector, callback);
  };

  DataSet.prototype.save = function(callback) {
    return vrt.save(this.id, callback);
  };

  DataSet.prototype.verify = function(data) {
    for(var name in this.format)
      if( (typeof data[name] === 'undefined' || data[name].constructor.name !== this.format[name].name) )
        throw new Error('Data has wrong format, correct format is : ' + (function(f) {var desc = {};for(var n in f) desc[n] = f[n].name; return JSON.stringify(desc);})(this.format));
  };

  DataSet.prototype.toJSON = function() {
	
	var that = $.extend(true, {}, this);
	
	delete that.toJSON;
	
	if(typeof that.schema === 'object')
		for(var path in that.schema) {
			if(typeof that.schema[path] === 'object' && typeof that.schema[path].defaults === 'object')
			{
				that.schema[path].defaults = $.extend(true, {}, that.schema[path].defaults);
				
				for(var key in that.schema[path].defaults)
				{
					if(typeof that.schema[path].defaults[key] === 'function')
					{
						that.schema[path].defaults[key] = that.schema[path].defaults[key].toString();
						
						if( /function (\w+)\(\) \{ \[native code\] \}/i.test(that.schema[path].defaults[key]) )
						{
							delete that.schema[path].defaults[key];
						}
					}
				}
			}
		}
		
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