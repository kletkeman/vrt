/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


require.config({
    
    'baseUrl' : '/',    
    'shim'    : {
        'bson': {
          'exports': 'bson'
        },
        'socket.io': {
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
        'interact': {
          'exports': 'interact'
        },
        'loglevel' : {
          'exports' : 'log'
        },
        'guid' : {
          'exports' : 'Guid'
        }
    },
    
    'paths' : {
        'socket.io' : '/node_modules/socket.io/node_modules/socket.io-client/socket.io',
        'jquery'    : '/deps/jquery',
        'd3'        : '/deps/d3.v3',
        'w2ui'      : '/deps/w2ui-1.3.2',
        'guid'      : '/node_modules/guid/guid',
        'loglevel'  : '/node_modules/loglevel/dist/loglevel',
        'bson'      : '/node_modules/bson/browser_build/bson',
        'debug'     : '/deps/debug',
        'interact'  : '/deps/interact',
        'text'      : '/deps/text'
    },
     'map': {
        '*': {'types' : 'lib/types/browser'},
    }
});

require(['guid', 'lib/api', 'lib/stores/clientstore', 'js/viewcontroller'], function (Guid, vrt, ClientStore, ViewController) {
        
    vrt.configure({
        store     : new ClientStore(),
        controls  : new ViewController(),
        browser   : true
    }).ready(function () {

      var id = chrome && chrome.app.window ? chrome.app.window.current().id : window.location.hash.replace(/^#/, "");
        

      vrt.log.disableAll();
      vrt.controls.initialize();

      if(!Guid.isGuid(id))
          return vrt.store.reload(function () {
            
            if(id.length)
                return vrt.controls.open(id);
            
          });
    
      return vrt.get(id, function(err, obj) {
              
            if(err) throw err;
              
            obj.toolbar.remove("expand"), 
            obj.toolbar.remove("move");
            obj.toolbar.remove("aligntop");
              
              
            vrt.controls.toolbar.remove("destroy"), 
            vrt.controls.toolbar.remove("save"),    
            vrt.controls.toolbar.remove("aligntop");              
            
            vrt.controls.open(id);
            
            vrt.controls.dock.destroy();              
            
          
      });
 
    });
    
});
