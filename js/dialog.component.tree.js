define(['js/dialog.component', 'js/viewport', 'd3'], function (DialogComponent, ViewPort, d3) {
    
    function TreeView (options) {

        var context = this;
        var s, root,
            path = [], levels = [],
            viewport = new ViewPort();
        
        options = options || {};

        DialogComponent.call(this, options.style);
        
        options.data = options.data || {};
        
        levels.push( (root = d3.keys(options.data)) );
        root.leaf = options.data;
    
        s =
        this.element
             .append("div")
             .classed("container-fluid", true);
        
        function item (name) {
                
            var level, type, value, s;
                
            d3.select(this.parentNode).each(function (l) { level = l; });
                
            value = level.leaf[name];
            type  = typeof value;
                
            d3.select(this)
              .classed("active string boolean number object undefined", false)
              .classed(type, true);
                
            if(type !== "object") {
                value = [value];
            }
            else
                value = [];
                    
            s =
            d3.select(this);
            
            s.select("span.text").text(datum);
            
            s =
            s.selectAll("span.value")
            .data(value);
                    
            s.text(datum);
                    
            s.enter()
             .append("span")
             .classed("value", true)
             .text(datum);
                    
            s.exit().remove();
                
        }
        
        function levitate (s) {
            
            var l;
            
            s.style("height", function () {
                return this.parentNode.offsetHeight + "px";    
            });
            
            s =
            s.selectAll("li.item")
             .data(datum);
            
            s.each(item);
            
            l =
            s.enter()
             .append("li")
             .classed("item", true)
             .each(item)
             .on("click", function (name, i) {
                
                var level, leaf, item = this;
                
                d3.select(this.parentNode.nextSibling)
                  .each(function (l) { level = l; })
                  .selectAll("li.item");
                
                if(level) {
                    levels.splice(levels.indexOf(level));
                    path.splice(levels.length - 1);
                }
                
                d3.select(this.parentNode)
                  .each(function (l) { level = l; })
                  .selectAll("li.item");
                
                leaf = level.leaf[name];
                
                levels.push( (level = d3.keys(leaf)) );
                path.push(i);
                
                level.leaf = leaf;
                        
                viewport.multiply(levels.length)
                        .zoom(levels.length / 3)
                        .pan(1);
                
                context.refresh();
                
                context.emit("modified", levels, path);
                
             });
            
            l.append("span")
             .classed("text", true)
             .text(datum);
            
             l.append("span")
             .classed("glyphicon", true)
             
            
            s.exit().remove();
            
            
        }
                              
        function scrollHeight (element) { return element.scrollHeight; }
        
        function f (d) { return !!d;}
        
        function mark () {
            
            var p = path.slice(viewport.left, viewport.right);
            
            s.selectAll("ul.level")
             .each(function (d, i) {
                
                if(i < p.length)
                    p[i] = d3.select(this)
                      .select("li.item:nth-child("+(p[i]+1)+")")
                      .classed("active", true)
                      .node();
             });
            
            return p;
            
        }
        
        function refresh () {
            
            var context = this, l;
            
            l = 
            s.selectAll("ul.level")
             .data(levels.slice(viewport.left, viewport.right));
            
            l.call(levitate);
            
            l.enter()
             .append("ul")
             .classed("level", true)
             .classed("col-sm-4", true)
             .call(levitate);
            
            l.exit().remove();
            
            mark();
            
            viewport.multiply(null, d3.max(l[0].filter(f), scrollHeight))
                    .zoom( null, viewport.height / l.node().offsetHeight );
            
            return DialogComponent.prototype.refresh.call(this);
            
        }
        
        this.refresh = refresh;
        
        this.insert("scrollbar", {
            element : s.node(),
            style : {
                position : "absolute",
                top     : function () {
                    var node = s.node();
                    return node.offsetTop + node.offsetHeight + "px";
                },
                left : function () {
                    var node = s.node();
                    return node.offsetLeft + "px";
                },
                width   : function () {
                    var node = s.node();
                    return  node.offsetWidth + "px";
                }
            },
            position : viewport.position.left,
            size     : viewport.size.horizontal
        })
        .nest()
        .on("scroll", function (alpha) {  
            viewport.pan(alpha);
            context.refresh();
        });
        
        this.insert("scrollbar", {
            element : s.node(),
            style : {
                position : "absolute",
                top     : function () {
                    var node = s.node();
                    return node.offsetTop + "px";
                },
                left : function () {
                    var node = s.node();
                    return node.offsetLeft + node.offsetWidth + "px";
                },
                height   : function () {
                    var node = s.node();
                    return  node.offsetHeight + "px";
                }
            },
            position : viewport.position.top,
            size     : viewport.size.vertical
        })
        .nest()
        .on("scroll", function (alpha) {
            viewport.pan(null, alpha);
            s.selectAll("ul.level")
             .each(function () {
                this.scrollTop = viewport.top;
            });
            context.refresh();
        });

    }

    TreeView.prototype = new DialogComponent("tree");

    function datum (d) { return d; }

    return TreeView;

})