$.extend(vrt.Api.Matrix.prototype, vrt.Api.Matrix.prototype.__proto__, $.extend({}, vrt.Api.Matrix.prototype));

vrt.Api.Matrix.prototype.create = function() {
	
	var element = d3.select(this.element),
		margin = this.dimensions.margin,
		step = this.step;
		
	element
	  .append("svg")
	  .attr("class", "display")
	  .style("margin-left", this.dimensions.margin.left + "px");
	
	this.color = Math.round(Math.random() * 16777215);
};

vrt.Api.Matrix.prototype.onSave = function() {
	vrt.Api.DataSet.prototype.onSave.apply(this, arguments);
	return this.resize();
};

vrt.Api.Matrix.prototype.show = function() {
	vrt.Api.DataSet.prototype.show.apply(this, arguments);
};



vrt.Api.Matrix.prototype.resize = function() {
	
	var svg = d3.select(this.element).select("svg");
    
    var margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top,
        context = this;
    
    svg.selectAll("g").remove();

    (function(w, h, columns) {
      
          var rows, rw = (w / columns.length), rh, down;
          
          svg.style("cursor", "pointer").selectAll('g.column').data(columns).enter().append('g')
          .attr("class", function(d,i) { return "column x " + i; })
          .attr("transform", function(d,i) { return 'translate('+[i * (w / columns.length),0]+')';})
          .attr("data-x", function(d,i) { return i; })
          .selectAll("rect")
          .data(function(d) { rows = d.length; return d; })
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
          
          svg.on("mousemove", function(e) {
              
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
            
          });
          
          svg.on("mousedown", function() {
            down = true;
          });
          svg.on("mouseup", function() {
            down = false;
          });
      
     })(width, height, this.data);
	
	vrt.Api.DataSet.prototype.resize.call(this);
	
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
};