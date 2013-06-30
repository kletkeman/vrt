global.$ = Object;

var prototype = require('prototype'),
	Base = require('../lib/base'),
	os = require('os'),
	http = require('http'),
	quotes = require('./quotes.js');


var s1 = require('../plots/sample.1.js'),
	s2 = require('../plots/sample.2.js'),/*
	s3 = require('../plots/sample.3.js');*/
	s4 = require('../plots/sample.4.js');

global.vrt = require('../lib/api');


var options = {
	host: '127.0.0.1',
	port: '80',
	path: '/api/v1/',
	method: 'POST',
	headers : { 'Content-Type' : 'application/json'}
};

vrt.configure({

	"store": new vrt.Api.MemoryStore(),

	"publish" : function(id, eventHandlerName, data, callback) {
		console.log('Write : ', id.substr(0, id.indexOf('-')), eventHandlerName);
	},

	"write" : function(id, data, callback) {

		var opt = Object.extend({}, options);

		opt.path = (options.path + id);

		var	req = http.request(opt, function(res) {
			
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('Response : ' + chunk);
			});
		
			vrt.Api.prototype.write.call(vrt, id, data, callback);
		});
		
		req.write(JSON.stringify(data));
		req.end();
	},

	"save" : function(id, data, callback) {

		if(!data)
			return;

		var opt = Object.extend({}, options);

		opt.path = (options.path + id + '/save');

		var req = http.request(opt, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		    console.log('Save : ' + chunk);
		  });

		  vrt.Api.prototype.save.call(vrt, id, data, callback);
		  
		});

		req.write(JSON.stringify(data));
		req.end();
	}

});

Base.load();


// Write some data to the routing tree

(function() {
	
	var paths = {
		"random" : null,
		"sin" : null,
		"cos" : null,
		"sqrt" : null
	}, value = 0, components;
	
setInterval(function() {
	
	for(var path in paths) {
		paths[path] = Math[path](value);
	}
	
	vrt.write("math", paths, function(){});
	
	value += .1;
	
}, 500);

})();


})();

// Sample 1		

// The Curve #1 widget

(function() {
	var id    = s1.datasets[0].id,
		i = 0;
		
	while(i < 5)
		(function(i) {
			
			var value = 0;
			
			setInterval(function() {
				vrt.write(id, {label: 'T'+i, value: value += .10 * Math.sqrt(i)});
			}, 500);
			
		})(i++);
	
})();

// The Curve #2 widget

(function() {
	var id    = s1.datasets[1].id,
		i = 0, f = [Math.cos, Math.sin];
		
	while(i < 5)
		(function(i) {
			
			var value = 0;
			
			setInterval(function() {
				vrt.write(id, {label: 'T'+i, value: f[i % 2](value += 5 / Math.pow(10, i+1)) + 1 });
			}, 1000);
			
		})(i++);
	
})();

// The Messages widget
setInterval(function() {
	var quote = quotes[Math.floor(Math.random() * quotes.length)];
	vrt.write(s1.datasets[3].datasets[1].id, {title : quote.substr(0, 20) + "...", text: quote, seen: Math.floor(Math.random() * 2)});
}, 10000);


// The Bubbletrouble widget
(function() {
	
	var id   = s1.datasets[3].datasets[0].id,
		data = [{name : 'google.com'},
				{name : 'microsoft.com'},
				{name : 'vg.no'},
				{name : 'dagbladet.no'},
				{name : 'bakerhughes.com'},
				{name : 'nodejs.org'},
				{name : 'github.com'},
				{name : 'reddit.com'},
				{name : 'gmail.com'},
				{name : 'hotmail.com'},
				{name : 'codeplex.com'},
				{name : 'stackoverflow.com'},
				{name : 'digg.com'},
				{name : 'facebook.com'}],
		index = 0, warning;
		
		setInterval(function() {
			
			if(typeof warning === 'object') {
				warning.warning = '';
				vrt.write(id, warning);
				warning = undefined;
			}
			else if(typeof warning === 'undefined')
				warning = index;
			
			data[index].value = Math.round(Math.random() * 200),
			data[index].unit  = 'ms';
			
			if(warning === index) {
				data[index].warning = 'Unreachable';
				warning = data[index];
			}
			else
				data[index].warning = '';
			
			vrt.write(id, data[index]);
			
			index = Math.floor(Math.random() * data.length);
			
			
			
		}, 5000);
		
})();

