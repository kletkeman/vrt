$.extend(vrt.Api.Bubbletrouble.prototype, vrt.Api.Bubbletrouble.prototype.__proto__, $.extend({}, vrt.Api.Bubbletrouble.prototype));

vrt.Api.Bubbletrouble.prototype.create = function() {
	
	var context = this;
	
	this.canvas = d3.select(this.element).append("svg");
	this.force = d3.layout.force()
	               .nodes(this.data)
				   .links([])
				   .charge(function(d, i) {
					   return d.warning ? -500 : context.charge( context.scalar(d.value) );
					});
					
	this.domain = this.domain || [0, 100, 300, 1000],
	this.range = this.range || ['green', 'orange', 'darkred'],
	this.shades = d3.scale.linear().domain(this.domain).range(this.range),
	this.scalar = d3.scale.log().domain([1, d3.max(this.domain)]).range([0, 1]);
	this.charge = d3.scale.linear().domain([0, 1]).range([0, -150]);
	
	this.force.start();
	
};

vrt.Api.Bubbletrouble.prototype.update = function(data) {
	
	var index = data.__cursor__;
	
	this.force.stop();
	
	if(data.warning) {
		data.x = data.px = Math.round(this.dimensions.width / 2),
		data.y = data.py = Math.round(this.dimensions.height / 2);
	}
	
	if(typeof index !== 'undefined') {
		for(var name in data)
			this.data[index][name] = data[name];
	}
	else 
		this.data.push(data);
	
	vrt.Api.DataSet.prototype.update.call(this);
};

vrt.Api.Bubbletrouble.prototype.resize = function() {
	
	var context = this,
		margin = this.dimensions.margin,
		width = this.dimensions.width,
		height = this.dimensions.height;
	
	this.canvas
		.attr('width', width)
		.attr('height', height);
		
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

vrt.Api.Bubbletrouble.prototype.r = function(d) { return function() { Math.round( Math.random() * d) }; };

vrt.Api.Bubbletrouble.prototype.draw = function() {

	var context = this,
		margin = this.dimensions.margin,
		width = this.dimensions.width,
		height = this.dimensions.height;
	
	if(!this.visible())
		return;
		
	this.force.stop();
	
	var nodes = this.canvas.selectAll("g")
					.data(this.data)
					.enter()
					.append("g")
					.attr("class", "node");
					  
					
	nodes.append("circle")
		 .attr({
			"cy" : this.r(height),
			"cx" : this.r(width)
	 	  })
	      .style("opacity", .75)
		  .on("click", function(d, i) { console.log(d,i); })
		  .call(this.force.drag);
	
	nodes.append("text")
		 .attr("text-anchor", "middle")
		 .attr("class", "node title")
		 .style("font", "8px sans-serif");
		
	nodes = this.canvas.selectAll("g.node").data(this.data);
	
	nodes.select("circle")
	     .transition().duration(100)
		 .attr({
			"fill" : function(d) { return d.warning ? 'red' : context.shades(d.value);},
			"r" : function(d, i) { 
				return Math.max(Math.round( ( Math.sqrt( (width * height) / context.data.length) * (d.warning ? 1 : context.scalar(d.value) ) ) / 2), 5)
			}
		  });
		
	nodes.select("text.node.title")
		 .text(function(d) {return d.name + ' : ' + (d.warning ? d.warning : (d.value + d.unit) ); })
		 .style("font-weight", function(d) { return d.warning ? 'bold' : 'normal';})
				
	this.force.on("tick", function() {
		
		var x = context.r(width),
			y = context.r(height);
	
	  	nodes.select("circle").attr("cx", function(d) { 
			return Math.round(d.x||x); 
		})
		.attr("cy", function(d) { 
			return Math.round(d.y||y); 
		});
	
		nodes.select("text.node.title").attr("x", function(d) { 
			return Math.round(d.x||x); 
			})
		    .attr("y", function(d) { 
				return Math.round((d.y||y) + 3); 
			});
	});


	this.force.start();
			
	
};
