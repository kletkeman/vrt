;!(function(module) {

	function Matrix(fields) {
        
	  fields.size = fields.size || [340,480];
        
	  vrt.Api.DataSet.call(this, fields);
        
      this.bufferSize = Math.max.apply(Math, this.size.slice(0,2));
      this.step = 0;
        
	};
	
	Matrix.required = {
		size : Array
	};
	
	Matrix.prototype.format = {
		R : Number,
		G : Number,
		B : Number,
        x : Number,
        y : Number
	};

	Matrix.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Matrix;
	else
		module.vrt.Api.Matrix = Matrix;

})(typeof module === 'undefined' ? window : module);