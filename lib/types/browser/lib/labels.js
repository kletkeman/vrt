/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define(['d3'], function (d3) {

    function text(d) {
        return d.label;
    }

    function getTextHeight(rotated) {
        var rect = this.getBoundingClientRect();
        return (rotated ? rect.width : rect.height);
    }

    function drawLabels (data, gutter, rotated) {
        
        var text_height, skip, labels,
            width  = parseInt(gutter.style("width")),
            height = parseInt(gutter.style("height"));

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
            return (rotated ? -height : width) / 2;
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

        labels.style("opacity", opacity)
              .attr("x", x)
              .attr("y", y);

        labels.exit()
              .remove();

    }

    return drawLabels;
})