/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
     'debug'
    , 'js/dialog'
    , 'js/dialog.confirm'
    , 'js/dialog.context'
    , 'js/dialog.component'
    , 'js/options'
    , 'lib/adapters/adapter'
    , 'interact'
    , 'lib/types/base/widget'
    , 'lib/api'
    , 'lib/measure'
    , 'js/viewcontroller.toolbar'
    , 'js/box'
    , 'd3'
],
       
function (
      debug
    , Dialog
    , ConfirmationDialog
    , ContextMenuDialog
    , DialogComponent
    , Options
    , Adapter
    , interact
    , Widget
    , vrt
    , Measure
    , toolbar
    , Box
    , d3

) { debug = debug("widget:browser");
   
   const windows = [];
   
   windows.postMessage = function () {
       
       var closed = [], i;
    
       for(i = 0; i < this.length; i++) {
        
           w = this[i];
           
           if(w.closed)
               closed.push(w);
           else if(w !== window)
               w.postMessage.apply(w, arguments);
           
        }
       
       for(i = 0; i < closed.length; i++) {
        
           w = closed[i];
           
           this.splice(this.indexOf(w), 1);
        
       }
               
   }
 
  function Event (type) {
      this.type  = type;
      this.event = window.event;
  }
   
  Widget.prototype.blur = function (yes) {
      
      if(yes)
        this.toolbar.hide();
      
      d3.select(this.element)
        .style("pointer-events", yes ? "none" : null)
        .select(".title")
        .style("display", yes ? "none" : null);
      
      placeTitle.call(this);
      
      return this;
  }

  Widget.prototype.open = function () {
    
      var loc        = window.location, 
          url        = loc.origin + loc.pathname + "#" + this.id,
          dimensions = this.dimensions,
          width      = $(window).width(),
          height     = $(window).height(),
          screen     = window.screen,
          specs      = {
            'width'      : Math.round( (dimensions.width / width) * screen.availWidth ), 
            'height'     : Math.round( (dimensions.height / height) * screen.availHeight ),
            'left'       : Math.round( (parseInt(this.element.style.left) / width) * screen.availWidth ),
            'location'   : 'no',
            'menubar'    : 'no',
            'scrollbars' : 'no',
            'status'     : 'no',
            'titlebar'   : 'no',
            'toolbar'    : 'no',
            'dialog'     : 'no'
          };
      
      specs.top  = Math.round( Math.min((parseInt(this.element.style.top) / height) * screen.availHeight, screen.availHeight - specs.height) );

      if(typeof chrome === "object" && chrome.app.window)
          return chrome.app.window.create("/views/window.html#"+this.id, {
            id: this.id,
            outerBounds: {
              width: specs.width,
              height: specs.height,
              left: specs.left,
              top: specs.top
            },
            frame:{
                type  : "chrome",
                color : "#0f0f0f"
            }
          }, function (window) {
              windows.push(window.contentWindow);
          });
      
      return windows.push(window.open(url, "_blank", d3.keys(specs).map(function(k) { return (k + '=' + specs[k]); }).join(", "))), windows[windows.length-1];

  }
   
  function data_src_dialog (options) {
      
      var dialog =
      vrt.controls.dialog("data-editor", {"min-width" : "85%", "min-height" : "85%"}, options)
         .insert("titlebar", {text: this.title + " - Data"})
        .insert("layout", {  
             "data" : ['col-md-8 main', 'col-md-4 sidebar']
         })
         .set(0)
         .insert("datagrid", {  
             "data" : this.data
         })
         .nest()
         .on("modified", refresh.bind(this))
         .insert("selector", {
             "data" : this.selector
         })
         .up()
         .set(1);
      
         dialog.insert("buttons", {
             "data"          : ["glyphicon glyphicon-list", "glyphicon glyphicon-list rotate"],
             "selectedIndex" : 0,
             "style"         : {
                 "text-align" : "right"
             }
         })
         .nest()
         .on("modified", function () {
             this.selectedIndex;
         });
      
         this.data.options.prepend.call(dialog).add(this.data.options);
  }
   
  Widget.prototype.dialog = function (obj, title, prepend) {
       
      var form, 
          context  = this,
          dialog   = vrt.controls.dialog(),
          toolbar = this instanceof Widget ? this.toolbar
                        .clone.call(dialog.element.node()) : null;
      
     dialog.insert("titlebar", {
               text: title || this.title
            });
      
      if(arguments.length) {
          
          if(typeof prepend === 'function')
            prepend.call(obj, dialog);
          
          return dialog.add(obj);
          
      }
      
      dialog.on("modified", function (component) {
          
          refresh.call(context, component);
          Widget.events.resize.call(this);
          
      }.bind(this));
      
      dialog.insert("folder", {text: "settings", collapsed: false})
            .nest()
            .add(this, "id")
            .nest()
            .disabled(true)
            .up()
            .add(this, "title")
            .add(this, "description")
            .add(this, "type")
            .nest()
            .disabled(true)
            .up()
            .add(this, "width")
            .add(this, "height")
            .add(this, "background", "color")
            .add(this.margin, "left")
            .add(this.margin, "right")
            .add(this.margin, "top")
            .add(this.margin, "bottom")
            .up()
            .insert("folder", {text: "data source", collapsed: false})
            .nest()
            .add(context, "data", "string", ["", "default", "csv", "json", "xml", "manual", "audio"], function () {
                
                import_data_adapter.call(context, this.valueOf(), function () {
                    
                    dialog.destroy();
                    this.dialog();
                    
                    refresh.call(context);
                    
                });
          
            })
            .nest()
            .set(context.data ? context.data.name : "default")
            .up()
            .insert("button", {
                text   : "Select Data",
                type   : "primary",
                style  : {
                    "float" : "right",
                    "margin-top" : "16px"
                },
                action : data_src_dialog.bind(context, {isModal: false})
            });
      
      
      
      function orient () {
        dialog.element.select(".widget.toolbar")
              .style("z-index", parseInt(dialog.element.style("z-index")) + 1)
        return toolbar.orient("top", "right", "div:nth-child(2)"), toolbar();
      }
      
      if(toolbar) {
      
          dialog.on("move", orient);
          dialog.on("resize", orient);

          dialog.on("destroy", function () {
              toolbar.destroy();
          });

          orient().hide(false);
          
      }
      
      return this.options.prepend.call(dialog).add(this.options), dialog;
      
  }
  
  function import_data_adapter (name, callback) {
      
      var context = this,
          options = {},
          selection;
      
      if(typeof name === "object") {
            
            if(name instanceof Adapter)
                return;
          
            options   = name.options;
            selection = name.selection;
            name      = name.name;
      }
                    
      require([name === "default" ? "default-adapter" : ("lib/adapters/" + name + ".adapter")],
      function (A) {
                        
           if(!(context.data instanceof Adapter) || context.data.name !== name ) {
          
               if(context.data instanceof Adapter) {
                   context.data.destroy();
                   selection = context.data.selection;
               }
               
               context.data = new A(options, selection);
               
           }
                      
           context.data.read(callback.bind(context));
          
      });
                        
  }
   
  Widget.prototype.select =  function () {
      
      this.event = null;
      
      if(this.data && this.selector.length && typeof this.data.select === "function")
          this.data.select(
              this.selector,
              this.selector.accessor || (this.selector.accessor = this.update.bind(this))
          );
  }
  
  function synchronize_windows (event) {
      
      event = event || this.event.event;
      
      if( !event || !(event && event.type === "message") ) {
          
          (window.opener || windows).postMessage({'type' : 'put', 'data' : this.toJSON()}, window.location.origin);
          
      }
      
  }
  
  function refresh (component) {
      
      var event   = new Event('refresh');
        
      if(component) {
          event.component = component;
          event.dialog    = component.dialog;
      }
      
      event.function  = [synchronize_windows, this.update, this.select];
      
      this.event = event;
      this.render();
      
  }
   
   window.addEventListener("message", function (e) {
       
       var event = e.data, id = event.data.id;
       
       return vrt.get(id, function (err, obj) {
           
           if(err) throw err;
           
           switch(event.type) {
               
               case 'put'  :
                   
                   return Widget.events.save.call(obj, event.data);
                   
                case 'get' :
                   
                   return windows.postMessage({'type' : 'put', 'data' : obj.toJSON()}, window.location.origin);
                   
           }
       
       });
       
   });
   
   function Position (parent) {
       
       var dimensions = parent.dimensions,
           position   = parent.position || {},
           left       = position.left || 0,
           top        = position.top  || 0;
       
        this.place = function place (l, t) {
            
            var width     = $(window).width(),
                height    = $(window).height(),
                maximized = parent.dimensions.maximized;
            
            if (!maximized) {
            
                 l = typeof l === 'number' ? l : left * width;

                 left = Math.max(0, Math.min(Math.min(width - dimensions.width, l) / width, 1));

                 t = typeof t === 'number' ? t : top * height;

                 top = Math.max(0, Math.min(Math.min(height - dimensions.height, t) / height, 1));
                
            }
         
             d3.select(parent.element)
               .style({
                 'top'  : ((maximized ? 0 : top) * height) + "px",
                 'left' : ((maximized ? 0 : left) * width) + "px"
             });
            
        }
        
        this.toJSON = function () {
            
            return {
                left : left,
                top  : top
            };
        }
    
        Object.defineProperty(this, 'left', {
            get : function () {
                return left;
            },
            set : function (l) {
                if(typeof l === "number")
                    return (left = l), this.place();
            }
        });
       
        Object.defineProperty(this, 'top', {
            get : function () {
                return top;
            },
            set : function (t) {
                if(typeof t === "number")
                    return (top = t), this.place();
            }
        });
  }

  Widget.prototype.create = function () {
      
      var context   = this, 
          maximized = false, 
          width     = null, 
          height    = null, 
          sortKey   = this.sortKey || 0,
          adapter   = this.data,
          position  = this.position || {},
          selector  = this.selector || [],
          event, dialog, status = "", e;
      
      this.__events__ = [];
      
      this.options    = new Options(this.options);
      this.background = this.background || d3.select(document.body).style("background-color");
      
      this.dimensions = $.extend(Object.create({},
      {
        width: {
          get: function() {
            return this.maximized ? $(window).width() : width;     
          },
          set: function(value) {
            return (width = Number(value));
          }
        },
        height: {
          get: function() {
            return this.maximized ? $(window).height() : height;     
          },
          set: function(value) {
            return (height = Number(value));
          }
        }, 
        maximized: {
          get: function() {
            return maximized;     
          },
          set: function(value) {
            return (maximized = Boolean(value)), Widget.events.resize.call(context);
          }
        } 
      }),
      {
          margin : {
              top: 5,
              right: 5,
              bottom: 5,
              left: 20
          },
          compensated : Object.create({}, {
              width: {
                  get : function() {
                      var d = context.dimensions, m = d.margin;
                      return d.width - m.left - m.right;
                  }
              },
              height: {
                  get : function() {
                      var d = context.dimensions, m = d.margin;
                      return d.height - m.top - m.bottom;
                  }
              }
          })
      });
      
    this.position = new Position(this);
      
    Object.defineProperty(this, "data", {
        
      get: function() {
        return adapter || null;
          
      },
      set : function(a) {
          return (adapter = a);
      }
        
    });
      
    Object.defineProperty(this, "event", {
      get: function() {
        return event;
      },
      set : function(e) {
          
          if(e !== null)
            debug("event", e);
          
          return (event = e);
      }
    });
      
    Object.defineProperty(this, "selector", {
      get: function() {
        return selector;
      },
      set : function(s) {
          
          if(Array.isArray(s))
             for(var i = 0; i < s.length; i++)
                 if(s[i] !== null)
                     selector[i] = s[i];
      }
        
    });
      
    adapter =  $.extend({
        name : "default"
    }, this.data);

    this.element = document.createElement('div');
        
    d3.select(document.head)
      .selectAll("link[href='/lib/types/css/"+this.type+".css']")
      .data([this.type+'.css'])
      .enter()
      .append("link")
      .attr("rel", "stylesheet")
      .attr("media", "screen")
      .attr("href", function(d) {
          return "/lib/types/css/"+d;
      });
      
    d3.select(this.element)
    .style({
      'display' : 'inline-block',
      'vertical-align': 'top'
    })
    .classed("widget container", true)
    .classed(this.type.toLowerCase(), true)
    .attr("id", this.id)
    .on("dragover", function () {
        
        var e = d3.event;
        
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        
        
    })
    .on("drop", function () {
        
        var e = d3.event, files = e.dataTransfer.items;
        
        e.preventDefault();
        e.stopPropagation();
        
        if(files.length)
            context.data.load(files[0].webkitGetAsEntry(), function (err) {
                if(err) throw err;
                refresh.call(context);
            });
        
    });
      
    (this.toolbar     = toolbar.call(this.element).orient("top", "right", ".background"));
      
    (this.contextmenu = new ContextMenuDialog(this.element))
        .on("show", context.render.bind(context, {blur: [true]}))
        .on("hide", context.render.bind(context,  {blur: [false]}))
        .add("edit-data", "Select Data", "Open Data Selection Editor", data_src_dialog.bind(this))
        .add("properties", "Properties", "Show widget properties dialog", function () { 
            context.dialog();
        });
      
    d3.select(this.element)
      .append("div")
      .attr("class", "widget background");

    d3.select(this.element)
      .append("div")
      .attr("class", "widget title")
      .append("span")
      .attr("class", "text")
      .text(this.title);    
          
    this.toolbar.add("destroy", "Destroy this widget", function click () {
            
      return new ConfirmationDialog( "Destroy widget " + context.title, "Are you sure you want to destroy this widget and all data? This cannot be undone.",
                function(answer) {
                  if(answer)
                      context.destroy();
              });

    }),
    this.toolbar.add("save", "Save settings", function click () { 
        return context.save(function (err) {
            vrt.controls.status("Saved!");
        });
    }),
    this.toolbar.add("options", "", {
        
        'on' : function () {
            
            var button = this;
       
            context.blur(true).toolbar.hide();
            
            dialog = new Dialog('quick-config-dialog', {

                'left'       : function () { 
                    return Math.max(0, Math.min(
                        $(window).width() - this.offsetWidth, 
                        context.element.offsetLeft + button.offsetParent.offsetLeft + button.offsetParent.offsetWidth - this.offsetWidth
                    )) + "px"; },
                'top'        : function () { 
                    return Math.max(0, Math.min(
                        $(window).height() - this.offsetHeight,
                        context.element.offsetTop + button.offsetParent.offsetTop
                    )) + "px"; 
                },
                'max-height' : function () { 
                    return window.innerHeight + "px";
                }

            }, {
                size: "smallest"
            })
            .on("modified", refresh.bind(context));

            context.options.prepend.call(dialog).add(context.options);
            
            dialog.insert("form", {
                    style: {
                        "text-align": "right",
                        "padding" : "8px"
                    }
                })
                .nest()
                .insert("button", {

                    text: " More options ",
                    type: "default",
                    action: function () {
                        $(button).trigger("click");
                        context.dialog();
                    }
                })
                .insert("button", {

                    text   : "Close",
                    type   : "primary",
                    style  : {
                        "margin-left" : "8px"
                    },
                    action : function () {
                        $(button).trigger("click");
                    }
                })
                .on("destroy", function () {
                    context.blur(false);
                });
            
            return "Close Options"
        
        },
        'off' : function off () {
            
            if(dialog)
                dialog.destroy();
            
            dialog = null;
            
            return "Quick Options";
        }
    }),
    this.toolbar.add("expand", "Expand this widget into a new window", function click () { return context.open(); }),
    this.toolbar.add("move", "Move widget", 
        function over (d, event) {
        
        var selection = d3.selectAll(".widget.container")
                          .style("z-index", 0),
            element    = d3.select(context.element)
                           .style("z-index", 100);
        
        if(d.interactable && d.interactable._element !== this) {
            d.interactable.draggable(null);
            d.interactable = null;
        }
        
        d.interactable = d.interactable ||
            interact(this)
            .draggable(true)
            .on("dragstart", function () {
                selection.classed("place", true);
            })
            .on("dragmove",    function (event) {
            
                context.position.place(
                    parseInt(element.style('left')) + event.dx,
                    parseInt(element.style('top')) + event.dy
                );

            })
            .on("dragend", function () {
                selection.classed("place", false);
            });
        
     }),
     this.toolbar.add("status", "", function show () {
        return d3.select(this).text(context.status()).attr("class", "status");
     });
    
    (function (add) {
        
        this.toolbar.add = function () {
            
            var item = context.toolbar.get("status").remove(), 
                added = add.apply(this, arguments);
            
            add(item.name, item.description, item.show);
            
            return added;
        };
        
      }).call(this, this.toolbar.add);
      
    this.status = function(text) {
      if(!arguments.length) return status;
      return status !== text ? ((status  = text), (this.toolbar && d3.select(this.element).each(this.toolbar))) : (status = text);
    };
      
    if(window.opener)
        window.opener.postMessage({'type' : 'get', 'data' : {'id': this.id}}, window.location.origin);
      
    return Widget.events.resize.call(this), ((this.group === (vrt.controls.dock.windows.activate()||{}).name) && this.show());

  };

  Widget.events.resize = function(event, w, h) {
      
      var expression = /\d+%/gi, // Check if percent
          dimensions,
          paths = ['width', 'height', 'margin.top', 'margin.bottom', 'margin.left', 'margin.right'],
          reference = {
              'width' : ( w || $(window).width() ),
              'height' : ( h || $(window).height() )
          },
          path, property, name, object;
      
      while(path = paths.shift()) {
          
          path       = path.split('.'),
          property   = true,
          dimensions = this.dimensions;
          
          while(path.length && property) {
              property   = ( object = (property && typeof property === 'object' ? property : this) )[(name = path.shift())],
              dimensions = ( dimensions[name] && typeof dimensions[name] === 'object' ? dimensions[name] : dimensions );
          }
          
          if(!property)
              continue;
          
          if(typeof property === 'string') {
              
              if(property.match(expression))
                  dimensions[name] = (reference[name] / 100) * parseInt(property, 10);
              else
                  dimensions[name] = parseInt(property, 10);
              
          } 
          else if (typeof property === 'number')
              dimensions[name] = property;
          
          dimensions[name] = Math.floor(dimensions[name]);
          
          reference.bottom = reference.top = this.dimensions.height;
          reference.left = reference.right = this.dimensions.width;
          
      }
    
      return this.position.place(), placeTitle.call(this), this.render({resize: []});
          
  }

  Widget.events.save = function (data) {
      return vrt.save(this.id, data, false), (this.event = $.extend(new Event('save'), {'data': data, function : [Widget.events.resize, this.update]})), refresh.call(this);
  }

  Widget.events.destroy = function () {
      return vrt.destroy(this.id, false);
  }
  
  Widget.events.create = function (data) {
      return vrt.create(data, false);
  }

  Widget.prototype.show = function (container) {
      
      var context = this;
      
      container = container || document.body;
      
      if(this.visible())
        return this;
    
      container.appendChild(this.element);
      
      import_data_adapter.call(this, this.data, function (err) {
          
         if(err)
            return vrt.controls.message(err.message || "An error occured, open the console for more details", "danger");

            refresh.call(context);
          
      });
        
      return this;
          
  }

  Widget.prototype.hide = function() {
      return d3.select(this.element).remove(), this;  
  }

  Widget.prototype.visible = function() {
      return !!this.element.parentNode;
  }
  
  Widget.__queue__ = [];
    
  function render (e) {
      
      var queue  = Widget.__queue__,
          events = this.__events__,
          i;
        
      if(queue.indexOf(this) === -1)
          
          queue.push(this);
      
      
      if(typeof e === "object") {
          
          for(var name in e) {
              
              if( (i = events.indexOf(name)) === -1)
                  
                  events.push(
                      this[name].bind.apply(this[name], [this].concat(e[name])), name
                  );
          }
          
      }
      else if( (e = this.event) && (i = events.indexOf(e.type)) > -1 )
          
          events[i - 1] = e;
          
      else if (e && events.indexOf(e) === -1)
          
            events.push(e, e.type);
      
      this.event = null;
      
      function draw (t) {

          var obj, f, length = queue.length, j = 0;

          (Widget.__animationRequestId__ = null);

          while ( (obj = queue[0]) ) {
              
              events = obj.__events__;
                
              if(events.length) {
                  
                  while ( (e = events[0]) ) {
                      
                      debug("render event identifier", events[1]);
                  
                      if(typeof e === "function")
                          
                          e.call(obj);
                      
                      else if ( (f = e.function)) {
                          
                          obj.event = e;
                          
                          if(Array.isArray(f))
                              
                              while(f.length) {
                                  
                                  obj.event = e;
                                  
                                  f.shift().call(obj);
                                  
                              }
                          
                          else if( typeof f === "function" )
                              
                              f.call(obj);
                      }
                      
                      events.splice(0, 2);
                      
                  }
                  
                  j--;
                  
              }
              else {
                  
                  if(obj.visible()) {
                      
                      if(obj.draw())
                        queue.push(queue.shift());
                      else
                        queue.shift();
                      
                  }
                  else
                    queue.shift();
              }
              
              obj.event = null;
              
              if(++j >= length)
                  break;
          }

          debug("render", (window.performance.now() - t), "milliseconds");

          if (queue.length) (Widget.__animationRequestId__ = requestAnimationFrame(draw));
            
      }
        
      return (Widget.__animationRequestId__ || (Widget.__animationRequestId__ = requestAnimationFrame(draw))), this;
  }
   
  Widget.prototype.render = render;

  Widget.prototype.update = function () {
      return this.render();
  }

  Widget.prototype.resize = function () {
      
      var dimensions = this.dimensions;
      
      d3.select(this.element)
          .style({
              'width'  : dimensions.width + "px",
              'height' : dimensions.height + "px",
              'top'    : dimensions.left + "px",
              'left'   : dimensions.left + "px"
          });

      d3.select(this.element).select(".widget.background")
        .style({
          'left'       : dimensions.margin.left + 'px',
          'top'        : dimensions.margin.top + 'px',
          'width'      : dimensions.compensated.width + 'px',
          'height'     : dimensions.compensated.height + 'px',
          'background-color' : this.background
        });
      
      placeTitle.call(this);
      
  }

  Widget.prototype.destroy = function () {
      
      var interactable = this.toolbar.get("move").interactable;
      
      if(interactable)
          interactable.unset();
      
      this.contextmenu.destroy(), this.toolbar.destroy(), this.hide();
      this.data && this.data.destroy();
      
      return Widget.destroy.call(this);
  }

  function placeTitle () {
    
    var margin = this.dimensions.margin,
         top = margin.top, left = margin.left;

      d3.select(this.element).select(".widget.title")
          .style({
            'left' : function() { return Math.round(-(this.offsetWidth / 2) + (left / 2)) + 'px'; },
            'top'  : function() { return Math.round(top + (this.offsetWidth / 2)) + "px"; }
          })
      .select(".text")
      .text(this.title);
        
  }
    
  return Widget;
  
});
