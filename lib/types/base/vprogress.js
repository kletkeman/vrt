;!(function(module) {

	function Vprogress(fields) {		
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Vprogress.required = {
		topBoundary : Number,
		showLabels  : Boolean
	};

	Vprogress.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Vprogress;
	else
		module.vrt.Api.Vprogress = Vprogress;

})(typeof module === 'undefined' ? window : module);