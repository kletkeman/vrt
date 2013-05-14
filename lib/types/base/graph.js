;!(function(module) {

	function Graph(fields) {
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Graph.required = {
		multiple : Boolean
	};

	Graph.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Graph;
	else
		module.vrt.Api.Graph = Graph;

})(typeof module === 'undefined' ? window : module);