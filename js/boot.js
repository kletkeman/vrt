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
        'bson'              : '/node_modules/bson/browser_build/bson',
        'debug'             : '/deps/debug',
        'interact'          : '/deps/interact',
        'text'              : '/deps/text',
        'eventemitter'      : '/deps/eventemitter',
        'gl-matrix'         : '/deps/gl-matrix',
        'default-adapter'   : '/lib/adapters/json.adapter'
    },
     'map': {
        '*': {'types' : 'lib/types/browser'},
    }
});

require(['guid', 'lib/api', 'lib/stores/clientstore', 'js/viewcontroller', 'default-adapter'], function (Guid, vrt, ClientStore, ViewController, Adapter) {
        
    vrt.configure({
        store     : new ClientStore(),
        controls  : new ViewController(),
        browser   : true
    }).ready(function () {

      var id = typeof chrome === "object" && chrome.app.window ? chrome.app.window.current().id : window.location.hash.replace(/^#/, "");
        
      this.data = new Adapter();
        
      vrt.log.disableAll();
      vrt.controls.initialize();

      if(!Guid.isGuid(id))
          return vrt.store.reload(function () {
            
            if(id.length)
                return vrt.controls.open(id);
              
          });
    
      return vrt.controls.dock.destroy(), vrt.controls.open(id);
 
    });
    
});
