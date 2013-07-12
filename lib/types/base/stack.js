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
	
	Stack.prototype.toJSON = function() {
		
		var that = $.extend({}, this, {datasets: {}});
		
		for(var i in this.datasets)
			that.datasets[i] = $.extend({}, {
				id: this.datasets[i].id
			});
		
		return vrt.Api.DataSet.prototype.toJSON.call(that);
	};
	
	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);