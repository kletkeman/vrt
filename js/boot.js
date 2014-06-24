require.config({
    
    'baseUrl' : '/',    
    'shim'    : {
        'socketio': {
          'exports': 'io'
        },
        'jquery': {
          'exports': '$'
        },
        'd3': {
          'exports': 'd3'
        },
        'w2ui' : {
            'deps': ['jquery'],
            'exports': 'w2ui',
            'init' : function () {
                return {
                    'w2alert'   : w2alert, 
                    'w2confirm' : w2confirm,
                    'w2obj'     : w2obj, 
                    'w2popup'   : w2popup, 
                    'w2ui'      : w2ui, 
                    'w2utils'   : w2utils
                }
            }
        },
        'loglevel' : {
          'exports' : 'log'
        },
        'guid' : {
          'exports' : 'Guid'
        }
    },
    
    'paths' : {
        'types'    : 'lib/types/browser',
        'socketio' : 'node_modules/socket.io/node_modules/socket.io-client/socket.io',
        'jquery'   : 'deps/jquery',
        'd3'       : 'deps/d3.v3',
        'w2ui'     : 'deps/w2ui-1.3.2',
        'guid'     : 'node_modules/guid/guid',
        'loglevel' : 'node_modules/loglevel/dist/loglevel'
    }
});

require(['socketio', 'lib/api', 'lib/stores/clientstore', 'js/viewcontroller'], function (io, vrt, ClientStore, ViewController) {
    
    vrt.configure({
        store : new ClientStore(),
        controls : new ViewController(),
        browser : true
    }).ready(function () {

      var id = window.location.hash.replace(/^#/, "");

      vrt.log.disableAll();

      if(id.length) {
          
        vrt.get(id, function(err, obj) {
          if(err) return vrt.store.reload(function() { return vrt.controls.open(id).activate(), connect(); });
            return vrt.controls.dock.destroy(), vrt.controls.toolbar.remove("destroy"), vrt.controls.toolbar.remove("layout"), (obj.dimensions.maximized = true), obj.toolbar.remove("expand"), obj.toolbar.remove("move"), obj.show();
          });
      }
      else
        vrt.store.reload(function() {
            return connect(), vrt.controls.message("<span style=\"font-size: 18pt;\">Welcome to the VRT application</span>", "<br /><span style=\"font-size: 12pt;\">Move the cursor to the bottom to display the toolbar</span>", "<span style=\"font-size: 16pt;\">&darr;</span>", 10000);
        });

      vrt.controls.initialize()

      function connect () {
        return io.connect('http://' + window.location.hostname + ':' + window.location.port).on('event', 
          function(response) {
            vrt.receive(response.type, response.action, response.ms);
        });
      }

    });
    
});
