/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    
      'js/dialog'
    , 'lib/api'
    , 'js/viewcontroller.dock'
    , 'js/viewcontroller.toolbar'
    , 'js/viewcontroller.navigator'
    , 'd3'
    , 'guid'
    , 'socket.io'
    , 'jquery'
    , 'types/widget'
],
function (
      Dialog 
    , vrt
    , dock
    , toolbar
    , navigator
    , d3
    , Guid
    , io
    , $
    , Widget
    
) {

  var title, blurred = false;

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
                return obj.render({'blur': [(blurred = yes)]});
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
        
        context.hideVisible();
          
        if(! (typeof chrome === "object" && chrome.app.window) )
            history.pushState(null, null, "/");
      };
        
      function active (d) {
          
          var i, group, len, widget;
          
        close();
                  
        if(groups[d.name]) {

            groups[d.name] = groups[d.name].sort(function(a, b) {
                return d3.ascending(a.sortKey, b.sortKey);
            });

            for(i = 0, group = groups[d.name], len = group.length; i < len; i++) {
                 
                widget = group[i];
                widget.dimensions.maximized = false;
                widget.show();
                
            }
                  
        }
        
        title = title || document.title;
        document.title  = title + " -- " + d.name;
          
        if(! (typeof chrome === "object" && chrome.app.window))
            history.pushState(null, null, "#"+(d.id||d.name))
          
        d3.select("body").each(context.toolbar), document.body.scrollIntoView(); 

      };   
             
      (window = windows.get(name) || windows.add(name, "", close, active));
      
      if(Guid.isGuid(name)) {
          vrt.get(name, function(err, obj) {
              
              if(err) throw err;
              
              obj.toolbar.remove("expand"), 
              obj.toolbar.remove("move"),
              obj.toolbar.remove("aligntop");
              
              context.toolbar.remove("destroy"), 
              context.toolbar.remove("save"),    
              context.toolbar.remove("aligntop");     
              
              window = windows.get(name);
              window.name = obj.title;
              window.id = obj.id;
              window.active = function () {
                  return (obj.dimensions.maximized = true), active.apply(this, arguments), obj.show();  
              }
              
              return window.activate();
              
          });
      }
      else if(typeof groups[name] === 'undefined') {
          window.remove();
          throw new Error('No group `'+name+'`');   
      }
      
      return windows.activate() ? window : window.activate();
  };

  ViewController.prototype.initialize = function () {

      var context    = this,
          elements   = this.elements(),
          navigation = $(elements.navigation),
          height     = navigation.height(),
          t;

     (this.dock = dock.call(document.body));
      
     this.dock.shortcuts.add("dashboards", "Open the dashboard browser", function click () { context.navigator(); });
      
     if(vrt.data)
         this.dock.shortcuts.add("data-editor-default-adapter", "Open Data Viewer", function click () {
             
             context.dialog("data-editor", {"min-width" : "85%"}, {isModal: true})
                    .insert("titlebar", {text:  "Data Viewer"})
                    .insert("datagrid", {
                        "data" : vrt.data
                    });

         });
      
     this.dock.shortcuts.add("create", "Create a new widget", function click () {
         
         var window = context.dock.windows.activate();
         
         vrt.store.typeNames(function (err, types) {
             
             types.unshift("");
             
             Widget.prototype.dialog.call({}, {
                 "type" : "",
                 "title" : "My Widget",
                 "description" : "",
                 "group" : window ? window.name : "My Group",
                 "width" : "50%",
                 "height" : "25%",
                 "background" : d3.select(document.body).style("background-color")

             }, "Create a new widget", function (dialog) {

                 obj = this;
                 
                 dialog
                     .add(this, "type", types.filter(function (t) { return t !== "widget";}))
                     .add(this, "group")
                     .nest()
                     .disabled(!!window);
                 
                 dialog.add(this, "background", "color");
                 
            })
            .insert("button", {
                 style: {
                    "padding-top" : "16px",
                    "padding-bottom" : "16px"
             },
             type: "primary",
             text : "Create",
             action: function () {
                 
                 var button = this;
                 
                 vrt.create(obj, function (err, obj) {
                    
                     if(err) {
                        button.alert = button.dialog.insert("alert", {type: "danger", html: err.message});
                        throw err;
                     }
                     
                     button.dialog.destroy();
                    
                     if(!window)
                         context.open(obj.group);
                      else
                          window.activate();

                      obj.dialog();

                  });
                 
             }});
             
         });
         
     });
      
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
          
          return d3.selectAll(".widget.container").each(function () {
                vrt.get(this.id, function(err, obj) {
                    if(err) throw err;
                    return obj.save(function (err) {
                        if(err) throw err;
                        context.status("Saved!");
                    });
                });
              });
          
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
                    Widget.events.resize.call(widget);
              
            for(var id in widgets)
                if( !(widget = widgets[id]).visible() )
                    Widget.events.resize.call(widget);
                
        }, true);
            
    })(vrt.collection);
      
  };
    
  ViewController.prototype.dialog  =  function(classnames, style, options) {
      
      var context = this, dialog = this._dialog;
      
      this.blur(true);
      
      options = options || {};
      
      if(!dialog || options.isModal === false) {
          
          dialog = new Dialog( (classnames || 'main-window-dialog') + " has-blur", $.extend({
        
              "width" : function () { 
                  return Math.round(window.innerWidth / 2) + "px"; 
              },
              "left" : function () {
                  return Math.round( (window.innerWidth / 2) - (this.offsetWidth / 2) )  + "px"
              },
              "top" : function () {
                  return Math.round( (window.innerHeight / 2) - (this.offsetHeight / 2) )  + "px"
              }
              
          }, style), $.extend({
              isModal : true,
              size: "smallest",
              movable : true,
              resizable: true
          }, options))
          .on("destroy", function () {
              context.blur(!!d3.select(".has-blur").node());
              context._dialog = null;
              
          });
          
          if( !("isModal" in options) || options.isModal === false )
            this._dialog = dialog;
          
      }
      
      return this._dialog || dialog;
  };

  ViewController.prototype.message =  function(text, type) {
      return this.dialog().insert("alert", {type: type, html: text});
  };

  ViewController.prototype.hideVisible = function () {      
      
      document.title = title || document.title;
          
      return d3.selectAll(".widget.container").each(function () {
        vrt.get(this.id, function(err, obj) {
            if(err) throw err;
            return obj.hide();
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
