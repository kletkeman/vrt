var Base = require('../lib/base'),
    Plot = new Base.Template;

Object.extend(Plot, {

	title: 'Sample Plot 5',
	createdBy: 'Odd Marthon Lende',
	creationDate: '2013-06-21:00Z',

});

Object.extend(Plot.datasets, {

		0 : {

			"type": 'cubism',
			"height" : "50%",
			"width" : "100%",
			"bufferSize" : 60 * 60 * 24, // 24 hours of 1 second data
			"title": "Example Cubism Visualization with schema",
			"description": "",
			"step" : 1e4,
			"schema" : {
				
				"Math.[function]" : {
					
					"bind" : {
						"Math.function" : "label",
						"function" : "value"
					},
					"defaults" : {
						"timestamp" : function() { return +new Date(); }
					}
				
				}

			}

		}
		
});

module.exports = Plot;
