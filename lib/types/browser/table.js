$.extend(vrt.Api.Table.prototype, vrt.Api.Table.prototype.__proto__, $.extend({}, vrt.Api.Table.prototype));

(function() {
        
    function Column(options) {
                
        var text           = String(options.text),
            textColor      = options.textColor ? String(options.textColor) : "000000",
            dataType       = this.dataTypes.indexOf(options.dataType) > -1 ? options.dataType : 'String',
            dateFormat     = options.dateFormat ? String(options.dateFormat) : "%a %b %e %H:%M:%S %Y",
            width          = Number.isFinite(options.width) ? options.width : 1,
            precision      = Number.isFinite(options.precision) ? options.precision : 0,
            colorDomain    = Array.isArray(options.colorDomain) ? options.colorDomain : [],
            colorRange     = Array.isArray(options.colorRange) ? options.colorRange : [],
            valueDomain    = Array.isArray(options.valueDomain) ? options.valueDomain : [],
            valueRange     = Array.isArray(options.valueRange) ? options.valueRange : [],
            hideValue      = Boolean(options.hideValue),
            colorScaleType = this.scaleTypes.indexOf(options.colorScaleType) > -1 ? options.colorScaleType : 'linear',
            valueScaleType = this.scaleTypes.indexOf(options.valueScaleType) > -1 ? options.valueScaleType : 'linear',
            colorScale     = d3.scale[colorScaleType](),
            valueScale     = d3.scale[valueScaleType](),
            scale          = {domain: {}, range: {}};
        
        colorScale.domain(colorDomain);
        colorScale.range(colorRange);
        
        valueScale.domain(valueDomain);
        valueScale.range(valueRange);
        
        Object.defineProperty(this, 'scale', {
            get : function() {
                return scale;
            },
            enumerable : false
            
        });
        
        Object.defineProperties(this.scale, {
            color : {
                get : function() { return colorScale; },
                enumerable : false
            },
            value : {
                get : function() { return valueScale; },
                enumerable : false
            }
        });
        
        Object.defineProperties(this, {
            
            text : {
                get : function() { return text; },
                enumerable : true
            },
            
            precision : {
                
                get : function() {
                    return precision;
                },
                set : function(value) {
                    precision = Number(value) || 0;
                },
                enumerable: true
                
            },
                       
            hideValue : {
                get : function() {
                    return hideValue;
                },
                set : function(value) {
                    hideValue = Boolean(value);
                },
                enumerable: true
            },
            
            textColor : {
                get : function() {
                    return textColor;
                },
                set : function(value) {
                    textColor = String(value).replace("#", "");
                },
                enumerable: true 
            },
            
            width : {
                
                get : function() {
                    return width;
                },
                set : function(value) {
                    width = Number(value) || 1;
                },
                enumerable: true
                
            },
            
            colorDomain : {
                
                get : function() {
                    return colorDomain;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        colorDomain = $.extend([], value);
                    else {
                        value = String(value);
                        colorDomain = value.trim().length ? value.split(",").map(function(d) {
                            return Number(d.trim());
                        }) : [];
                    }
                    
                    colorScale.domain(colorDomain);
                },
                enumerable: true
            },
            
            colorRange : {
                
                get : function() {
                    return colorRange;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        colorRange = $.extend([], value);
                    else {
                        value = String(value);
                        colorRange = value.trim().length ? value.split(",").map(function(d) {
                            return d.trim(); 
                        }) : [];
                    }
                    
                    colorScale.range(colorRange);
                },
                enumerable: true
                
            },
            
            colorScaleType : {
                
                get : function() {
                    return colorScaleType;
                },
                set : function(value) {
                    if(this.scaleTypes.indexOf(value) > -1) {
                        
                        colorScaleType = value;
                        colorScale = d3.scale[value]();
                        
                        colorScale.domain(colorDomain);
                        colorScale.range(colorRange);
                    }
                },
                enumerable: true                
            },
            
            valueDomain : {
                
                get : function() {
                    return valueDomain;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        valueDomain = $.extend([], value);
                    else {
                        value = String(value);
                        valueDomain = value.trim().length ? value.split(",").map(function(d) {
                            return Number(d.trim());
                        }) : [];
                    }
                    
                    valueScale.domain(valueDomain);
                },
                enumerable: true
            },
            
            valueRange : {
                
                get : function() {
                    return valueRange;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        valueRange = $.extend([], value);
                    else {
                        value = String(value);
                        valueRange = value.trim().length ? value.split(",").map(function(d) {                            
                            var n = Number(d = d.trim());                            
                            return Number.isFinite(n) ? n : d;                            
                        }) : [];
                    }
                    
                    valueScale.range(valueRange);
                },
                enumerable: true
                
            },
            
            valueScaleType : {
                
                get : function() {
                    return valueScaleType;
                },
                set : function(value) {
                    if(this.scaleTypes.indexOf(value) > -1) {
                        
                        valueScaleType = value;
                        valueScale = d3.scale[value]();
                        
                        valueScale.domain(valueDomain);
                        valueScale.range(valueRange);
                    }
                },
                enumerable: true                
            },
            
            dataType : {
                
                get : function() {
                    return dataType;
                },
                set : function(value) {
                    if(this.dataTypes.indexOf(value) > -1) {
                        dataType = value;
                    }
                },
                enumerable: true                
            },
            
            dateFormat : {
                
                get : function() {
                    return dateFormat;
                },
                set : function(value) {
                    dateFormat = value;
                },
                enumerable: true                
            }
        });
    
    };
    
    Column.prototype.fill = function(element, v) {
            
        var context   = this, dataType = window[this.dataType],
            selection = d3.select(element),
            n_float, n_scaled, n;
        
        switch(dataType) {
                
            case Date:
                n_float   = (typeof v === 'string' ? Date.parse(v) : undefined);              
                break;
            default:
                n_float   = (Number.isFinite(v) ? v : (typeof v === 'string' ? parseFloat(v) : (typeof v === 'boolean' ? (v ? 1 : 0): undefined) ) );            
        };
        
         n_scaled  = context.valueDomain.length && context.valueRange.length && Number.isFinite(n_float) ? context.scale.value(n_float) : undefined,
         n = Number.isFinite(n_scaled) ? n_scaled : Number.isFinite(n_float) ? n_float : undefined;
        
        switch(dataType) {
                
            case Date:               
                                
                v = (new Date(n_float));            
                
                if(this.dateFormat.length)
                    v = d3.time.format(this.dateFormat)(v);
                else 
                    v = v.toLocaleString();
                
                n_float = n_scaled = undefined;
                
                break;
                
            case String:
                
                v = String(v).replace(/(\d+\.\d+)|(\d+)/, 
                    (n_scaled !== undefined ? 
                        (Number.isFinite(n_scaled) ? 
                            n_scaled.toFixed(context.precision) : n_scaled) : 
                        (Number.isFinite(n_float) ? 
                            n_float.toFixed(context.precision) : v)
                    )
                );
                
                n_float = n_scaled = undefined;
                
                break;
                
            case Number:             
                break;
            
        }
        
        
        
        return selection
                .select("rect")
                .style("fill", function() {
                    return (context.colorDomain.length && context.colorRange.length) && 
                        n !== undefined ? (context.scale.color(n) || "transparent") : "transparent";
                }),
                selection
                 .select("text.value")
                 .text(function() {
                     return (context.hideValue ? null : (n_scaled !== undefined ? 
                                                            (Number.isFinite(n_scaled) ? 
                                                                n_scaled.toFixed(context.precision) : n_scaled) : 
                                                            (Number.isFinite(n_float) ? 
                                                                n_float.toFixed(context.precision) : v) 
                                                        ) 
                            );
                 });
        
    };
    
    Column.prototype.scaleTypes = ['log', 'linear', 'quantize', 'quantile', 'threshold'];
    Column.prototype.dataTypes  = ['Date', 'String', 'Number'];
    
    function Row(options) {
         
        var text = String(options.text),
            highlight = Boolean(options.highlight),
            hide = Boolean(options.hide);
        
        Object.defineProperties(this, {
            
            text : {
                get : function() { return text; },
                enumerable : true
            },
            
            highlight : {
                get : function() {
                    return highlight;
                },
                set : function(value) {
                    highlight = Boolean(value);
                },
                enumerable: true 
            },
            
            hide : {
                get : function() {
                    return hide;
                },
                set : function(value) {
                    hide = Boolean(value);
                },
                enumerable: true 
            }
        });
    
    };
    
    function move(collection, src, dst) {
                
        var result = [];
        
        collection.forEach(function(d, i) {
            
            if(d === dst) {
                result.push(src);
            }
            
            if(d !== src)
                result.push(d);
            
                
        });
        
        result.forEach(function(d, i) {
            collection[i] = d;
        });
                    
        return collection;
    };
    
    vrt.Api.Table.prototype.fromJSON = function() {
        
        var context = this;
      
        this.columns.forEach(function(c, i) {
            if (!(context.columns[i] instanceof Column))
                context.columns[i] = new Column(c);
        }),     
        this.rows.forEach(function(r, i) {
            if (!(context.rows[i] instanceof Row))
                context.rows[i] = new Row(r);
        });
        
        return vrt.Api.DataSet.prototype.fromJSON.call(this);
        
    };
    
    vrt.Api.Table.prototype.create = function() {
        
        var context = this;
        
        this.canvas = d3.select(this.element).append('svg')
        .on("dblclick", function() {
            context.rows.forEach(function(r) {
                r.highlight = false;                
            });
            context.save();
        });
        
        this.index = {
            rows : [], 
            columns : []
        };
        
        this.cellmap = {};
        
        $.extend(this.dimensions.margin, 
        {
            right: 10,
            left: 80,
            top: 80,
            bottom: 10
        });
        
        return this.reIndex();
    
    };
    
    vrt.Api.Table.prototype.resize = function() {
        
        var margin = this.dimensions.margin, 
            width = this.dimensions.width - (margin.left * 2) - margin.right, 
            height = this.dimensions.height - margin.top - margin.bottom, 
            canvas = this.canvas, 
            context = this;
        
        if (!width || !height)
            return;
        
        this.scale = {
            x: d3.scale.ordinal().rangeBands([0, width]),
            y: d3.scale.ordinal().rangeBands([0, height])
        };
        
        this.canvas.selectAll('g').remove();
        
        this.canvas.attr("width", width + margin.left + margin.right + "px")
        .attr("height", height + margin.top + margin.bottom + "px")
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);
        
        vrt.Api.DataSet.prototype.resize.call(this);
    
    };
    
    vrt.Api.Table.prototype.reIndex = function() {
            
        var added   = 0, 
            context = this,
            hidden = [];
            
        this.index.rows = this.rows.filter(function(r) { 
            return !(r.hide && hidden.push(r.text));
        }).map(function(d) {
            return d.text;
        }), 
        this.index.columns = this.columns.map(function(d) {
            return d.text;
        });

        this.data.forEach(function(d, i) {

            if ( (context.index.rows.indexOf(d.label) & hidden.indexOf(d.label) ) === -1)
                context.rows.push(new Row($.extend({}, context.defaults.row, {text: d.label, highlight: true}))) && (added += context.index.rows.push(d.label) );

            Object.keys(d.values).forEach(function(k, i) {
                if (context.index.columns.indexOf(k) === -1)
                    context.columns.push(new Column($.extend({}, context.defaults.column, {text: k}))) && (added += context.index.columns.push(k) );

            });

        });
            
        return added;
            
    };
    
    vrt.Api.Table.prototype.update = function() {
        
        var e = this.event, 
            context = this, cell, label, values, save = 0, d;      
        
        if(!e){}
        else if (e.type === 'delete') {    
            
            if(e.filter && !e.path)
                e.affected.forEach(function(r) {
                   delete context.cellmap[r.label];
                });
            else if (!e.filter && e.path && e.path.length === 2 && e.path[0] === 'values') {
                for(var k in context.cellmap)
                    delete context.cellmap[k][e.path[1]];
            }
            
            this.reIndex();
        }
        else if (e.type === 'receive') {
                        
            label = e.data.label;
            values = e.data.values;
            
            for (var key in values) {
                
                if(cell = this.getCell(label, key)) {
                    
                    if(d = cell.__data__) {
                        
                         if(save = d.row.hide)
                            d.row.highlight = !(d.row.hide = false);
                    }
                    
                    if(save) return this.save();
                
                }
                else if(this.reIndex()) return this.resize();
                
            }
            
            
           
        }
        else if(this.reIndex()) return this.resize();

        return vrt.Api.DataSet.prototype.update.call(this);
    
    };
        
    vrt.Api.Table.prototype.getValue = function(label, key) {
        
        var y = this.data.map(function(d) {
            return d.label;
        }).indexOf(label);
        
        if (y > -1) {
            
            return this.data[y].values[key];
        }
    
    };
    
    vrt.Api.Table.prototype.getCell = function(label, key) {
        
        var x, cell, context = this;
        
        label = String(label);
        key = String(key);
        
        context.cellmap[label] = context.cellmap[label] || {};
        
        if(cell = this.cellmap[label][key])
            return cell;
        
        this.canvas
        .selectAll("g.column text.column")
        .each(function(d, i) {
            if (d.text === key)
                x = i;
        });
        
        this.canvas
        .selectAll("g.row text.row")
        .each(function(d, i) {
            
            if (d.text === label) {
                
                d3.select(this.parentNode)
                .selectAll(".cell")
                .each(function(d, i) {
                    if (i === x)
                        context.cellmap[label][key] = cell = this;
                });
            
            }
        });
        
        return cell;
    };
    
    vrt.Api.Table.prototype.draw = function() {
        
        if (!this.visible())
            return;
        
        var margin = this.dimensions.margin, 
            width = this.dimensions.width - (margin.left * 2) - margin.right, 
            height = this.dimensions.height - margin.top - margin.bottom, 
            svg = this.canvas.select("g"), 
            context = this;
        
        var s = this.scale, 
            x = s.x, 
            y = s.y;
        
        function row( rowObject ) {
            
            var cells = context.columns.map(function(d, i) {
                return {value: context.getValue(rowObject.text, d.text), column: d, row: rowObject};
            }), highlight;
            
            var i = 0;
            var cell = d3.select(this);
            var highlight = cell.select("rect.highlight");
            
            if(!highlight.node() && rowObject.highlight) {
                
                cell.insert("rect", ":first-child")
                .attr("width", function(d) {
                    return d3.max(x.range()) + x.rangeBand();
                })
                .attr("height", y.rangeBand())
                .classed("highlight", true);
            }
            else if (highlight.node() && !rowObject.highlight) highlight.remove();
            
            
            cell = cell.selectAll("g.cell")
            .data(cells);
            
            cell.each(function(d, i) {                
                d.column.fill(this, d.value);
            });
            
            cell = cell.enter()
            .append("g")
            .attr("clip-path", function(d) { return ('url(#' + d.column.clipPathUrl + ')');})
            .attr("class", "cell")
            .attr("transform", function(d) {
                
                var _i = i;
                
                i += d.column.width;
                
                return "translate(" + x(_i) + ")";
            
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .each(function(d) {
               context.cellmap[d.row.text] = context.cellmap[d.row.text] || {};
               context.cellmap[d.row.text][d.column.text] = this;
            });
                        
            cell.append("rect")
            .attr("width", function(d) {
                return x.rangeBand() * d.column.width;
            })
            .attr("height", y.rangeBand());
            
            if(rowObject.highlight)
                cell.classed("highlight", true);
            
            cell.append("text")
            .attr("class", "value")
            .attr("x", function(d) {
                return (d.column.width * x.rangeBand()) / 2
            })
            .attr("y", y.rangeBand() / 2)
            .attr("dy", ".42em")
            .attr("text-anchor", "middle")
            .style("fill", function(d) {
                return "#"+d.column.textColor;
            });
            
            cell.each(function(d) {
                d.column.fill(this, d.value);
            });
        };  
                
        x.domain(d3.range(
            context.columns.reduceRight(function(a, b) {
                return a + b.width
            }, 0))
        );
        
        y.domain(context.index.rows);
        
        svg.selectAll("defs")
        .data([null])
        .enter()
        .append("defs")
        .selectAll("clipPath")
        .data(context.columns)
        .enter()
        .append("clipPath")
        .attr("id", function(d) { return (d.clipPathUrl = ('clippath-' + context.id + '-' + d.text)); })
        .append("rect")
        .attr("width", function(d) {
            return x.rangeBand() * d.width;
        })
        .attr("height", y.rangeBand());

        // Rows
        
        var r = svg.selectAll("g.row")
                   .data(context.rows);
        
        r.each(row);
        
        r = r.enter()
        .append("g")
        .attr("class", "row")
        .attr("visibility", function(d) {
            return d.hide ? "hidden" : null;
        })
        .attr("transform", function(d, i) {
            return "translate(0," + y(d.text) + ")";
        })
        .each(row);
        
        (function() {
            
            var src, 
                dest;
            
            r.call(
            d3.behavior.drag()
            .on("dragstart", function() {
                
                d3.event.sourceEvent.stopPropagation();
                
                d3.select(d3.event.sourceEvent.srcElement)
                .each(function(d) {
                    src = d;
                });
            
            })
            .on("dragend", function() {
                
                d3.select(d3.event.sourceEvent.srcElement)
                .each(function(d) {
                    dst = d;
                });
                
                if (src instanceof Row && dst instanceof Row && src !== dst)
                    return move(context.rows, src, dst) && context.save();
            
            }));
        })();
        
        r.append("line")
        .attr("x2", width)
        .classed("highlight", function(d) {
            return d.highlight;
        });
        
        r.append("text")
        .attr("class", "row")
        .attr("x", -6)
        .attr("y", y.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .attr("fill", "#000000")
        .text(function(d, i) {
            return d.text;
        })
        .classed("highlight", function(d) {
            return d.highlight;
        })
        .on("click", axisOpt.bind(this));

        // Columns
        
        
        var i = 0;
        var c = svg.selectAll("g.column")
        .data(context.columns)
        .enter()
        .append("g")
        .attr("class", "column")
        .attr("transform", function(d) {
            
            var _i = i;
            
            i += d.width;
            
            return "translate(" + x(_i) + ")rotate(-90)";
        
        });
        
        (function() {
            
            var src, 
            dest;
            
            c.call(
            d3.behavior.drag()
            .on("dragstart", function() {
                
                d3.event.sourceEvent.stopPropagation();
                
                d3.select(d3.event.sourceEvent.srcElement)
                .each(function(d) {
                    src = d;
                });
            
            })
            .on("dragend", function() {
                
                d3.select(d3.event.sourceEvent.srcElement)
                .each(function(d) {
                    dst = d;
                });
                
                if (src instanceof Column && dst instanceof Column && src !== dst)
                    return move(context.columns, src, dst) && context.save();
            
            }));
        })();
        
        c.append("line")
        .attr("x1", -width);
        
        c.append("text")
        .attr("class", "column")
        .attr("x", 6)
        .attr("y", function(d) {
            return (x.rangeBand() * d.width) / 2
        })
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) {
            return d.text;
        })
        .on("click", axisOpt.bind(this));
    
    };
    
    function mouseover ( cellObject ) {
        d3.select(this.parentNode).select("text.row").classed("active", true);
        d3.selectAll(".column text").classed("active", function(d, i) {
            return cellObject.column.text == d.text;
        });
    };
    
    function mouseout () {
        d3.selectAll("text").classed("active", false);
    };
    
    function axisOpt ( obj ) {
        
            var title = obj.text,
                fid =  title.replace(" ", "-") + "-" + obj.constructor.name.toLowerCase() + "-form",
                context = this;
                
            $().w2form({
                    name:  fid,
                    style: 'border: 0px; background-color: transparent;',
                    fields: (function() {
                        
                        var fields = [];
                        
                        if (obj instanceof Column) 
                        {
                            
                            fields.push({
                                name: 'hideValue',
                                type: 'checkbox'
                            });
                            
                            fields.push({
                                name: 'dataType',
                                type: 'list',
                                options: {
                                    showNone : false,
                                    items: obj.dataTypes,
                                    value: obj.dataType
                                },
                                required: true
                            });
                            
                            fields.push({
                                name: 'precision',
                                type: 'int'
                            });
                            
                            fields.push({
                                name: 'dateFormat',
                                type: 'text'
                            });
                            
                            fields.push({
                                name: 'width',
                                type: 'list',
                                options: {
                                    showNone : false,
                                    items: d3.range(1, context.index.columns.length + 1).map(function(d) { return String(d) }),
                                    value: String(obj.width)
                                },
                                required: true
                            });
                            
                            fields.push({
                                name: 'colorScaleType',
                                type: 'list',
                                options : {
                                    showNone : false,
                                    items: obj.scaleTypes,
                                    value: obj.scaleType
                                }
                            });
                            
                            fields.push({
                                name: 'colorDomain',
                                type: 'text',
                                options : {
                                    items: obj.colorDomain.join(",")
                                }
                            });
                            
                            fields.push({
                                name: 'colorRange',
                                type: 'text',
                                options : {
                                    items: obj.colorRange.join(",")
                                }
                            });
                            
                            fields.push({
                                name: 'valueScaleType',
                                type: 'list',
                                options : {
                                    showNone : false,
                                    items: obj.scaleTypes,
                                    value: obj.scaleType
                                }
                            });
                            
                            fields.push({
                                name: 'valueDomain',
                                type: 'text',
                                options : {
                                    items: obj.valueDomain.join(",")
                                }
                            });
                            
                            fields.push({
                                name: 'valueRange',
                                type: 'text',
                                options : {
                                    items: obj.valueRange.join(",")
                                }
                            });
                            
                             fields.push({
                                name: 'textColor',
                                type: 'color',
                                required: true
                            });
                            
                        }
                        else if (obj instanceof Row) 
                        {
                            
                            fields.push({
                                name: 'highlight',
                                type: 'checkbox'
                            });
                            
                            fields.push({
                                name: 'hide',
                                type: 'checkbox'
                            });
                            
                        }
                        
                        return fields;
                        
                    })(),
                    record: obj,
                    actions: {
                        "save": function () {
                                                        
                            if(!this.validate().length) {
                                
                                $.extend(true, obj, this.record);
                                                                
                                context.reIndex();
                                context.save();
                                
                                pop.close();
                            }
                        },
                        "update view": function () {
                            
                            if(!this.validate().length) {
                                
                                $.extend(true, obj, this.record);
                                
                                context.reIndex();
                                context.resize();
                            }
                        },
                        "copy to": function () {
                            
                            if(!this.validate().length) {
                                
                                var msg = pop.message({ 
                                    html: ('<div id="' + fid +'-copy-to-message" style="width: 100%; height: 100%;"></div>'), 
                                    width: 350, 
                                    height: 400
                                });
                                
                                $('#w2ui-popup #'+fid +'-copy-to-message').w2render(fid +'-copy-to');
                                
                                w2ui[fid +'-copy-to'].resize();
                                
                            }
                        },
                        "to default" : function() {
                             if(!this.validate().length) {
                                 context.defaults[obj.constructor.name.toLowerCase()] = obj;
                             }
                        },
                        "delete" : function() {
                            
                            pop.close();
                            
                            if(obj instanceof Row) {
                                context.delete({label: obj.text});
                            }
                            else if(obj instanceof Column) {
                                context.delete("values."+obj.text);
                            }
                        }
                        
                    }
                });
                
                var items = context[obj.constructor.name.toLowerCase() + 's']
                                .map(function(d,i) {
                                    return {id: i, text: d.text, obj: d};
                                })
                                .filter(function(d) { 
                                    return d.text !== obj.text
                                }),
                    fields = w2ui[fid].fields.map(function(f,i) {
                             return {id: i, text: f.name};
                         });
        
                $().w2form({
                    name:  fid+'-copy-to',
                    style: 'border: 0px; background-color: transparent;',
                    header: 'Copy ' + obj.constructor.name.toLowerCase() + ' properties to',
                    fields: [
                        {
                            name: 'fields',
                            type: 'enum',
                            required: true,
                            options : {
                                items : fields,
                                max      : 0,
                                maxHeight: 100,
                                showAll   : false,
                                maxCache  : 5000

                            }
                        },
                        
                        {
                            name: 'to',
                            type: 'enum',
                            required: true,
                            options : {
                                items : items,
                                max      : 0,
                                maxHeight: 100,
                                showAll   : false,
                                maxCache  : 5000

                            }
                        }
                    
                    ],
                    record: {
                        fields : fields.map(function(d) { return $.extend({}, d); }),
                        to : items.map(function(d) { return $.extend({}, d); })
                    },
                    actions: {
                        
                        "copy": function () {
                                                       
                            if(!this.validate().length) {
                                
                                var filter_obj = {};
                                
                                (this.record.fields||[]).forEach(function(f) {
                                    filter_obj[f.text] = w2ui[fid].record[f.text];
                                });
                                                               
                                (this.record.to||[]).forEach(function(d){
                                    $.extend(true, d.obj, filter_obj);
                                });
                                                                
                                w2ui[fid].actions["update view"].call(w2ui[fid]);
                                
                                pop.message(); 
                            }
                        },
                        "cancel": function () {                            
                            pop.message();
                        }
                        
                    }
                });
                    
                var pop = $().w2popup('open', {
                    title	: ('Edit ' + obj.constructor.name + ' : "' +  title + '"'),
                    body	: ('<div id="'+fid+'" style="width: 100%; height: 100%;"></div>'),
                    style	: 'padding: 15px 0px 0px 0px',
                    width	: 640,
                    height	: 480, 
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
                        $().w2destroy(fid+'-copy-to');
                        $().w2destroy(fid);
                    }
                });       
    };
    

})();
