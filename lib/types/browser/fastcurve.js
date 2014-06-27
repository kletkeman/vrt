define(['types/dataset', 'lib/types/base/fastcurve', 'lib/api', 'd3', 'js/viewcontroller.contextmenu'], 
function( DataSet, FastCurve, vrt, d3, contextmenu ) {
    
    $.extend(FastCurve.prototype, FastCurve.prototype.__proto__, $.extend({}, FastCurve.prototype));

    $.extend(FastCurve.required, {
        '(__buffer)' : Array
    });
    
    var highestIndex = 0, context, menu = contextmenu.call(null),
        format       = d3.time.format("%Y-%m-%d %H:%M:%S.%L");
    
    menu.add('Blur', 'Send to back and blur',
        function click (curveObject) {
            
            var canvas    = d3.select(curveObject.canvas),
                z0        = Number(canvas.style('z-index')),
                selection = d3.select(canvas.node().parentNode)
                              .selectAll("canvas");
            
            return selection
                     .each(function(d) {
                         
                        var selection = d3.select(this),
                            z1        = Number(selection.style('z-index'));
                         
                         return selection.style('z-index', ++z1);
                     })
                    .each(function(d) {
                        
                        var selection = d3.select(this),
                            z1        = Number(selection.style('z-index'));

                        if(z1 > z0)
                            return selection.style('z-index', z1 - z0)
                    }),
                    canvas.classed("blur", true)
                          .style('z-index', 0);
                    
        }
    ),  
        
    menu.add('Focus', 'Bring to front and blur others',
        function click (curveObject) {
            
            var canvas    = d3.select(curveObject.canvas),
                z0        = Number(canvas.style('z-index')),
                selection = d3.select(canvas.node().parentNode)
                              .selectAll("canvas");
            return selection
                        .each(function(d) {
                            
                            var selection = d3.select(this),
                                z1        = Number(selection.style('z-index'));
                            
                            if(z1 > z0)
                                return selection.style('z-index', --z1);
                    }), 
                    selection
                        .each(function (d) {
                            return d3.select(this).classed("blur", d !== curveObject);
                    }),
                    canvas.style('z-index', highestIndex);
        }
    ),
        
    menu.add('Bring to front', 
        function click (curveObject) {
            return toFront(curveObject);
        }
    ),
        
    menu.add('Send to back', 
        function click (curveObject) {
            return toBack(curveObject);
        }
    ),
    
    menu.add('Set new timespan', 'Set new timespan for this curve', 
        function click (curveObject) {
            return setTimespan(curveObject);
        }
    ),
    
    menu.add('__configure', 'Configure', 'Open the configuration editor', 
        function show (curveObject, command) {
            command.title = "Configure << " + curveObject.label + " >>";
        }
    );
    
    function showTimespan (curveObject) {
        
        var domain    = curveObject.scales.x.domain(),
            startTime = domain[0],
            endTime   = domain[1],
            e         = d3.event;
        
        vrt.controls.status(e && e.type === "mouseover" ? format(startTime) + ' to ' + format(endTime) : "")
    };
    
    function setTimespan (curveObject) {
        
        var domain    = curveObject.scales.x.domain(),
            startTime = domain[0].getTime(),
            endTime   = domain[1].getTime();
        
        return (curveObject.seconds = (endTime - startTime) / 1000);
        
    };
    
    function toFront (curveObject) {
        
        return  d3.select(curveObject.canvas.parentNode)
                     .selectAll("canvas")
                     .each(function(d) {
                         if(d instanceof Curve && d.index > curveObject.index)
                             d.index--;
                     }),
            
                (curveObject.index = highestIndex);
    };    
    
    function toBack (curveObject) {
                
        if(curveObject.index) {
            
            d3.select(curveObject.canvas.parentNode)
                     .selectAll("canvas")
                     .each(function(d) {
                         if(d instanceof Curve)
                             d.index++;
                     })
                    .each(function(d) {

                        if(d instanceof Curve && d.index > curveObject.index)
                            return (d.index -= curveObject.index - 1);
                    });
            
            (curveObject.index = 0);
        }
    };

    function getCoordinates ( data ) {
            
        if(typeof data !== 'undefined') {
                        
            data.sx = context.scales.x(data.timestamp),
            data.sy = context.scales.y(data.value);
            
            data.x = Math.floor(data.sx),
            data.y = Math.floor(data.sy);
            
        }

        return data;
    };
    
    function getControlPoints( p0, p1, p2 ) { 
            
        var t   = context.tension, 
            d01 = Math.sqrt( Math.pow( p1.x - p0.x, 2) + Math.pow( p1.y - p0.y, 2 ) ),
            d12 = Math.sqrt( Math.pow( p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) ),
            fa  = ( t * d01 / ( d01 + d12 ) ),
            fb  = ( t * d12 / ( d01 + d12 ) );
            
            p1.cpx = ( p1.x - fa * ( p2.x - p0.x ) ),
            p1.cpy = ( p1.y - fa * ( p2.y - p0.y ) ),
            p2.cpx = ( p1.x + fb * ( p2.x - p0.x ) ),
            p2.cpy = ( p1.y + fb * ( p2.y - p0.y ) );            
            
    };
    
    function Curve ( options ) {
        
        options = options || {};
        
        var low  = options.low || 0,
            high = options.high || 1000,
            lineColor, lineWidth, fill, mode,
            canvas, 
            seconds = 5, 
            index = 0, 
            tension = .5, 
            label, 
            stack = [], 
            scales = {},
            sx, sy, data = {}, correction = 0;
        
        this.map = function map (data) {
        
            if(typeof data === 'object') {
                if( getCoordinates(data) && Number.isFinite(data.x) ) {
                    return (context = this), (this.data = map.x[data.x] = data);
                }
            }

            return (context = this), map.x.forEach(getCoordinates), map;
        };
        
        this.map.x = [];
        this.map.y = [];        

        Object.defineProperty(this.map.x, 'correction', {
                    
          enumerable: false,
          get: function() {
            var floored = Math.floor(correction);
            return correction >= 1 ? ( (correction = correction - floored), floored ) : 0;
          },
          set : function(value) {
            if(value===null) return (correction = 0);
            return (correction += value - Math.floor(value));
          }
        });
        
        Object.defineProperties(this, {
            data: {
                configurable: true,
                   enumerable: false,
                   get: function() { 
                       return data;
                   }
            },
            stack : {
              enumerable: false,
              get : function () {
                  return stack;
              }
            },
            label : {
              enumerable: true,
              get : function () {
                  return label || "Name not provided";
              },
              set : function (l) {
                  return (label = String(l));
              }
            },
            tension : {
              enumerable: true,
              get : function () {
                  return tension;
              },
              set : function (t) {
                  if((t = Number(t)) <= 1 && t >= 0)
                    return (tension = t);
              }
            },
            index : {
              enumerable: true,
              get : function () {
                  return index;
              },
              set : function (i) {
                  return (index = Number(i)), d3.select(this.canvas).style("z-index", index);
              }
            },
            seconds : {
              enumerable: true,
              get : function () {
                  return seconds;
              },
              set : function (s) {
                    return (seconds = Number(s));
              }
            },
            lineColor : {
                enumerable: true,
                get : function() {
                    return lineColor || (lineColor = d3.rgb(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)));
                },
                set : function(c) {
                    if(typeof c === 'string')
                        return (lineColor = d3.rgb("#" + c.replace("#", "")));
                }
            },
            lineWidth : {
                enumerable: true,
                get : function() {
                    return lineWidth || (lineWidth = .5);
                },
                set : function(w) {
                    return (lineWidth = Number(w)), (this.height = this.height), lineWidth;
                }
            },
            fill : {
                enumerable: true,
                get : function() {
                    return typeof fill === 'undefined' ? (fill = false) : fill;
                },
                set : function(value) {
                    return (fill = Boolean(value));
                }
            },
            mode : {
                enumerable: true,
                get : function() {
                    return typeof mode === 'undefined' ? (mode = 'normal') : mode;
                },
                set : function(value) {
                    if(this.modes.indexOf(value) > -1)
                        return (mode = value);
                    return value;
                }
            },
            low : {
                enumerable: true,
                get : function() {
                    return low;
                },
                set : function(l) {
                    this.scales.y.domain([(low = Number(l)), high]);
                }
            },
            high : {
                enumerable: true,
                get : function() {
                    return high;
                },
                set : function(h) {
                    this.scales.y.domain([low, (high = Number(h))]);
                }
            },
            canvas : {
                enumerable: false,
                get : function() {
                    return canvas || (canvas = document.createElement("canvas")), d3.select(canvas).data([this]).node();
                }
            },
            width : {
                enumerable: false,
                get : function() {
                    return Number(this.canvas.width);
                },
                set : function(w) {
                    return d3.select(this.canvas).attr("width", w), this.reset(), this.scales.x.range([0, w]), w;
                }
            },
            height : {
                enumerable: false,
                get : function() {
                    return Number(this.canvas.height);
                },
                set : function(h) {
                    return d3.select(this.canvas).attr("height", h), this.scales.y.range([h - Math.ceil(this.lineWidth), 0]), h;
                }
            },
            scales: {
                get: function() {
                    return scales;
                }
            },
            dirty: {
                get: function() {
                    return this.data !== this.map.x[this.map.x.length - 1];
                }
            }
        }),
        
        Object.defineProperties(scales, {
            x: {
                get: function () {
                    return sx || (sx = d3.time.scale());
                }
            },
            y: {
                get: function () {
                    return sy || (sy = d3.scale.linear().domain([low, high]));
                }
                
            }
        });
        
        $.extend(this, options);
        
        this.index = Number.isFinite(options.index) ? options.index : highestIndex++;        
        
        index > highestIndex && (highestIndex = index);
                
    };
            
    Curve.prototype.reset = function () {
        
        var map   = this.map,
            stack = this.stack,
            data;
        
        while(stack.length) stack.pop();
        
        while(map.x.length) {
            
            if(data = map.x.pop()) {
            
                delete data.cpx;
                delete data.cpy;
                
                delete data.x;
                delete data.y;
                
            }            
        }
        
    };
        
    Curve.prototype.toJSON = function () {
        
        var that = $.extend({}, this);
        
        that.lineColor = that.lineColor.toString();
        
        delete that.modes;
        
        return that;
        
    };
    
    Curve.prototype.modes = ['normal', 'step'];
    
    (function() {
        
        var points, c, width, height, data, stack;
                
        function drawLine (p0, p1, p2) {
                                    
            c.beginPath();
            
            if(context.mode === 'step') {
                
                c.clearRect(p1.x, 0, p2.x - p1.x, height);
                
                if(p0) {
                  c.moveTo(p1.x, p0.y);
                  c.lineTo(p1.x, p1.y);
                }
                else
                  c.moveTo(p1.x, p1.y);

                c.lineTo(p2.x, p1.y);
                c.lineTo(p2.x, p2.y);
                
            }
            else if(context.mode === 'normal') {
                
                if(p0) {

                    getControlPoints(p0, p1, p2), c.clearRect(p0.x, 0, p2.x - p0.x, height);                   

                    c.moveTo(p0.x, p0.y);

                    c.bezierCurveTo(p0.cpx||p0.x, p0.cpy||p0.y, p1.cpx, p1.cpy, p1.x, p1.y);
                    c.bezierCurveTo(p2.cpx, p2.cpy, p2.x,  p2.y, p2.x, p2.y);                
                                
                }
                else {
                
                    c.moveTo(p1.x, p1.y);
                    c.lineTo(p2.x, p2.y);
                }
                
            }
                            
            c.stroke();
            
            if(context.fill) {
               
                c.save(); 
                c.globalCompositeOperation = "destination-over";
                
                c.lineTo(p2.x, height),
                c.lineTo(context.mode === 'normal' ? (p0||p1).x : p1.x, height),
                c.closePath(),
                c.fill();
                
                c.restore();
                
            }
            
        };
        
        function verticalLine(x) {
            
            c.save();            
            
            c.lineWidth   = .5;
            c.strokeStyle   = "whitesmoke";
            c.globalCompositeOperation = "destination-over";
            
            drawLine(null, {x: x, y: 0}, {x: x, y: height});
                 
            c.restore();
        };

        Curve.prototype.zoom = function ( pixels ) {
          
          pixels = Math.floor(pixels / 2);

          var scale        = this.scales.x,
              milliseconds = scale.invert(Math.abs(pixels)).getTime() - scale.invert(0).getTime();

          milliseconds = pixels < 0 ? 0 - milliseconds : milliseconds;

          return scale.domain().map(function(d, i) {
            return i === 0 ? (d.getTime() + milliseconds) : (d.getTime() - milliseconds);
          });
        };

        Curve.prototype.shift = function ( pixels ) {
            
            pixels = Math.floor(pixels);

            var scale        = this.scales.x,
                map          = this.map.x,
                milliseconds = scale.invert(Math.abs(pixels)).getTime() - scale.invert(0).getTime(),
                domain       = scale.domain().map(function(d) { return new Date(d.getTime() + (pixels > 0 ? (0 - milliseconds) : milliseconds)); }),
                startTime    = pixels > 0 ? domain[0].getTime() : (domain[1].getTime() - milliseconds),
                endTime      = pixels > 0 ? (domain[0].getTime() + milliseconds) : domain[1].getTime(),
                c            = this.canvas.getContext("2d");

            c.save();
            c.globalCompositeOperation = "copy";
            c.drawImage(this.canvas, pixels, 0);
            c.restore();

            for(var i = 0, length = Math.abs(pixels); i < length; i++)
              if(pixels > 0) {
                map.unshift(undefined);
                map.pop();
              }
              else {
                map.shift();
              }

            return [startTime, endTime, domain];

        };
    
        function m (p) {
          return context.map(p);
        };

        Curve.prototype.draw = function(d, startTime, endTime, domain) {
            
            var p0, p1, p2, shift = 0, x = this.map.x, correction = 0, scale = this.scales.x, points;

            context  = this,
            width    = this.width, 
            height   = this.height,
            stack    = this.stack,
            data     = (d || this.map().x.filter(function(d) { return !!d; }));
            
            if(Array.isArray(data) && (c = this.canvas.getContext("2d")) ) {
                
                points = [].concat(data);
                
                c.strokeStyle = this.lineColor.toString();
                c.lineWidth   = this.lineWidth;
                c.fillStyle   = (function(color) { return 'rgba('+color.r+','+color.g+','+color.b+', .5)'})(this.lineColor.brighter());
                
                c.globalCompositeOperation = "source-over";

                this.reset();

                if( points && points.length && (data = points.pop()) ) {

                    scale.domain(domain || [
                        new Date( startTime || (startTime = (data.timestamp - (this.seconds * 1000))) ),
                        new Date( endTime || (endTime = data.timestamp) )
                    ]);

                    points.push(data);

                    c.clearRect(scale(new Date(startTime)), 0,  scale(new Date(endTime)), height);
                        
                }

                while( points && points.length && (data = points.shift()) ) {
                    
                    if ( stack.length < 1 ) 
                    {
                        stack.push(data); continue;
                    }
                    
                    p0 = stack.length === 2 ? stack.shift() : undefined;
                    p1 = stack[stack.length - 1];
                    p2 = data;
                    
                    if(p1.timestamp > endTime) {
                        stack.pop(); break;
                    }
                    else if( p2.timestamp < startTime )
                    {
                        stack.push(p2); continue;
                    }
                    
                    drawLine.apply(null, [p0, p1, p2].map(getCoordinates).map(m)), stack.push(p2), (p1.cpx = p2.cpx), (p1.cpy = p2.cpy);
                                        
                }
                
                return (x.correction = null);

            }
            else if(typeof data === 'object' && (c = this.canvas.getContext("2d"))) {
                
                if ( stack.length < 1 )
                    return stack.push(data);
                
                p0 = stack.length === 2 ? stack.shift() : undefined;
                p1 = stack[stack.length - 1];
                
                stack.push(p2 = getCoordinates(data));
                
                (points = [p0, p1, p2]);
                
                if( (shift = p2.x - p1.x) >= 1 ) {
                    
                    c.save();

                    c.globalCompositeOperation = "copy";
                    
                    x.correction = p2.sx;

                    scale.domain([
                        new Date(p2.timestamp - (this.seconds * 1000) ),
                        new Date(p2.timestamp)
                    ]);
                    
                    this.shift(-(shift += (correction = x.correction)));
                    
                }

                c.restore();

                drawLine.apply(null, 
                               ( (points = points.map(getCoordinates)), 
                                  points.slice(0,1)
                                        .map(correct(-correction, 'x'))
                                        .slice(0,1)
                                        .map(correct(-shift, 'cpx')), 
                                  points.map(m))), (p1.cpx = p2.cpx), (p1.cpy = p2.cpy);

            }
        };
        
        function correct (p, key) {
            var k = correct.key, v = correct.value;
            if(typeof p === 'number')
                return (correct.value = p), (correct.key = key), correct;
            else if (typeof p === 'object')
                return (p[k] += v), p;
        };
        
    })();


    FastCurve.prototype.zoom = function (pixels) {
        
        var context = this;

        return this.stop(), this.curves.forEach(function (curveObject, i) {
            return curveObject.draw.apply(curveObject, [context.data[i]].concat(curveObject.zoom(pixels)));
        });
    };
    
    FastCurve.prototype.shift = function (pixels) {
        
        var context = this;

        return this.stop(), this.curves.forEach(function (curveObject, i) {
            return curveObject.draw.apply(curveObject, [context.data[i]].concat(curveObject.shift(pixels)));
        });
    };
    
    FastCurve.prototype.fromJSON = function () {
        
        var context = this,
            curves  = this.curves;
        
        this.labels.forEach(function(label, i) {
            curves[i] = (new Curve(curves[i] || {label: label, seconds: context.seconds}));
        });
        return DataSet.prototype.fromJSON.call(this);    
    };

    FastCurve.prototype.create = function () {

        var  context    = this, 
             element    = d3.select(this.element),
             dimensions = this.dimensions,
             line       = d3.svg.line()
                            .x(function(d) { return d[0]; })
                            .y(function(d) { return d[1]; })
                            .interpolate("linear"),
             legends, brush, extent;
        
        function blur () {
          return context.stop(), element.select("g.x.brush").style("pointer-events", "none");
        };
        
        function focus () {
          if(context.visible() && !extent) return context.start(), element.select("g.x.brush").style("pointer-events", "all");
        };
        
        window.addEventListener("blur", blur, false);
        window.addEventListener("focus", focus, false);

        this.destroy = function () {

          window.removeEventListener("blur", blur);
          window.removeEventListener("focus", focus);

          return DataSet.prototype.destroy.apply(this, arguments);

        };
        
        this.contextmenu.add( 'Set Timespan', 'Set new timespan for ALL curves', 
            function click () {
                context.curves.forEach(setTimespan);
            }
        ),
            
        this.contextmenu.add( 'Release', 'Release and force a re-draw because window is frozen', 
            function click () {
                context.brush.clear(), (extent = null), context.overlay.select("g.brush.x").call(brush), context.draw(true);
            },
            function show (curveObject, d) {
                return d3.select(this).style("display", extent ? null : "none");
            }
        ),
            
        this.contextmenu.add( 'Re-Focus All', 'Makes all curves visible again', 
            function click () {
                context.curves.forEach(function (curveObject) {
                    d3.select(curveObject.canvas).classed("blur", false), (curveObject.index = curveObject.index);
                });
            }
        ),
                             
        
        this.toolbar.add("zoom", "Click hold and move cursor around to zoom, move",
          function click (d) {
              
              var element = d3.select(context.element),
                  selection = d3.select(this),
                  c = click;

              extent = [0,0];
              
              if(selection.classed("zooming")) {
                
                element.select("g.x.brush")
                   .style("pointer-events", "all"),
                selection.classed("zooming", false),
                context.overlay.style("cursor", null)
                       .on("mousedown", null)
                       .classed("icon zooming", false);
                
                vrt.controls.status("");

              }
              else {
                
                element.select("g.x.brush").style("pointer-events", "none"),
                selection.classed("zooming", true),
                context.overlay.on("mousedown", 
                  function zoom () {

                    var event = d3.event, x  = event.clientX, y = event.clientY;

                    function up () {
                      return window.removeEventListener("mouseup", up), 
                             window.removeEventListener("mousemove", move); 
                    };

                    function move (event) {       

                      var dx = 0 - (x - event.clientX), dy = 0 - (y - event.clientY);
                      
                      return context.overlay.style("cursor", dy < 0 ? "-webkit-zoom-out" : "-webkit-zoom-in"), 
                             context.shift(dx), context.zoom(dy), (x = event.clientX), (y = event.clientY);
                    };

                    return window.addEventListener("mouseup", up),  
                           window.addEventListener("mousemove", move);
                })
                .classed("icon zooming", true);
              
                vrt.controls.status(d.description);
                  
                context.contextmenu.add('Disable Zoom Controls', 'Return to normal mode', 
                    function click (_, command) {
                        return c.call(selection.node()), command.remove();
                });
              }
              
              
          });

        this.brush      = brush = d3.svg.brush().x(d3.scale.ordinal())
        .on("brushstart", function() {
            extent = brush.extent();
        })
        .on("brushend", function() {
            
            if(!brush.empty() && (extent = brush.extent())) {
                
                context.stop(),           
                context.curves.forEach(function(curveObject, i) { 
                    curveObject.draw.apply(curveObject, [context.data[i]].concat(brush.extent().map(function(x) { 
                        return curveObject.scales.x.invert(x).getTime(); 
                    })) ); 
                }),
                
                brush.clear(),
                context.overlay.select("g.brush.x").call(brush);
            }
        });
        
        this.overlay = element.append("svg");
        
        this.overlay.append("g")
            .attr("class", "x brush")
        .on("mousemove", function () {
                        
            var width      = dimensions.width,
                height     = dimensions.height,
                margin     = dimensions.margin,
                x = d3.event.x - margin.left - context.element.offsetLeft,
		        y = d3.event.y - margin.top - context.element.offsetTop,
                map, selection, data = [];
            
            function search(start, stop, step) {
                for(var i = start; ( start <= stop ? (i <= stop) : (i >= stop) );) {
                    return map[i];
                }                
            };
            
            context.curves.forEach(function( curveObject, i ) {
                
                map = curveObject.map.x;
                
                var x1      = x,
                    x2      = x,
                
                    stop1   = map.length-1,
                    stop2   = 0;
                
                while(x1 <= stop1 && x2 >= stop2) {                  
                    
                    if( x1 <= stop1 )
                        data[i] = search(x1++, stop1);
                    
                    if(typeof data[i] === 'object')
                        break;
                    
                    if( x2 >= stop2 )
                        data[i] = search(x2--, stop2);
                    
                    if(typeof data[i] === 'object')
                        break;
                }
                
                if(typeof data[i] !== 'object')
                    data[i] = curveObject.data;
                
            });
            
            selection = context.overlay.selectAll("circle.track")
                    .data(context.curves);
            
            selection.transition()
                    .duration(50)
                    .attr("cx", function(curveObject, i) {return data[i].x; })
                    .attr("cy", function(curveObject, i ) {return data[i].y + margin.top; });
            
            selection.enter()
                    .append("circle")
                    .attr("class", "track")
                    .attr("r", function(curveObject) {return curveObject.lineWidth + 2; })
                    .attr("cx", function(curveObject, i) {return data[i].x; })
                    .attr("cy", function(curveObject, i) {return data[i].y + margin.top; })
                    .style({
                        "fill": "none",
                        "stroke": function(curveObject) { return curveObject.lineColor.toString(); },
                        "stroke-width": 1
                    }); 
            
            
            selection = context.overlay.selectAll("path.track.x")
                    .data(context.curves);
            
            selection.transition()
                    .duration(50)
                    .attr("d", function(curveObject, i) { return line([ [data[i].x,  0], [data[i].x,  height] ]); });
            
            selection.enter()
                    .append("path")
                    .classed({
                        "track" : true,
                        "x" : true
                    })
                    .style({
                        "fill": "none",
                        "stroke": function(curveObject) { return curveObject.lineColor.toString(); },
                        "stroke-width": 1
                    })
                    .attr("d", function(curveObject, i) { return line([ [data[i].x,  0], [data[i].x,  height] ]); });
            
            selection = context.overlay.selectAll("path.track.y")
                    .data(context.curves);
            
            selection.transition()
                    .duration(50)
                    .attr("d", function(curveObject, i) { return line([ [0, data[i].y + margin.top], [width,  data[i].y + margin.top] ]); });
            
            selection.enter()
                    .append("path")
                    .classed({
                        "track" : true,
                        "y" : true
                    })
                    .style({
                        "fill": "none",
                        "stroke": function(curveObject) { return curveObject.lineColor.toString(); },
                        "stroke-width": 1
                    })
                    .attr("d", function(curveObject, i) { return line([ [0, data[i].y], [width,  data[i].y] ]); });
            
            selection = context.overlay.selectAll("text.top")
                    .data(context.curves);
            
            selection.text(function(curveObject, i) { return format(new Date(data[i].timestamp)); });
            
            selection.enter()
                    .append("text")
                    .attr("class", "top")
                    .attr("y", margin.top / 2)
                    .attr("x", 0)
                    .style({
                        "fill" : function(curveObject) { return curveObject.lineColor.toString(); },
                        "opacity" : 0,
                        "text-anchor" : function(_, i) { 
                            switch (i) {
                                case 0:
                                    return "start";
                                case (context.curves.length-1):
                                    return "end";
                                default:
                                    return "middle";
                            }
                        }
                    })
                    .text(function(curveObject, i) { return format(new Date(data[i].timestamp)); })
                    .transition()
                    .duration(function(_, i) { return 100 * i })
                    .style({
                        "opacity": null
                    })
                    .attr("x", function(_, i) { return  i * (width / context.curves.length); })
            
            selection = context.overlay.selectAll("text.bottom")
                    .data(context.curves);
            
            selection.text(function(curveObject, i) { return String(data[i].value); });
            
            selection.enter()
                    .append("text")
                    .attr("class", "bottom")
                    .attr("y", height - (margin.bottom * 0.5))
                    .attr("x", 0)
                    .style({
                        "fill" : function(curveObject) { return curveObject.lineColor.toString(); },
                        "opacity" : 0,
                        "text-anchor": function(_, i) {
                            switch(i) {
                                case 0:
                                    return "start";
                                case (context.curves.length-1):
                                    return "end";
                                default:
                                    return "middle";
                            }
                        }
                    })
                    .text(function(curveObject, i) { return String(data[i].value); })
                    .transition()
                    .duration(function(_, i) { return 100 * i })
                    .style({
                        "opacity": null
                    })
                    .attr("x", function(_, i) { return i * (width / context.curves.length); });
            
            context.overlay.selectAll("text.top, text.bottom, circle.track, path.track")
                .classed("blur", function(curveObject) {return d3.select(curveObject.canvas).classed("blur"); });
            
        })
        .on("mouseout", function () {
                        
           !extent && context.start();
            
                       
            context.overlay.selectAll("text.top, text.bottom, circle.track, path.track")
                           .transition()
                           .duration(200)
                           .style({
                                "opacity": 0
                            })
                           .remove();
            
            context.overlay.selectAll("g.legends")
            .transition()
            .duration(100)
            .style("opacity", 1);

            vrt.controls.status("");
            
        })
        .on("mouseover", function() {
            
            context.stop();
            
            context.overlay.selectAll("g.legends")
                    .transition()
                    .duration(100)
                    .style("opacity", .25);
            
            context.curves.forEach(function( curveObject ) {                
                map = curveObject.map().x;           
            });

            vrt.controls.status("Click hold and drag to select zoomable area");
        });
    };

    FastCurve.prototype.update = function () {
        
        var e = this.event, d = this.data;
        
        if( !e ) {}
        else if( e.type === 'receive' && this.visible())
            return (e.data.curve = this.curves[e.x]), 
                        (e.data.curve && (e.data.curve.data = e.data) ), 
                            ( this.__animationRequestId__ && this.__buffer.push(e.data) );
        else if(this.event.type === 'reload:eof')
            return DataSet.prototype.update.apply(this, arguments);

    };

    FastCurve.prototype.resize = function () {

        var context    = this,
            dimensions = this.dimensions,
            margin     = dimensions.margin,
            width      = dimensions.compensated.width,
            height     = dimensions.compensated.height,
            overlay    = this.overlay;
        
        this.brush.x().domain([0, width]).range([0, width]);

        d3.select(this.element).selectAll("canvas").remove(),
            
        overlay.remove(),
        
        this.curves.forEach(function(curveObject) {
            
            curveObject.width =  width;
            curveObject.height =  height;
            
            d3.select(curveObject.canvas)
            .style({
                'position': 'absolute', 
                'left': margin.left + 'px', 
                'top': margin.top + 'px', 
                'z-index': curveObject.index
            });
            
            $(context.element).append(curveObject.canvas);
        }),
            
        $(this.element).append(overlay.node());
            
        overlay
            .attr("width", width)
            .attr("height", dimensions.height)
            .style({
                'position': 'absolute', 
                'left': margin.left + 'px',
                'top': '0px', 
                'z-index': highestIndex + 1
            });
        
        overlay.selectAll("g.legends").remove();
        
        overlay.append("g")
               .attr("class", "legends")
               .attr("transform", "translate("+margin.left+","+(height+margin.top)+") rotate(-90)")
               .append("rect")
               .attr("class", "background")
               .attr("width", height - (margin.top / 2) - (margin.bottom / 2))
               .attr("x", margin.bottom / 2)
               .attr("rx", 3)
               .attr("ry", 3)
               .on("mouseover", function() {
                    
                   context.stop(),
                   
                    d3.event.stopImmediatePropagation(),

                    d3.select(this.parentNode)
                      .transition()
                      .duration(100)
                      .style("opacity", 1);
                }),
            
        this.brush.clear(),
            
        overlay.selectAll("g.brush.x")
            .attr("class", "x brush")
            .call(this.brush)
            .selectAll("rect")
            .attr("y", margin.top)
            .attr("height", height);               

        return this.start(), DataSet.prototype.resize.call(this);
    };    

    FastCurve.prototype.draw = function ( force ) {
        
        if(!this.visible())
            return;

        var dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin,
            width      = dimensions.width,
            height     = dimensions.height,
            context    = this, 
            overlay    = this.overlay, background, line;
        
        function rightclick () {
            var args = arguments;
            menu.get("__configure").click = function() {
              return editor.apply(context, args);  
            };
            menu.apply(this, args);
        };
        
        overlay = overlay.select("g.legends");
            
        background = overlay.select("rect.background");
            
        overlay = overlay.selectAll("g.legend")
                             .data(this.curves);

        overlay = overlay
                    .enter()
                    .append("g")
                    .attr("class", "legend")
                    .on('contextmenu', rightclick)
                    .on('mouseover', showTimespan)
                    .on('mouseout', showTimespan);
            
        line = overlay.append("rect")
                    .attr("class", "line")
                    .style({
                        "opacity" : .5,
                        "fill" : function(curveObject) { 
                            return curveObject.lineColor.toString(); 
                        }
                    });

        overlay            
           .append("text")
           .attr("class", "low")
           .style("text-anchor", "end")
           .attr("x", (height / 4))
           .text(function(curveObject) { return String(curveObject.low); });

        overlay             
           .append("text")
           .attr("class", "label")
           .style("text-anchor", "middle")
           .attr("x", height / 2 )
           .text(function(curveObject) { return curveObject.label; });

        overlay             
           .append("text")
           .attr("class", "value")
           .style("text-anchor", "middle")
           .attr("x", height / 2 )
           .text(function(curveObject) {
               
               var element = d3.select(this), data = curveObject.data;
               
               return Object.defineProperty(curveObject, "data", {
                   configurable: true,
                   enumerable: false,
                   set: function(d) { 
                       element.text(d && d.value && (data = d) ? String(d.value) : "");
                   }, 
                   get: function() { 
                       return data;
                   }
               }), (data && data.value ? String(data.value) : "N/A");
               
           })
           .attr("y", (function() {
                   
               var extent, background_height = 0;
                   
               return function() { 
                    return (extent = this.getExtentOfChar("0")),
                                    background.attr("height", (background_height += extent.height * 3)).attr("y", -extent.height * 1.5),
                                    line.attr("height", 1).attr("width", height - margin.top - margin.bottom).attr("x", margin.bottom).attr("y",  extent.height * 0.25 ), 
                                        extent.height;
               };
                   
           })());

        overlay               
           .append("text")
           .attr("class", "high")
           .style("text-anchor", "start")
           .attr("x", height - (height / 4) )
           .text(function(curveObject) { return String(curveObject.high); });

        overlay.attr("transform", function(_, i) { 
            return "translate(0," + (i * d3.select(this).select("text").node().getExtentOfChar("0").height) * 3 + ")";
        });
        
        return this.curves.forEach(function(curveObject, i) {
            return (!force && !curveObject.dirty) || curveObject.draw(context.data[i]);
        });

    };

    FastCurve.prototype.show = function () {
        return d3.select(this.element).select("g.x.brush").style("pointer-events", "all"), this.start(), DataSet.prototype.show.apply(this, arguments);
    };

    FastCurve.prototype.hide = function () {
        return this.stop(), DataSet.prototype.hide.apply(this, arguments);
    };

    FastCurve.prototype.start = function() {

        var context = this;
        
        this.stop();
        
        while(this.__buffer.length) this.__buffer.pop();

        return this.render('draw'), (function dispatch () {

            var data;

            while(typeof (data = context.__buffer.shift()) !== 'undefined') {
                data.curve.draw(data);
            }

            return (context.__animationRequestId__ = requestAnimationFrame(dispatch));

        })();

    };

    FastCurve.prototype.stop = function() {
        return  cancelAnimationFrame(this.__animationRequestId__), (this.__animationRequestId__ = null);
    };
    
    function editor ( obj ) {
        
        var context = this;
        
        return this.editor({
                   
            title: ('Edit ' + obj.constructor.name + ' : "' +  obj.label + '"'),
            record: obj,
            fields: [
                {
                   name: 'mode',
                   type: 'list',
                   options: {
                        showNone : false,
                        items: obj.modes,
                        value: obj.mode
                    },
                    required: true
                },
                {
                    name: 'tension',
                    type: 'float',
                    required: true
                },
                {
                    name: 'fill',
                    type: 'checkbox'
                },
                {
                    name: 'lineWidth',
                    type: 'float',
                    required: true
                },
                {
                    name: 'lineColor',
                    type: 'color',
                    options: {
                        value: obj.lineColor.toString().replace("#", "")
                    },
                    required: true
                },
                {
                    name: 'low',
                    type: 'int',
                    required: true
                },
                {
                    name: 'high',
                    type: 'int',
                    required: true
                },
                {
                    name: 'seconds',
                    type: 'int',
                    required: true
                }
            ],
            actions: {
                "delete" : function() {
                    return context.delete(context.curves.indexOf(obj)), this.actions.cancel();
                }
            }
        });
    };
    
    return FastCurve;
    
});
