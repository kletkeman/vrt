var express = require('express')()
  , server  = require('http').createServer(express)
  , io      = require('socket.io').listen(server)
  , app     = require('./vrt')
  , net     = require("net")
  , repl    = require("repl");

app.scripts = [
	'/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js'
].concat(app.scripts);

for(var i=0,s=app.scripts;i<s.length;i++){s[i] = {url:s[i]};};

app.routes[0].handler = function(req, res) { res.render('layout', {windowId: 'N/A', scripts: app.scripts }); };

express.configure(function() {
	express.set('view engine', 'jade');
	express.set('view options', {
		layout: false
	});
	express.use(require('express').bodyParser());
	express.use(require('express').static(__dirname+'/public'));
});



vrt.configure({

	"store": new vrt.Api.MemoryStore(),
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

Base.load();

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

net.createServer(function (socket) {

  var remote = repl.start("vrt::remote> ", socket);

  remote.context.vrt = vrt;
  remote.context.dump = heapdump.writeSnapshot;
  
}).listen(5001);
