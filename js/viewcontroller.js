/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
      'deps/packery.pkgd'
    , 'lib/api'
    , 'js/viewcontroller.dock'
    , 'js/viewcontroller.toolbar'
    , 'js/viewcontroller.navigator'
    , 'd3'
    , 'guid'
    , 'socket.io'
],
function (
       
      Packery
    , vrt
    , dock
    , toolbar
    , navigator
    , d3
    , Guid
    , io
    
) {

  var title, packery;

  function ViewController() {
    
    var status = "";

    this.status = function(text) {
      if(!arguments.length) return status;
      return status !== text ? ((status  = text), (this.toolbar && d3.select("body").each(this.toolbar))) : (status = text);
    };
      
  };
    
  ViewController.prototype.navigator = navigator;
  
  ViewController.prototype.open = function(name) {

      var context = this, 
          windows = this.dock.windows, 
          groups  = vrt.groups,
          window;
      
      function close () {
        packery && packery.destroy();
        context.hideVisible();
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
          
        return history.pushState(null, null, "#"+(d.id||d.name)), d3.select("body").each(context.toolbar), document.body.scrollIntoView(); 

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
      this.toolbar.add("layout", "Save this layout", 
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

  ViewController.prototype.message =  function(text) {
    
      text = String(text);

      var msg = this.message, context = this, args = Array.prototype.slice.call(arguments),
        expire = typeof args[args.length - 1] === 'number' ? args.pop() : undefined,
              elements = this.elements(),
              messages = elements.messages,
              backdrop = elements.backdrop;
              
      
      msg.queue = msg.queue || [];

      if(args.length > 1) {
        while(args.length && (text = String(args.shift())))
          msg.apply(this, typeof expire === 'number' ? [text, expire] : [text]);
        return;
      }
      else if(msg.busy)
        return msg.queue.push(arguments);

      var e = d3.select(messages).insert("div", ":first-child"),
        b = d3.select(backdrop).classed("front", true);
        
      msg.busy = true;
      msg.back = clearTimeout(msg.back) | setTimeout(function(){b.classed("front", false);}, 5000);

      e.html(text);

      if(typeof expire === 'number')
        setTimeout(function() {e.remove();}, expire);

      function proceed() {
        msg.busy = false;
        if(msg.queue.length)
          msg.apply(context, msg.queue.shift());
              else if (!messages.childNodes.length) {
                  clearTimeout(msg.back);
                  b.classed("front", false);
              }
      };

      var t = setTimeout(proceed, 250);

      return {
        remove: function() {
          clearTimeout(t); 
          e.remove();	
          proceed();
        }
      };
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
