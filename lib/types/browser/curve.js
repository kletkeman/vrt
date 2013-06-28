$.extend(vrt.Api.Curve.prototype, vrt.Api.Curve.prototype.__proto__, $.extend({}, vrt.Api.Curve.prototype));
$.extend(vrt.Api.Curve.required, {
	data: Array
});

vrt.Api.Curve.prototype.create = function() {

	var context = this, element = d3.select(this.element);
	this.canvas                  = element.append('svg')
									 .on("dblclick", function() {
											context.resize.call(context);
								   	});
									
								
	element.append("div").attr("class", "rule").call(this.rule.bind(this));
								
	this.color        		     = color = d3.scale.category10();
	this.dimensions.margin.right = 100;
	this.ymax = this.xmax = 0;
	
	d3.select(this.element).select(".widget.title").remove();

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
	this.axis = {
		x : xAxis,
		y : yAxis
	};
			
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

vrt.Api.Curve.prototype.update = function() {
	
	var line = this.line(), xmax, ymax;
	
	for(var x = 0, len = this.data.length, reduced = false; x < len; x++)
		if(this.data[x] && (this.data[x].length > this.bufferSize)) {
		
			for(var i=0,len=Math.round(this.bufferSize / 4);i<len;i++)
				this.data[x].shift();
			
			reduced  = true;
			
		}
		
	if(reduced)
		return this.resize();
		
	ymax = d3.max(this.data, function(d) { return d3.max(d, function(d) { return d.value; }); });
	xmax = d3.min(this.data, function(d) { return d3.min(d, function(d) { return d.timestamp;}); });
		
	if(this.ymax < ymax || this.xmax < xmax)
		return this.resize();
		
	this.canvas.selectAll("path.line")
			   .data(this.data)
		       .attr("d", function(d) { 
					return line(d);
				});
				
	this.canvas.selectAll("circle.point")
			   .data(this.data)
		       .attr({
					"cx": function(d) { 
						return context.x(d.timestamp); 
					},
					"cy": function(d) { 
						return context.y(d.value); 
					}
				});
				
	this.color.domain(this.labels);
				
	vrt.Api.DataSet.prototype.update.call(this);
};
	    
vrt.Api.Curve.prototype.draw = function() {

	if(!this.visible())
		return;
	
	var context = this,
		color   = this.color,
		line = this.line();
		
	var g = this.canvas.select("g")
		.selectAll(".curve")
	    .data(this.data)
	    .enter()
	    .append("g")
	    .attr("class", "curve");
	
	g.append("path")
	 .attr("class", "line")
	 .attr("d", function(d) { 
		return line(d); 
	 })
	 .style("stroke", function(d, i) { 
	 	return context.color(context.labels[i]); 
   	 })
	.style("fill", "none");
	
	g.append("g")
	 .attr("class", "points")
	 .style({
		"fill": function(d, i) {
			return d3.rgb(context.color(context.labels[i])).darker().toString();
		},
		"display" : "none"
	 })
	 .selectAll("circle.point")
	 .data(function(d) { return d;})
	 .enter()
	 .append("circle")
	 .attr("class", "point")
	 .attr({
		"r": 1, 
		"cx": function(d) { 
			return context.x(d.timestamp); 
		},
		"cy": function(d) { 
			return context.y(d.value); 
		}
	  });

};

vrt.Api.Curve.prototype.line = function() {
	
	var x = this.x,
		y = this.y;
		
	return d3.svg.line()
	    .interpolate("basis")
	    .x(function(d, i) {
		 	d.point = d.point || {};
			return (d.point.x = x(new Date(d.timestamp)));
		})
	    .y(function(d) {
			d.point = d.point || {};
			return (d.point.y = y(d.value)); 
		});
};

vrt.Api.Curve.prototype.rule = function(selection) {
	
	var context = this;
	
	selection.append("div")
	 .attr("class", "crosshair horizontal");
	
	selection.append("div")
	 .attr("class", "crosshair vertical");
	
	selection.selectAll(".crosshair")
	 .style("display", "none");
			
	this.canvas
	    .on("mouseover", context.focusRule(selection))
	    .on("mousemove", context.ruleXY(selection))
		.on("mouseout", context.hideRule(selection));
		
};

vrt.Api.Curve.prototype.ruleXY = function(selection) {
	
	var context = this,
		margin  = this.dimensions.margin,
		py, px, xf = d3.time.format("%I:%M:%S %p"), yf = d3.format(",.6r");
	
	return function() {
		
		context.canvas.selectAll("g.points")
		       .style("display", null);
		
		selection.select(".horizontal").style("top", d3.event.y + "px");
		selection.select(".vertical").style("left", d3.event.x + "px");
		
		px = d3.event.x - margin.left - context.element.offsetLeft;
		py = d3.event.y - margin.top - context.element.offsetTop;
		
		context.axis.rule_xtick
			.style("display", null)
			.attr("x", px)
			.text( xf(context.x.invert(px)) );
			
		var t = context.axis.rule_ytick
			.style("display", null)
			.attr("y", py)
			.text( yf( context.y.invert(py), 1 ) ),
			w;
			
		if(t && (w = t.node().getComputedTextLength() + 9) > context.dimensions.margin.left)
			context.dimensions.margin.left = w + 1;
		
		
		var dx = context.axis.rule_xtick.node().getComputedTextLength() + 6,
			dy = context.axis.rule_ytick.node().getExtentOfChar("0").height + 6;
        
		context.canvas.select(".x.axis")
			   .selectAll("text")
			   .style("fill-opacity", function(d) { 
					return Math.abs(context.x(d) - px) < dx ? 0 : 1; 
				});
		
		context.canvas.select(".y.axis")
		        .selectAll("text")
			    .style("fill-opacity", function(d) { 
					return Math.abs(context.y(d) - py) < dy ? 0 : 1; 
				});
	};
};

vrt.Api.Curve.prototype.focusRule = function(selection) {
	
	var context = this;
	
	return function() {
		
		var gx = context.canvas.select(".x.axis"),
			gy = context.canvas.select(".y.axis");
		
		if (!context.axis.rule_xtick) 
		  	 context.axis.rule_xtick = d3.select(gx.node().appendChild(gx.selectAll("text").node().cloneNode(true)))
	             .style("display", "none")
	             .text("null");
	
		if (!context.axis.rule_ytick) 
			 context.axis.rule_ytick = d3.select(gy.node().appendChild(gy.selectAll("text").node().cloneNode(true)))
	             .style("display", "none")
   	             .text("null");
	
		selection.selectAll(".crosshair").style("display", "block");
	};
	
};

vrt.Api.Curve.prototype.hideRule = function(selection) {
	
	var context = this;
	
	return function() {
		
		context.canvas.selectAll("g.points")
		       .style("display", "none");
		
		selection.selectAll(".crosshair")
		         .style("display", "none");
		
		d3.selectAll([context.axis.rule_xtick.node(), context.axis.rule_ytick.node()])
		  .style("display", "none");
		
        context.canvas.selectAll(".x.axis, .y.axis")
			.selectAll("text")
			.style("fill-opacity", null);
	};
};

vrt.Api.Curve.prototype.tooltip = function(index) {
    	
    var curveIndex = Math.ceil(index * (1 / this.bufferSize)) - 1,
    	valueIndex = index - (curveIndex * this.bufferSize);

    return this.labels[curveIndex] + ' ( ' + Math.round(this.data[curveIndex][valueIndex]) + ' ) ';
};

vrt.Api.Curve.prototype.show = function() {
	
	var context = this, values = [], max;
	
	vrt.Api.DataSet.prototype.show.apply(this, arguments);
	
	this.canvas.selectAll(".y.axis g.tick text")
	   .each(function() { 
			values.push(this.getComputedTextLength() + 9); 
		});
		
	max = d3.max(values);
	
	if( max > this.dimensions.margin.left) {
		this.dimensions.margin.left = max + 1;
	}
};