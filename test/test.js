var prototype = require('prototype'),
	Base = require('../lib/base'),
	cluster = require('cluster'),
	config = require('../../../lib/config').config,
	http = require('http'),
	quotes = require('./quotes.js');


var s1 = require('../plots/sample.1.js'),
	s2 = require('../plots/sample.2.js');

global.vrt = require('../lib/api');

vrt.configure({
	
	"store": new vrt.Api.MemoryStore(),

	"publish" : function(id, eventHandlerName, data, callback) {
		console.log('Write : ', id.substr(0, id.indexOf('-')), eventHandlerName);
	},

	"write" : function(id, data, callback) {

		var options = {
		  host: '127.0.0.1',
		  port: '80',
		  path: '/api/v1/'+ id,
		  method: 'POST',
		  headers : { 'Content-Type' : 'application/json'}
		};

		var req = http.request(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		    console.log('Response : ' + chunk);
		  });
		  vrt.Api.prototype.write.call(vrt, id, data, callback);
		});
		req.write(JSON.stringify(data));
		req.end();
	}
});

Base.load();

		// Sample 1		

				// Curve 1
				(function()  {
					var value = 0;
					setInterval(function() {
						value+=0.5;
						vrt.write(s1.datasets[0].id, { 'test99' : value });
					}, 30 * 1000);
				})();

				// Curve 2
				(function()  {
					var value = 0;
					setInterval(function() {
						value++;
						vrt.write(s1.datasets[1].id, { 'test100' : value });
					}, 10 * 1000);
				})();

				// Sample Text 1
				setInterval(function() {
					vrt.write(s1.datasets[5].id, {0 : quotes[Math.round(Math.random() * quotes.length)]});
				}, 5000);

				// Sample Text 2
				setInterval(function() {
					vrt.write(s1.datasets[6].id, {0 : quotes[Math.round(Math.random() * quotes.length)]});
				}, 10000);

				// Graph 1
				(function() {
					var id = s1.datasets[2].id;
					setInterval(function() {					
						vrt.write(id, {'test1' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]});
					}, 2000);
					setInterval(function() {
						vrt.write(id, {'test2' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]}); 
					}, 2100);
					setInterval(function() {
						vrt.write(id, {'test3' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]});
					}, 2200);
					setInterval(function() {
						vrt.write(id, {'test4' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]});
					}, 2300);
					setInterval(function() {
						vrt.write(id, {'test5' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]}); 
					}, 2400);
					setInterval(function() {
						vrt.write(id, {'test6' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]}); 
					}, 2500);
					setInterval(function() {
						vrt.write(id, {'test7' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]});
					}, 2600);
					setInterval(function() {
						vrt.write(id, {'test8' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]}); 
					}, 2700);
					setInterval(function() {
						vrt.write(id, {'test9' : [Math.round(Math.random() * 100), Math.round(Math.random() * 100) ,Math.round(Math.random() * 100)]});  
					}, 2900);
				})();

				// Pie 1
				setInterval(function() {
					
					var id = s1.datasets[3].id;
					vrt.write(id, {'test10' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test11' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test12' : Math.round(Math.random() * 100)}); 
				}, 3000);

				// Pie 2
				setInterval(function() {
					
					var id = s1.datasets[4].id;
					vrt.write(id, {'test13' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test14' : Math.round(Math.random() * 100)});
					vrt.write(id, {'test15' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test16' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test17' : Math.round(Math.random() * 100)}); 
					vrt.write(id, {'test18' : Math.round(Math.random() * 100)}); 
				}, 4000);

				// TrafficLights 1
				setInterval(function() {
					var id = s1.datasets[7].id;
					vrt.write(id, {'google.com' : Math.round(Math.random() * 2)});
					vrt.write(id, {'microsoft.com' : Math.round(Math.random() * 2)});
					vrt.write(id, {'bakerhughes.com' : Math.round(Math.random() * 2)});
					vrt.write(id, {'github.com' : Math.round(Math.random() * 2)});
					vrt.write(id, {'altavista.com' : Math.round(Math.random() * 2)});
				}, 5000);

				// Ticker 1
				setInterval(function() {
					var id = s1.datasets[8].id;
					vrt.write(id, {'google.com' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'microsoft.com' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'vg.no' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'dagbladet.no' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'bakerhughes.com' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'nodjs.org' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'github.com' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'altavista.com' : Math.round(Math.random() * 200) + 'ms'});
					vrt.write(id, {'rogavis.no' : Math.round(Math.random() * 200) + 'ms'});
				}, 6000);

		// Sample 2

					
					
					(function(){
						var value = 0;
						setInterval(function() {					
							
							value += .1;
							
							// Curve 1
							vrt.write(s2.datasets[0].id, { 
								'test1000' :  100 + (Math.sin(value) * 100), 
								'test999' : 100 + (Math.cos(value) * 100) 
							});

							// Curve 2
							vrt.write(s2.datasets[1].id, { 
								'test1002' :  100 + (Math.sin(value) * 100)
							});

							

						}, 1000);
					})();

					// Curve 3
					
					(function(){
						var value = 0;
						setInterval(function() {
							value++;					
							vrt.write(s2.datasets[2].id, {'test1001' : value % 4});
					}, 1000 * 50);
					})();


					// Curve 4
					setInterval(function() {					
						vrt.write(s2.datasets[3].id, {'test1003' : Math.round(Math.random() * 100)});
					}, 1000 * 30);

					// Curve 5
					(function(){
						var value = 0;
						setInterval(function() {					
							value += .25;
							vrt.write(s2.datasets[4].id, {'test10001' : 100 + (Math.sin(value) * 100)});
							vrt.write(s2.datasets[4].id, {'test10002' : 50 + (Math.cos(value) * 50) });
							vrt.write(s2.datasets[4].id, {'test10003' : 25 + (Math.sin(value) * 25)});
						}, 1000);
					})();

					// Curve 6
					setInterval(function() {					
						vrt.write(s2.datasets[5].id, {'test1005' : Math.round(Math.random() * 100)});
					}, 1000 * 15);

					// Graph 1
					setInterval(function() {
						
						for(var i = 1000, obj = {}, t = (new Date()).getTime(); i < 1050; i++)
							obj['test'+i] = 1000 - ( (Math.cos(i + t)) * 100);

						vrt.write(s2.datasets[6].id, obj);
					}, 1000 * 1);

					// Graph 2
					setInterval(function() {
						
						for(var i = 2000, obj = {}, t = (new Date()).getTime(); i < 2025; i++)
							obj['test'+i] = 2000 - ( (Math.sin(i + t)) * 1000);

						vrt.write(s2.datasets[7].id, obj);
					}, 1000 * 2);
				
