;!(function(module) {

	function Stack(fields) {
		
		fields.bufferSize = 0;
		fields.mode       = ( typeof fields.blueprint === 'object' && (Stack.required.identifier = String) ) && 
							  ( typeof fields.identifier === 'string' ) ? 
							  	  1 : 0;
			
	  	vrt.Api.DataSet.call(this, fields);
	
		if(fields.mode)
		{
			this.format = vrt.Api[fields.blueprint.type.capitalize()].prototype.format;
			this.queue  = new vrt.Api.Queue(this.queue);
			
			delete fields.blueprint.id;
		}
	
		delete Stack.required.identifier;
	   
        this._configure();
		
	};

	Stack.required = {
		datasets : Object,
		mode : Number
	};
	
	Stack.prototype.format = {};
	
	Stack.prototype._configure = function() {
		
		for(var i in this.datasets)
			(function(context, i) {

				var config = context.datasets[i];

				Object.defineProperty(context.datasets, i, {
			  		enumerable: true,
			  		configurable: true,
			  		get: function() {
			  			return vrt.Api.DataSet.collection[config.id]||config;
			  		}
				});

			})(this, i);

	};
	
	Stack.prototype.toJSON = function() {
		
		var that = $.extend({}, this, {datasets: {}});
		
		for(var i in this.datasets)
			that.datasets[i] = $.extend({}, {
				id: this.datasets[i].id
			});
		
		return vrt.Api.DataSet.prototype.toJSON.call(that);
	};
    
    Stack.prototype.destroy = function(widget) {
        
        for(var i in this.datasets) {
            if(this.datasets[i] && widget === this.datasets[i].id || widget === this.datasets[i]) {
                
                for(var label in this.queue.identifier)
                    if(this.queue.identifier[label] === this.datasets[i].id)
                        delete this.queue.identifier[label];
                delete this.datasets[i];
                
                return widget.destroy();
            }
        }
        
        for(var i in this.datasets) {
            throw new Error("All datasets must be destroyed before destroying the stack")     
        }
            
        return  vrt.Api.DataSet.destroy.apply(this, arguments);
    };
    
    Stack.findParent = function() {
        
        for(var id in vrt.Api.DataSet.collection) {
            if((stack = vrt.Api.DataSet.collection[id]) instanceof Stack) {
                for(var i in stack.datasets) {
                    var widget = stack.datasets[i];
                    if(widget.id === arguments[0] || widget === arguments[0])
                        return stack;
                }
            }
        }
        
    };
	
	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);