// The Graph widget
(function() {
	
	var id    = s1.datasets[2].datasets[0].id,
		index = 0, v
		i     = 0;
		
	setInterval(function() {
		
		var values = [null, null, null, null];
		
		values[Math.floor(Math.random() * values.length)] = Math.random() * 1000;
		
		vrt.write(id, {name: 'T'+index, values: values});
		
		index = Math.floor(Math.random() * 10);
		
	}, 1000);
	
	
	
})();

// Pie 1

(function() {
	
	var id    = s1.datasets[2].datasets[1].id,
		index = 0;
		
	setInterval(function() {
	
		vrt.write(id, {label: 'T'+index, value: Math.random() * 100});
		index = Math.floor(Math.random() * 10);
		
	}, 1200);
	
	
	
})();

// Pie 2

(function() {
	
	var id    = s1.datasets[2].datasets[2].id,
		index = 0;
		
	setInterval(function() {
		
		vrt.write(id, {label: 'T'+index, value: Math.random() * 1982});
		index = Math.floor(Math.random() * 10);
		
	}, 500);
	
	
	
})();



// Sample 2			
				
(function(){
	var value = 0;
	setInterval(function() {					
		
		value += .1;
		
		// Curve 1
		vrt.write(s2.datasets[0].id, { 
			label: 'T0', value : 100 + (Math.sin(value) * 100)
		});	
		vrt.write(s2.datasets[0].id, {
			label : 'T1', value : 100 + (Math.cos(value) * 100)
		});

		// Curve 2
		vrt.write(s2.datasets[1].id, { 
			label : 'T0', value :  100 + (Math.sin(value) * 100)
		});
		

	}, 1000);
})();


// Curve 3

(function(){
	var value = 0;
	setInterval(function() {
		value++;					
		vrt.write(s2.datasets[2].id, {label : 'T0', value : value % 4});
}, 1000 * 60);
})();

// Curve 4
setInterval(function() {					
	vrt.write(s2.datasets[3].id, {label : 'T0', value : Math.round(Math.random() * 100)});
}, 1000 * 30);

// Curve 5
(function(){
	var value = 0;
	setInterval(function() {					
		value += .25;
		vrt.write(s2.datasets[4].id, {label : 'T0', value : 100 + (Math.sin(value) * 100)});
		vrt.write(s2.datasets[4].id, {label : 'T1', value : 50 + (Math.cos(value) * 50) });
		vrt.write(s2.datasets[4].id, {label : 'T2', value : 25 + (Math.sin(value) * 25)});
	}, 1000);
})();

// Curve 6
setInterval(function() {					
	vrt.write(s2.datasets[5].id, {label : 'T0', value : Math.round(Math.random() * 100)});
}, 1000 * 15);

// Graph 1
setInterval(function() {
	
	for(var i = 0, obj = {}, t = (new Date()).getTime(); i < 50; i++)
		vrt.write(s2.datasets[6].id, {name : "T"+i, values: [1000 - ( (Math.cos(i + t)) * 100)]});

}, 1000 * 1);

// Graph 2
setInterval(function() {
	
	for(var i = 0, obj = {}, t = (new Date()).getTime(); i < 25; i++)
		vrt.write(s2.datasets[7].id, {name: "T"+i, values : [2000 - ( (Math.sin(i + t)) * 1000)]});
		
}, 1000 * 2);

