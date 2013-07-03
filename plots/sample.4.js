var Base = require('../lib/base'),
	Dashboard = new Base.Template({

		title: 'Sample Plot 4',
		createdBy: 'Odd Marthon Lende',
		creationDate: '2013-06-25T17:19Z',
		datasets: {

			0: {

				"type": 'cubism',
				"id": 'b52471e7-595f-411b-8897-0dce475bc427',
				"height": "100%",
				"width": "100%",
				"bufferSize": 60 * 60 * 24,
				// 24 hours of 1 second data
				"title": "Example Cubism Visualization of some sine function",
				"description": "",
				"step": 1e4

			}

		}

	});

module.exports = Dashboard;
