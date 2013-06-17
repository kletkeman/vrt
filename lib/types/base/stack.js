;!(function(module) {

	function Stack(fields) {
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Stack.required = {
		datasets : Object
	};
	
	Stack.prototype.onCreate = function() {

		for(var i in this.datasets)
			(function(context) {

				var id = context.datasets[i].id;

				Object.defineProperty(context.datasets, i, {
			  		enumerable: true,
			  		configurable: false,
			  		get: function() {
			  			return vrt.Api.DataSet.collection[id];
			  		}
				});

			})(this);

			vrt.Api.DataSet.prototype.onCreate.call(this);
	};
	
	Stack.prototype.format = {};

	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);