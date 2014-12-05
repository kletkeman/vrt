/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

var jsdom     = require("jsdom");

document = jsdom.jsdom("<html><head></head><body></body></html>"),
window   = document.createWindow();

define([
      'bson'
    , 'jquery'
    , 'module'
    , 'path'
    , 'fs'
    , 'JSONStream'
    , 'lib/api'
    , 'lib/producer'
    , 'lib/consumer'
    , 'lib/ipc'
], 
function (
       
      bson
    , $
    , module
    , path
    , fs
    , JSONStream
    , vrt
    , Producer
    , Consumer
    , IPC

) {   
    
    var __dirname = path.dirname(module.uri),
        BSON      = bson.pure().BSON;

    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true
    });

    vrt.configure({
        
        producer    : new Producer(),
        consumer    : new Consumer(),
        ipc         : new IPC(),
        routes      : [

            {	
                path:   '/',
                method: 'get',
                secure: false,
                handler: function(req, res) {
                    res.render('layout', {}); 
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
                            if(err) return res.send({error: err});
                            res.send(list);
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                            if(err) return res.send({error: err});
                            res.send(list);
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                            if(err) return res.send({error: err});
                            res.send(tree);
                        });
                    }
                    catch(err) {
                        res.send({error: err});
                    }
                }
            },

            {	
                path:   '/api/v1/typeNames',
                method: 'get',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    res.send(vrt.store.typeNames());
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
                            if(err) return res.send({error: err});
                            res.send(config);
                        });
                    }
                    catch(err) {
                        res.send({error: err});
                    }
                }
            },

            {	
                path:   '/api/v1/destroy',
                method: 'post',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    req.accepts('application/json');
                    try {
                        vrt.destroy(req.body.id, function(err) {
                            res.send({error: err ? err : false});
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                            if(err) return res.send({error: err});
                            res.send(config);
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                            res.send({error: err ? err : false});
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                        res.end({error: err});
                    });

                    vrt.data(req.params.id, stream);


                }
            },

            {	
                path:   '/api/v1/:id/data/delete',
                method: 'post',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    req.accepts('application/json');
                    try {
                        vrt.delete(req.params.id, (req.body.filter||req.body.index), req.body.path, function(err, info) {
                            res.send($.extend( info||{}, {error: err ? err : false}));
                        });
                    }
                    catch(err) {
                        res.send({error: err});
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
                            res.send({error: err ? err : false});
                        });
                    }
                    catch(err) {
                        res.send({error: err});
                    }
                }
            }

        ]})
        .ready(function (config) {
                
            try { 
                config = BSON.deserialize(fs.readFileSync(path.resolve(path.dirname(module.uri), 'etc/vrt.bson')), {evalFunctions : true});
            } catch (e) { config = {}; } 
            finally { 
                $.extend(this.trigger, config.trigger);
            }
        
            this.configure({
                dump : function (name) {
                    fs.writeFileSync('./etc/vrt.bson', BSON.serialize(vrt, false, true, true));        
                }
            });
            
        });
        
        return vrt;

});
