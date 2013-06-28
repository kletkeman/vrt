$.extend(vrt.Api.Graph.prototype, vrt.Api.Graph.prototype.__proto__, $.extend({}, vrt.Api.Graph.prototype));

vrt.Api.Graph.prototype.create = function() {
	
	var context = this;
	this.canvas = d3.select(this.element).append('svg')
					.on("dblclick", function() {
						delete context.max;
						context.resize.call(context);
						});
	this.color  = d3.scale.category10().domain(this.labels);
	this.dimensions.margin.right = 100;
	
	d3.select(this.element).select(".widget.title").remove();

};

vrt.Api.Graph.prototype.resize = function() {

	var margin = this.dimensions.margin,
    	width = this.dimensions.width - margin.left - margin.right,
    	height = this.dimensions.height - margin.top - margin.bottom,
    	data = this.data;

	this.canvas.selectAll('g').remove();
	
	this.canvas
		.attr('width', this.dimensions.width)
		.attr('height', this.dimensions.height)
		.style('font', '10px sans-serif');
	
	this.x0 = this.x = d3.scale.ordinal()
				.domain(data.map(function(d) { return d.name; }))	
	    		.rangeRoundBands([0, width], .1);
	
	this.x1 = d3.scale.ordinal()
				.domain(this.labels)
				.rangeRoundBands([0, this.x0.rangeBand()]);
	
	this.y = d3.scale.linear()
	    .range([height, 0]);
	
	var xAxis = d3.svg.axis()
	    .scale(this.x0)
	    .orient("bottom"),

	    yAxis = d3.svg.axis()
	    .scale(this.y)
	    .orient("left");
	
	this.axis = {
		x : xAxis
	}
	
	this.y.domain([0, this.max||(this.max=d3.max(data, function(d) { return d3.max(d.values); }))]);

	var svg = this.canvas
				  .append('g')
				  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	svg .append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg .append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text(this.title);


	var legend = this.canvas.selectAll(".legend")
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
	
	if(this.visible())
		this.show();

	vrt.Api.DataSet.prototype.resize.call(this);

};

vrt.Api.Graph.prototype.update = function() {

	var height = this.dimensions.height - this.dimensions.margin.top - this.dimensions.margin.bottom,
		x1 = this.x1,
		color = this.color,
		y =  this.y,
		labels = this.labels;
	
	if(d3.max(this.data, function(d) { return d3.max(d.values) ; }) > this.max) {
		delete this.max;
		return this.resize();
	}
	
	this.canvas.selectAll("g.bar")
	    .data(this.data)
	    .each(function(d, i) {
			
	    	d3.select(this)
			  .selectAll("rect")
			  .data(d.values)
			  .enter()
			  .append("rect")
			  .style('fill', function(d, i) { return color(labels[i]); })
			  .style('fill-opacity', .9)
			  .attr("x", function(d, i) { return x1(labels[i]); })
			  .attr("width", x1.rangeBand());
					
			d3.select(this)
			  .selectAll("rect")
			  .transition()
			  .duration(100)
			  .attr("y", function(d) { return y(d); })
			  .attr("height", function(d) { return height - y(d); });
					  
		});
		
	vrt.Api.DataSet.prototype.update.call(this);

};

vrt.Api.Graph.prototype.draw = function() {

	if(!this.visible())
		return;

	var margin = this.dimensions.margin,
    	width = this.dimensions.width - margin.left - margin.right,
    	height = this.dimensions.height - margin.top - margin.bottom,
    	data = this.data,
		context = this,

    	x = this.x0,
        x1 = this.x1,
		y = this.y,
		labels = this.labels;

	var c = this.canvas.select('g')
	    .selectAll(".bar")
	    .data(data)
	    .enter()
		.append("g")
		.attr("class", "bar")
		.attr("transform", function(d) { return "translate(" + x(d.name) + ", 0)"; });
		
		
	   c.selectAll("rect")
	 	.data(function(d) { return d.values; })
		.enter()
		.append("rect")
	    .style('fill', function(d, i) { return context.color(labels[i]); })
	    .style('fill-opacity', .9)
	    .attr("x", function(d, i) { return x1(labels[i]); })
	    .attr("width", x1.rangeBand())
	    .attr("y", function(d) { return y(d); })
	    .attr("height", function(d) { return height - y(d); });


};

vrt.Api.Graph.prototype.show = function() {
	vrt.Api.Curve.prototype.show.apply(this, arguments);
};

