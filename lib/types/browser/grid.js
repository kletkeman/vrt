define(['interact', 'jquery', 'types/dataset', 'lib/types/base/grid', 'lib/api', 'd3', 'js/viewcontroller.contextmenu'], function(interact, $, DataSet, Grid, vrt, d3, contextmenu) {

    $.extend(Grid.prototype, Grid.prototype.__proto__, $.extend({}, Grid.prototype));
    
    $.extend(Grid.required, {
        '(__buffer)' : Array,
        '(extent)'     : Array
    });
    
    var transition_time_milliseconds = 250;
    
    function select (x0, y0, x1, y1) {

       var i      = 0, selected = {cells: [], rows: [], columns: []},
           data   = this.data, len = data.length, 
           canvas = this.canvas.node(), 
           width  = canvas.width,
           height = canvas.height,
           two    = arguments.length === 2,
           four   = arguments.length === 4,
           cell, column, row, values, y, x, x2, y2;

       if( Number.isFinite(x0) && Number.isFinite(y0) ) {
                      
           for(;i < len; i++) {
               
               row = data[i];
               
               if(! (row instanceof Row) ) continue;
               
               y  = row.position.y(height);
               
               y2 = y + row.position.height(height);

              if( (two && y <= y0 && y2 >= y0) || 
                  (four && y >= y0 && y2 <= y1) ||
                  (four && y0 >= y && y0 <= y2 && y1 <= y2 && y0 >= y) ) {
                  
                  values = row.values;
                  
                  for(var label in values) {

                      cell   = values[label];
                      
                      if(! (cell instanceof Cell) ) continue;
                      
                      column = cell.column;
                      
                      x  = column.position.x(width);
                      
                      x2 = x + column.position.width(width);

                      if( (two && x <= x0 && x2 >= x0) ||
                          (four && x >= x0 && x2 <= x1) ||
                          (four && x0 >= x && x0 <= x2 && x1 <= x2 && x0 >= x) ) {
                          
                          selected.cells.push(cell);
                          
                          if(two) break;
                          
                          if(selected.columns.indexOf(column) === -1)
                              selected.columns.push(column);
                      }

                   }
                  
                  if(two) break;
                  
                  selected.rows.push(row);
                  
              }

           }
       }

       return two ? cell : selected;

    }
    
    Grid.prototype.zoom = function (h, v) {
        
        var canvas    = this.canvas.node(),
            width     = canvas.width,
            height    = canvas.height,
            ctx       = canvas.getContext("2d"),
            extent    = this.extent,
            selection, position, rows, columns, row, column, columns_length = 0, x, y, first_row_index, first_column_index;
        
        if(extent.length < 2)
            extent = this.extent = [[0,0], [width, height]];
        
        if( Number.isFinite(v) && Number.isFinite(h) ) {
            
        }
        
        selection = select.apply(
            this, this.extent[0].concat(this.extent[1])
        );
        
        if(!selection.cells.length)
            return this.draw();
        
        rows = selection.rows.sort(function(a, b) {
            return d3.ascending(a.position.y(height), b.position.y(height));
        });
        
        columns = selection.columns.sort(function(a, b) {
            return d3.ascending(a.position.x(width), b.position.x(width));
        });
        
        selection.cells.map(function(cell) { return  cell.mark(); });
        
        with(ctx) {
        
            save(); 

            globalCompositeOperation = "copy";

            drawImage(canvas,
                          (x = columns[0].position.x(width)),
                          (y = rows[0].position.y(height)),  
                          (columns[columns.length-1].position.x(width) + columns[columns.length-1].position.width(width)) - x,
                          (rows[rows.length-1].position.y(height) + rows[rows.length-1].position.height(height)) - y,
                          0, 0, 
                          width, 
                          height
            );

            restore();
            
        }
        
        first_column_index  = columns[0].position.index,
        first_row_index     = rows[0].position.index;
        
        for(var i = 0, _rows = this.data, _columns = d3.values(this.columns), len = Math.max(_rows.length, _columns.length); i < len; i++)
        {
            
            row    = _rows[i];
            column = _columns[i];
            
            if(row instanceof Row) {
                
                with(row.position) {
                
                    index -= first_row_index;                
                    divider = rows.length;
                    
                }
            }
            
            if(column instanceof Column) {
                
                with(column.position) {                    
                    
                    index -= first_column_index;
                    divider = function () { return columns_length; }
                
                }
                
                if(columns.indexOf(column) > -1)
                    columns_length += column.width;
                
            }
            
        }
        
        return (this.extent = [[0,0], [width, height]]), this.render('draw', columns, rows);
        
    }
    
    Grid.prototype.shift = function (h, v) {
        
        var canvas = this.canvas.node(),
            width  = canvas.width,
            height = canvas.height,
            ctx    = canvas.getContext("2d"),
            extent = this.extent,
            position, shift_x, shift_y;
        
        for(var i = 0, rows = this.data, columns = d3.values(this.columns),
            len = Math.max(rows.length, columns.length); i < len; i++)
        {
            row    = rows[i];
            column = columns[i];
            
            if(Number.isFinite(v) && row instanceof Row) {                
                
                with(row.position) {
                   index += v;
                }
                
            }
            
            if(Number.isFinite(h) && column instanceof Column) {
                
                with(column.position) {
                   index += h;
                }                
                                
            }
            
        }
        
        if(rows.length)
            shift_y = rows[0].position.height(height) * v;
        
        if(columns.length)
            shift_x = columns[0].position.width(width) * h;

        shift_x |= 0, shift_y |= 0;
        
        with(ctx) {
            
            save();

            globalCompositeOperation = "copy";

            drawImage(canvas, shift_x, shift_y);
            
            restore();
        }

        with (select) {
            
            if(shift_x)
                (shift_x < 0 ? 
                    call(this, width + Math.ceil(shift_x), 0, width, height) :
                    call(this, 0, 0, Math.ceil(shift_x), height)).cells
                    .map(function(cell) { return cell.mark(); });
            
            if(shift_y)
                (shift_y < 0 ? 
                    call(this, 0, height + Math.ceil(shift_y), width, height) :
                    call(this, 0, 0, width, Math.ceil(shift_y))).cells
                    .map(function(cell) { return cell.mark(); });
            
        }
        
        return this.render('draw', columns, rows);
        
    }
        
    Grid.prototype.create = function () {
        
        var context = this,
            element = d3.select(this.element),
            brush, interactable;
        
        this.canvas  = element.append("canvas");

        this.overlay = element.append("svg");

        this.gutter  = {
            right  : element.append("svg"),
            bottom : element.append("svg")
        };
        
        this.brush = brush = d3.svg.brush()
            .on("brushend", function () {
            
                if(!brush.empty() && (context.extent = brush.extent())) {
                    
                    brush.clear(),
                    context.overlay.select("g.brush").call(brush);

                    return context.zoom();
                    
                }
        });
        
        this.overlay.on("mousemove", function () {
            
            var e      = d3.event,
                margin = context.dimensions.margin,
                cell   = select.call(context, e.x - margin.left, e.y - margin.top);
            
            cell && context.status(cell.value);

        });
        
        with (this) {
            
            (function () {
            
                var dx = 0, dy = 0, sx, sy;

                interactable = interact(overlay.node()).draggable(true)
                .on("dragstart",    function (event) {
                    
                    for(var k in columns) {
                        sx = __width__.call(columns[k].position, dimensions.compensated.width);
                        break;
                    }
                    
                    sy = __width__.call(data[0].position, dimensions.compensated.height);
                    
                })
                .on("dragmove",    function (event) {
                    
                    var integer, cols = 0, rows = 0;
                    
                    dx += event.dx / sx;
                    dy += event.dy / sy;
                    
                    if( dx < 0 ? (integer = Math.ceil(dx)) : (integer = Math.floor(dx)) ) {
                        cols = integer;
                        dx = dx - integer;
                    }
                    
                    if( dy < 0 ? (integer = Math.ceil(dy)) : (integer = Math.floor(dy)) ) {
                        rows = integer;
                        dy = dy - integer;
                    }
                    
                    (cols || rows) && shift(cols, rows);
                    
                });


            })();

            gutter.right.append("g").attr("class", "labels");
            gutter.bottom.append("g").attr("class", "labels");

            gutter.bottom.select("g.labels")
                .attr("transform", "rotate(-90)");

            brush.y(d3.scale.ordinal());
            brush.x(d3.scale.ordinal());
            
            toolbar.add("zoom", {
                on: function () {
                    
                    interactable.options.draggable = false;
                    
                    overlay.append("g")
                        .attr("class", "brush")
                        .call(brush);
                    
                    return "Drag and move around";

                },
                off: function () {
                    
                    interactable.options.draggable = true;
                    
                    brush.clear();
                    overlay.selectAll("g.brush").remove();
                    
                    return "Select Zoom Area";                    

                }
            });
            
        }
                        
        Object.observe(this.columns, function (changes) {
            
            var change, name;
          
            for(var i = 0, len = changes.length; i < len; i++) {
              
              change = changes[i];
              name   = change.name;
                
              if(change.type === "add" || change.type === "delete")
                 return context.render('resize');
                
            }
                       
        });
    
    };
    
    Grid.prototype.destroy = function () {
        return Object.unobserve(this.columns), DataSet.prototype.destroy.apply(this, arguments);
    }
    
    Grid.prototype.resize = function () {
        
        var dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin, 
            width      = dimensions.width, 
            height     = dimensions.height,
            context    = this, 
            canvas     = this.canvas.node();
        
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
        
        this.gutter.bottom
            .style({
                'position' : 'absolute',
                'left' : margin.left + 'px',
                'top': height + margin.top + 'px'
            })
            .attr('width', width)
            .attr('height',  margin.bottom)
            .attr("class", "gutter");
        
        this.gutter.right
            .style({
                'position' : 'absolute',
                'left' : width + margin.left + 'px',
                'top': margin.top + 'px'
            })
            .attr('width', margin.right)
            .attr('height',  height)
            .attr("class", "gutter");
        
        this.brush.y().domain([0, height]).range([0, height]);
        this.brush.x().domain([0, width]).range([0, width]);
        
        this.brush.clear();
               
        for(var i = 0, index = 0, row, values, data = this.data, length = data.length; i < length; i++) {
            
            row = data[i];
            
            if( ! (row instanceof Row) )
                row = data[i] = new Row(row, this.columns, new Position(i, function () { 
                    return context.data.length; 
                }), canvas);
            
        }
        
        this.canvas.each(function config () {
            
            with(this.getContext("2d")) {
            
                imageSmoothingEnabled = false;
                textAlign             = 'center';
                textBaseline          = 'middle';
                fillStyle             = 'rgba(0,0,0,0)';
                
            }
                        
        });
        
        return DataSet.prototype.resize.apply(this, arguments);
    
    }
    
    Grid.prototype.fromJSON = function () {
        
        var columns = this.columns;
        
        Object.defineProperty(columns, '__length__',
        {
            enumerable: false,
            configurable: true,
            writable: true,
            value: 0
        });
        
        $.each(columns, function (label, column) {
            
            if( ! (column instanceof Column))
                new Column(label, columns, new Position(columns.__length__, function divider () { return columns.__length__ }));
                
        });
                
        return DataSet.prototype.fromJSON.apply(this, arguments);
    }
        
    Grid.prototype.update = function () {
        
        var e = this.event, row, buffer = this.__buffer;
        
        if(!e) {}
        else if(e.type === 'receive')
        {
            
            row = this.data[e.x];
            
            if( ! (row instanceof Row) && typeof row === 'object' )
                return this.render('resize');
            else if(buffer.indexOf(row) === -1)
                buffer.push(row);
            
        }
        
        return rasterize.call(this);

    }
    
    function rasterize (restart) {
        
        var context     = this,
            width_cache = {},
            x_cache     = {},
            buffer    = this.__buffer;
        
        if(restart)
            cancelAnimationFrame(this.__animationRequestId__), clearTimeout(this.__animationRequestId__), (this.__animationRequestId__ = null);
        
        function draw () {
            
            var obj, row_count = 0;
            
            (context.__animationRequestId__ = null);
            
            while(buffer.length) {
                
                obj = buffer.shift();
                
                if (obj instanceof Row) {
                    
                    row_count += obj.draw(width_cache, x_cache);
                     
                    if( row_count > ( (context.data.length - buffer.length) / row_count ) )
                         break;
                    
                }
                
            }
            
            if(buffer.length)
                return (context.__animationRequestId__ = requestAnimationFrame(draw));
        }
        
        return this.__animationRequestId__ || (this.__animationRequestId__ = requestAnimationFrame(draw));
        
    }
       
    Grid.prototype.draw = function (columns, rows) {
        
        var two = arguments.length === 2,
            buffer = this.__buffer;
        
        if ( !this.visible() ) return;
        else if(!two) 
        {
            rows    = this.data;
            columns = d3.values(this.columns);
        }

        for(var i = 0, row , length = rows.length; i < length; i++) {

            row = rows[i];

            if(row instanceof Row) {
                (buffer.indexOf(row) === -1) && buffer.push(two ? row : row.mark());
            }
            else if(row instanceof Object)
                return this.render('resize');
        }
        
        with (drawLabels) {
            call(this, rows, this.gutter.right);
            call(this, columns, this.gutter.bottom, true);
        }
        
        return rasterize.call(this, true);
    
    }
    
    function text (d) {
        return d.label;
    }
    
    function getTextHeight (rotated) {
        var rect = this.getBoundingClientRect();
        return (rotated ? rect.width : rect.height);
    }
    
    function drawLabels (data, gutter, rotated) {
            
        var labels,
            margin     = this.dimensions.margin,
            dimensions = this.dimensions.compensated,
            width      = dimensions[rotated?'width':'height'],
            text_height, skip;
                
        function opacity (d) {
            
            var i = data.indexOf(d);
            
            text_height = text_height || getTextHeight.call(this, rotated);
            skip        = Math.ceil(Math.max(text_height / d.position.width(width), 1));
            
            return !( i % skip ) && i > -1 ? 1 : 0;
        }
        
        function y (d) {
            text_height = text_height || getTextHeight.call(this, rotated);            
            return  Position.prototype[rotated?'x':'y'].call(d.position, width) + (d.position.width(width) / 2) + (text_height / 2);
        }
        
        function x () {
            return (rotated ? -margin.bottom : margin.right) / 2;
        }
            
        labels = gutter.select("g.labels")
                 .selectAll("text.label")
                 .data(data);
        
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
    
    function Position (index, divider, multiplier) {
        this.index      = index || 0;
        this.divider    = divider || 1;
        this.multiplier = multiplier || 1;        
    }
    
    function __width__ (width) {
        return (width / (typeof this.divider === 'function' ? this.divider.call(this) : this.divider));
    }

    Position.prototype.width = function (width) {
        return (__width__.call(this, width) * this.multiplier);
    }

    Position.prototype.height = Position.prototype.width;

    Position.prototype.x = function (width) {
        return (typeof this.index === 'function' ? this.index.call(this) : this.index) * __width__.call(this, width);
    }

    Position.prototype.y = Position.prototype.x;
    
    function set_width (w) {
        return (this.position.multiplier = w);
    }
    
    function get_width () {
        return this.position.multiplier;
    }

    function Column (label, columns, position) {
        
        var column, width = 1;
                
        Object.defineProperties(this, {

            columns : {
              configurable: false,
              enumerable: false,
              value : columns
            },
            label : {
              configurable: false,
              enumerable: false,
              value : label
            },
            position: {
                configurable : false,
                enumerable : false,
                writable : true,
                value: position
            },
            width: {
                configurable : false,
                enumerable : true,
                set: set_width,
                get: get_width
            },
            hideText : {
                configurable : false,
                enumerable : true,
                writable: true,
                value : false
            },
            textColor : {
                configurable : false,
                enumerable : true,
                writable: true,
                value : null
            }

          });
        
        if( (column = columns[label]) ) {
            
           this.width = width = column.width || width;
            
        }
        
        columns.__length__ += width;
        
        columns[label] = this;
        
    }
    
    Column.prototype.add = function (cell) {
        
        if(cell instanceof Cell)
            Object.defineProperty(this, cell.row.label, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cell
            });
        
        return cell;
    }
    
    Column.prototype.delete = function (cell) {
        
        if(typeof cell === 'string')
            delete this[cell];
        if( cell instanceof Cell )
            delete this[cell.row.label];
        else if(!arguments.length) {
            
            if(this.label in this.columns)
                this.columns.__length__--;
            
            delete this.columns[this.label];
        }
    }

    function Cell (row, column, value) {
        
        Object.defineProperties(this, {
            value : {
                configurable: false,
                writable: true,
                value : value
            },
            row : {
              configurable: false,
              value : row
            },
            column : {
              configurable: false,
              value : column
            }
          });
        
        this.context = row.canvas.getContext("2d");
        this.context.font = "10px Arial";
    }    
    
    Cell.prototype.toJSON = function () {
        return this.value;
    }
    
    Cell.prototype.mark = function () {
        
        with(this.row.marked) {
        
            if(indexOf(this) === -1)
                push(this);
            
        }
        
        return this;        
    }    

    function Row (data, columns, position, canvas) {
        
      var values = {}, row = this, length = 0; columns = columns || {};
        
      function divider () { return columns.__length__ }

      Object.defineProperties(this, {

        marked  : {
          configurable: false,
          enumerable: false,
          value : []
        },          
        columns  : {
          configurable: false,
          enumerable: false,
          value : columns
        },
        label  : {
          configurable: false,
          enumerable: true,
          value : data.label
        },
        values : {
          configurable: false,
          enumerable: true,
          value : values

        },
        position : {
          configurable: false,
          enumerable : false,
          value: position
        },
        canvas : {
          configurable: false,
          enumerable : false,
          value: canvas
        },
        length : {
          configurable: false,
          enumerable : false,
          get: function () {
              return length;
          }
        }

      });
        
      Object.observe(values, function (changes) {
          
          var change, name, obj;
          
          for(var i = 0, len = changes.length; i < len; i++) {
              
              change = changes[i];
              name   = change.name;
              obj    = change.object;
              
              if(change.type === "add") {
                  
                  if( ! ( obj[name] instanceof Cell ) ) {
                      
                      obj[name] = new Cell(
                          row, 
                          !(columns[name] instanceof Column) ? 
                          new Column(name, columns, new Position(columns.__length__, divider)) : columns[name],
                          obj[name]
                      );
                    
                      columns[name].add(obj[name]);
                      
                      obj[name].mark();
                      
                  }
                  
                  length++;
              }
              else if(change.type === "delete") {
                  length--;
              }
              else if(change.type === "update") {
                  
                  if(change.oldValue instanceof Cell && ! (obj[name] instanceof Cell) ) {
                      
                      change.oldValue.value = obj[name];
                      
                      obj[name] = change.oldValue;
                      
                      obj[name].mark();
                  }
                      
              }
          }
          
      });
        
      $.extend(values, data.values);
        
    }
    
    Row.prototype.mark = function () {
        
        var values = this.values,
            marked = this.marked,
            cell;
        
        for(var k in values) {
            
            cell = values[k];
            
            if(cell instanceof Cell && marked.indexOf(cell) === -1)
                marked.push(cell);
        }
        
        return this;
    } 
    
    Row.prototype.draw = function (width_cache, x_cache) {
        
        var marked     = this.marked,
            values     = this.values,
            canvas     = this.canvas,
            height     = this.position.height(canvas.height),
            y          = this.position.y(canvas.height),
            w          = canvas.width,
            ctx        = canvas.getContext("2d"),
            textHeight = Math.max(Math.floor(height / 2), 0),
            count      = 0,
            x, width, cell, column, label, value;
        
        width_cache = width_cache || {}, x_cache = x_cache || {};
        
        if(this.position.index < 0 || !marked.length) return true;
        
        with(ctx) {
        
            save();

            font = textHeight + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';

            while( (cell = marked.shift()) ) {

                column = cell.column;

                if(column.position.index < 0) continue;

                label  = column.label;

                save();

                if(values[label] === cell) {

                    width = (width_cache[label] = width_cache[label] || cell.column.position.width(w));

                    x = (x_cache[label] = x_cache[label] || cell.column.position.x(w));

                    beginPath();

                    rect(x, y, width, height);

                    if(true) {

                        save();

                        value = Math.round(cell.value * 255);

                        fillStyle = '#' + ((value  << 16) | (value << 8) | value).toString(16);
                        fill();

                        restore();

                    }

                    if(textHeight > 5 && !column.hideText) {

                        clip();

                        fillStyle = column.textColor || "black";

                        fillText(String(value), x + (width / 2), y + (height / 2));

                    }

                }

                restore();
                
                count++;

            }

            restore();
            
        }
        
        return count / this.length;
    }
    
    return Grid;
    
});
