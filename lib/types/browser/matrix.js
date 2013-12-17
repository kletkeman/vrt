$.extend(vrt.Api.Matrix.prototype, vrt.Api.Matrix.prototype.__proto__, $.extend({}, vrt.Api.Matrix.prototype));

vrt.Api.Matrix.prototype.create = function() {
	
	var element = d3.select(this.element),
		margin = this.dimensions.margin,
		step = this.step, down, context = this;
		
	element
	  .append("svg")
	  .attr("class", "display")
	  .style("margin-left", this.dimensions.margin.left + "px")
      .on("mousemove", function(e) {
              
            var x = d3.event.target.parentNode.getAttribute("data-x"),
                y = d3.event.target.getAttribute("data-y");
            
            if(down && x!==null&&y!==null) {
             
              d3.select(d3.event.target)
              .attr("fill", function(d) {
                  
                 var   r = (context.color & (255 << 16)) >> 16,
                       g = (context.color & (255 << 8)) >> 8,
                       b = context.color & 255;
                  
                  context.write({R: r, G: g, B: b, x: Number(x), y: Number(y)});
                  
                  return 'rgb(' + [r,g,b].join(",") + ')';
                  
              });
            }
            
          })
          .on("mousedown", function() {
            down = true;
          })
          .on("mouseup", function() {
            down = false;
          });
	
	this.color = Math.round(Math.random() * 16777215);
};

vrt.Api.Matrix.prototype.update = function() {
    
    var svg = d3.select(this.element).select("svg"),
        margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top,
        context = this;
    
    (function(w, h, columns) {
      
          var rows = context.size[1], rw = (w / columns.length), rh, down;
          
          svg.style("cursor", "pointer")
          .selectAll('g.column')
          .data(columns)
          .enter()
          .append('g')
          .attr("class", function(d,i) { return "column x " + i; })
          .attr("transform", function(d,i) { return 'translate('+[i * (w / columns.length),0]+')';})
          .attr("data-x", function(d, i) { return i; })
          .selectAll("rect")
          .data(function(d) { return d; })
              .enter()
              .append("rect")
              .attr({
                x: function(d) {
                  return 0;
                }, 
                y: function(d, i) { 
                  return i * (h / rows);
                },
                width: function() { 
                  return rw-1; 
                }, 
                height: function() { 
                  return (rh = (h / rows))-1; 
                },
                fill: function(d) { return 'rgb(' + [d.R,d.G,d.B].join(",") + ')'; }
              })
            .attr("data-y", function(d,i) { return i; })
            .attr("class", function(d,i) { return "row y " + i; });
      
     })(width, height, this.data);
    
    return vrt.Api.DataSet.prototype.update.apply(this, arguments);

};

vrt.Api.Matrix.prototype.resize = function() {
	
    vrt.Api.DataSet.prototype.resize.call(this);
    
	d3.select(this.element)
    .select("svg")
    .selectAll("g")
    .remove();

    return this.update();	
	
};

vrt.Api.Matrix.prototype.fill = function(x, y, d) {
    var svg = d3.select(this.element).select("svg");
    svg.selectAll('g.column').each(function(_, X) {
        if(X === x)
            d3.select(this).selectAll('rect.row').each(function(_, Y) {
                if(Y === y)
                    d3.select(this)
                    .attr("fill", "rgb("+[d.R, d.G, d.B].join(',')+')');
            });
    });
    
};

vrt.Api.Matrix.prototype.draw = function() {
    if(this.event && this.event.type === 'receive')
        return this.fill(this.event.x, this.event.y, this.event.data);
    else if(this.event && this.event.type === 'show')
        ;
};