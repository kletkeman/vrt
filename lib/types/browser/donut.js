$.extend(vrt.Api.Donut.prototype, vrt.Api.Donut.prototype.__proto__, $.extend({}, vrt.Api.Donut.prototype));

vrt.Api.Donut.prototype.create = function() {
	
	this.canvas = d3.select(this.element).append("svg");
	this.layout = d3.layout.pie().sort(null).value(function(d) { return d; }).value(function(d) { return d.value;});
	this.arc = d3.svg.arc();
	
	this.color = d3.scale.category20().domain(this.data.map(function(d) { return d.label; }));
};

vrt.Api.Donut.prototype.resize = function() {
	
	var margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top - margin.bottom,
		radius = Math.min(width-40, height-40) / 2,
		context = this;
	
	this.innerRadius = radius / 1.5
	this.outerRadius = radius - 10;
		
	this.arc.innerRadius(this.innerRadius).outerRadius(this.outerRadius);
	
	this.canvas
		.attr("height", height)
		.attr("width", width)
		.style({
			"font" : "10px sans-serif",
			"margin-top" : margin.top + "px",
			"margin-left" : margin.left + "px"
		})
		.selectAll("g").remove();
		
	this.canvas.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
		.append("g").attr("class", "display");
	
	
	vrt.Api.DataSet.prototype.resize.call(this);

};

vrt.Api.Donut.prototype.update = function() {
	
	var data = this.layout(this.data),
		g = this.canvas.select("g.display")
			.selectAll("g")
			.data(data),
		context = this;
	
	this.color.domain(this.data.map(function(d) { return d.label; }));
	
	var timeoutId = setTimeout(function() {
		vrt.Api.DataSet.prototype.update.call(context);
	}, 1000);
	
	this.rotateTo(data[0], 0, function() {
		
			g.select("path.arc")
			 .transition()
			 .attr("d", context.arc);

			g.select("text.value")
			 .attr("transform", function(d) { return "translate(" + context.arc.centroid(d) + ")"; })
			 .text(function(d) { return Math.round(d.value);});

			g.select("path.tp")
			 .attr("d", context.textPath());

			g.select("text.label")
			 .style("fill",  function(d) { return d3.rgb(context.color(d.data.label)).darker().toString(); })
			 .select(".tp")
			 .text(function(d) { return d.data.label; });
		
			clearTimeout(timeoutId);
		
		});
	
};

vrt.Api.Donut.prototype.rotateTo = function(d, i, callback) {
	
	var context = this;
	
	this.canvas.select("g.display")
		   .transition()
		   .attr("transform", "rotate(-"+(d.startAngle / 0.017453293)+")")
		   .each("end", function() {
				
				context.canvas.selectAll("text.value")
					   .transition()
					   .attr("transform", function() { 
							var t = d3.select(this).attr("transform");
						 	return  t.substr(0, t.indexOf(")") + 1) + " rotate(-"+(360 - (d.startAngle / 0.017453293))+")"; 
						})
						.each("end", function() {
							
							var data = context.layout(context.data);
								
							while(data[0].data.label !== d.data.label)
								data.unshift(data.pop());
							
							context.canvas.selectAll("path.tp")
									.data(data)
									.transition()
									.attr("d", context.textPath())
									.each("end", function() {
											
											context.canvas.selectAll("text.label")
												.data(data)
												.style("fill",  function(d) { return d3.rgb(context.color(d.data.label)).darker().toString(); })
												.select(".tp")
											 	.text(function(d) { return d.data.label; });
											
											if(typeof callback === 'function')
												callback();
										});
							});
			
			});
				
	
};

vrt.Api.Donut.prototype.textPath = function(s) {
	
	var context = this,
		x1  = s||0, x2 = s||0;
	
	return function(d, i) { 
  
   		var r = (i % 2 ? context.outerRadius + 2 + ( x1++ * 12 ) : context.innerRadius - 8 - ( x2++ * 12 )),
   	        arc = d3.svg.arc().innerRadius(r).outerRadius(r);

		d.arcLength = (2 * Math.PI * r * ( ( (d.endAngle - d.startAngle) / 0.017453293) / 360));
		
		return arc({
   	        endAngle: d.startAngle + (6.283185307179586 / 2),
   	        startAngle: d.startAngle
   		});
	};
	
};

vrt.Api.Donut.prototype.draw = function() {

	if(!this.visible())
		return;
		
	var context = this;
	
	var s = this.canvas.select("g.display")
			.selectAll("g")
			.data(this.layout(this.data))
			.enter();
			
	var g = s.append("g");
		
	g.append("path")
	 .attr("d", this.arc)
	 .attr("class", "arc")
	 .style({
		"fill" : function(d) { return context.color(d.data.label); },
		"stroke" : function(d) { return d3.rgb(context.color(d.data.label)).darker().toString(); },
		"stroke-width" : "1px"
	 })
	.on("click", context.rotateTo.bind(this))
	.on("mouseover", function(d) {
		d3.select(this).style("fill", d3.rgb(context.color(d.data.label)).brighter().toString());
	})
	.on("mouseout", function(d) {
		d3.select(this).style("fill", context.color(d.data.label));
	});
		
	g.append("text")
	 .attr("class", "value")
	 .attr("transform", function(d) { return "translate(" + context.arc.centroid(d) + ")"; })
	 .attr("text-anchor", "middle")
	 .text(function(d) { return Math.round(d.value);});
	
	var defs = g.append("defs"),
	
		textpath = g.insert("text", "defs")
	 				.attr("class", "label")
				    .attr("text-anchor", "start")
					.style("fill",  function(d) { return d3.rgb(context.color(d.data.label)).darker().toString(); })
			        .append("textPath")
					.attr("class", "tp")
					.attr("startOffset", "0%")	
					.text(function(d) { return d.data.label; });
	
	defs.append("path")
	 .attr("class", "tp")
	 .attr("d", this.textPath())
	 .attr("id", function(d, i) { return context.id + "P" + i;});
	
	textpath.attr("xlink:xlink:href", function(d, i) { return "#" + context.id + "P" + i;});

};