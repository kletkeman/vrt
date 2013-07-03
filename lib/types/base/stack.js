;!(function(module) {
	
	function Queue(options) {
		this.identifier = {};
		$.extend(true, this, options);
	};
	
	Queue.prototype = Array.prototype;
	
	Queue.prototype.release = function(key, value, callback) {
		
		var len = this.length, i = 0, d, id = this.identifier[value];
		
		if(!id)
			return false;
			
		while(len && i++ < len) {
			
			d = this.shift();
			
			if(d && d[key] === value) {
				callback.call(this, id, d); i--;
			}
			else
				d && this.push(d);
		}
		
		return true;
		
	};
	
	Queue.prototype.stash = function(value, data) {
		
		var identifier = this.identifier[value],
			context = this;
			
		this.push(data);
				
		return function(callback) {
			
			callback.call(context, identifier,
				function(id) {
					context.identifier[value] = id;
					return context;
				}
			);
			
			return context;
		};
	};

	function Stack(fields) {
		
		fields.bufferSize = 0;
		fields.mode       = ( typeof fields.blueprint === 'object' && (Stack.required.identifier = String) ) && 
							  ( typeof fields.identifier === 'string' ) ? 
							  	  1 : 0;
			
	  	vrt.Api.DataSet.call(this, fields);
	
		if(fields.mode)
		{
			this.format = vrt.Api[fields.blueprint.type.capitalize()].prototype.format;
			this.queue  = new Queue(this.queue);
			
			delete fields.blueprint.id;
		}
	
		delete Stack.required.identifier;
	
		
	};

	Stack.required = {
		datasets : Object,
		mode : Number
	};
	
	Stack.prototype.format = {};
	
	Stack.prototype.onCreate = function() {
		
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
			
		if(!vrt.Api.DataSet.collection[this.id]) {
			vrt.Api.DataSet.collection[this.id] = this;
			vrt.Api.DataSet.prototype.onCreate.call(this);
		}

	};
	
	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);