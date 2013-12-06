var express = require('express')()
  , server  = require('http').createServer(express)
  , io      = require('socket.io').listen(server)
  , app     = require('./vrt')
  , net     = require("net")
  , repl    = require("repl")
  , argv    = require("optimist").argv
  , cluster = require("cluster")
  , os      = require("os");

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
});

vrt.configure({

	"store": new vrt.Api.MongoStore({poolSize: 25}),
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

vrt.log.setLevel(typeof argv.setLevel === 'number' ? Math.min(argv.setLevel, 3) : 2);

if(cluster.isMaster)
    Base.load(function() {
        if(argv.cluster)
            for(var i = 0, len = typeof argv.cluster === 'number' ? argv.cluster : os.cpus().length; i < len; i++)
                cluster.fork();
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
    
    server.listen(80);

}

net.createServer(function (socket) {
    
    var remote = repl.start('vrt:'+(cluster.isMaster?'master':'worker['+cluster.worker.id+']') + '::remote> ', socket);
    
    remote.context.vrt = vrt;
    remote.context.dump = heapdump.writeSnapshot;
    remote.context.io = io;
      
}).listen(cluster.isMaster ? 5000 : 5000 + Number(cluster.worker.id));




