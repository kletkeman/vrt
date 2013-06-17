;!(function(module) {

	function Stack(fields) {
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Stack.required = {
		datasets : Object
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
		
		vrt.Api.DataSet.collection[this.id] = this;
		vrt.Api.DataSet.prototype.onCreate.call(this);

	};
	
	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);