var Base = require('../lib/base'),
    Plot = new Base.Template;

Object.extend(Plot, {

	title: 'Sample Plot',
	createdBy: 'Odd Marthon Lende',
	creationDate: '2012-09-24T12:55Z',

});

Object.extend(Plot.datasets, {

		0 : {

			"type": "curve",
		  	"id" : '9795b25c-fa52-430a-a60b-85f8c30d056a',
			"height": "25%",
			"width": "50%",
			"title": "Example Curve 1 (Hours / 7 Days)",
			"description": "Curve Example",
			"unit" : "hours",
			"resolution": 7,
			"multiple": true
		},

		1 : {

			"type": "curve",
		  	"id" : 'ba99b297-0d68-4453-ac73-562888d540ad',
			"height": "25%",
			"width": "50%",
			"title": "Example Curve 2 (Minutes / 1 Day)",
			"description": "Curve Example",
			"unit" : "minutes",
			"resolution": 1,
			"multiple": true
		},

		2 : {

			"type": 'graph',
			"id" : '969d2513-2eaf-4fbd-81af-2c82b06ec1c8',
			"width" : "100%",
			"height" : "50%",
			"multiple" : true,
            "labels" : ["a", "b", "c"],
            "title": "Example Graph 1",
			"description": "Example Graph"
		},

		3 : {

			"type": 'pie',
			"id" : 'b52471e7-595f-411b-8897-0dce475bc427',
			"height" : "25%",
			"width" : "20%",
			"title": "Example Pie 1",
			"description": "Example Pie"

		},

		4 : {

			"type": 'pie',
			"id" : '81627ed1-4462-425c-97b6-9041747e2b88',
			"height" : "25%",
			"width" : "20%",
			"title": "Example Pie 2",
			"description": "Example Pie"

		},

		5 : {

			"type": 'text',
			"id" : '22421476-720c-498a-9c34-c313d6fa4bf0',
			"height" : "25%",
			"width" : "15%",
			"fontFamily": "Arial",
			"fontSize": "9pt",
			"fontColor": "#000",
			"title": "Text Feed Example 1",
			"description": "Text Feed Example",
			"bufferSize": 20
		},

		6 : {

			"type": 'text',
			"id" : '89179d49-946d-4208-8553-8731d2046ef7',
			"height" : "25%",
			"width" : "15%",
			"fontFamily": "Arial",
			"fontSize": "9pt",
			"fontColor": "#000",
			"title": "Text Feed Example 2",
			"description": "Text Feed Example",
			"bufferSize": 20
		},

		7 : {
			"type": 'trafficlights',
			"id" : '22dec686-b52b-46b4-b302-df9b2531cfe5',
			"height" : "25%",
			"width" : "15%",
			"title": "Traffic Lights Example 1",
			"description": "Traffic Lights Example"
		},

		8 : {
			"type": 'ticker',
			"id" : '5fe2f66b-ffd6-409d-8736-11d1ffc107e2',
			"height" : "25%",
			"width" : "15%",
			"title": "Ticker Example 1",
			"description": "Ticker Example",
			"fontSize": "",
		    "fontColor" : "",
		    "fontWeight" : ""
		}

});

module.exports = Plot;
