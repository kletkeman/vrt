$.extend(vrt.Api.Messages.prototype, vrt.Api.Messages.prototype.__proto__, $.extend({}, vrt.Api.Messages.prototype));
$.extend(vrt.Api.Messages.required, {
	data: Array
});

vrt.Api.Messages.prototype.shades = function() {
	this.shades = d3.scale.linear().domain([this.min, this.max]).range(['lightgrey', 'steelblue']);
	this.opacity = d3.scale.linear().domain([this.min, this.max]).range([.5, 1.0]).nice();
};

vrt.Api.Messages.prototype.create = function() {
	
	var context = this;
	
	this.min = d3.min(this.data, function(d) { return d.timestamp;}),
	this.max = d3.max(this.data, function(d) { return d.timestamp;});
	
	vrt.Api.Messages.prototype.shades.call(this);
	
	d3.select(this.element)
	  .style('font-family', this.fontFamily)
	  .style('font-size', this.fontSize);
	
	this.canvas = d3.select(this.element).append('svg')
					.on('mouseover', function() {
						context.__focused__ = true;
	   				})
	   				.on('mouseout', function() {
						context.__focused__ = false;
	   				})
	
	this.__index__ = 0;
	this.__focused__ = false;
	
	// Display red squares for 10 seconds if mouse is not over canvas
	
	setInterval(function() {
		
		if(!context.visible() || context.__focused__)
			return;	
		else if(context.__index__ >= context.data.length)
			context.__index__ = 0;
			
		context.canvas.select("g.squares")
		    .selectAll("rect.square")
		    .each(function(d, i) {
			
					if(i == context.__index__)
						if(d3.select(this).style("fill") === '#8b0000')
							context.click.call(context, i).call(this, d, i);
						else
							context.__index__++;
			});
			
		
		context.__index__++;
			
	}, 5000);
	
};

vrt.Api.Messages.prototype.resize = function() {
	
	var margin = this.dimensions.margin,
		height = this.dimensions.height - margin.top - margin.bottom,
		width = this.dimensions.width - margin.left - margin.right,
		context = this;
	
	this.area = {
		area: height * width,
		width: width,
		top : {
			height : Math.round(height / 3)
		}
	};
	this.area.bottom = {
			height: this.area.top.height * 2
	};
	
	this.square = {
		sqrt: Math.sqrt(  (this.area.area / 3) / this.bufferSize ),
		y: function(index) { return Math.floor(index / this.columns); },
		x: function(index) { return index % this.columns; }
	};
	 
	this.square.width = this.square.height = Math.floor(this.square.sqrt);
	this.square.columns = Math.floor(this.area.width / this.square.width);
	this.square.rows = Math.floor(this.area.top.height / this.square.height);
	
	this.canvas
		.attr('width', this.dimensions.width)
		.attr('height', this.dimensions.height)
		.selectAll('text')
		.style({
			'width': this.dimensions.width
	 	});
	
	this.canvas.selectAll("g").remove();
		
	this.canvas.append("g")
	.attr("transform", "translate("+margin.left+", "+margin.top+")")
	.attr("class", "squares");
	
	this.canvas.append("g")
	.attr("transform", "translate("+margin.left+", "+(margin.top+context.area.top.height)+")")
	.attr("class", "view")
	.append("foreignObject")
	.attr({
		"width" : this.area.width,
  		"height" : this.area.bottom.height
	})
	.append("xhtml:div")
	.attr("class", "viewer")
	.style({
		"padding" : this.square.width + "px",
		"color" : "steelblue"
	});

	vrt.Api.DataSet.prototype.resize.call(this);
};

vrt.Api.Messages.prototype.update = function() {
	
	var context = this, max, min, reduced = false;
		
	if(this.data.length >= this.bufferSize) {
		for(var i=0,len=this.square.columns+(this.data.length-this.bufferSize)-1;i<len;i++) {
			this.data.shift();
			this.canvas.select('rect.square').each(context.close.call(context, null)).remove();
			!this.__index__||this.__index__--;
		}
		reduced = true;
	}
	
	max = d3.max(this.data, function(d) { return d.timestamp; });
	min = d3.min(this.data, function(d) { return d.timestamp; });
	
	this.shades.domain([min, max]),
	this.opacity.domain([min, max]);
		
	if(max > this.max || min < this.min) {

		this.max = max;
		this.min = min;

		vrt.Api.Messages.prototype.shades.call(this);
	}
	
	if(reduced) {
		
		this.canvas.select("div.viewer")
					  .selectAll("p").remove();
					
		this.canvas.selectAll('rect.square')
			.on("click", this.click.call(this))
			.style("fill", function(d) { return d.seen ? context.shades(d.timestamp) : '#8b0000'})
			.style("opacity", function(d) { return context.opacity(d.timestamp); })
			.transition().ease("elastic").duration(100)
			.each('end', function() {vrt.Api.DataSet.prototype.update.call(context);})
			.attr("x", function(d, i) { return context.square.x(i) * context.square.width; })
			.attr("y",function(d, i) { return context.square.y(i) * context.square.height; })
			.attr({
				"width": this.square.width - 2,
				"height": this.square.height - 2
			});
		
	}
	else
		vrt.Api.DataSet.prototype.update.call(this);
};

