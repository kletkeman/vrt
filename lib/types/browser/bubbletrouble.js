$.extend(vrt.Api.Bubbletrouble.prototype, vrt.Api.Bubbletrouble.prototype.__proto__, $.extend({}, vrt.Api.Bubbletrouble.prototype));

vrt.Api.Bubbletrouble.prototype.create = function() {
	
	var context = this;
	
	this.canvas = d3.select(this.element).append("svg");
	this.force = d3.layout.force()
	               .nodes(this.data)
				   .links([])
				   .charge(function(d, i) {
					   return -35;
					});
	
};

vrt.Api.Bubbletrouble.prototype.update = function(data) {
	
	var index = data.__cursor__;
	
	if(typeof index !== 'undefined')
		for(var name in data)
			this.data[index][name] = data[name];
	else this.data.push(data);
	
	vrt.Api.DataSet.prototype.update.call(this);
};

vrt.Api.Bubbletrouble.prototype.resize = function() {
	
	var context = this,
		margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top - margin.bottom;
	
	this.canvas
		.attr('width', this.dimensions.width)
		.attr('height', this.dimensions.height);
		
	this.canvas.selectAll("g").remove();

	this.canvas
		.append("g")
		.attr("class", "title")
		.attr("transform", "translate(" + Math.round(margin.left / 2) + ", " + margin.top + ")")
		.append("text")
		.style('font','10px sans-serif')
		.attr("class", "title")
		.attr("text-anchor", "end")
		.attr("fill", "black")
		.attr("transform", "rotate(-90)")
		.text(this.title);
		
	this.force.size([width, height]);
};

vrt.Api.Bubbletrouble.prototype.draw = function() {

	var context = this;
	
	if(!this.visible())
		return;
		
	var nodes = this.canvas.selectAll("g")
					.data(this.data)
					.enter()
					.append("g")
					.attr("class", "node");
					
	var titles = nodes.append("text")
					  .text(function(d) {return d.name + ' : ' + d.value + d.unit;})
					  .attr("text-anchor", "middle")
					  .attr("class", "node title");
					  
					
		nodes.append("circle")
			 .attr({
				"fill" : "yellow",
				"r" : function(d, i) { return 10; }
			  })
			  .call(this.force.drag);
		
		nodes = this.canvas.selectAll("circle");
		titles = this.canvas.selectAll("text.node.title")
							.data(this.data)
							.style("font", "8px sans-serif");
				
		this.force.on("tick", function() {
		  	nodes.attr("cx", function(d) { return Math.round(d.x); })
			     .attr("cy", function(d) { return Math.round(d.y); });
			titles.attr("x", function(d) { return Math.round(d.x); })
			     .attr("y", function(d) { return Math.round(d.y + 3); });
		});


		this.force.start();
			
	
};
