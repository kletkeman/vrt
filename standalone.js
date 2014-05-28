var express = require('express')()
  , server  = require('http').createServer(express)
  , io      = require('socket.io').listen(server)
  , app     = require('./vrt')
  , net     = require("net")
  , repl    = require("repl")
  , argv    = require("optimist").argv
  , cluster = require("cluster")
  , os      = require("os")
  , config  = require("./package.json").configure
  , Store   = require('./lib/store')
  , workers    = {};

app.scripts = [
	'/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js'
].concat(app.scripts);

for(var i=0,s=app.scripts;i<s.length;i++){s[i] = {url:s[i]};};

app.routes[0].handler = function(req, res) { res.render('layout', {windowId: 'N/A', scripts: app.scripts, stylesheets: app.stylesheets }); };

express.configure(function() {
	express.set('view engine', 'jade');
	express.set('view options', {
		layout: false
	});
	express.use(require('express').bodyParser());
	express.use(require('express').static(__dirname+'/public'));
    express.use(require('express').static(__dirname+'/public/resources/css'));
    express.use(require('express').static(__dirname+'/lib/types/css'));
});

vrt.configure({

	"store": (function(Api, name, options) {
                
        name = name.toLowerCase();
        
        for(var k in Api) {
            if(typeof Api[k] === 'function' && k.toLowerCase() === name && (Api[k].prototype instanceof Store) )
                return new Api[k](options);
        }
                
    })( 
       vrt.Api, 
       typeof config.store === 'object' ? config.store.name : 'memorystore',
       typeof config.store === 'object' ? config.store.options : {}
    ),
    
	"publish": function(id, eventHandlerName, args, callback) {

		io.sockets.emit('event', {
			_streamFetchType: 'on*',	
			type: id,
			action: eventHandlerName, 
			ms: args
		});

		if(typeof callback === 'function')
			callback();

	}
});

io.set('store', new vrt.Api.SocketIO);
io.set('log level', typeof argv.setLevel === 'number' ? argv.setLevel : 2);
io.set('browser client', false);

vrt.log.setLevel(typeof argv.setLevel === 'number' ? Math.min(argv.setLevel, 3) : 2);

if(cluster.isMaster)
    Base.load(function() {
        
        vrt.log.info("http interface is configured to listen on port", config.http_port);
        vrt.log.info("telnet interface is configured to listen on port", config.telnet_interface_port);
        vrt.log.info("consumer interface is configured to listen on port", config.consumer.port);
        
        if(argv.cluster) {
            
            for(var i = 0, len = typeof argv.cluster === 'number' ? argv.cluster : os.cpus().length; i < len; i++)
                cluster.fork();
                       
            cluster.on('exit', function(worker, code, signal) {
                var pid = worker.process.pid;
                vrt.log.info('worker[', worker.id, '][', pid, '] died');
                delete workers[pid];
                cluster.fork();
            });
            
            cluster.on('listening', function(worker, address) { 
                var pid = worker.process.pid;
                vrt.log.info('worker[', worker.id, '][', pid, '] is now listening on port', address.port);
                workers[pid] = workers[pid] || {};
                workers[pid].net = workers[pid].net || [];
                workers[pid].net.push(address);
            });
            
            cluster.on('online', function(worker, address) {
                var pid = worker.process.pid;
                vrt.log.info('worker[', worker.id, '][', pid, '] is now online');
                workers[pid] = workers[pid] || {};
                workers[pid].id = worker.id;
            });
                       
        }
    });

if(cluster.isWorker || !argv.cluster) {
    
    for(var i = 0, route, len = app.routes.length; i < len; i++) {
	   route = app.routes[i];
	   express[route.method.toLowerCase()](route.path, route.handler);
    }

    for(var i = 0, script, len = app.scripts.length; i < len; i++) {
        script = app.scripts[i];
        (function(url){
            express.get(url, function(req, res) {
                res.sendfile('.' + url);
            });
        })(script.url);
    }
    
    server.listen(config.http_port);

}

(function(port) {
    
    net.createServer(function (socket) {
        
        var remote = repl.start('vrt:'+(cluster.isMaster?'master':'worker[ '+cluster.worker.id+' ][ '+cluster.worker.process.pid) + ' ] >>> ', socket);
        
        remote.context.vrt = vrt;
        remote.context.dump = heapdump.writeSnapshot;
        remote.context.io = io;
        
        if(cluster.isMaster)
            remote.context.workers = workers;
          
    }).listen(port);

})(cluster.isMaster ? config.telnet_interface_port : config.telnet_interface_port + Number(cluster.worker.id));

vrt.consumer.start();