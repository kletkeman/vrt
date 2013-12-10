require("../vrt");

var quotes = require('./quotes.js');
    s1 = require('../dashboards/dashboard.example.1.json'),
	s2 = require('../dashboards/dashboard.example.2.json'),/*
	s3 = require('../dashboards/dashboard.example.3.json'),*/
	s4 = require('../dashboards/dashboard.example.4.json'),
    os = require('os');

vrt.log.setLevel(0);

// Create a new producer for each test so that we can have many connections
function producer() {
    var Producer = vrt.producer.constructor;
    return (new Producer(require('../package.json').configure.consumer)).start();
}

// Write some data to the routing tree

(function () {
	
	var paths = {
		"random" : null,
		"sin" : null,
		"cos" : null,
		"sqrt" : null
	}, value = 0, components;
	
    producer().produce(function() {
        
        for(var path in paths) {
            paths[path] = {value : Math[path](value), letter: path[0].toUpperCase()}
        }
        
        this.write("math", paths);
        
        value += .1;
        
    }, 1000);

})();


// Sample 1		

// The Curve #1 widget

(function () {
    
	var id    = s1.datasets[0].id,
		i = 0;
		
	while(i < 5)
		(function(i) {
			
			var value = 0;
			
			producer().produce(function() {
				this.write(id, {label: 'T'+i, value: value += .10 * Math.sqrt(i)});
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
			
			producer().produce(function() {
				this.write(id, {label: 'T'+i, value: f[i % 2](value += 5 / Math.pow(10, i+1)) + 1 });
			}, 1000);
			
		})(i++);
	
})();

// The Messages widget
producer().produce(function() {
	var quote = quotes[Math.floor(Math.random() * quotes.length)];
	this.write(s1.datasets[3].datasets[1].id, {title : quote.substr(0, 20) + "...", text: quote, seen: Math.floor(Math.random() * 2)});
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
		
		producer().produce(function() {
			
			if(typeof warning === 'object') {
				warning.warning = '';
				this.write(id, warning);
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
			
			this.write(id, data[index]);
			
			index = Math.floor(Math.random() * data.length);
			
		}, 5000);
		
})();

// The Graph widget
(function() {
	
	var id    = s1.datasets[2].datasets[0].id,
		index = 0, v
		i     = 0;
		
	producer().produce(function() {
		
		var values = [null, null, null, null];
		
		values[Math.floor(Math.random() * values.length)] = Math.random() * 1000;
		
		this.write(id, {name: 'T'+index, values: values});
		
		index = Math.floor(Math.random() * 10);
		
	}, 1000);
	
	
	
})();

// Pie 1

(function() {
	
	var id    = s1.datasets[2].datasets[1].id,
		index = 0;
		
	producer().produce(function() {
	
		this.write(id, {label: 'T'+index, value: Math.random() * 100});
		index = Math.floor(Math.random() * 10);
		
	}, 1200);
	
	
	
})();

// Pie 2

(function() {
	
	var id    = s1.datasets[2].datasets[2].id,
		index = 0;
		
	producer().produce(function() {
		
		this.write(id, {label: 'T'+index, value: Math.random() * 1982});
		index = Math.floor(Math.random() * 10);
		
	}, 500);
	
	
	
})();



// Sample 2			
				
(function(){
	var value = 0;
	producer().produce(function() {					
		
		value += .1;
		
		// Curve 1
		this.write(s2.datasets[0].id, { 
			label: 'T0', value : 100 + (Math.sin(value) * 100)
		});	
		this.write(s2.datasets[0].id, {
			label : 'T1', value : 100 + (Math.cos(value) * 100)
		});

		// Curve 2
		this.write(s2.datasets[1].id, { 
			label : 'T0', value :  100 + (Math.sin(value) * 100)
		});
		

	}, 1000);
})();


// Curve 3

(function(){
	var value = 0;
	producer().produce(function() {
		value++;					
		this.write(s2.datasets[2].id, {label : 'T0', value : value % 4});
}, 1000 * 60);
})();

// Curve 4
producer().produce(function() {					
	this.write(s2.datasets[3].id, {label : 'T0', value : Math.round(Math.random() * 100)});
}, 1000 * 30);

// Curve 5
(function(){
	var value = 0;
	producer().produce(function() {					
		value += .25;
		this.write(s2.datasets[4].id, {label : 'T0', value : 100 + (Math.sin(value) * 100)});
		this.write(s2.datasets[4].id, {label : 'T1', value : 50 + (Math.cos(value) * 50) });
		this.write(s2.datasets[4].id, {label : 'T2', value : 25 + (Math.sin(value) * 25)});
	}, 1000);
})();

// Curve 6
producer().produce(function() {					
	this.write(s2.datasets[5].id, {label : 'T0', value : Math.round(Math.random() * 100)});
}, 1000 * 15);

// Graph 1
producer().produce(function() {
	
	for(var i = 0, obj = {}, t = (new Date()).getTime(); i < 50; i++)
		this.write(s2.datasets[6].id, {name : "T"+i, values: [1000 - ( (Math.cos(i + t)) * 100)]});

}, 1000 * 1);

// Graph 2
producer().produce(function() {
	
	for(var i = 0, obj = {}, t = (new Date()).getTime(); i < 25; i++)
		this.write(s2.datasets[7].id, {name: "T"+i, values : [2000 - ( (Math.sin(i + t)) * 1000)]});
		
}, 1000 * 2);

// Write to tree

producer().produce(function() {

	var total = 0, 
	    throughput = {'in': 1000000 + (Math.random() * 100000), 'out': 100000 + (Math.random() * 10000)};

	for(var direction in throughput) {

	  total += throughput[direction];

	  if(!throughput[direction])
	    continue;

	  if(direction === 'in') {

	    this.write('network', {
	      'In (kB/s)' : throughput[direction] / 1024 
	    });	   	

	  }
	  else if(direction === 'out') {

	     this.write('network', {
	      'Out (kB/s)' : throughput[direction] / 1024
	     });
	     
	  }
	  
	  throughput[direction] = 0;

	}

	this.write('network', {
	  'Total (kB/s)' : total / 1024
	});

	this.write('computer', {

	  'Free  Memory' : Math.round(os.freemem() / 1024 / 1024) + 'MB',
      'Used Memory' : Math.round(os.totalmem() / 1024 / 1024) - Math.round(os.freemem() / 1024 / 1024),
	  'CPU Usage' : Math.round(os.loadavg()[0] * 100) + '%',
	  'Uptime' : Math.round(os.uptime() / 60 / 60 / 24) + ' days',
	  'Total' : Math.round(total / 1024) + ' kB/s'

	});

}, 1000);

// Sample 4

// The Cubism widget
(function() {
	
	var id    = s4.datasets[0].id,
		index = 0;
	
	while(index < 10)
		(function(index) {
	
			var value = 0,
	    	    i     = 0;
	
			producer().produce(function() {
			    this.write(id, {label: 'T'+index, value: (value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += index * .02))))});
			}, 1000);
			
		})(index++);
	
})();