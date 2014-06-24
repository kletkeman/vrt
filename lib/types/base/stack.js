define(['types/dataset', 'lib/queue', 'lib/api'], function( DataSet, Queue, vrt ) {

	function Stack(fields) {
		
		fields.bufferSize = 0;
		fields.mode       = ( typeof fields.blueprint === 'object' && (Stack.required.identifier = String) ) && 
							  ( typeof fields.identifier === 'string' ) ? 
							  	  1 : 0;
			
	  	DataSet.call(this, fields);
	
		if(fields.mode)
		{
			this.format = vrt.type(fields.blueprint.type).prototype.format;
			this.queue  = new Queue(this.queue);
			
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
			  			return vrt.collection[config.id]||config;
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
        
        that.queue && (function(identifier) {
            for(var key in identifier) 
                identifier[key] = String(identifier[key]);
        })(that.queue.identifier);
		
		return DataSet.prototype.toJSON.call(that);
	};
    
    Stack.prototype.destroy = function(widget) {
        
        for(var i in this.datasets) {
            if( (this.datasets[i] && widget === this.datasets[i].id || widget === this.datasets[i]) && (widget = this.datasets[i])) {
                
                if(this.queue)
                    for(var label in this.queue.identifier)
                        if(this.queue.identifier[label] === widget.id)
                            delete this.queue.identifier[label];
                
                delete this.datasets[i];
                
                return widget.destroy();
            }
        }
        
        for(var i in this.datasets) {
            throw new Error("All datasets must be destroyed before destroying the stack")     
        }
            
        return  DataSet.destroy.apply(this, arguments);
    };
    
    Stack.findParent = function() {
        
        for(var id in vrt.collection) {
            if((stack = vrt.collection[id]) instanceof Stack) {
                for(var i in stack.datasets) {
                    var widget = stack.datasets[i];
                    if(widget.id === arguments[0] || widget === arguments[0])
                        return stack;
                }
            }
        }
        
    };
	
	Stack.prototype.__proto__ =  DataSet.prototype;

	return Stack;

});
