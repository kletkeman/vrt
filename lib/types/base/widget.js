/*
    Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'jquery'
    , 'guid'
    , 'lib/api'
    , 'debug'
], 
function(
      $
    , Guid
    , vrt
    , debug

) { debug = debug("widget:base");
    
  function verify (required, properties) {
        
        var context = this,
            optional, propertyName, requiredProperty, thisProperty;
        
        for(propertyName in required) {
            
            optional = propertyName.match(/^(\()(.*?)(\))$/),
            requiredProperty = required[propertyName];

            if(optional) {

                propertyName = optional[2];
                
                if(Array.isArray(properties) && properties.indexOf(propertyName) === -1)
                    properties.push(propertyName);

                if( typeof this[propertyName] === 'undefined' ) {
                    
                    if(typeof requiredProperty === 'function') {
                        (this[propertyName] = requiredProperty()); continue;
                    }
                    else if (typeof requiredProperty === 'object' && !Array.isArray(requiredProperty) )
                        (this[propertyName] = Object());         
                    
                }
                
            }
            
            if(Array.isArray(properties)) {
               
               if(properties.indexOf(propertyName) === -1)
                    properties.push(propertyName);
            
                continue;
            
            }   
            
            if(Array.isArray(requiredProperty)) {
                
                var errors = [];
                
                requiredProperty.forEach(                    
                    
                    function multiple (requiredProperty) {
                        
                        var required = {}; (required[optional ? optional[0] : propertyName] = requiredProperty);
                        
                        try {
                            verify.call(context, required);
                        }
                        catch(err) {
                            errors.push(err);
                        }
                    
                    }
                );
                
                if(errors.length === requiredProperty.length)
                    throw errors;
                
                continue;
            }
                        
            thisProperty = this[propertyName];
            
            (function (requiredProperty) {

                if( ( (typeof thisProperty === 'undefined') || thisProperty.constructor.name !== requiredProperty.name) && !(thisProperty instanceof requiredProperty) )
                    throw new Error(typeof thisProperty !== 'undefined' ?
                        'Propery `' + propertyName + '` has wrong type. Type is [' + (typeof thisProperty).capitalize() + '], should be [' + requiredProperty.name + ']' :
                            'Missing property `' + propertyName + '` [' + requiredProperty.name + ']');
                
            }).call(this, typeof requiredProperty === 'object' ? Object : requiredProperty);
            
            if(typeof requiredProperty === 'object')
                verify.call(thisProperty, requiredProperty);

        }
      
      return properties;
  }

  function Widget (fields) {
    
    var required = [];
      
    if(!Guid.isGuid(fields.id))
          fields.id = Guid.create().toString();
      
    this.toBSON = this.toJSON;
          
    if(typeof fields !== 'object')
      throw new Error('TypeError: Missing argument');    
    
    $.extend(this, fields);
      
    Object.defineProperty(this, "id", {
        enumerable: true,
        writable: false,
        value: this.id
    });
      
    verify.call(this, Widget.required, required);
    verify.call(this, vrt.type[fields.type].required, required);
    
    if(typeof this.create === 'function') this.create();

    verify.call(this, Widget.required);
    verify.call(this, vrt.type[fields.type].required);
    
    vrt.type[fields.type].keys = required;
      
  }
   
  Widget.prototype.toJSON = function () {
      
      var context  = this,
          keys = vrt.type[this.type].keys || [],
          obj      = {};
      
      for(var i = 0; i < keys.length; i++) {
          
          name = keys[i];
          
          if(typeof this[name] !== "function")
            obj[name] = this[name];
          
      }
      
      return JSON.parse(JSON.stringify(obj));
      
  }   

  Widget.prototype.set = function (name, value) {
          
    if(typeof name !== 'string' || typeof value === 'undefined')
      throw new Error('Invalid argument(s): Must provide a name (string) and a value.');
    else if(typeof this[name] === 'undefined')
      throw new Error('Property "'+name+'" does not exist');
      
    if(typeof this[name] === 'object' && typeof value === 'object' && !Array.isArray(this[name]))
        return $.extend(true, this[name], value);

    return (this[name] = value);
    
  }

  Widget.prototype.save = function() {
    return vrt.save.apply(vrt, [this.id].concat(Array.prototype.slice.call(arguments)));
  }
  
  Widget.prototype.destroy = function() {
      return Widget.destroy.call(this);
  }
  
  Widget.destroy = function () {
      vrt.destroy(this.id);
  }
                                      
  // Properties in parantheses are optional

  Widget.required = {

    '(position)'      : {
        '(left)' : Number,
        '(top)'  : Number
    },
    'group'           : String,
    'type'            : String,
    'id'              : String,  
    'height'          : [String, Number],
    'width'           : [String, Number],
    'title'           : String,
    '(description)'   : String,
    '(options)'       : Object,
    '(background)'    : String,
    'save'            : Function,
    'toJSON'          : Function,
    'toBSON'          : Function,
    'destroy'         : Function,
    'set'             : Function,
    '(data)'          : Object,
    '(margin)'        : {
        '(top)'   : [String, Number],
        '(bottom)': [String, Number],
        '(left)'  : [String, Number],
        '(right)' : [String, Number]             
    },
    '(selector)' : Array
  }
                               
  Widget.events = {};

  return Widget;

});
