$.extend(vrt.Api.Cubism.prototype, vrt.Api.Cubism.prototype.__proto__, $.extend({}, vrt.Api.Cubism.prototype));

vrt.Api.Cubism.prototype.create = function() {
	
	var element = d3.select(this.element),
		margin = this.dimensions.margin,
		step = this.step;
		
	Object.defineProperties(this, {
		step : {
			
			get : function() {
				return step;
			},
			
			set : function(value) {
				step = value;
				this.resize();
			}
			
		}
	});
	
	element
	  .append("div")
	  .attr("class", "display")
	  .style("margin-left", this.dimensions.margin.left + "px");
	
	
};

vrt.Api.Cubism.prototype.metric = function(d, i) {
	
	var context = this;
	
	return this.cubism_context.metric(
		
		function(start_, stop_, step, callback) {
			
			var data   = context.data[i];
			
			if(!data) {
				callback(null, []);
				return;
			}
			
			var	start  = +start_, stop = +stop_,
				length =  ( stop - start ) / step,
				values = new Array( length ),
				scale   = d3.scale.linear().domain([start, stop]).range([0, length]),
				x = data.length - 1, d = data[x], y;
				
			while(d && (d.timestamp >= start)) {
				
				y = Math.floor( scale(d.timestamp) );
				
				if(Array.isArray(values[y]))
					values[y].push(d.value);
				else
					values[y] = typeof values[y] !== 'undefined' ? [values[y], d.value] : d.value;
				
				d = data[--x];
			}
			
		    callback(null, values.map(function(d) { return Array.isArray(d) ? d3.median(d) : d; }) );
	
		}
	);
};

vrt.Api.Cubism.prototype.show = function() {
	
	var margin = this.dimensions.margin,
		height = this.dimensions.height;
		
	vrt.Api.DataSet.prototype.show.apply(this, arguments);
	
	d3.select(this.element).selectAll(".x.axis").style("top", function() {return -this.parentNode.clientHeight + height + "px";});
};

vrt.Api.Cubism.prototype.resize = function() {
	
	var context = this,
		margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top,
		element = d3.select(this.element).select("div.display");
	
	if(this.cubism_context)
		element
		.selectAll(".horizon")
		.call(this.cubism_context.horizon().remove)
		.remove();
		
	element
	    .attr("height", height + "px")
		.selectAll("div").remove();
		
	this.cubism_context = cubism.context()
						 .step(this.step)
						 .size(width)
						 .on("focus", function(i) {
						  	element
						      .selectAll(".value").style("right", i == null ? null : context.cubism_context.size() - i + "px");
						  });

	element
	  .selectAll(".x.axis")
	  .data(["bottom"])
	  .enter()
	  .append("div")
	  .attr("class", function(d) { return d + " x axis"; })
	  .each(function(d) { 
		d3.select(this)
		  .call(context.cubism_context.axis().ticks(12).orient(d));
	  });
	
	
	element
	  .append("div")
	  .attr("class", "rule")
	  .call(this.cubism_context.rule());
	
	vrt.Api.DataSet.prototype.resize.call(this);
	
};

vrt.Api.Cubism.prototype.draw = function() {

	if(!this.visible())
		return;
		
	var context = this,
		margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top,
		element = d3.select(this.element).select("div.display");
	
	element
	  .selectAll(".horizon")
	  .data(this.labels)
	  .enter()
	  .insert("div", ".bottom")
	  .attr("class", "horizon")
	  .style("width", width + "px")
	  .call(this.cubism_context.horizon()
							   .height( Math.max(Math.floor(height / this.labels.length), 30) )
							   .metric(this.metric.bind(this))
	  );
	
	if(this.visible())
		this.show();

};