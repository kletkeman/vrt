$.extend(vrt.Api.Chat.prototype, vrt.Api.Chat.prototype.__proto__, $.extend({}, vrt.Api.Chat.prototype));
$.extend(vrt.Api.Chat.required, {
	data: Array
});

vrt.Api.Chat.prototype.create = function() {
	
	var element = d3.select(this.element),
		margin = this.dimensions.margin,
		context = this;
	
	element.append("span")
		.attr("class", "widget title")
		.text(this.title);
			
	element.append("div")
	  .attr("class", "messages")
	  .style({
		"font" : "10px sans-serif",
		"vertical-align" : "top",
		"overflow" : "auto"
	   });
	
	element.append("input")
		.attr("placeholder", "Enter your nickname")
		.on("keydown", function() {
			
			if(d3.event.keyCode !== 13)
				return;
				
			if(!context.nickname) {
				context.nickname = this.value;
				d3.select(this).attr("placeholder", "Type a message, " + context.nickname + "!");
			}
			else
				context.write({nickname: context.nickname, message: this.value});
				
			this.value = '';
			
		});
		
	
};

vrt.Api.Chat.prototype.resize = function() {
	
	var margin = this.dimensions.margin,
		width = this.dimensions.width - margin.left - margin.right,
		height = this.dimensions.height - margin.top - margin.bottom;
	
	d3.select(this.element).select("div.messages")  
	  .style({
		"margin-top" : margin.top + "px",
		"margin-left" : margin.left + "px",
		"width" : width + "px",
		"height" : height + "px"
	   });
	
	d3.select(this.element).select("input")
	   .style({
			"margin-left" : margin.left + "px",
			"width" : width + "px"
		});
	
};

vrt.Api.Chat.prototype.update = function() {
	
	while(this.data.length > this.bufferSize) {
		this.data.shift();
		d3.select(this.element).select("p.message").remove();
	}
	
	vrt.Api.DataSet.prototype.update.call(this);
};

vrt.Api.Chat.prototype.draw = function() {
	
	var context = this;
	
	d3.select(this.element)
		.select("div.messages")
		.each(function() {
			this.scrollTop = this.scrollHeight - $(this).height();
		})
		.selectAll("p.message")
		.data(this.data)
		.enter()
		.append("p")
		.attr("class", "message")
		.style({
			"margin" : "5px",
			"text-align" : "left"
		})
		.html(function(d) {
			return d3.time.format("%H:%M:%S")(new Date(d.timestamp)) + "  <strong>" + d.nickname + "</strong> ";
		})
		.append("p")
		.text(function(d) {
			return d.message;
		})
		.style({
			"margin" : "2px"
		});
		
		d3.select(this.element)
			.select("div.messages")
			.each(function() {
				this.scrollTop = this.scrollHeight - $(this).height();
			});
};