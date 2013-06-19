$.extend(vrt.Api.Curve.prototype, vrt.Api.Curve.prototype.__proto__, $.extend({}, vrt.Api.Curve.prototype));
$.extend(vrt.Api.Curve.required, {
	data: Array
});

vrt.Api.Curve.prototype.create = function() {

	var context = this;
	this.canvas                  = d3.select(this.element).append('svg')
									 .on("dblclick", function() {
											context.resize.call(context);
								   	});
								
	this.color        		     = color = d3.scale.category10();
	this.dimensions.margin.right = 100;
	this.ymax = this.xmax = 0;

};

vrt.Api.Curve.prototype.resize = function() {
	
	var margin    = this.dimensions.margin,
	    width     = this.dimensions.width - margin.left - margin.right,
	    height    = this.dimensions.height - margin.top - margin.bottom,
		data      = this.data,
 		context   = this;
	
	this.canvas.selectAll('g').remove();
	
	var svg = this.canvas
	          .attr("width", this.dimensions.width)
	          .attr("height", this.dimensions.height)
	          .append("g")
	          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			  .style('font', '10px sans-serif');
	
	this.x = d3.time.scale()
	    			.range([0, width]),
	this.y = d3.scale.linear()
	    			.range([height, 0]);
	
	var xAxis = d3.svg.axis()
					  .scale(this.x)
					  .orient("bottom"),

		yAxis = d3.svg.axis()
					  .scale(this.y)
					  .orient("left");
					
	this.color.domain(this.labels);
	
	this.xmax = d3.max(data, function(d) { 
		return d3.max(d, function(d) {
			return d.timestamp;	
	});}) + (1000 * 60);
	
	this.x.domain([
		new Date(d3.min(data, function(d) { 
			return d3.min(d, function(d) {
				return d.timestamp;
			});})), 
		new Date(this.xmax)
	 ]);
	
	this.y.domain([
		0,
		d3.max(data, function(c) { 
			return d3.max(c, function(d) {
				
				if(d.value > context.ymax)
				 	context.ymax = d.value;
				
				return d.value; 
		} ); })
	]);

	svg.append("g")
	   .attr("class", "x axis")
	   .attr("transform", "translate(0," + height + ")")
	   .call(xAxis);

	svg.append("g")
	   .attr("class", "y axis")
	   .call(yAxis)
	   .append("text")
	   .attr("transform", "rotate(-90)")
       .attr("y", 6)
	   .attr("dy", ".71em")
	   .style("text-anchor", "end")
	   .text(this.title);
	
	svg.selectAll(".axis path, .axis line")
	   .style({
			'fill': 'none',
			'stroke': '#000',
			'shape-rendering': 'crispEdges'
		});
		
	svg.selectAll(".x.axis path")
		.style({
			'display' : 'none'
		});
		
	svg.selectAll(".line")
	   .style({			
		  'fill': 'none',
		  'stroke': 'steelblue',
		  'stroke-width': '1.5px'
		});
		
	var legend = svg.selectAll(".legend")
	      			.data(this.color.domain())
		    		.enter()
					.append("g")
		      		.attr("class", "legend")
		      		.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
		      .attr("x", this.dimensions.width - this.dimensions.margin.right + 18)
		      .attr("width", 18)
		      .attr("height", 18)
		      .style("fill", this.color);

		legend.append("text")
		      .attr("x", this.dimensions.width - this.dimensions.margin.right)
		      .attr("y", 9)
		      .attr("dy", ".35em")
		      .style("text-anchor", "end")
		      .text(function(d) { return d; });

	vrt.Api.DataSet.prototype.resize.call(this);
};

vrt.Api.Curve.prototype.onSave = function() {
	vrt.Api.DataSet.prototype.onSave.apply(this, arguments);
	this.resize();
};

vrt.Api.Curve.prototype.update = function(data) {
	
	var index = data.__cursor__,
		line = this.line();
	
	this.data[index] = this.data[index] || [];
	this.data[index].push(data);
	
	if(this.data[index].length > this.bufferSize) {
		
		for(var i=0,len=Math.round(this.bufferSize / 4);i<len;i++)
			this.data[index].shift();
			
		return this.resize();
	}
		
	if(this.ymax < data.value || this.xmax < data.timestamp)
		return this.resize();
		
	this.canvas.selectAll("path.line")
			   .data(this.data)
		       .attr("d", function(d) { 
					return line(d);
				});
				
	vrt.Api.DataSet.prototype.update.call(this);
};
	    
vrt.Api.Curve.prototype.draw = function() {

	if(!this.visible())
		return;
	
	var context = this,
		color   = this.color,
		line = this.line();
		
	var curve = this.canvas.select("g")
		.selectAll(".curve")
	    .data(this.data)
	    .enter()
	    .append("g")
	    .attr("class", "curve")
		.append("path")
	    .attr("class", "line")
	    .attr("d", function(d) { 
			return line(d); 
		})
	    .style("stroke", function(d, i) { 
			return context.color(context.labels[i]); 
		})
		.style("fill", "none");

};

vrt.Api.Curve.prototype.line = function() {
	
	var x = this.x,
		y = this.y;
		
	return d3.svg.line()
	    .interpolate("basis")
	    .x(function(d, i) { 
			return x(new Date(d.timestamp));
		})
	    .y(function(d) { 
			return y(d.value); 
		});
}

vrt.Api.Curve.prototype.tooltip = function(index) {
    	
    var curveIndex = Math.ceil(index * (1 / this.bufferSize)) - 1,
    	valueIndex = index - (curveIndex * this.bufferSize);

    return this.labels[curveIndex] + ' ( ' + Math.round(this.data[curveIndex][valueIndex]) + ' ) ';
};