var Text = require('../base/text'),
	asyncblock = require('asyncblock');

Text.prototype.write = function(data, callback) {

	var context = this;

	asyncblock(function(flow) {

		flow.errorCallback = callback;

		for(var key in data) {

			var obj = {}, timestamp;

			if(!parseInt(key, 10))
				timestamp = (new Date()).getTime();
			else
				timestamp = parseInt(key, 10);

			obj[timestamp] = data[key];

			flow.sync(vrt.Api.DataSet.prototype.write.call(context, obj, flow.callback()));

			context.onReceive(obj);
		}

		if(typeof callback === 'function')
			callback(null);
	});
};

module.exports = Text;