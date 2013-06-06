;!(function(module) {

	function Hprogress(fields) {		
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Hprogress.required = {
		topBoundary : Number,
		showLabels  : Boolean
	};

	Hprogress.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Hprogress;
	else
		module.vrt.Api.Hprogress = Hprogress;

})(typeof module === 'undefined' ? window : module);