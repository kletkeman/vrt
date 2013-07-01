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
			"bufferSize" : 60 * 60 * 24 * 2, // 24 hours of 500ms data
			"title": "Example Cubism Visualization with schema",
			"description": "",
			"step" : 1e4,
			"schema" : {
				
				"Math.[function]" : {
					
					"bind" : {
						"Math.[function]" : "label",
						"[function]" : {
							"[function]" : "components[[function]]",
							"sqrt" : "functions[0]",
							"cos" : "functions[1]",
							"sin" : "functions[2]",
							"random" : "functions[3]"
						},
						"{value}" : "value",
						"{letter}" : "letter"
					},
					"defaults" : {
						"components" : Object,
						"functions" : Array,
						"function" : String,
						"letter" : function(d) { return d?String(d).toLowerCase():String();},
						"timestamp" : function(d) { return d?d:+new Date(); }
					}
				
				}

			}

		},
		
	1 : {

			"type": 'graph',
			"width" : "50%",
			"height" : "50%",
            "labels" : ["sqrt", "cos", "sin", "random"],
            "title": "Example Graph with schema",
			"description": "Example Graph",
			"step" : 1000,
			"schema" : {
				
				"Math.[function]" : {
					
					"bind" : {
						"[function]" : {
							"{value}" : {
								"sqrt" : "values[0]",
								"cos" : "values[1]",
								"sin" : "values[2]",
								"random" : "values[3]"
							}
						}
					},
					"defaults" : {
						"name" : "Math"
					}
				
				}

			}
		}
		
});

module.exports = Plot;
