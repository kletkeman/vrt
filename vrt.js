var jsdom      = require("jsdom"),
	fs         = require('fs'),
	jquery     = fs.readFileSync(__dirname + "/deps/jquery.js", "utf-8").toString(),
	document   = jsdom.jsdom("<html><head></head><body></body></html>"),
	window     = document.createWindow(),
	JSONStream = require("JSONStream");
		
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
	js = fs.readdirSync(__dirname + jsdir).sort().filter(function(path) {
			return path.indexOf('boot.js') === -1;
		}).map(function(path) {
			return jsdir + '/' + path;
	}),
	deps = fs.readdirSync(__dirname + depsdir).sort().map(function(path) {
		return depsdir + '/' + path;
	});

module.exports.scripts = deps.concat(js).concat(module.exports.scripts).concat(base).concat(browser).concat(['/js/boot.js']);

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
			try {
				vrt.list(function(err, list) {
					if(err) return res.send({error: err.message});
					res.send(list);
				});
			}
			catch(err) {
				res.send({error: err.message});
			}
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
					if(err) return res.send({error: err.message});
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
				vrt.tree(req.params.path, function(err, tree) {
					if(err) return res.send({error: err.message});
					res.send(tree);
				});
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
					if(err) return res.send({error: err.message});
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
			try {
				vrt.get(req.params.id, function(err, config) {
					if(err) return res.send({error: err.message});
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
		path:   '/api/v1/:id/data',
		method: 'get',
		sessions: false,
		secure: false,
		handler: function(req, res) {
			
			var stream = JSONStream.stringify(false);

			stream.pipe(res).on('error', function(err) {
				res.end({error: err.message});
			});

			vrt.data(req.params.id, stream);
				
			
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