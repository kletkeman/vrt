$.extend(vrt.Api.Table.prototype, vrt.Api.Table.prototype.__proto__, $.extend({}, vrt.Api.Table.prototype));

(function() {
        
    function Column(options) {
        
        this.text = String(options.text);
        
        var textColor = options.textColor ? String(options.textColor) : "000000",
            width     = Number.isFinite(options.width) ? options.width : 1,
            domain    = Array.isArray(options.domain) ? options.domain : [],
            range     = Array.isArray(options.range) ? options.range : [],
            scaleType = this.scaleTypes.indexOf(options.scaleType) > -1 ? String(options.scaleType) : 'linear',
            scale     = d3.scale[scaleType]();
        
        scale.domain(domain);
        scale.range(range);
        
        Object.defineProperties(this, {
            
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
            
            domain : {
                
                get : function() {
                    return domain;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        domain = value;
                    else {
                        domain = value.trim().length ? String(value).split(",").map(function(d) {return Number(d.trim()); }) : [];
                    }
                    
                    scale.domain(domain);
                },
                enumerable: true
            },
            
            range : {
                
                get : function() {
                    return range;
                },
                set : function(value) {
                    if(Array.isArray(value))
                        range = value;
                    else {
                        range = value.trim().length ? String(value).split(",").map(function(d) {return d.trim(); }) : [];
                    }
                    
                    scale.range(range);
                },
                enumerable: true
                
            },
            
            scaleType : {
                
                get : function() {
                    return scaleType;
                },
                set : function(value) {
                    if(this.scaleTypes.indexOf(value) > -1) {
                        
                        scaleType = value;
                        scale = d3.scale[value]();
                        
                        scale.domain(domain);
                        scale.range(range);
                    }
                },
                enumerable: true                
            }
        });
        
        this.fill = function(element, value) {
            
            var context = this;
            
            return d3.select(element).select("rect")
                    .style("fill", function(d) {
                        return (context.domain.length && context.range.length) && 
                            value !== undefined ? scale(typeof value === 'string' ? 
                                (Date.parse(value) || parseFloat(value)) : value) : "transparent";
                    });
        
        };
    
    };
    
    Column.prototype.scaleTypes = ['log', 'linear', 'quantize', 'quantile'];
    
    function Row(options) {
        
        this.text = String(options.text);
 
        var highlight = Boolean(options.highlight),
            hide = Boolean(options.hide);
        
        Object.defineProperties(this, {
            
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
    
    function value(v) {
            
        if(typeof v === "string" && Date.parse(v) )
            return (new Date(Date.parse(v))).toLocaleString();
        
        return v;
        
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
                context.save();
            });
        });
        
        this.index = {
            rows : [], 
            columns : []
        };
        
        $.extend(this.dimensions.margin, 
        {
            right: 10,
            left: 80,
            top: 80,
            bottom: 10
        });
    
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
                context.rows.push(new Row({text: d.label, highlight: true})) && (added += context.index.rows.push(d.label) );

            Object.keys(d.values).forEach(function(k, i) {
                if (context.index.columns.indexOf(k) === -1)
                    context.columns.push(new Column({text: k})) && (added += context.index.columns.push(k) );

            });

        });
            
        return added;
            
    };
    
    vrt.Api.Table.prototype.update = function() {
        
        var e = this.event, recv = (e && e.type === 'receive'), 
            context = this, cell, label, values, v;        
        
        if (recv) {
            
            label = e.data.label;
            values = e.data.values;
            
            var save = false;
            
            for (var key in values) {
                
                if (cell = this.getCell(label, key)) {
                    
                    v = values[key];
                    
                    d3.select(cell)
                    .each(function(d, i) {
                        
                        if(save = d.row.hide) {
                            d.row.highlight = !(d.row.hide = false);
                        }
                        else if(d.value !== v && (d.value = v) ) {
                            
                            d.column.fill(this, v);

                            d3.select(this)
                            .select("text.value")
                            .text(String(value(v)));
                        }
                        
                    });
                
                } 
                else if(this.reIndex()) return this.resize();
            
            }
            
            if(save) return this.save();
        }
        else if(this.reIndex()) return this.resize();

        return vrt.Api.DataSet.prototype.update.call(this);
    
    };
        
    vrt.Api.Table.prototype.getValue = function(label, key) {
        
        var y = this.data.map(function(d) {
            return d.label;
        }).indexOf(label);
        
        if (y > -1) {
            
            return value(this.data[y].values[key]);
        }
    
    };
    
    vrt.Api.Table.prototype.getCell = function(label, key) {
        
        var x, cell;
        
        label = String(label);
        key = String(key);
        
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
                        cell = this;
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
            });
            
            var i = 0;
            var cell = d3.select(this);
            
            if(rowObject.highlight) {
                
                cell.append("rect")
                .attr("width", function(d) {
                    return d3.max(x.range()) + x.rangeBand();
                })
                .attr("height", y.rangeBand())
                .classed("highlight", true);
            }
            
            cell = cell.selectAll("g.cell")
            .data(cells)
            .enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                
                var _i = i;
                
                i += d.column.width;
                
                return "translate(" + x(_i) + ")";
            
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
            
            cell.append("rect")
            .attr("width", function(d) {
                return x.rangeBand() * d.column.width;
            })
            .attr("height", y.rangeBand())
            .each(function(d) {
                d.column.fill(this.parentNode, d.value);
            });
            
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
            })
            .text(function(d) {
                return d.value;
            });
        };  
                
        x.domain(d3.range(
            context.columns.reduceRight(function(a, b) {
                return a + b.width
            }, 0))
        );
        
        y.domain(context.index.rows);

        // Rows
        
        var r = svg.selectAll("g.row")
        .data(context.rows)
        .enter()
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
                fid =  title.replace(" ", "-") + "-" + (typeof obj).toLowerCase() + "-form",
                context = this;
                
            var form = $().w2form({
                    name:  fid,
                    style: 'border: 0px; background-color: transparent;',
                    fields: (function() {
                        
                        var fields = [];
                        
                        if (obj instanceof Column) 
                        {
                            fields.push({
                                name: 'width',
                                type: 'list',
                                options: {
                                    showNone : false,
                                    items: d3.range(1, context.index.columns.length).map(function(d) { return String(d) }),
                                    value: String(obj.width)
                                },
                                required: true
                            });
                            
                            fields.push({
                                name: 'scaleType',
                                type: 'list',
                                options : {
                                    showNone : false,
                                    items: obj.scaleTypes,
                                    value: obj.scaleType
                                }
                            });
                            
                            fields.push({
                                name: 'domain',
                                type: 'text',
                                options : {
                                    items: obj.domain.join(",")
                                }
                            });
                            
                            fields.push({
                                name: 'range',
                                type: 'text',
                                options : {
                                    items: obj.range.join(",")
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
                                $.extend(obj, this.record);
                                context.reIndex();
                                context.save();
                                pop.close();
                            }
                        }
                    }
                });
                    
                var pop = $().w2popup('open', {
                    title	: ('Edit ' + obj.constructor.name + ' : "' +  title + '"'),
                    body	: ('<div id="'+fid+'" style="width: 100%; height: 100%;"></div>'),
                    style	: 'padding: 15px 0px 0px 0px',
                    width	: 350,
                    height	: 300, 
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
                        $().w2destroy(fid);
                    }
                });       
    };
    

})();
