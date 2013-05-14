var express = require('express')()
  , server = require('http').createServer(express)
  , io = require('socket.io').listen(server)
  , app = require('./vrt');

app.scripts = [
	'/js/prototype.js',
	'/js/color.js',
	'/js/proto.js',
	'/js/time.js',
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
	"publish": function(id, eventHandlerName, data, callback) {

		io.sockets.emit('event', {
			_streamFetchType: 'on*',	
			type: id,
			action: eventHandlerName, 
			ms: data
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
