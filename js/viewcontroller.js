/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    
      'js/dialog'
    , 'deps/packery.pkgd'
    , 'lib/api'
    , 'js/viewcontroller.dock'
    , 'js/viewcontroller.toolbar'
    , 'js/viewcontroller.navigator'
    , 'd3'
    , 'guid'
    , 'socket.io'
    , 'jquery'
],
function (
      Dialog 
    , Packery
    , vrt
    , dock
    , toolbar
    , navigator
    , d3
    , Guid
    , io
    , $
    
) {

  var title, packery, blurred = false;

  function ViewController() {
    
    var status = "";

    this.status = function(text) {
      if(!arguments.length) return status;
      return status !== text ? ((status  = text), (this.toolbar && d3.select("body").each(this.toolbar))) : (status = text);
    };
      
  };
    
  ViewController.prototype.navigator = navigator;
    
  ViewController.prototype.blur = function blur (yes) {
      
        d3.selectAll(".widget.container")
          .each(function () {
            return vrt.get(this.id, function (err, obj) {
                if(err) throw err;
                return obj.render("blur", (blurred = yes) );
            });
          });

        if(yes)
            this.toolbar.hide(), this.dock.hide();

        return this;

 }
  
  ViewController.prototype.open = function open (name) {

      var context = this, 
          windows = this.dock.windows, 
          groups  = vrt.groups,
          window;
      
      function close () {
        packery && packery.destroy();
        context.hideVisible();
          
        if(! (chrome && chrome.app.window) )
            history.pushState(null, null, "/");
      };
        
      function active (d) {
          
        close();
                  
        if(groups[d.name]) {

            groups[d.name] = groups[d.name].sort(function(a, b) {
                return d3.ascending(a.sortKey, b.sortKey);
            });

            for(var i = 0, group = groups[d.name], len = group.length; i < len; i++) {
                 
                (group[i].dimensions.maximized = false), (group[i].show().visible() && group[i].reload());
                
            }
                  
        }
        
        title = title || document.title;
        document.title  = title + " -- " + d.name;
          
        packery = new Packery(
            document.body, 
            {
                itemSelector : ".widget.container", 
                gutter: 0, 
                isInitLayout: true, 
                isResizeBound: true
            });
          
        if(! (chrome && chrome.app.window))
            history.pushState(null, null, "#"+(d.id||d.name))
          
        d3.select("body").each(context.toolbar), document.body.scrollIntoView(); 

      };   
             
      (window = windows.get(name) || windows.add(name, "", close, active));
      
      if(Guid.isGuid(name)) {
          vrt.get(name, function(err, obj) {
              
              if(err) throw err;
              
              window = windows.get(name);
              window.name = obj.title;
              window.id = obj.id;
              window.active = function () {
                  return (obj.dimensions.maximized = true), active.apply(this, arguments), obj.show().reload();  
              };
              
          });
      }
      else if(typeof groups[name] === 'undefined') {
          window.remove();
          throw new Error('No group `'+name+'`');   
      }
      
      return windows.activate() ? window : window.activate();
  };

  ViewController.prototype.initialize = function() {

      var context    = this,
          elements   = this.elements(),
          navigation = $(elements.navigation),
          height     = navigation.height(),
          t;

     (this.dock = dock.call(document.body)).shortcuts.add("dashboards", "Open the dashboard browser", function click () { context.navigator(); });
      
      (this.toolbar = toolbar.call(document.body),
      this.toolbar.add("destroy", "Close this dashboard", 
        function click (d) {
          return context.dock.windows.activate().remove(), d3.select("body").each(context.toolbar);
        },
        function show () {
          return d3.select(this).style("display", context.dock.windows.activate() ? null : "none");
        }),
      this.toolbar.add("aligntop", "Scroll dashboard to top", 
        function click () {
          return document.body.scrollIntoView();
        }), 
      this.toolbar.add("save", "Save this layout", 
        function click (d) {
            packery.getItemElements().forEach(
                function (element, index) {
                    vrt.get(element.id, function (err, obj) {
                        if(err) throw err;
                        obj.save({sortKey: index});
                    });
                });
            return vrt.controls.status("Layout was saved!");
        }),
       this.toolbar.add("fullscreen", "", 
        function on (d) {
            document.body.webkitRequestFullScreen();
            return "Exit Fullscreen Mode";
        },
        function off (d) {
          document.webkitExitFullscreen();
          return "Fullscreen Mode";
        }), 
        this.toolbar.add("status", "", function show () {
          return d3.select(this).text(context.status()).attr("class", "status");
        })
      );
      
      (function (add) {
        
        this.toolbar.add = function () {        
            
            var item = context.toolbar.get("status").remove(), 
                added = add.apply(this, arguments);
            
            add(item.name, item.description, item.show);
            
            return added;
        };
        
      }).call(this, this.toolbar.add);
     
      window.addEventListener("popstate", function() {
          return context.open(window.location.hash.replace(/^#/, "")||context.hideVisible()).activate();
      }, false);
            
     (function(widgets) {
        
        var widget;
         
        window.addEventListener('resize', function () {
          
            for(var id in widgets)
                if( (widget = widgets[id]) )
                    widget.onResize();
              
            for(var id in widgets)
                if( !(widget = widgets[id]).visible() )
                    widget.onResize();
                
        }, true);
         
         window.addEventListener('scroll', function () {

            d3.selectAll(".widget.container")
              .each(function () {
                  vrt.get(this.id, function (_, obj) {
                    if(obj.visible() && !obj.reload(3))
                        obj.reload();
                    else if(!obj.visible())
                        obj.unload();
                });
            });
             
        });
            
    })(vrt.collection);
      
  };
    
  ViewController.prototype.dialog  =  function(options) {
      
      var context = this, dialog = this._dialog;
      
      this.blur(true);
      
      if(!dialog) {
          
          dialog = new Dialog('main-window-dialog', {
              
              "max-width" : function () { 
                  return window.innerWidth + "px"; 
              },
              "max-height" : function () { 
                  return window.innerHeight + "px"; 
              },
              "width" : function () { 
                  return Math.round(window.innerWidth / 2) + "px"; 
              },
              "left" : function () {
                  return Math.round( (window.innerWidth / 2) - (this.offsetWidth / 2) )  + "px"
              },
              "top" : function () {
                  return Math.round( (window.innerHeight / 2) - (this.offsetHeight / 2) )  + "px"
              }
              
          }, $.extend({
              isModal :true,
              size: "smallest",
              movable : true,
              resizable: true
          }, options))
          .on("destroy", function () {
              context.blur(false);
              context._dialog = null;
          });
          
          this._dialog = dialog;
          
      }
      
      return this._dialog;
  };

  ViewController.prototype.message =  function(text, type) {
      return this.dialog().insert("alert", {type: type, html: text});
  };

  ViewController.prototype.hideVisible = function () {      
      
      document.title = title || document.title;
          
      return d3.selectAll(".widget.container").each(function () {
        vrt.get(this.id, function(err, obj) {
            if(err) throw err;
            return obj.hide().unload();
        });
      });
      
  };

  ViewController.prototype.elements =  function () {

      return {
        navigation : $('#navigation').get(0),
        status : $('#status').get(0),
        messages : $('div.backdrop div.messages').get(0),
        backdrop : $('div.backdrop').get(0)
      };
  };
  
  return ViewController;

});
