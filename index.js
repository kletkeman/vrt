
/**
 * @preserve Written by Odd Marthon Lende, Baker Hughes INTEQ
 *
 * Copyright 2012
 *
 *  Version 1.0
 *
 */

var External = require('../../lib/stream').External;

module.exports = require('./vrt');

module.exports.name = 'VisualizeRT';
module.exports.description = 'Realtime Data Visualizer';

module.exports.routes[0].handler = function(req, res) {res.view('visualizert/layout', {});};

module.exports.init = function(app) {
	
	vrt.configure({

		"store": new vrt.Api.MemoryStore(),
		"publish": function(id, eventHandlerName, data, callback) {

			External.fetch({
				_streamFetchType: 'on*',	
				type: id,
				action: eventHandlerName, 
				ms: data
			});

			if(typeof callback === 'function')
				callback();

		}
	});

	Base.load();
	
};

module.exports.stream = {
	
	parse: function(command, next) {		
		
	},

	fetch: function(data) {
		
		if(data._streamFetchType === 'on*') {
			this.write.private(data);
			this.write.end(this);
		}
	}

};
