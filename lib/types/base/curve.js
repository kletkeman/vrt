;!(function(module) {

	function Curve(fields) {

	  fields.labels = fields.labels || [];
	  fields.resolution = Math.max(fields.resolution, 1 / 24 / 60);

	  var units = ['days', 'hours', 'minutes', 'seconds'],
	  	  unit = fields.unit

	  if(units.indexOf(unit) === -1)
	  	throw new Error('Property `units` has an invalid value. Valid units are : ' + JSON.stringify(units));

	  // Calculate bufferSize

	  if(unit === 'days')
	  	this.bufferSize = fields.resolution;
	  else if(unit === 'hours')
	  	this.bufferSize = fields.resolution * 24;
	  else if(unit === 'minutes')
	  	this.bufferSize = fields.resolution * 24 * 60;
	  else if(unit === 'seconds')
	  	this.bufferSize = fields.resolution * 24 * 60 * 60;

	  this.bufferSize = Math.max(Math.round(this.bufferSize), 1);

	  vrt.Api.DataSet.call(this, fields);

	  var time = this.getTime();

 	  this.right = Math.floor(this.right || ((this.cursor - time.elapsed) + time.length));
      this.left = Math.floor(this.left || (this.right - (time.resolution * time.length)));
	  
	};

	Curve.required = {
		unit : String,
		labels : Array,
		cursor : Number,
		pad : Function,
		getTime : Function,
		reset : Function,
		unit : String,
		resolution : Number
	};

	Curve.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	Curve.prototype.getTime = function() {

		var unit = this.unit,
			now = new Date(),
			length = 0, 
			elapsed = 0,
			timezoneOffset = 0,

			res_d = this.resolution,
			res_h = res_d * 24,
			res_m = res_h * 60,
			res_s = res_m * 60,

			gte_1day = res_d >= 1,
			gte_1hour = res_h >= 1,
			gte_1minute = Math.round(res_m) >= 1,

			resolution;

		if(unit === 'days') {
			length = 1;
			elapsed = 1;
			timezoneOffset = now.getTimezoneOffset() / 60 / 24;
		}
		else if(unit === 'hours') {
			length = 24;
			elapsed = now.getUTCHours();
			timezoneOffset = now.getTimezoneOffset() / 60;
		}
		else if(unit === 'minutes') {
			length = (gte_1day ? 24 : 1) * (gte_1hour ? 60 : 1);
			elapsed = (gte_1day ?  now.getUTCHours() * 60 : 0) + (gte_1hour ? now.getUTCMinutes() : 0);
			timezoneOffset = now.getTimezoneOffset();
			
		}
		else if(unit === 'seconds') {
			length = (gte_1day ? 24 : 1) * (gte_1hour ? 60 : 1) * 60;
			elapsed = ( ( (gte_1day ?  now.getUTCHours() * 60 : 0) + (gte_1hour ? now.getUTCMinutes() : 0) ) * 60 ) + now.getUTCSeconds();
			timezoneOffset = now.getTimezoneOffset() * 60;
		}

		if(gte_1day)
			resolution = res_d;
		else if(gte_1hour)
			resolution = res_h;
		else if(gte_1minute)
			resolution = res_m;

		return {
			elapsed: elapsed, 
			length : length,
			now : now,
			resolution : Math.round(resolution),
			timezoneOffset : timezoneOffset
		};

	};

	Curve.prototype.reset = function() {

		var length = this.getTime().length, 
			padded = false, 
			cursor = this.cursor;
			
		while( cursor >= this.right && (padded = true) ) {

			this.left += length;
			this.right += length;
		};

		return padded ? this.right - cursor : 0;
	};

	Object.defineProperties(Curve.prototype, {

		cursor : (function() {

			var cursor;

			return {

				get : function() {

					if(cursor)
						return cursor;

			  		var unit   = this.unit,
			  			now = new Date();

			  		if(unit === 'days')
			  			return Math.round(now.getTime() / 1000 / 60 / 60 / 24);		
					else if(unit === 'hours')
						return Math.round(now.getTime() / 1000 / 60 / 60);
					else if(unit === 'minutes')
						return Math.round(now.getTime() / 1000 / 60);
					else if(unit === 'seconds')
						return Math.round(now.getTime() / 1000);				

			  	},
			  	set : function(value) {
			  		cursor = value;
			  	},
			  	enumerable : false
			  };

		  })(),

		  currentIndex : {

			get : function() {
				return this.cursor - this.left;
		  	},
		  	enumerable : false
		  }

	});

	if(module.exports)
		module.exports = Curve;
	else
		module.vrt.Api.Curve = Curve;

})(typeof module === 'undefined' ? window : module);