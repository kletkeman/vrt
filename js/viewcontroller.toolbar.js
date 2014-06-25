define(['js/shrink', 'js/random', 'js/box', 'lib/api'], function (shrink, random, Box, vrt) {
        
    function toolbar () {
    
        var commands    = [], 
            orientation = {
              'vertical'   : 'top', 
              'horizontal' : 'right', 
              'stickTo'    : null
            },
            id = random(), 
            selection,
            box;

        function add (name, desc, fn) {

          var args = Array.prototype.slice.call(arguments), obj;

          commands.unshift(obj = {
            'name'        : String(args.shift()),
            'description' : String(args.shift()),
            'remove'      : remove
          });

          while( (fn = args.pop()) && (name = fn.name)) {
            obj[name] = fn;
          }

          return obj;

        };

        function remove (name) {
          var obj = get(name = name || this.name);
          return (commands = commands.filter(function(c) { return c !== obj; })), obj;
        };

        function get (name) {
          return commands.filter(function(c) { return c.name === name; })[0];
        };

        function fade (selection) {

          return !selection ?  (clearTimeout(fade.id), (fade.id = null)) :
            (fade.id = fade.id || setTimeout(function() {
              selection.transition(1000).style("opacity", 0);
            }, 5000));

        };

        function orient (v, h, s) {

          var t, stickTo, width, height, top, left;

          if(!arguments.length) {

            if(selection) {

              t       = selection.select("#"+id).node(),
              stickTo = orientation.stickTo ? selection.select(orientation.stickTo).node() : selection.node();

              if(stickTo) {

                width   = selection.node().clientWidth,
                height  = selection.node().clientHeight,
                top     = stickTo.offsetTop,
                left    = stickTo.offsetLeft;

                orientation.top     = ((orientation.vertical   === 'bottom' ? ( height  - t.clientHeight) : top) + t.parentNode.scrollTop) + 'px';
                orientation.left    = (orientation.horizontal === 'right' ? ( width - t.clientWidth - left) : left) + 'px'

              }

            }

            return orientation;

          }

          orientation.vertical   = v,
          orientation.horizontal = h,
          orientation.stickTo    = s;

          return invoke;

        };

        function move () {

          var event = d3.event, t = selection.select("#"+id);

          if( !t.node() || (box && box.compare(event.clientX, event.clientY)))
            return invoke.call(this);

          return fade(t);

        };       

        function invoke (event) {

            var t     = (selection = d3.select(this)).on("mousemove", move).select("#"+id),
                width = 0;

            if(event) return (t && t.style(orient()));

            fade();

            if ( !commands.length || event ) return;

            t = t.node() ? t : selection
                  .append("div")
                  .attr("class", "widget toolbar")
                  .attr("id", id).call(fade);

            t.style("opacity", null)
             .selectAll("span")
             .data(commands)
             .each(show)
             .enter()
             .append("span")
             .style("opacity", .8)
             .attr("class", function (d) { return "icon small " + d.name; })
             .on("click", click)
             .on("mouseover", over)
             .on("mouseout", out)
             .on("mousedown", down)
             .on("mouseup", up)
             .each(show);

            t.selectAll("span")
             .each(function() { 
               width += this.offsetWidth + parseInt(d3.select(this).style("margin-right")||0, 10) + parseInt(d3.select(this).style("margin-left")||0, 10); 
             });       

            t.style("width", width + 'px');
            t.style(orient());        

            return (box = box || (new Box(t.node())).on('scroll', invoke, window).on('resize', invoke, window) );

        };

        function destroy () {
            return selection.remove(), (box && box.destroy());
        };

        return (invoke.destroy = destroy), (invoke.orient = orient), (invoke.add = add), (invoke.get = get), (invoke.remove = remove), invoke;
        
  };
    
  function click (d) { return d3.event.stopImmediatePropagation(), (d.click && d.click.call(this, d,  d3.event)); };
  function over (d) { return vrt.controls.status(d.description), d3.select(this).style("opacity", 1), (d.over && d.over.call(this, d, d3.event)); };
  function out (d) { return vrt.controls.status(""), d3.select(this).style("opacity", .8), (d.out && d.out.call(this, d, d3.event)); };
  function down (d) { return (shrink.call(this, .95), d.down && d.down.call(this, d, d3.event)); };
  function up (d) { return (shrink.call(this), d.up && d.up.call(this, d, d3.event)); };
  function show (d) { return (d.show && d.show.apply(this, arguments)); };

  return toolbar;
    
});
