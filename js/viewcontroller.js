define(['lib/api', 'js/viewcontroller.dock', 'js/viewcontroller.toolbar', 'js/viewcontroller.navigator', 'd3'], function (vrt, dock, toolbar, navigator, d3) {

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
      
      if(typeof groups[name] === 'undefined')
        throw new Error('No group `'+name+'`');

      (window = windows.get(name) || 
                windows.add(name, "", 

            function close () {
               return context.hideAll(), history.pushState(null, null, "/");
            },
        
            function active (d) {

              groups[d.name] = groups[d.name].sort(function(a, b) {
                return d3.ascending(a.sortKey, b.sortKey);
              });

              context.hideAll();

              for(var i = 0, group = groups[d.name], len = group.length; i < len; i++)
                group[i].show();  

              context.__title = document.title;
              document.title  = context.__title + " -- " + d.name;
          
              return history.pushState(null, null, "#"+d.name), d3.select("body").each(context.toolbar), document.body.scrollIntoView(); 

            }

      ));
      
      return windows.activate() ? window : window.activate();
  };

  ViewController.prototype.initialize = function() {

      var context    = this,
          elements   = this.elements(),
          navigation = $(elements.navigation),
          height     = navigation.height(),
          t;

     (this.dock=dock(this)).shortcuts.add("dashboards", "Open the dashboard browser", function click () { context.navigator(); });
      
      (d3.select("body").each(this.toolbar = toolbar()),
      this.toolbar.add("destroy", "Close this dashboard", 
        function click (d) {
          return context.dock.windows.activate().remove(), d3.select("body").each(context.toolbar);
        },
        function show () {
          return d3.select(this).style("display", context.dock.windows.activate() ? null : "none");
        }),
      this.toolbar.add("layout", "Save this layout", 
        function click (d) {
          
        }), 
        this.toolbar.add("status", "", function show () {
          return d3.select(this).text(context.status()).attr("class", "status");
        })
      );
     
      window.addEventListener("popstate", function() {
          return context.open(window.location.hash.replace(/^#/, "")||context.hideAll()).activate();
      }, false);
            
     (function(widgets) {
        
        var widget;
         
        window.addEventListener('resize', function () {
          
            for(var id in widgets)
                if( (widget = widgets[id]).visible() && !widget.stacked )
                    widget.onResize()
              
            for(var id in widgets)
                if( !(widget = widgets[id]).visible() && !widget.stacked )
                    widget.onResize();
                
            }, true);
            
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

  ViewController.prototype.hideAll = function () {
      for(var id in vrt.collection)
        vrt.collection[id].hide();
      
       document.title = this.__title ? this.__title : document.title;
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
