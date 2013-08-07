var jsdom    = require("jsdom"),
	fs       = require('fs'),
	jquery   = fs.readFileSync(__dirname + "/deps/jquery.js", "utf-8").toString(),
	document = jsdom.jsdom("<html><head></head><body></body></html>"),
	window   = document.createWindow();
		
(new Function("window", "document", jquery))(window, document);

global.$ = window.$;
global.heapdump = require("heapdump");
global.vrt = require('./lib/api');
global.Base = require('./lib/base');

var basedir = '/lib/types/base',
	browserdir = '/lib/types/browser',
	jsdir = '/js',
	depsdir = '/deps';
	
module.exports.scripts = [
	'/lib/store.js',
	'/lib/stores/clientstore.js',
	'/lib/api.js',
	'/lib/queue.js'
];

var base = [basedir + '/dataset.js'].concat(fs.readdirSync(__dirname + basedir).sort().filter(function(path) {
		return path.indexOf('dataset.js') === -1;
	}).map(function(path) {
		return basedir + '/' + path;
	}) ),
	browser = [browserdir + '/dataset.js'].concat(fs.readdirSync(__dirname + browserdir).sort().reverse().filter(function(path) {
			return path.indexOf('dataset.js') === -1;
		}).map(function(path) {
			return browserdir + '/' + path;
	}) );
	js = fs.readdirSync(__dirname + jsdir).sort().map(function(path) {
		return jsdir + '/' + path;
	}),
	deps = fs.readdirSync(__dirname + depsdir).sort().map(function(path) {
		return depsdir + '/' + path;
	});

module.exports.scripts = deps.concat(js).concat(module.exports.scripts).concat(base).concat(browser);

module.exports.routes = [

	{	
		path:   '/',
		method: 'get',
		secure: false,
		handler: function(req, res) {
			res.send(404);
		}
	},

	{	
		path:   '/api/v1/list',
		method: 'get',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			vrt.list(function(err, list) {
				list = list || {};
				list.error =  err ? err.message : 0;
				res.send(list);
			});
		}
	},

	{	
		path:   '/api/v1/list',
		method: 'post',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			req.accepts('application/json');
			try {
				vrt.list(req.body, function(err, list) {
					list = list || {};
					list.error =  err ? err.message : 0;
					res.send(list);
				});
			}
			catch(err) {
				res.send({error: err.message});
			}
		}
	},
	
	{	
		path:   '/api/v1/tree/:path',
		method: 'get',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			req.accepts('application/json');
			try {
				res.send(vrt.tree(req.params.path));	
			}
			catch(err) {
				res.send({error: err.message});
			}
		}
	},

	{	
		path:   '/api/v1/available',
		method: 'get',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			res.send(vrt.available());
		}
	},

	{	
		path:   '/api/v1/create',
		method: 'post',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			req.accepts('application/json');
			try {
				vrt.create(req.body, function(err, config) {
					config = config || {};
					config.created_from_ip_address = req.connection.remoteAddress;
					config.error =  err ? err.message : 0;
					res.send(config);
				});
			}
			catch(err) {
				res.send({error: err.message});
			}
		}
	},

	{	
		path:   '/api/v1/:id',
		method: 'get',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			vrt.get(req.params.id, function(err, config) {
				config = config || {};
				config.error =  err ? err.message : 0;
				res.send(config);
			});
		}
	},

	{	
		path:   '/api/v1/:id',
		method: 'post',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			req.accepts('application/json');
			try {
				vrt.write(req.params.id, req.body, function(err) {
					res.send({error: err ? err.message : 0});
				});
			}
			catch(err) {
				res.send({error: err.message});
			}
		}
	},

	{	
		path:   '/api/v1/:id/save',
		method: 'post',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			req.accepts('application/json');
			try {
				vrt.save(req.params.id, req.body, function(err) {
					res.send({error: err ? err.message : 0});
				});
			}
			catch(err) {
				res.send({error: err.message});
			}
		}
	}
	
];