vrt.Api.Messages.prototype.draw = function() {

	if(!this.visible())
		return;
	
	var margin = this.dimensions.margin,
		height = this.dimensions.height - margin.top - margin.bottom,
		width = this.dimensions.width - margin.left - margin.right,
		context = this;
	
	 this.canvas.select("g.squares")
	   			.selectAll("rect.square")
			   .data(this.data)
			   .style({
					"fill" : function(d) { return d.seen ? context.shades(d.timestamp) : '#8b0000';},
					"opacity" : function(d) { return context.opacity(d.timestamp); }
					
				})
			   .enter()
			   .append("rect")
			   .attr({
				    "class" : "square",
					"width": this.square.width - 2,
					"height": this.square.height - 2
				})
				.attr("x", function(d, i) { return context.square.x(i) * context.square.width; })
				.attr("y",function(d, i) { return context.square.y(i) * context.square.height; })
				.style({
					"opacity" : function(d) { return context.opacity(d.timestamp); },
					"fill" : function(d) { return d.seen ? context.shades(d.timestamp) : '#8b0000';}
				})
				.on('mouseover', function(d, i) {
					
					if( d3.select(this).attr("width") == (context.square.width - 2) )
						d3.select(this)
						.transition()
						.duration(100)
						.style({
							"opacity" : 1.0
						});
				})
				.on('mouseout', function(d, i) {
					
					if( d3.select(this).attr("width") == (context.square.width - 2) )
						d3.select(this)
						.transition()
						.duration(100)
						.style({
							"opacity" : function(d) { return context.opacity(d.timestamp); }
						});
				})
				.on('click', this.click.call(this));
			   
};

vrt.Api.Messages.prototype.click  = function(original_index) {
	
	var context = this;
	
	return function(d, i) {
		
		if(d3.event && d3.event.type === 'click' && !d.seen) {
			d.seen = true;
			context.write(d);
		}
			
		context.canvas.selectAll("rect.square")
		.each(function(d, i) {
			if(d3.select(this).attr("class").indexOf("open") > -1)
				this.__onclick(d, i);
		});
		
  		d3.select(this)
		.classed("open", true)
		.on("click", context.close.call(context, this, typeof original_index !== 'undefined' ? original_index : i))
  		.transition().ease("elastic")
  		.duration(300)
  		.attr("y", ( (context.square.rows + 1 ) * context.square.height))
  		.attr("x", 0)
  		.attr("width", ( context.square.columns * context.square.width))
  		.attr("height", context.area.bottom.height)
		.each('end', function(d, i) {
			
			var viewer = context.canvas.select("div.viewer"),
				r_shades = context.shades.copy().range(["whitesmoke", "black"]);
			
			viewer.style("color", d3.select(this).style("fill") === '#8b0000' ? "whitesmoke" : r_shades(d.timestamp));
			viewer.append("p")
			.style({
				"font-size" : "larger",
				"font-weight" : "bold"
			})
			.text(d.title);
			
			viewer.append("p")
			.style({
				"font-size" : "smaller",
				"text-align" : "right"
			})
			.text( d3.time.format("%c")( new Date(d.timestamp) ) ) ;
			
			viewer.append("p").text(d.text);
		});
	};
	
};

vrt.Api.Messages.prototype.close = function(element, original_index) {
	
	var context = this,
		element = element;
	
	return function(d) {
		
		if(d3.event && d3.event.type === 'click' && !d.seen) {
			d.seen = true;
			context.write(d);
		}
		
		context.canvas.select("div.viewer")
					  .selectAll("p").remove();
		
		d3.select(element)
			.classed("open", false)
			.on("click", context.click.call(context, original_index))
			.transition().ease("elastic")
		  	.duration(300)
			.attr({
				"width": context.square.width - 2,
				"height": context.square.height - 2
			})
			.style("opacity", function(d) { return context.opacity(d.timestamp); })
			.attr("x", context.square.x(original_index) * context.square.width)
			.attr("y",context.square.y(original_index) * context.square.height);
			
	};
};

