/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'bson'
    , 'jquery'
    , 'module'
    , 'path'
    , 'fs'
    , 'JSONStream'
    , 'lib/api'
], 
function (
       
      bson
    , $
    , module
    , path
    , fs
    , JSONStream
    , vrt

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
                path:   '/api/v1/typeNames',
                method: 'get',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    vrt.store.typeNames(function (err, types) {
                        if(err) return res.send({error: err});
                        res.send(types);
                    });
                    
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
                path:   '/api/v1/data',
                method: 'get',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    res.send(vrt.data.data());
                }
            },
            
            {	
                path:   '/api/v1/data/:path',
                method: 'post',
                sessions: false,
                secure: false,
                handler: function(req, res) {
                    req.accepts('application/json');
                    try {
                        vrt.data.write(req.params.path, req.body, function(err) {
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
