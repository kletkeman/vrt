/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'deps/packery.pkgd'
    , 'interact'
    , 'lib/types/base/dataset'
    , 'lib/api'
    , 'lib/measure'
    , 'js/viewcontroller.toolbar'
    , 'js/viewcontroller.contextmenu'
    , 'js/box'
    , 'd3'
], 
function (
       
      Packery
    , interact
    , DataSet
    , vrt
    , measure
    , toolbar
    , menu
    , Box
    , d3

) {

  $.extend(DataSet.required, {
   
    'create'     : Function,
    'element'    : HTMLDivElement,
    'data'       : Object,
    'draw'       : Function,
    'update'     : Function,
    'show'       : Function,
    'hide'       : Function,
    'resize'     : Function,
    'onResize'   : Function,
    'dimensions' : Object,
    'render'     : Function,
    'toolbar'    : Function,
    'reload'     : Function,
    'unload'     : Function
  });

  DataSet.prototype.open = function () {
    
      var loc        = window.location, 
          url        = loc.origin + loc.pathname + "#" + this.id,
          dimensions = this.dimensions,
          width      = $(window).width(),
          height     = $(window).height(),
          screen     = window.screen,
          specs      = {
            'width'      : (dimensions.width / width) * screen.availWidth, 
            'height'     : (dimensions.height / height) * screen.availHeight,
            'left'       : (parseInt(this.element.style.left) / width) * screen.availWidth,
            'location'   : 'no',
            'menubar'    : 'no',
            'scrollbars' : 'no',
            'status'     : 'no',
            'titlebar'   : 'no',
            'toolbar'    : 'no',
            'dialog'     : 'no'
          };
      
      specs.top  = Math.min((parseInt(this.element.style.top) / height) * screen.availHeight, screen.availHeight - specs.height);

      return window.open(url, "_blank", d3.keys(specs).map(function(k) { return (k + '=' + specs[k]); }).join(", "));

  };

  DataSet.prototype.onCreate = function(config) {
      
      var context   = this, 
          maximized = false, 
          width     = null, 
          height    = null, 
          sortKey   = this.sortKey || 0,
          events, status = "";
      
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
            return (maximized = Boolean(value)), context.onResize();
          }
        } 
      }),
      {
          margin : {
              top: 30,
              right: 40,
              bottom: 30,
              left: 40
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

    Object.defineProperty(this, "sortKey", {
      get: function() {
        return sortKey;
      },
      set : function(value) {

        if(value !== sortKey)
          return (sortKey = Number(value) || 0), (this.visible() && (this.hide(), this.show())), sortKey;

        return sortKey;
      }
    });

    Object.defineProperty(this, "__render_event_queues", {
      enumerable: false,
      configurable: false,
      value : (events=Object.create({}, {
        0: {
          configurable: false,
          value: []
        },  
        1: {
          configurable: false,
          value: []
        }  
      })) 
    });

    measure.call(events[0], '__growth_frq');
    measure.call(events[1], '__growth_frq');
    measure.call(this, '__render_processing_frq');

    this.element = document.createElement('div');
        
    d3.select(document.head)
      .selectAll("link[href='"+this.constructor.name.toLowerCase()+".css']")
      .data([this.constructor.name.toLowerCase()+'.css'])
      .enter().append("link")
      .attr("rel", "stylesheet")
      .attr("media", "screen")
      .attr("href", function(d) {
          return d;
      });
      
    d3.select(this.element)
    .style({
      'display' : 'inline-block',
      'vertical-align': 'top'
    })
    .classed("widget container", true)
    .classed(this.type.toLowerCase(), true)
    .attr("id", this.id);
      
    (this.toolbar     = toolbar.call(this.element).orient("top", "right", ".background")),
    (this.contextmenu = menu.call(this.element));

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
            
      return w2confirm("Are you sure you want to destroy this widget and all data? This cannot be undone.", "Destroy widget " + this.title,
                function(answer) {
                  if(answer === "Yes")
                    vrt.destroy(context.id);
              });

    }),
    this.toolbar.add("save", "Save settings", function click () { return context.save(); }),
    this.toolbar.add("options", "Configure this widget", function click () {}),
    this.toolbar.add("expand", "Expand this widget into a new window", function click () { return context.open(); }),
    this.toolbar.add("aligntop", "Align the top of this widget to the viewport", function click () { return context.element.scrollIntoView(true); }), 
    this.toolbar.add("move", "Move widget", 
        function show (d, event) {
        
        var selection = d3.select(context.element);       
        
        d.interactable = d.interactable || interact(context.element, {allowFrom : this})
            .draggable(true)
            .on("dragmove",    function (event) {
            
                selection.style('left', parseInt(selection.style('left')) + event.dx + 'px')
                         .style('top', parseInt(selection.style('top')) + event.dy + 'px');
            })
            .on("dragend", function (event) {
                
                 var packery = Packery.data(document.body);

                 packery.fit(
                     context.element, 
                     Math.min(parseInt(selection.style('left')), 0), 
                     Math.min(parseInt(selection.style('top')), 0) 
                 );
            
                 packery.layout();

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
      
    return this.onResize(), this.create(), ((this.group === (vrt.controls.dock.windows.activate()||{}).name) && this.render('show', this.reload));

  };

  DataSet.prototype.onResize = function(event, w, h) {
      
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
      
    return (this.event = $.extend(new Event('resize'), {'width': reference.width, 'height': reference.height })), this.render('resize');
          
  };

  function truncate () {
      
      if(Array.isArray(this.data))
          while(this.bufferSize < this.data.length)
              this.data.shift();

      for(var x = 0, len = this.data.length; x < len; x++)
          if(Array.isArray(this.data[x]))
              while(this.bufferSize < this.data[x].length)
                this.data[x].shift();         
            
  };

  DataSet.prototype.onReceive = function(data, x, y) {
      
      var context = this;
           
      if(this.bufferSize) {

        if(typeof x === 'number') {

          this.data[x] = Array.isArray(this.data[x]) ? 
            this.data[x] : (typeof y !== 'number' ? 
              (typeof data  ===  'object' && typeof this.data[x] === 'object' ? 
                $.extend( true, this.data[x], data ) : data) : []);

          if(typeof y === 'number')
            this.data[x][y] = (typeof data  ===  'object' && typeof this.data[x][y] === 'object' ?
              $.extend( true, this.data[x][y], data ) : data);
              
          else if ( Array.isArray(this.data[x]) )
            this.data[x].push(data);
        }
        else
          this.data.push(data);
          
      }
      else if(typeof data === 'object')
        $.extend( true, this.data, data );
      
      if(this.__reloading__)
          return;
          
      this.event = $.extend(this.event || new Event('receive'), {x: x, y: y, data: data});
      
      return this.render('update', truncate);
      
  };

  DataSet.prototype.onError = function(err) {
      return vrt.log.error(err), vrt.controls.status(err.message);
  };

  DataSet.prototype.onSave = function(data) {
      return vrt.save(this.id, data, false), (this.event = $.extend(new Event('save'), {data: data})), this.render();
  };

  DataSet.prototype.onDelete = function(info, data) {
      return vrt.save(this.id, data, false), (this.event = $.extend(new Event('delete'), Store.delete.call(this, (info.filter || info.index), info.path, 'data')) ), this.render();
  };

  DataSet.prototype.onDestroy = function() {
      return this.destroy.apply(this, arguments);
  };

  DataSet.prototype.show = function (container) {
      
      container = container || document.body;
      
      if(this.visible())
        return this;
      
      this.event = $.extend(new Event('show'), {container: container});
        
      var context = this,
          group   = vrt.groups[context.group]
                       .sort(function(a, b) { return d3.ascending(a.sortKey, b.sortKey); });
      
      for(var i=0,len=group.length;i<len;i++)
        if(group[i].visible() && group[i].sortKey > this.sortKey) {
          container.insertBefore(this.element, group[i].element);
          break;
        }
      
      if(!this.visible())
        container.insertBefore(this.element, container.nextSibling);
        
      return this.render('draw', positionTitle), vrt.register(this, 'data'), this;
          
  };
    
  DataSet.prototype.unload = function() {
      
      delete this.__reloading__;
      
      if(Array.isArray(this.data))
          while(this.data.length) this.data.pop();
      else {
        for(var k in this.data)
            delete this.data[k];
      }
            
  };
    
  function flt_undef (d) {
      return d !== undefined;
  };
    
  function compact () {
            
      if(Array.isArray(this.data))
          (this.data = this.data.filter(flt_undef));

      for(var x = 0, len = this.data.length; x < len; x++)
          if(Array.isArray(this.data[x]))
              (this.data[x] = this.data[x].filter(flt_undef)); 
      
  };

  DataSet.prototype.reload = function () {

      var context = this, previous, xhr;
      
      if(this.__reloading__) return;

      this.unload(), (this.__reloading__ = true);

      d3.select(this.element).classed("loading", true);
      
      function push() {
                            
          if(!previous)
              return (previous = arguments);
              
          context.onReceive.apply(context, previous);
              
          return (previous = arguments);
          
      };

      xhr = vrt.data(this.id, function (err, data, eof) {
          
            var x, y;
          
            if(err)
              vrt.log.error(err);
            else if(!context.__reloading__)
                return xhr.abort();

            for(var k in data) {

              if(context.bufferSize)
                push.apply(null, [data[k]].concat(k.split('.').map(
                    
                    function m (n, i) { 
                        
                        n = Number(n);
                        
                        if (i === 0) { 
                            
                            ( x = n );
                            
                            if (context.bufferSize !== Infinity && context.data.length < context.bufferSize) ( context.data = new Array(context.bufferSize) );
                            
                        }
                        else if (i === 1) ( context.data[x] = context.data[x] || new Array(context.bufferSize === Infinity ? 0 : context.bufferSize) );
                        
                        return n; 
                    }
                )));
              else
                push(data);
            }

            if(eof) {
                
                d3.select(context.element).classed("loading", false);
                
                push(), compact.call(context), truncate.call(context), context.draw();
                
                delete context.__reloading__;

            }

      });

  };


  DataSet.prototype.hide = function() {
      return d3.select(this.element).remove(), vrt.unregister(this, 'data'), this;  
  };

  DataSet.prototype.visible = function() {
      
      var box, viewportHeight = $(window).height();
      
      if(!this.element.parentNode)
          return false;
      
      return ((box = new Box(this.element)), !(box.top >= viewportHeight || box.bottom <= 0));
  };
    
    function Queued (function_name, event, args, callback) {
        this.function  = function_name;
        this.event     = event;
        this.arguments = args;
        this.callback  = callback;
    };
    
    Queued.prototype.test = function test (properties) {
        
         var result = true;
        
         if(typeof properties === 'object') {
                  
                for(var k in properties) {
                    if(typeof properties[k] === 'object' && typeof this[k] === 'object')
                        result &= test.call(this[k], properties[k]);
                    else
                        result &= properties[k] === this[k];
                }
          }
          else
              throw new Error("TypeError: Argument is not an object");
        
        return result;
        
    };
    
    Queued.FILTER_EVENT_RECEIVE   = {'event': {'type' : 'receive'}};
    Queued.FILTER_EVENT_RESIZE    = {'event': {'type' : 'resize'}};
    Queued.FILTER_FUNCTION_DRAW   = {'function': 'draw'};
    Queued.FILTER_FUNCTION_RESIZE = {'function': 'resize'};
    
    function drop (events, filter) {
        
        var last = events[events.length - 1], current;
        
        while(events.length) {
        
            current = events.shift();
              
            if (!current.test(filter))
                events.push(current);
            
            if (current === last) break;
         }          
    };
    
    DataSet.prototype.render = function () {
      
      var context = this,
          callback, function_name,
          event = $.extend({}, this.event), 
          events = this.__render_event_queues[(!event || event.type !== 'receive' ) ? 0 : 1],
          args = Array.prototype.slice.call(arguments), temp;
            
      callback         = args[args.length-1];
      function_name    = args[0];
      
      if(typeof callback !== 'function') 
          callback = undefined;
      else
          args.pop();
      
      if(typeof function_name !== 'string' || !function_name.length) 
          function_name = undefined;
      else
          args.shift();
     
      function render () {
          
          var e, events = context.__render_event_queues, burst = 0;
          
          for(var i = 0; i < events.length; i++) {
              if(events[i].__renderId__ === context.__renderId__ && context.__renderId__ !== null) {
                  events = events[i];
                  break;
              }
          }
          
          if(events === context.__render_event_queues) {
              
              if(events[0].length) {
                  events = events[0];
              }
              else
                  events = events[1];
          }
          
          (context.__renderId__ = events.__renderId__ = null);
          
          context.__render_processing_frq.tick();
          
          burst = burst || Math.ceil(events.__growth_frq.average(5) / context.__render_processing_frq.average(5));
          
          for(var b = 0; b < burst; b++) 
          { 
            
            if( e = events.shift() ) {

                clearTimeout(context.__renderId__);
                              
                if(!e.animationFrame && e.function === 'draw' )                  
                  return (e.animationFrame = true), events.unshift(e), ( context.__renderId__ = events.__renderId__ = requestAnimationFrame(render) );
                else if(e.animationFrame)
                    drop(context.__render_event_queues[1], Queued.FILTER_EVENT_RECEIVE );
                
                ( context.__renderId__ = setTimeout(render, 0) );
                
                ( context.event = e.event ), context[e.function].apply(context, e.arguments), (context.event =  null);

                if(typeof e.callback === 'function')
                    e.callback.call(context);
                
            } 
            else
                return (context.event =  null);
          }
          

      };
      
      if(function_name) {}
      else if (
          event.type === 'save' ||
          event.type === 'reload:eof' || 
          event.type === 'delete'
      )
          this.render('update'), (function_name = 'onResize');
      else if(event.type === 'receive')
          (function_name = 'update');
     else 
          (function_name = 'draw');
        
     if(!event || event.type !== 'receive' )
         drop(events, {function: function_name });
         
      return events.push( new Queued (function_name, event, args, callback) ), 
              events.__growth_frq.tick(),
             (context.__renderId__ || ( context.__renderId__ = setTimeout(render, 0) ) );
      
  };

  DataSet.prototype.update = function () {
      return this.render('draw');
  };

  DataSet.prototype.resize = function () {
      
      d3.select(this.element)
          .style({
              'width': this.dimensions.width + "px",
              'height': this.dimensions.height + "px"
          });

      d3.select(this.element).select(".widget.background")
        .style({
          'left'  : this.dimensions.margin.left + 'px',
          'top'   : this.dimensions.margin.top + 'px',
          'width' : this.dimensions.compensated.width + 'px',
          'height': this.dimensions.compensated.height + 'px'
        });
          
      return (this.event = this.event || $.extend(new Event('resize'), {'width': this.dimensions.width, 'height': this.dimensions.height})), this.render('draw', positionTitle);
         
  };

  DataSet.prototype.destroy = function() {
    return this.hide(), this.trigger.destroy();
  };

  DataSet.prototype.editor = function editor ( options ) {
          
          var context  = this, 
              defaults = {
        
                title   : null,
                record  : null,
                fields  : [],
                actions : null,
                width   : 640,
                height  : 480
                  
              },
              fid     = this.id + "-editor-main-form",
              mfid     = this.id + "-editor-modal-form",           
              actions, modal, main = w2popup.get(), f = w2ui[fid], m = w2ui[mfid];
      
          if(f && m)
              return false;
          
          options = $.extend({}, defaults, options || {
              title: context.title,
              record: context,
              fields: [  
                  {name: "title"},
                  {name: "description"},
                  {name: "bufferSize"},
                  {name: "width"},
                  {name: "height"},
                  {name: "seconds"}
              ],
              actions: null
          });
          
          actions = options.actions || {};

          f = $().w2form({

              name   :  main ? mfid : fid,
              style  : 'border: 0px; background-color: transparent;',
              header  : main ? options.title : undefined,
              fields : options.fields,
              record : options.record,
              actions: $.extend({}, actions, (!main ? {
                  
                  "save": function () {

                      if(!this.validate().length) {

                          $.extend(true, options.record, this.record);

                          if(typeof actions.save === 'function')
                              actions.save.call(this);
                                      
                          context.save();
                          
                          w2popup.close();

                      }
                  },
                  "update": function () {

                      if(!this.validate().length) {

                          $.extend(true, options.record, this.record);

                          if(typeof actions.update === 'function')
                              actions.update.call(this);
                                      
                          context.resize();
                      }
                  }
              } : {}), {
                  "cancel": function () {
                      return modal ? w2popup.message() : w2popup.close();
                  }
              })           
          });
      
          return main ? 
              
              (modal = w2popup.message({ 
                  html: ('<div id="' + mfid +'" style="width: 100%; height: 100%;"></div>'), 
                  width: options.width * .9, 
                  height: options.height * .9,
                  onOpen: function() {
                      $('#w2ui-popup #'+mfid).w2render(mfid), w2ui[mfid].resize();
                  },
                  form: f
              }))

              : 

              (main = w2popup.open({

                  title	: options.title,
                  body	: ('<div id="'+fid+'" style="width: 100%; height: 100%;"></div>'),
                  style	: 'padding: 15px 0px 0px 0px',
                  width	: options.width,
                  height	: options.height,
                  showMax : true,
                  onMin	: function (event) {
                      $(w2ui[fid].box).hide();
                      event.onComplete = function () {
                          $(w2ui[fid].box).show();
                          w2ui[fid].resize();
                      }
                  },
                  onMax	: function (event) {
                      $(w2ui[fid].box).hide();
                      event.onComplete = function () {
                          $(w2ui[fid].box).show();
                          w2ui[fid].resize();
                      }
                  },
                  onOpen	: function (event) {
                      event.onComplete = function () {
                          $('#w2ui-popup #'+fid).w2render(fid);
                      }
                  },
                  onClose : function() {
                      $().w2destroy(mfid);
                      $().w2destroy(fid);
                  },
                  form: f

              }));
          
  };

  function positionTitle () {
    
    var top = this.dimensions.margin.top, left = this.dimensions.margin.left;

      d3.select(this.element).select(".widget.title")
          .style({
            'left' : function() { return -(this.clientWidth / 2) + this.clientHeight + 'px'; },
            'top'  : function() { return top + (this.clientWidth / 2) + "px"; }
          })
      .select(".text")
      .text(this.title);
        
  };
    
  return DataSet;
  
});
