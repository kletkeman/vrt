define(['js/shrink', 'js/random', 'js/box', 'lib/api'], function (shrink, random, Box, vrt) {
    
  function dock () {
    
    var shortcuts = [], windows = [], selection, box, id = random(), active;
    
    function add (name, description, fn) {
      
      var args = Array.prototype.slice.call(arguments),
          obj  = {
            'name'        : args.shift(),
            'description' : args.shift(),
            'parent'      : this,
            'remove'      : remove,
            'activate'    : activate
          };

      while( (fn = args.pop()) && (name = fn.name) )
          obj[name] = fn;
      
      return this.push(obj), (selection && invoke.call(selection.node())), obj;

     };

    function activate (name) {
      
      var context = this, deactivate = (name === false);

      if(!arguments.length) {
        if(context === windows)
          return active;
        else if(context.parent === windows)
          context = windows.get(context.name);
      }
      else 
        (name === context.name) || (context = windows.get(name||this.name||(active?active.name:'')));
        
      return selection.select(".section.windows")
                      .selectAll(".window")
                      .classed("active", function(d) { 
                        return (context === d ? deactivate ? ( (d.close && d.close.call(this, d, d3.event)), !!(active = null)) : 
                          ( (active = d) && (d.active && d.active.call(this, d, d3.event), true) ) : false);
                      }), context;
    };
    
    function remove (name) {
      
      var obj = Array.isArray(this) ? this.get(name) : this, element, parent = this.parent || this;

      for(var i = 0; obj && i < parent.length; i++)
        if( parent[i] === obj )
          return selection.selectAll(".window, .shortcut").each(function(d) { 
            var last, temp;
            if(d === obj) {
              last = parent[parent.length-1];
              while( (temp = parent.shift()) ) {
                if(d !== temp) parent.push(temp);
                else {
                  if(active === temp)
                    parent.unshift(temp), temp.activate(false), parent.shift();
                }
                if (temp === last) break;
              }
            }
          }).remove(), invoke(),  obj;

      return obj;

    };   

    shortcuts.add    = windows.add    = add;
    shortcuts.remove = windows.remove = remove;
    shortcuts.get    = windows.get    = get;
    
    windows.activate = activate;
    
    function slide (visible) {

      var t            = selection.node(),
          parentHeight = t.parentNode.offsetHeight,
          height       = t.offsetHeight;

      selection.
        transition(100)
        .style({
          'opacity' : visible ? 1 : 0,
          'top' : function () {
            return ((visible ?  (parentHeight - height) : parentHeight) + t.parentNode.scrollTop) + 'px';
          }
        });
    };

    function move (event) {
      return (event              = event || move.previousEvent), 
             (move.previousEvent = event || move.previousEvent), 
        slide(event && box.compare(event.clientX, event.clientY));
    };

    
    
    window.addEventListener("mousemove", move);

    function invoke (event) {
      
      selection
        .selectAll("div.section")
        .data([shortcuts, windows])
        .enter()
        .append("div")
        .attr("class", function(d) { 
          if(d === shortcuts) 
            return "shortcuts"; else if (d === windows) return "windows"; 
        })
        .classed("section", true);

      selection
        .select("div.section.shortcuts")
        .selectAll("span.shortcut")
        .data(shortcuts)
        .enter()
        .append("span")
        .attr("class", function(d) { return d.name; })
        .classed("shortcut", true)
        .classed("icon", true)
        .classed("large", true)
        .on("click", function(d) { 
          return (d.click && d.click.call(this, d, d3.event)); 
        })
        .on("mousedown", function (d) {
          return shrink.call(this, .95), (d.down && d.down.call(this, d, d3.event));
        })
        .on("mouseup", function (d) {
          return shrink.call(this), (d.up && d.up.call(this, d, d3.event));
        })
        .on("mouseover", over)
        .on("mouseout", out);
           
      selection
        .select("div.section.windows")
        .selectAll("div.window")
        .data(windows)
        .classed("active", function(d) { return d === active; })
        .enter()
        .append("div")
        .attr("class", "window")
        .attr("title", function(d) { return d.description; })
        .on("click", function(d) { 
          return (d === active ? d.activate(false) : d.activate()), (d.click && d.click.call(this, d, d3.event)); 
        })
        .on("mouseover", over)
        .on("mouseout", out)
        .append("span")
        .attr("class", "title")
        .text(function(d) { return d.name; });

      selection.selectAll(".shortcut, .window")
        .each(function(d) { return (d.show && d.show.call(this, d, d3.event)); });

      return (event ? false : move());

    };

    function destroy () {
      return window.removeEventListener("mousemove", move), selection.remove(), (box && box.destroy());
    };

    return (invoke.id = id), (invoke.destroy = destroy), (invoke.shortcuts = shortcuts), (invoke.windows = windows), 
           (selection=d3.select(this).append("div").attr("class", "dock").attr("id", id)), 
            selection.style({'top' : function () { return (this.parentNode.offsetHeight - this.offsetHeight) + 'px'; }, 'left' : '0px'}),
            selection.append("div").attr("class", "background"), 
           (box = new Box(selection.node())).freeze().on('scroll', invoke, window).on('resize', invoke, window), invoke(),  invoke;

  };
    
  function get (name) {
    return this.filter(function(obj) { return obj.name === name; })[0];  
  };
    
  function over (d) {
    return vrt.controls.status(d.description), (d.over && d.over.call(this, d, d3.event));
  };
   
  function out (d) {
    return vrt.controls.status(""), (d.out && d.out.call(this, d, d3.event));
  };
    
  return dock;
    
});
