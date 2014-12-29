define(['d3'], function (d3) {

    var default_ease = d3.ease("cubic-in-out"),
        transition_time_milliseconds = 250;
    
    function text(d) {
        return d.label;
    }

    function getTextHeight(rotated) {
        var rect = this.getBoundingClientRect();
        return (rotated ? rect.width : rect.height);
    }
    
    function ease (fn) {
        
        if(!arguments.length)
            return default_ease;
        
        default_ease = fn;
        
        return this;
    }
    
    function duration (ms) {
        
        if(!arguments.length)
            return transition_time_milliseconds;
        
        transition_time_milliseconds = ms;
        
        return this;
    }

    function draw (data, gutter, rotated) {
        
        var labels,
            margin     = this.dimensions.margin,
            dimensions = this.dimensions.compensated,
            width      = dimensions[rotated ? 'width' : 'height'],
            text_height, skip;

        function opacity(d) {

            var i = data.indexOf(d);

            text_height = text_height || getTextHeight.call(this, rotated);
            skip = Math.ceil(Math.max(text_height / d.position[rotated ? 'width' : 'height'], 1));

            return !(i % skip) && i > -1 ? 1 : 0;
        }

        function y (d) {
            text_height = text_height || getTextHeight.call(this, rotated);
            return d.position[rotated ? 'x' : 'y'] + (d.position[rotated ? 'width' : 'height'] / 2) + (text_height / 2);
        }

        function x () {
            return (rotated ? -margin.bottom : margin.right) / 2;
        }

        labels = gutter.select("g.labels")
            .selectAll("text.label")
            .data(data);

        labels.text(text);

        labels.enter()
            .append("text")
            .text(text)
            .attr("class", "label")
            .attr("y", y)
            .attr("x", x)
            .style("text-anchor", "middle")
            .style("opacity", 0);

        labels.transition()
            .duration(transition_time_milliseconds)
            .ease(default_ease)
            .style("opacity", opacity)
            .attr("x", x)
            .attr("y", y);

        labels.exit()
            .transition()
            .duration(transition_time_milliseconds)
            .ease(default_ease)
            .style("opacity", 0)
            .remove();

    }

    return {
        duration: duration,
        ease    : ease,
        draw    : draw
    };
})