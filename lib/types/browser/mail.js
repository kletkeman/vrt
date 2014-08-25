define(['jquery', 'types/dataset', 'lib/types/base/mail', 'lib/api', 'd3', 'js/viewcontroller.contextmenu'], function($, DataSet, Mail, vrt, d3, contextmenu) {

    $.extend(Mail.prototype, Mail.prototype.__proto__, $.extend({}, Mail.prototype));
    
    var format = d3.time.format("%Y-%m-%d %H:%M:%S.%L");
                
    Mail.prototype.create = function() {
        
        var context = this, selection = d3.select(this.element);
        
        this.panes = {
            list  : selection.append("div").attr("class", "list pane")
        };
    };
    
    Mail.prototype.resize = function() {
        
        var margin  = this.dimensions.margin, 
            width   = this.dimensions.compensated.width, 
            height  = this.dimensions.compensated.height,
            context = this;
        
        this.panes.list.style({
            top: margin.top + 'px',
            left: margin.left + 'px',
            height: height + 'px'
        });
        
        return DataSet.prototype.resize.call(this);
    
    };
    
    Mail.prototype.update = function() {
        return DataSet.prototype.update.call(this);
    };
        
    Mail.prototype.draw = function() {
        
        if (!this.visible())
            return;
        
        var margin = this.dimensions.margin,
            width = this.dimensions.compensated.width,
            height = this.dimensions.compensated.height, 
            context = this;
        
        this.panes.list
        .selectAll("div.message")
        .data(this.data)
        .enter()
        .append("div")
        .attr("class", "message")
        .on("mouseover", function (d) {
            // Slide out a toolbar handle right side
        })
        .on("click", function (d) {
            
            var list = context.panes.list.node(), self = d3.select(this),
                selection;
            
            selection = d3.select(context.element)
              .selectAll(".reading");
            
            selection.selectAll("div").remove();
            
            selection.transition(100)
              .style({
                  'left' : width + 'px',
                  'width' : '0px'
              })
              .remove();
            
            d3.selectAll(".active")
              .classed("active", false);
            
            self = d3.select(context.element).append(function () { return self.classed("active", true), $.clone(self.node()); });
            
            self.classed("active", false)
                .classed("transition", true)
                .style({
                    opacity: 1,
                    top    : this.offsetTop + margin.top - list.scrollTop + 'px',
                    left   : this.offsetLeft + margin.left+ 'px',
                    width  : this.offsetWidth  + 'px',
                    height : this.offsetHeight  + 'px'
                })
                .transition(100)
                .ease("sin")
                .style({
                    left : list.offsetWidth + margin.left + 'px',
                     width  : width - list.offsetWidth + 'px'
                })
                .each('end', function () {

                    self.transition(100)
                        .ease("elastic")
                        .style({
                            top    : margin.top + 'px',
                           
                        })
                        .each('end', function () {

                            self.transition(100)
                            .ease("elastic")
                            .style({
                                height : height + 'px'
                            })
                            .each('end', function () {
                                
                                self
                                .classed("reading", true)
                                .append("div")
                                    .attr("class", "body")
                                    .text(function() { 
                                        return d.body; }).style("opacity", 0);
                                
                                self.selectAll("div")
                                    .transition(100)
                                    .style("opacity", 1);
                                
                            });

                        });
                });
            
        })
        .call(content);
    
    };
    
    function content (selection) {
        
        selection.append("div").attr("class", "from").text(function(d) {return d.from;});
        selection.append("div").attr("class", "subject").text(function(d) {return d.subject;});
        
    };
    
    return Mail;
    
});