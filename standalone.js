/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

var requirejs = require('requirejs'),
    config    = require("./package.json").configure,
    build     = require("./build.json"),
    debug     = require("debug"),
    fs        = require("fs");

requirejs.config(build);
requirejs.config({
    'shims' : {
      'jquery' : {
        'exports' : '$'
      }
    },
    'paths' : {
        'types'   : 'lib/types/server',
        'jquery'  : 'deps/jquery'
    },
    'nodeRequire': require,
    'loglevel' : 1,
    'throwWhen' : {
       'optimize': true
    }
});

requirejs([
      'bson'
    , 'express'
    , 'morgan'
    , 'http'
    , 'socket.io'
    , 'vrt'
    , 'net'
    , 'repl'
    , 'optimist'
    , 'cluster'
    , 'os'
    , ('lib/stores/' + config.store.name)
    , 'lib/template'
    , 'fs'
],
function (
          
      bson
    , express
    , morgan
    , http
    , socketio
    , vrt
    , net
    , repl
    , optimist
    , cluster
    , os
    , __STORE
    , Template
    , fs

) {
    
    var app     = express(),
        server  = http.createServer(app),
        io      = socketio.listen(server),
        argv    = optimist.argv,
        workers = {},
        BSON = bson.pure().BSON;   

    vrt.configure({
        "store": new __STORE(config.store.options),
        "io" : io
    }).ready(function() {
        
        app.configure(function() {
            app.set('view engine', 'jade');
            app.set('view options', {
                layout: false
            });
            app.use(express.bodyParser());
            app.use(express.static(__dirname+'/public/resources/'));
            app.use(express.static(__dirname+'/lib/types/'));
            app.use('/r', express.static(__dirname+'/node_modules/requirejs'));
       
        });

        app.configure('development', function () {
            app.use(morgan('dev'));
            app.use(express.static(__dirname));
        });

        app.configure('production', function () {

            app.use(morgan('tiny'));
            app.use('/js', express.static(__dirname+'/build'));
            
            build.include = fs.readdirSync("lib/types/browser")
                  .filter(function (name) { return name.indexOf('.js') > -1; })
                  .map(function (name) { return "lib/types/browser/"+name.replace('.js', ''); });
            
            requirejs.optimize(build, function () {
                vrt.log("Build Completed...");
            });
            
        });
    
        
      io.set('log level', typeof argv.setLevel === 'number' ? argv.setLevel : 2);
      io.set('browser client', false);

      vrt.log.setLevel(typeof argv.setLevel === 'number' ? Math.min(argv.setLevel, 3) : 2);

      if(cluster.isMaster)
          Template.load(function() {

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
          
        for(var i = 0, route, len = vrt.routes.length; i < len; i++) {
             route = vrt.routes[i];
             app[route.method.toLowerCase()](route.path, route.handler);
          }

          server.listen(config.http_port, config.http_address);

      }

      (function(port) {

          net.createServer(function (socket) {

              var remote = repl.start('vrt:'+(cluster.isMaster?'master':'worker[ '+cluster.worker.id+' ][ '+cluster.worker.process.pid) + ' ] >>> ', socket);

              remote.context.vrt   = vrt;
              remote.context.debug = debug;

              if(cluster.isMaster)
                  remote.context.workers = workers;

          }).listen(port);

      })(cluster.isMaster ? config.telnet_interface_port : config.telnet_interface_port + Number(cluster.worker.id));

      vrt.consumer.start();   
      
    });
    
    function exit (options, err) {
        
        if (err) vrt.log.error(err.stack);        
        if (options.exit) process.exit();
        
    };

    process.on('exit', exit);
    process.on('SIGINT', exit.bind(null, {exit: true}));
    process.on('uncaughtException', exit.bind(null, {exit: true}));
    
});
