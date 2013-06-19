;!(function(module) {

	function Graph(fields) {
	  fields.bufferSize = Number.MAX_VALUE;
	  vrt.Api.DataSet.call(this, fields);
	};

	Graph.required = {
		labels: Array
	};

	Graph.prototype.format = {
		name : String,
		values : Array
	};

	Graph.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Graph;
	else
		module.vrt.Api.Graph = Graph;

})(typeof module === 'undefined' ? window : module);