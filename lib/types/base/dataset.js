;!(function(module, Guid) {

  function DataSet(fields) {
    
    if(Guid && typeof Guid.create === 'function')
      this.id = Guid.create().toString();

    this.options = {};
    
    if(!(fields instanceof Object))
      throw new Error('TypeError: Missing argument');

    Object.extend(this, fields);

    if(typeof this.onCreate === 'function')
      this.onCreate();
    
    // Required properties for all Datasets
    var required = {};
    Object.extend(required, arguments.callee.caller.required);
    Object.extend(required, arguments.callee.required);

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
    options: Object

  };

  DataSet.collection = {};

  if(module.exports)
    module.exports = DataSet;
  else 
    module.vrt.Api.DataSet = DataSet;

})(typeof module === 'undefined' ? window : module, typeof Guid === 'undefined' ? undefined : Guid);