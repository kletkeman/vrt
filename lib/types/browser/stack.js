define(['types/dataset', 'lib/types/base/stack', 'd3'], function(DataSet, Stack, d3) {

    $.extend(Stack.prototype, Stack.prototype.__proto__, $.extend({}, Stack.prototype));

    Stack.prototype.create = function() {
        d3.select(this.element)
            .classed("container", false)
            .select(".widget.title")
            .classed("widget", false)
            .classed("stack", true);
    };

    Stack.prototype.update = function() {

        if(!this.event) {}
        else if(this.event.type === 'save')
            this._configure();

        return DataSet.prototype.update.apply(this, arguments);
    };

    Stack.prototype.show = function() {

        var datasets = d3.values(this.datasets)
            .sort(function(a, b) {
                return a.sortKey > b.sortKey;
            });

        DataSet.prototype.show.apply(this, arguments);

        for(var i = 0, len = datasets.length; i < len; i++) {
            datasets[i].show(this.element);
        }

    };

    Stack.prototype.hide = function() {

        for(var i in this.datasets)
            this.datasets[i].hide();

        DataSet.prototype.hide.call(this);
    };

    Stack.prototype.draw = function() {

        if(!this.visible())
            return;

        for(var i in this.datasets) {
            this.datasets[i].onResize(null, this.dimensions.width, this.dimensions.height);
        }

    };

    return Stack;
});
