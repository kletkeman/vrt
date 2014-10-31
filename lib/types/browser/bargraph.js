define(['jquery', 'types/dataset', 'lib/types/base/bargraph', 'lib/api', 'd3', 'js/viewcontroller.contextmenu'], function($, DataSet, BarGraph, vrt, d3, contextmenu) {

    $.extend(BarGraph.prototype, BarGraph.prototype.__proto__, $.extend({}, BarGraph.prototype));
    
    $.extend(BarGraph.required, {
       '(__buffer)' : Array,
        'extent'    : Array
    });
    
    var plus = '+', minus = '-', transition_time_milliseconds = 500;
    
    BarGraph.prototype.zoom = function (amount, explicit) {
         
        var extent  = this.extent.slice(), 
            data    = this.data,
            length  = data.length,
            rotated = isRotated.call(this),
            width   = this.dimensions.compensated[rotated?'height':'width'],
            percent,
            min     = 0,
            max     = 0;
        
        if( width / length < 1 ) {
            min = max = Math.round( length * (1 - (width / length)) / 2);
            min = -min;
        }
                
        if(amount === undefined || explicit)
            extent = Array.isArray(amount) ? amount : [(amount = amount || 0), -amount];
        else {
            
            for(var i = 0, len = extent.length, x; i < len; i++) {

               x = extent[i];

               if(i === 1)
                   extent[i] =  x - amount;
                else
                    extent[i] = x + amount;

            };
        }
                
        extent[0] = Math.max(extent[0], max);
        extent[1] = Math.min(extent[1], min);
        
        if( ( (data.length + extent[1]) - extent[0] ) >= 1 )
            this.extent = extent;
        
       return this.sort(undefined, !!explicit), (percent = Math.round( (data.length / (this.data.sorted || data).length)  * 100)),
           (percent && this.status( "Zoom is " + percent +  "%")), percent;
        
    };
    
    BarGraph.prototype.shift = function (amount) {
        
        var extent = this.extent;
        
        amount = amount || 1;
        
        if( (extent[0] + amount) < 0 || 
            (extent[1] + amount) > 0) return;
        
         for(var i = 0, len = extent.length, x; i < len; i++) {
             
           x = extent[i];
             
           if(i === 1)
               extent[i] =  Math.min(x + amount, 0);
            else
                extent[i] = Math.max(x + amount, 0);            
        };
        
        return this.sort(undefined, false);
        
    }; 
    
    function sort (by) {
        
        var fn, args, data = this.data.slice(), context = this;
        
        by   = by || "";        
        args = by.match(/^(value|label)|(ascending|descending)$/gi) || [];
        
        switch(args.length) {
            
            case 2:                
                fn = d3[args[1]];
                break;
            case 1:
                args = by.match(/^(value|label)/i);
                fn = d3.ascending;
                if(args)
                    break;
            default:
                return data;
        }
        
        by = args[0].toLowerCase();
        
        return data.sort(
            function (a, b) {
                return fn(a[by], b[by]);
        });
    };
    
    BarGraph.prototype.toJSON = function () {
        
        var that = $.extend({}, this);
        
        delete that.data;
        
        return DataSet.prototype.toJSON.call(that);
    };
    
    BarGraph.prototype.sort  = function (by, animate) {
        
        var context    = this,
            rotated    = isRotated.call(this),
            dimensions = this.dimensions,
            width      = dimensions.compensated[rotated ? 'height' : 'width'],
            height     = dimensions.compensated.height,
            timings    = {responseTime : transition_time_milliseconds},
            data       = by === undefined && this.data.sorted ? this.data.sorted.data.slice() : null,
            sorted     = Array.prototype.slice.apply( ( data = data ||  sort.call(this, by) ), this.extent.map(slice) )
        
        function slice (x, i) {
            if(i === 1)
               return context.data.length + x;
            return x;
        };
               
        this.sortBy = by = !by ? this.sortBy : by;
                
        for(var i = 0, index, barObject, length = sorted.length; i < length; i++) {
            
            barObject = sorted[i];
                        
            (function () {
            
                var position = barObject.position,
                    transition,
                    x = Position.prototype.x.call(position, width), 
                    w = Position.prototype.width.call(position, width);

                barObject.position = position = new Position(context.alignment, i, length);
                
                if( animate !== false ) {
                    
                    transition = barObject.position.transition = new Transition();
                    transition.width = new Transition();

                    transition.width.reset(w);
                    transition.reset(x); 
                    x = position.x(width);
                    w = position.width(width);

                    position.x = function () {
                        return this.transition.tick(timings, x);
                    };
                    
                    position.width = function () {
                        return this.transition.width.tick(timings, w);
                    };
                    
                }
                                
            })();
            
        }
        
        return (sorted.data = data), (this.data.sorted = sorted), this.draw(), sorted;  
        
    };
    
    BarGraph.prototype.reset = function () {
        
        for(var index = 0, barObject, data = this.data, length = data.length; index < length; index++) {
            
            barObject = this.data[index];
            
            if(barObject instanceof Bar) 
                barObject.reset();
        }
        
        return this.render('draw');
    };
    
    function isRotated () {
        var align = this.alignment;
        return align === "left" || align === "right" || align === "vertical";
    };    
        
    function get_index (x, y) {
        
        var i, dimensions = this.dimensions.compensated;     
        var width = dimensions.width, height = dimensions.height;
        var data = this.data.sorted || this.data;
        
        if(isRotated.call(this)) {
            width = height;
            x = y;
        }            
        
        i     = Math.floor((x / width) / ((width / data.length ) / width));
        
        return i;
        
    };   
                
    BarGraph.prototype.create = function () {
        
        var context    = this, 
            element    = d3.select(this.element),
            dimensions = this.dimensions,
            margin     = dimensions.margin,
            brush;
        
        this.extent = [0, 0];
        
        this.canvas  = element.append("canvas");
        this.overlay = element.append("svg");
        this.gutter  = element.append("svg");
               
        this.overlay.append("g")
            .attr("class", "brush")
        .on("mousemove", function () {
                
                var e         = d3.event,
                    margin    = context.dimensions.margin,
                    i         = get_index.call(context, e.x - margin.left, e.y - margin.top),
                    barObject = (context.data.sorted || context.data)[i];                
                
                return context.status(barObject.label + " " + barObject.value)
                
            })
        .on("mouseout", function () {
            
        });
        
        this.gutter.append("g").attr("class", "labels");
        
        function map_index (d, i) {
            
            var sorted = context.data.sorted.data, data = context.data.sorted || context.data, index;
                        
            index = get_index.call(context, d + margin.left, d + margin.top);
            index = sorted.indexOf(data[index]);
                        
            return i === 1 ? -(context.data.length - 1 - index) : index;
            
        };
        
        this.brush = brush = d3.svg.brush()
            .on("brushend", function () {
            
                var extent;
            
                if(!brush.empty() && (extent = brush.extent().map(map_index))) {
                                        
                    brush.clear(),
                    context.overlay.select("g.brush").call(brush);
                    
                    return context.zoom(extent, true);

                }
            });
        
        this.toolbar.add("zoom", "Click hold and move cursor around to zoom, move",
          function click (d) {
              
              var element = d3.select(context.element),
                  selection = d3.select(this),
                  c = click;
              
              if(selection.classed("zooming")) {
                
                element.select("g.brush")
                   .style("pointer-events", "all"),
                selection.classed("zooming", false),
                context.overlay.style("cursor", null)
                       .on("mousedown", null)
                       .classed("icon zooming", false);
                
                vrt.controls.status("");

              }
              else {
                
                element.select("g.brush").style("pointer-events", "none"),
                selection.classed("zooming", true),
                context.overlay.on("mousedown", 
                  function zoom () {

                    var rotated = isRotated.call(context), event = d3.event, x  = event[rotated?'clientY':'clientX'], y = event[rotated?'clientX':'clientY'], dx = 0, dy = 0;

                    function up () {
                      return window.removeEventListener("mouseup", up), 
                             window.removeEventListener("mousemove", move); 
                    };

                    function move (event) {

                        var length  = (context.data.sorted || context.data).length,
                            height  = dimensions.compensated[rotated?'width':'height'],
                            width   = dimensions.compensated[rotated?'height':'width'],                      
                            sx      = length / width,
                            sy      = length / height, integer, temp,
                            ex      = event[rotated?'clientY':'clientX'],
                            ey      = event[rotated?'clientX':'clientY'];
                        
                        dx += (x - ex) * sx,
                        dy += 0 - (y - ey) * sy;
                                                                    
                        context.overlay.style("cursor", dy < 0 ? "-webkit-zoom-out" : "-webkit-zoom-in");
                        
                        if( dx < 0 ? (integer = Math.ceil(dx)) : (integer = Math.floor(dx)) ) {
                            context.shift(integer);
                            dx = dx - integer;
                        }
                            
                        if( dy < 0 ? (integer = Math.ceil(dy)) : (integer = Math.floor(dy)) ) {
                            context.zoom(integer);
                            dy = dy - integer;
                        }
                        
                        return (x = ex), (y = ey);
                    
                    };

                    return window.addEventListener("mouseup", up),  
                           window.addEventListener("mousemove", move);
                })
                .classed("icon zooming", true);
              
                vrt.controls.status(d.description);
                  
                context.contextmenu.add('Disable Zoom Controls', 'Return to normal mode', 
                    function click (command) {
                        return c.call(selection.node()), command.remove();
                });
              }
              
              
          });
        
        this.contextmenu.add("Reset", "Reset peaks", function click () {
           return context.reset(); 
        });
        
        this.contextmenu.add("Zoom out", "Reset zooming", function click () {
           return context.zoom(); 
        });
        
        (function (menu) {
            
            function click (d) {
               if(!d.parent.parent)
                   return context.sort(d.name.toLowerCase())
                return context.sort( (d.parent.name + ":" + d.name).toLowerCase() );
            };  
            
            (function () {
                
                var args = Array.prototype.slice.call(arguments),
                    name, desc = "Sort the graph by ";
                
                while( (name = args.pop()) ) {
                    
                    (function () {
                        
                        var args = Array.prototype.slice.call(arguments),
                            menu = args.pop(), order;
                        
                         while((order = args.pop())) {
                            menu.add(order, order.capitalize(), desc + ' ' + order, click);
                         }
                        
                    })("ascending", "descending", menu.add(name, 'By ' + name.capitalize(), desc + name + " ascending", click));                   
                }
                
            })("value", "label");
            
        })(this.contextmenu.add("Sort", "Sort the graph", function click () { return context.sort(""); }));
        
    };
    
    BarGraph.prototype.resize = function () {
        
        var context = this,
            dimensions = this.dimensions,
            margin  = dimensions.margin, 
            width   = dimensions.compensated.width, 
            height  = dimensions.compensated.height,
            canvas  = this.canvas.node(),
            rotated = isRotated.call(this),
            c       = canvas.getContext("2d"), brush, extent;      
        
        (function () {
            
            for(var i = 0, selection; i < arguments.length; i++) {
            
                selection = arguments[i];
            
                selection
                    .style({
                        'position': 'absolute',
                        'left': margin.left + 'px',
                        'top': margin.top + 'px',
                        'z-index': i + 1
                    })
                    .attr('width', width)
                    .attr('height', height);
            
            }
            
        })(this.canvas, this.overlay);
        
        this.gutter
            .style({
                'position' : 'absolute',
                'left' : (rotated ? width + margin.right : margin.left) + 'px',
                'top': (rotated ? margin.top : height + margin.top) + 'px'
            })
            .attr('width', rotated ? margin.right : width)
            .attr('height',  rotated ? height : margin.bottom)
            .attr("class", "gutter");
        
        if(rotated) {
            this.brush.x(null);
            this.brush.y(d3.scale.ordinal());
            this.brush.y().domain([0, height]).range([0, height]);
        }
        else {
            this.brush.y(null);
            this.brush.x(d3.scale.ordinal());
            this.brush.x().domain([0, width]).range([0, width]);
        }
        
        this.brush.clear();
        
        this.overlay
            .selectAll("g.brush")
            .call(this.brush)
            .selectAll("rect")
            .attr(rotated?"x":"y", 0)
            .attr(rotated?"width":"height", (rotated?width:height) - 1 );
        
        this.gutter.select("g.labels")
            .attr("transform", rotated ? null : "rotate(-90)");
                
        c.fillStyle   = 'rgba(64,128,255, .5)';
        c.strokeStyle = "whitesmoke";
        c.strokeWidth = 1;
            
        for(var i = 0, barObject, data = this.data, length = data.length; i < length; i++) {
            
            barObject = data[i];
            
            if( ! (barObject instanceof Bar) )
                data[i] = new Bar(data[i], this.canvas.node(), this.domain);
            
        }
        
        return this.zoom(0), DataSet.prototype.resize.call(this);
    
    };
       
    BarGraph.prototype.wipe = function () {
        var compensated  = this.dimensions.compensated;
        return this.canvas.node().getContext("2d").clearRect(0, 0, compensated.width, compensated.height);
    };
    
    function animate () {
        
        var context = this, wipe = false, buffer = this.__buffer;
    
        function draw () {

            var index, data = context.data, length = context.__buffer.length, barObject, bar_count = 0, position, transition;

            (context.__animationRequestId__ = null);
            
            if (wipe) {
                context.wipe();
                wipe = false;
            }
                        
            while (length--) {

                (index = buffer.shift());

                barObject = data[index];

                if (barObject instanceof Bar) {
                    
                  position   = barObject.position;                    
                  transition = position ? position.transition : undefined;
                    
                   if(!barObject.animate(context.timings) || 
                      (transition = barObject.rect.clear = (transition && (!transition.done() || !transition.width.done()))) ||
                      wipe
                     )
                       buffer.push(index);
                                                            
                     wipe |= transition;
                    
                    if( bar_count++ > ( (data.length - buffer.length) / bar_count ) )
                        break;
                    
                }
                else
                    return context.render('resize');               
                
            }
                                    
            if(buffer.length)
                return (context.__animationRequestId__ = requestAnimationFrame(draw));

        };
        
        return this.__animationRequestId__ || (this.__animationRequestId__ = requestAnimationFrame(draw));
        
    };
        
    BarGraph.prototype.update = function () {
        
        var e = this.event;
                
        if(!e) {}
        else if(e.type === 'receive') {
            
            if(this.data.sorted.indexOf(this.data[e.x]) > -1 && this.__buffer.indexOf(e.x) === -1)
                this.__buffer.push(e.x);
            
            return animate.call(this);
        }
        
        return DataSet.prototype.update.call(this);
    };
    
    BarGraph.prototype.draw = function () {
               
        if (!this.visible())
            return;
        
        while(this.__buffer.length) this.__buffer.pop();
        
        this.wipe();
        
        for(var index, i = 0, barObject, data = this.data.sorted || this.data, length = data.length; i < length; i++) {
            
            barObject = data[i];
            
            if(barObject instanceof Bar) {
                
                index = this.data.indexOf(barObject);
                
                barObject.rect.clear = true;
                
                if(this.__buffer.indexOf(index) === -1) {
                    this.__buffer.push(index);
                }
                
            }
            else 
                return this.render('resize');
        };
        
        drawLabels.call(this, data);

        return animate.call(this);
            
    };
    
    function text (d) {
        return d.label;
    }
    
    function getTextHeight (rotated) {
        var rect = this.getBoundingClientRect();
        return (rotated ? rect.height : rect.width);
    }
    
    function drawLabels (data) {
        
         var labels,
            rotated    = isRotated.call(this), 
            dimensions = this.dimensions.compensated,
            width      = dimensions[rotated ? 'height' : 'width'],
            margin     = this.dimensions.margin[rotated ? 'right' : 'bottom'],
            bar_width, text_height, skip;
        
        bar_width = width / data.length;
        
        if(!Number.isFinite(bar_width))
            return;
        
        function opacity (d) {
            
            var i = data.indexOf(d);
            
            text_height = text_height || getTextHeight.call(this, rotated);
            skip        = skip || Math.ceil(Math.max(text_height / bar_width, 1));
            
            return !( i % skip ) && i > -1 ? 1 : 0;
        };
        
        function y (d) {
            text_height = text_height || getTextHeight.call(this, rotated);            
            return  Position.prototype.x.call(d.position, width) + (bar_width / 2) + (text_height / 2);
        };
        
        function x () {
            return (rotated ? margin : -margin) / 2;
        };

        labels = this.gutter.select("g.labels")
                     .selectAll("text.label")
                     .data(this.data);
        
        labels.text(text);
        
        labels.enter()
              .append("text")
              .text(text)
              .attr("class", "label")
              .attr("y", y  )
              .attr("x", x )
              .style("text-anchor", "middle")
              .style("opacity", 0);
        
        labels.transition(transition_time_milliseconds)
              .style("opacity", opacity)
              .attr("x", x )
              .attr("y", y );
        
        labels.exit()
              .transition(transition_time_milliseconds)
              .style("opacity", 0)
              .remove();
        
    }
    
    function Position (align, index, divider) {
        
        this[this.alignments.indexOf(align)>-1?align:'bottom'] = {
            'index'   : Math.floor(index) || 0,
            'width'   : Number.isInteger(index) ? 0 : (index - Math.floor(index)),
            'divider' : divider || 1, 
            '_align'  : this.alignments.indexOf(align) % 2
        };  
    };
    
    Position.prototype.width = function ( pixels ) {
        
        for(var alignment in this) {
            alignment = this[alignment];
            return alignment.width ? (pixels * alignment.width) : (pixels / alignment.divider) || 0;
        }
        
    };
    
    Position.prototype.x = function ( pixels ) {
        
        for (var alignment in this) {
            alignment = this[alignment];
            return alignment.width ? alignment.index : ((pixels / alignment.divider) * alignment.index) || 0;
        }
        
    };
    
    Position.prototype.y = function ( pixels, f ) {
                        
        for (var alignment in this) {            
            alignment = this[alignment];            
            return (((this.horizontal || this.vertical) && (pixels /= 2)) || alignment._align ? ( pixels - (pixels * f) ) : 0) || 0;
        }
    };
    
    Position.prototype.alignments = ['top', 'bottom', 'left', 'right', 'vertical', 'horizontal'];
    
    
    function Transition () {
        
        var start, _y0 = 0, y = 0, preDelay, responseTime, holdTime, decayTime, totalTime, elapsed;
            
        this.tick = function (timings, y1, y2) {

            elapsed = window.performance.now() - start;
            
            responseTime = totalTime = timings.responseTime || 0;
            holdTime     = timings.holdTime                 || 0; totalTime += holdTime; 
            decayTime    = timings.decayTime                || 0; totalTime += decayTime;
            preDelay     = timings.preDelay                 || 0; totalTime += preDelay;
            
            y1 = y1 === undefined ? _y0 : y1;
            y2 = y2 === undefined ? 0   : y2;
                        
            if(elapsed <= preDelay) 
                return y;
            else if(elapsed <= preDelay + responseTime) 
                return (y = ((y1 - _y0) * Math.pow(Math.min( (elapsed - preDelay) / responseTime, 1), 3)) + _y0);
            else if(decayTime && elapsed >= preDelay + responseTime + holdTime) 
                return (y = ((y1 - y2) * (1 - Math.pow(Math.min( (elapsed - preDelay - responseTime - holdTime) / decayTime, 1), 3))) + y2);
            
            return (y = y1);
            
        };

        this.reset = function (y0) {

            start =  window.performance.now(),
            responseTime = 0,
            decayTime = 0,
            holdTime = 0,
            totalTime = 0,
            elapsed = 0;
            
            return this.set(y0);
        };
        
        this.set = function (y0) {
            
            _y0 = y0 === undefined ? y : y0;
            
            return this;
        };
        
        this.done = function () {
            return !totalTime || elapsed >= totalTime; 
        };
        
        this.reset();

    };
    
    function Rect () {
        this.x      = 0,
        this.y      = 0,
        this.clear  = false,
        this.width  = 0,
        this.height = 0,
        this.value  = 0,
        this.peak   = new BarGraph.Peak();
    }
    
    function Bar (options, canvas, domain, position) {
        
        options = options || {};
        
        var context = this, 
            rect = new Rect(),
            peak = new BarGraph.Peak(),
            label, value = 0;
        
        Object.defineProperties(this, {
            
            transition : {
              enumerable   : false,
              configurable : false,
              value : Object.create({}, {
                  value: {
                      value: new Transition()
                  },
                  peak: {
                      value: new BarGraph.Peak(
                          new Transition(), 
                          new Transition()
                      )
                  }
              })
            },
            position : {
              enumerable   : false,
              configurable : false,
              get : function () {
                  return position;
              },
              set : function (p) {
                return (position = p instanceof Position ? p : position);
              }
            },
            canvas : {
              enumerable   : false,
              configurable : false,
              writable: false,
              value : canvas
            },
            value : {
              enumerable   : true,
              configurable : false,
              get : function () {
                  return value;
              },
              set : function (v) {
                  
                  for(var sign in this.peak) {
                    if(sign === plus || sign === minus)
                        this.transition.peak[sign].done() && this.transition.peak[sign].reset(this.rect.peak[sign]);
                  }
                  
                  this.transition.value.reset(this.rect.value);

                  return (options.value = value = v);
              }
                
            },
            label : {
              enumerable   : true,
              configurable : false,
              get : function () {
                  return label;
              },
              set : function (l) {
                  return (label = l);
              }
                
            },
            rect : {
              enumerable   : false,
              configurable : false,
              get : function () {
                  return rect;
              }                
            },
            peak : {
              enumerable   : false,
              configurable : false,
              get : function () {
                  return peak;
              },
              set : function (peak) {                  
                  return (options.peak = peak);
              }
            }            
        }); 
        
        this.position = position || new Position('bottom');
        
        this.label    = options.label;
        this.value    = options.value;
                
        $.extend(peak, options.peak);
        
        this.toJSON = function () {
            return options;
        };
        
       
    };
        
    Bar.prototype.reset = function () {
        
        this.peak.reset();        
        this.peak.set(this.value, this.value);        
       
        this.value = this.value;
                
    };
    
    Bar.prototype.animate = function animate (timings) {
        
        var tick = this.transition.value.tick(timings.values, this.value);
                
        this.peak.set(tick, tick);
        
        this.draw(
            tick,
            (timings.peaks.decayTime + timings.peaks.holdTime) ?
            animate.peak.set(
                tick < this.peak[plus] ? this.transition.peak[plus].tick(timings.peaks, undefined, tick >= 0 ? tick : 0 ) : this.peak[plus],
                tick > this.peak[minus] ? this.transition.peak[minus].tick(timings.peaks, undefined, tick < 0 ? tick : 0 ) : this.peak[minus],
                true
            ) : undefined
        );
        
        return this.transition.value.done() && (this.transition.peak[plus].done() && this.transition.peak[minus].done() && this.peak.set(this.rect.peak, true));
        
    };
    
    Bar.prototype.animate.peak = new BarGraph.Peak();
            
    Bar.prototype.draw = function (value, peak) {
        
        var context  = this,
            canvas   = this.canvas, 
            position = this.position,
            height   = canvas.height, 
            width    = canvas.width,
            rect     = this.rect,
            c        = canvas.getContext("2d"),
            x, y, py, px; 
                
        value = Number.isFinite(value) ? value : this.value;        
        peak  = typeof peak === 'object' ? peak : this.peak;
        
        position = position.top || position.bottom || position.left || position.right || position.horizontal || position.vertical;
        
        if(position) {
                
            if( (position = this.position.top || this.position.bottom || this.position.horizontal) ) {

                ( x = this.position.x(width) );
                
                width = Math.round(this.position.width(width));

                ( y = Math.round(this.position.y(height, value)));  
                
                if(!rect.clear)
                    c.clearRect(x, 0, width, height);
                
                for(var k in peak) {
                    
                    if((!this.position.horizontal && k !== plus) || !peak[k]) continue;
                    
                    c.beginPath();
                    
                    (py = Math.round(this.position.top ? peak[k] * height : this.position.y(height, peak[k])));
                    
                    c.moveTo(x,  py);
                    c.lineTo(x + width, py);
                    
                    c.stroke();                    
                    
                }
                
                this.position.horizontal && (height /= 2);
                
                c.fillRect(x,  y, (rect.width = width), (rect.height = Math.round(height * value)));  
                                
                

            }
            else if( (position = this.position.left || this.position.right || this.position.vertical) ) {

                ( y = this.position.x(height) );
                
                height  = Math.round(this.position.width(height));

                ( x = Math.round(this.position.y(width, value)) );
                
                if(!rect.clear)
                    c.clearRect(0, y, width, height);
                
                for(var k in peak) {
                    
                    if((!this.position.vertical && k !== plus) || !peak[k]) continue;
                    
                    c.beginPath();
                    
                    (px = Math.round(this.position.left ? peak[k] * width : this.position.y(width, peak[k])));
                    
                    c.moveTo(px, y);
                    c.lineTo(px, y + height);
                    
                    c.stroke();
                    
                }
                
                this.position.vertical && (width /= 2);
                
                c.fillRect(x,  y, (rect.width = Math.round(width * value)), (rect.height = height));
                
            }
        }
        
        for(var k in peak) {
            rect.peak[k] = peak[k];
        }
                        
        return (rect.clear = false), (rect.value = value), (rect.x = x), (rect.y = y), rect;
                
    }
    
    return BarGraph;
    
});