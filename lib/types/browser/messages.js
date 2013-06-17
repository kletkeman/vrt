$.extend(vrt.Api.Messages.prototype, vrt.Api.Messages.prototype.__proto__);
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
	  .style('font-size', this.fontSize)
	  .style('overflow', 'auto');
	
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
	/*
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
	
	var q =  [

		"Any intelligent fool can make things bigger, more complex, and more violent. It takes a touch of genius -- and a lot of courage -- to move in the opposite direction.",
		"Imagination is more important than knowledge.",
		"Gravitation is not responsible for people falling in love.",
		"I want to know God's thoughts; the rest are details.",
		"The hardest thing in the world to understand is the income tax.",
		"Reality is merely an illusion, albeit a very persistent one.",
		"The only real valuable thing is intuition.",
		"A person starts to live when he can live outside himself.",
		"I am convinced that He (God) does not play dice.",
		"God is subtle but he is not malicious.",
		"Weakness of attitude becomes weakness of character.",
		"I never think of the future. It comes soon enough.",
		"The eternal mystery of the world is its comprehensibility.",
		"Sometimes one pays most for the things one gets for nothing.",
		"Science without religion is lame. Religion without science is blind.",
		"Anyone who has never made a mistake has never tried anything new.",
		"Great spirits have often encountered violent opposition from weak minds.",
		"Everything should be made as simple as possible, but not simpler.",
		"Common sense is the collection of prejudices acquired by age eighteen.",
		"Science is a wonderful thing if one does not have to earn one's living at it.",
		"The secret to creativity is knowing how to hide your sources.",
		"The only thing that interferes with my learning is my education.",
		"God does not care about our mathematical difficulties. He integrates empirically.",
		"The whole of science is nothing more than a refinement of everyday thinking.",
		"Technological progress is like an axe in the hands of a pathological criminal.",
		"Peace cannot be kept by force. It can only be achieved by understanding.",
		"The most incomprehensible thing about the world is that it is comprehensible.",
		"We can't solve problems by using the same kind of thinking we used when we created them.",
		"Education is what remains after one has forgotten everything he learned in school.",
		"The important thing is not to stop questioning. Curiosity has its own reason for existing.",
		"Do not worry about your difficulties in Mathematics. I can assure you mine are still greater.",
		"Equations are more important to me, because politics is for the present, but an equation is something for eternity.",
		"If A is a success in life, then A equals x plus y plus z. Work is x; y is play; and z is keeping your mouth shut.",
		"Two things are infinite: the universe and human stupidity; and I'm not sure about the the universe.",
		"As far as the laws of mathematics refer to reality, they are not certain, as far as they are certain, they do not refer to reality.",
		"Whoever undertakes to set himself up as a judge of Truth and Knowledge is shipwrecked by the laughter of the gods.",
		"I know not with what weapons World War III will be fought, but World War IV will be fought with sticks and stones.",
		"In order to form an immaculate member of a flock of sheep one must, above all, be a sheep."
	];
	
	var context = this;
	setInterval(function() {
		var v = {text: q[Math.floor(Math.random()*q.length)]};
		v.title = v.text.substr(0, 10) + "...";
		context.write(v, function(err) { err && console.error(err);})
	}, Math.round(Math.random() * 60000));*/
	
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
	this.square.columns = Math.ceil(this.area.width / this.square.width);
	this.square.rows = Math.ceil(this.area.top.height / this.square.height);
	
	this.canvas
		.attr('width', this.dimensions.width)
		.attr('height', this.dimensions.height)
		.selectAll('text')
		.style({
			'width': this.dimensions.width
	 	});
	
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

vrt.Api.Messages.prototype.update = function(data) {
	
	var context = this,
		index = data.__cursor__;
	
	if(typeof index !== 'undefined') {
		delete data.__cursor__;
		this.data[index] = data;
	}
	else
		this.data.push(data);
		
	if(this.data.length > this.bufferSize) {
		
		for(var i=0,len=this.square.columns-1;i<len;i++) {
			this.data.shift();
			this.canvas.select('rect.square').each(context.close.call(context, null)).remove();
			!this.__index__||this.__index__--;
		}
		
	if(data.timestamp > this.max || data.timestamp < this.min) {

		this.max = data.timestamp > this.max ? data.timestamp : this.max;
		this.min = data.timestamp < this.min ? data.timestamp : this.min;

		vrt.Api.Messages.prototype.shades.call(this);
	}
		
	this.canvas.select("div.viewer")
				  .selectAll("p").remove();
					
	this.canvas.selectAll('rect.square')
		.on("click", this.click.call(this))
		.style("fill", function(d) { return d.seen ? context.shades(d.timestamp) : '#8b0000'})
		.style("opacity", function(d) { return context.opacity(d.timestamp); })
		.transition().ease("elastic").duration(100)
		.each('end', function() {context.async(context.draw);})
		.attr("x", function(d, i) { return context.square.x(i) * context.square.width; })
		.attr("y",function(d, i) { return context.square.y(i) * context.square.height; })
		.attr({
			"width": this.square.width - 2,
			"height": this.square.height - 2
		});
	}
	else
		this.async(this.draw);
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
	if(!original_index && typeof original_index === 'number')
		debugger;
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
  		.attr("y", context.area.top.height + 3)
  		.attr("x", 0)
  		.attr("width", context.area.width)
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
	if(!original_index && typeof original_index === 'number')
		debugger;
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