/*
// Sample 3

setInterval(function() {

	var total = 0, 
	    throughput = {'in': 1000000 + (Math.random() * 100000), 'out': 100000 + (Math.random() * 10000)};

	for(var direction in throughput) {

	  total += throughput[direction];

	  if(!throughput[direction])
	    continue;

	  if(direction === 'in') {

	  	var _in = {
	      'In (kB/s)' : throughput[direction] / 1024 
	    };

	    vrt.write(s3.datasets[0].id, _in);
	    vrt.write(s3.datasets[7].datasets[2].id, _in);

	    vrt.write(s3.datasets[3].id, {
	      'In' : Math.round(throughput[direction] / 1024) + ' kB/s'
	    });

	    
	   	vrt.get(s3.datasets[9].id, function(err, obj) {
	   		var value = Math.round(throughput[direction] / 1024 / 1024);
	   		var max = Math.ceil(value / 10) * 10;
	   		if(obj.max !== max)
		   		vrt.save(obj.id, {
		   			max : max
		   		});
	   		vrt.write(s3.datasets[9].id, {
	   			value : value
	   		});
	   	});	   	

	  }
	  else if(direction === 'out') {

	  	var out = {
	      'Out (kB/s)' : throughput[direction] / 1024
	     };

	     vrt.write(s3.datasets[1].id, out);
	     vrt.write(s3.datasets[7].datasets[2].id, out);

	     vrt.write(s3.datasets[3].id, {
	      'Out' : Math.round(throughput[direction] / 1024) + ' kB/s'
	     });

	     vrt.get(s3.datasets[10].id, function(err, obj) {
	   		var value = Math.round(throughput[direction] / 1024);
	   		var max = Math.ceil(value / 1000) * 1000
	   		if(obj.max !== max)
		   		vrt.save(obj.id, {
		   			max : max
		   		});
	   		vrt.write(s3.datasets[10].id, {
	   			value : value
	   		});
	   	});

	   
	    
	  }
	  
	  throughput[direction] = 0;

	}

	var total_message = {
	  'Total (kB/s)' : total / 1024
	};

	vrt.get(s3.datasets[7].datasets[2].id, function(err, obj) {   	
	   	
	   	var max = Math.ceil((total / 1024) / 1000) * 1000;

	   	if(obj.topBoundary !== max)
			vrt.save(obj.id, {
		   		topBoundary : max
		   	});

	});

	vrt.write(s3.datasets[2].id, total_message);
	

	vrt.get(s3.datasets[11].id, function(err, obj) {
		var value = Math.round(total / 1024 / 1024);
		var max = Math.ceil(value / 10) * 10;
	   	if(obj.max !== max)
		   	vrt.save(obj.id, {
		   		max : max
		   	});
	   	vrt.write(s3.datasets[11].id, {
	   		value : value
	   	});
	});


	vrt.write(s3.datasets[3].id, {

	  "Free  Memory" : Math.round(os.freemem() / 1024 / 1024) + 'MB',
	  "CPU Usage" : Math.round(os.loadavg()[0] * 100) + '%',
	  "Uptime" : Math.round(os.uptime() / 60 / 60 / 24) + ' days',
	  'Total' : Math.round(total / 1024) + ' kB/s'

	});    

	var memory = {
	  'Used Memory' : Math.round(os.totalmem() / 1024 / 1024) - Math.round(os.freemem() / 1024 / 1024),
	  'Free Memory' : Math.round(os.freemem() / 1024 / 1024)
	};

	vrt.write(s3.datasets[4].id, memory);
	vrt.write(s3.datasets[7].datasets[0].id, memory);

	var cpu = {
	    'CPU Usage' : Math.round(os.loadavg()[0] * 100)
	};

	vrt.write(s3.datasets[5].id, cpu);
	vrt.write(s3.datasets[7].datasets[1].id, cpu);

	vrt.write(s3.datasets[8].id, {
	    value : Math.round(os.loadavg()[0] * 100)
	});

	vrt.write(s3.datasets[6].id, {
	    'CPU Usage' : os.loadavg().map(function(v) { return Math.round(v * 100); })
	});



}, 1000);

setInterval(function() {
	vrt.write(s3.datasets[7].datasets[3].id, {'Sin' : Math.max(Math.sin((new Date().getTime())), 0) * 100});
},100);
			
*/

// Sample 4


// The Cubism widget
(function() {
	
	var id    = s4.datasets[0].id,
		index = 0;
	
	while(index < 10)
		(function(index) {
	
			var value = 0,
	    	    i     = 0;
	
			setInterval(function() {
			    vrt.write(id, {label: 'T'+index, value: (value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += index * .02))))});
			}, 1000);
			
		})(index++);
	
})();