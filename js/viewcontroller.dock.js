/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {shrink} from "./shrink.js";
import {random} from "./random.js";
import {Box} from "./box.js";
import * as d3 from 'd3';
import $ from 'jquery';
import {DialogComponent} from "./dialog.component.js";

const transition_time = 100;

export function dock (options) {

  var shortcuts = [], windows = [], selection, box, id = random(), active;

  options = options || {};

  function add (name, description, fn) {

    var element;

    if( name instanceof DialogComponent ) {

      if(arguments.length < 3)
         throw "minimum 3 arguments required";

      element = name;
      name = description;
      description = fn;

    }
    else if(arguments.length < 2)
       throw "minimum 2 arguments required";

    var args = Array.prototype.slice.call(arguments),
        obj  = {
          'element'     : args[0] instanceof DialogComponent ? args.shift().node() : null,
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

  function activate (name, triggerHide) {

    var context = this, deactivate = (name === false);

    triggerHide = triggerHide === undefined ? true : !!triggerHide;

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
                      return (context === d ? deactivate ? ( (triggerHide && (d.hide && d.hide.call(this, d, d3.event))), !!(active = null)) :
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
                  parent.unshift(temp), (temp.close && temp.close.call(this, temp, d3.event)), parent.shift(), (active = undefined);
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
        height       = t.offsetHeight,
        width        = t.offsetWidth;

    visible = typeof visible === 'boolean' ? visible : false;

    switch (options.orientation) {

      case "top"    :

        selection.
          transition(transition_time)
          .style('opacity', visible ? 1 : 0)
          .style('top', function () {
            if(!this.parentNode) return;
            return ( visible ?  box.top : (box.top - height) ) + t.parentNode.scrollTop + 'px';
          });

         break;

      case "left"   :

        selection.
          transition(transition_time)
          .style('opacity', visible ? 1 : 0)
          .style('left', function () {
            if(!this.parentNode) return;
            return ( visible ?  box.left : (box.left - width) ) + t.parentNode.scrollLeft + 'px';
          });

         break;

      case "right"  :

        selection.
          transition(transition_time)
          .style('opacity', visible ? 1 : 0)
          .style('left', function () {
            if(!this.parentNode) return;
            return ( visible ?  box.left : (box.left + width) ) + t.parentNode.scrollLeft + 'px';
          });

        break;

      case "bottom" :
      default:

        selection.
          transition(transition_time)
          .style('opacity', visible ? 1 : 0)
          .style('top', function () {
            if(!this.parentNode) return;
            return ( visible ?  box.top : (box.top + height) ) + t.parentNode.scrollTop + 'px';
          });

    }


  };

  function move (event) {
    event = event || window.event;
    if(options.autoHide === false) return;
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
          return "shortcuts";
        else if (d === windows) return "windows";
      })
      .classed("section", true);

    selection
      .select("div.section.shortcuts")
      .selectAll("span.shortcut")
      .data(shortcuts)
      .enter()
      .append(function(d) {

        var element = document.createElement("span");

        if(d.element)
          element.appendChild(d.element);

        return element;

      })
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
      .html(function(d) { return d.name; });

    selection.selectAll(".shortcut, .window")
      .each(function(d) { return (d.show && d.show.call(this, d, d3.event)); });

    return (event ? false : move());

  };

  function destroy () {
    return window.removeEventListener("mousemove", move), selection.remove(), (box && box.destroy());
  };

  function reset () {

    switch(options.orientation) {

      case "top"    :
      case "left"   :

        selection
          .style('top', '0px')
          .style('left',  '0px');

        break;

      case "right"  :

        selection
          .style('left', function () {
              return ($(window).width() + this.parentNode.scrollLeft - this.offsetWidth) + 'px';
          })
          .style('top',  '0px');

        break;

      case "bottom" :
      default       :

        selection
          .style('top', function () {
              return ($(window).height() + this.parentNode.scrollTop - this.offsetHeight) + 'px';
          })
          .style('left',  '0px');


    }



    return (box && box.reset().freeze());
  };

  return (invoke.toggle = slide), (invoke.id = id), (invoke.destroy = destroy), (invoke.shortcuts = shortcuts), (invoke.windows = windows),
         (selection=d3.select(this).append("div").classed("dock " + options.orientation, true).attr("id", id)),
          reset(),
          selection.append("div").attr("class", "background"),
         (box = new Box(selection.node())).freeze().on('scroll', reset, window).on('resize', reset, window), invoke(),  invoke;

};

function get (name) {
  return this.filter(function(obj) { return obj.name === name; })[0];
};

function over (d) {
  return (d.over && d.over.call(this, d, d3.event));
};

function out (d) {
  return (d.out && d.out.call(this, d, d3.event));
};
