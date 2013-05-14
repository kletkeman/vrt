var Curve = require('../base/curve'),
	asyncblock = require('asyncblock');

Curve.prototype.write = function(data, callback) {

	if(this.pad(this.reset()))
	   this.save();

	var llen = this.labels.length,
		context = this, 
		cursor = this.cursor;

	asyncblock(function(flow) {

		flow.errorCallback = callback;

		for(var key in data) {

			if(context.labels.indexOf(key) === -1)
				context.labels.push(key);

			flow.sync(vrt.Api.DataSet.prototype.write.call(context, context.labels.indexOf(key))(context.currentIndex)(data[key], flow.callback()));

		};

		if(llen < context.labels.length)
			context.onUpdate('labels');

		context.onReceive({
			'__cursor__' : cursor
		});
		
		context.onReceive(data);

		if(typeof callback === 'function')
			callback();

	});

};

Curve.prototype.pad = function(length) {

	for(var y = 0; y < length; y++)
		for(var x = 0, len = this.labels.length; x < len; x++)
			vrt.Api.DataSet.prototype.write.call(this, x)(null);

	return length;
};

module.exports = Curve;