;!(function(module) {

	function Stack(fields) {
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Stack.required = {
		datasets : Object
	};

	Stack.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Stack;
	else
		module.vrt.Api.Stack = Stack;

})(typeof module === 'undefined' ? window : module);