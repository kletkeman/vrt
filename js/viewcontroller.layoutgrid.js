/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import * as d3 from 'd3';
import $ from 'jquery';
import {EventEmitter} from 'events';
import {random} from "../../vrt/js/random.js";

const transition_time = 500;
const easing_fn = d3.easePolyInOut;

export function LayoutGrid(parent) {

  EventEmitter.call(this);

  var grid, top, bottom, middle;

  parent = this._parent = parent || document.body;
  this._grid = grid = d3.select(parent).append("div").classed("layoutgrid", true);

  top    = grid.append("div").classed("top", true);
  middle = grid.append("div").classed("middle", true);
  bottom = grid.append("div").classed("bottom", true);

  top.append("div").classed("frame left", true);
  top.append("div").classed("frame middle", true);
  top.append("div").classed("frame right", true);

  middle.append("div").classed("frame left", true);
  middle.append("div").classed("frame middle", true);
  middle.append("div").classed("frame right", true);

  bottom.append("div").classed("frame left", true);
  bottom.append("div").classed("frame middle", true);
  bottom.append("div").classed("frame right", true);

  this._position = {
    "x"  : -1,
    "y"  : -1
  };

  this._resize = (function() {

    const closed = (this._state.index === -1);

    closed && clear.call(this);
    resize.call(this);
    closed && load.call(this);

  }).bind(this);

  this._state = {};
  this._state._current = -1;

  $.extend(this._state, create_state_object([]));

  Object.defineProperty(this, "viewing", {
    "get" : () => {
      return this._state.index > -1;
    },
    "configurable": false
  })

  window.addEventListener("resize", this._resize);

  resize.call(this);

}

LayoutGrid.prototype = Object.create(EventEmitter.prototype);

LayoutGrid.prototype.push = function(id, items) {

  var state = this._state;

  if(Array.isArray(id)) {
    items = id;
    id = random();
  }
  else if(typeof id != "string")
    throw "Id must be of type [string]";

  state[id] = create_state_object(items);

  return id;

}

function create_state_object(items) {

  return {

    "items" : items instanceof Array ? items : [],
    "page" : 0,
    "index" : -1,
    "content" : null,
    "width" : {
      "left"  : null,
      "right" : null
    },
    "size" : {
      "h" : 0,
      "v" : 0
    }

  };

}

LayoutGrid.prototype.destroy = function(items, append) {
  window.removeEventListener("resize", this._resize);
}

LayoutGrid.prototype.load = function(items, append) {

  var frame       = get_frame.call(this),
      state       = this._state,
      state_index = state._current,
      length = Object.keys(state).length - 8;

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      if(typeof items === "string") {

        state_index = items;

        items = arguments.length === 1 ? state[state_index].items : append;
        append = arguments.length === 2 ? false : !!arguments[2];

        if( !Array.isArray(items) )
           throw new Error("argument 2 must be an array");

        state._current = state_index;

        $.extend(state, state[state_index]);

        clear.call(this);

      }
      else if (!length || arguments.length < 3) {

        if(!length)
          this.push(items);

        return this.load.call(this, Object.keys(state)[length], !!append || false).then(resolve);

      }
      else if(!arguments.length) {
        clear.call(this);
        return load.call(this).then(resolve);
       }

      if(state.items != items) {

        while(!append && state.items.length)
          state.items.pop();

        this.append(state_index, items);

      }

      return load.call(this).then(resolve);

    })
    .catch(reject);

  });

}

LayoutGrid.prototype.append = function(index, items) {

  const state = this._state[index];

  for(var i = 0; i < items.length; i++) {
    state.items.push(items[i]);
  }

  return Promise.resolve();

}

LayoutGrid.prototype.close = function close() {

  var grid      = this._grid,
      state     = this._state,
      position  = this._position,
      index     = state.index,
      frame     = get_frame.call(this, -1, position.y),
      left      = get_frame.call(this, 0, position.y),
      right     = get_frame.call(this, -2, position.y),
      padding   = get_space.call(this, frame, "padding"),

  left  = d3.select(left);
  right = d3.select(right);
  frame = d3.select(frame);

  return new Promise((resolve, reject) => {

    if(index === -1)
       return resolve();

    fade_elements.call(this, frame.node(), true).then(() => {

      clear.call(this);

      grid.transition()
          .ease(easing_fn)
          .duration(transition_time)
          .style("left", "0px");

      left.transition()
          .ease(easing_fn)
          .duration(transition_time)
          .style("width", state.width.left + "px");

      right.transition()
           .ease(easing_fn)
           .duration(transition_time)
           .style("width", state.width.right + "px")
           .style("padding-left", "0px");
           //.style("margin-left", -padding.left + "px");

      frame.transition()
          .ease(easing_fn)
          .duration(transition_time)
          .style("width", "0px")
          .style("padding-left", "0px")
          .style("padding-right", "0px")
          .on("end", () => {

            state.index = -1;
            state.content = null;

            //clear.call(this,  0, position.y);
            clear.call(this, -1, position.y);
            clear.call(this, -2, position.y);

            right.style("padding-left", null);
            frame.style("padding-left", null)
                 .style("padding-right", null);

            resize.call(this);
            load.call(this, true).then(resolve);

            this.emit("close");

          });

    });

    window.removeEventListener("keyup", state._esc);

  });


}

LayoutGrid.prototype.view = function(item, content) {

  var grid      = this._grid,
      state     = this._state,
      size      = state.size,
      position  = this._position,
      parent    = this._parent,
      state     = this._state,
      page      = state.page,
      per_page  = (size.h * size.v),
      start     = page * per_page,
      items     = state.items,
      range     = items.slice(start, start + per_page),
      frame     = get_frame.call(this, -1, position.y),
      left      = get_frame.call(this, 0, position.y),
      right     = get_frame.call(this, -2, position.y),
      padding   = get_space.call(this, frame, "padding"),
      children  = frame.children,
      index, column, columns = [];

  if(typeof content === "string")
    content = $.parseHTML(content)[0];

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      if(range.indexOf(item) === -1)
         reject(new Error(`item with index ${index} is not in range`));
      else if(!item.parentNode)
         reject(new Error("item is not visible"));
      else if( !(content instanceof HTMLElement) )
         reject(new Error("no content"));
      else if(state.index > -1)
         reject(new Error("already open"));

      state.content = content;

      column = item.parentNode;
      index  = state.index = Number.parseInt(d3.select(column).attr("data-index"));

      if(position.x != -1)
        move.call(this, -1, position.y);

      clear.call(this, 0, position.y);
      clear.call(this, -2, position.y);

      for(var i = 0, len = children.length; i < len; i++)
         columns.push(children[i]);

      for(i = 0, len = columns.length; i < len; i++)
        (i <= index ? left : right).appendChild(columns[i]);

      left  = d3.select(left);

      grid.style("left", "0px");

      left  = left.style("width", (state.width.left = ((index + 1) * $(column).outerWidth()) + padding.left + padding.right) + "px")

      right = d3.select(right)
                .style("width", (state.width.right = (len - index + 1) * $(column).outerWidth() - padding.left - padding.right) + "px")
                .style("padding-left", "0px");
                //.style("margin-left", -padding.left + "px");

      frame = d3.select(frame)
                .style("width", "0px")
                .style("padding-left", "0px")
                .style("padding-right", "0px");

      frame.transition()
           .ease(easing_fn)
           .duration(transition_time)
           .style("width", $(parent).outerWidth() + "px")
           .style("padding-left", null)
           .style("padding-right", null);

      grid.transition()
          .ease(easing_fn)
          .duration(transition_time)
          .style("left", -(((index + 1) * $(column).outerWidth()) + padding.left + padding.right) + "px")
          .on("end", () => {

            //right.style("margin-left", null);
            insert_content.call(this, frame.node(), content).then(resolve);
            resize.call(this);
            this.emit("view", item, content);

          });

      state._esc = function(event) {
        if(event.keyCode === 27)
           this.close();
      }.bind(this);

      window.addEventListener("keyup", state._esc);

    })
    .catch(reject);

  });
}

LayoutGrid.prototype.remove = function(index) {
  delete this._state[index];
}

LayoutGrid.prototype.down = function(content) {

  var state = this._state;

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      var p     = slide.call(this, "y", -1),
          frame = get_frame.call(this);

      insert_content.call(this, frame, content);
      p.then(resolve)
      .catch(reject);

      this.emit("down", content);

    })
    .catch(reject);

  });

}

LayoutGrid.prototype.up = function(content) {

  var state = this._state;

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      var p     = slide.call(this, "y", 1),
          frame = get_frame.call(this);

      insert_content.call(this, frame, content);
      p.then(resolve)
       .catch(reject);

      this.emit("up", content);

    })
    .catch(reject);

  });

}

LayoutGrid.prototype.left = function(content) {

  var state = this._state;

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      var p     = slide.call(this, "x", 1),
          frame = get_frame.call(this);

      insert_content.call(this, frame, content);
      p.then(resolve)
      .catch(reject);

      this.emit("left", content);

    })
    .catch(reject);

  });

}

LayoutGrid.prototype.right = function(content, callback) {

  var state = this._state;

  return new Promise((resolve, reject) => {

    this.close().then(() => {

      var p     = slide.call(this, "x", -1),
          frame = get_frame.call(this);

      insert_content.call(this, frame, content);
      p.then(resolve)
      .catch(reject);

      this.emit("right", content);

    })
    .catch(reject);

  });

}

LayoutGrid.prototype.next = function() {

  var state     = this._state,
      page      = state.page,
      items     = state.items,
      size      = state.size,
      position  = this._position,
      last_page = Math.floor(items.length / (size.h * size.v));

  return new Promise((resolve, reject) => {

    if(page === last_page)
       return resolve(page);
    else {
       clear.call(this, position.x - 1);
    }

    state.page = page = Math.min( last_page, page + 1);

    this.close().then(() => {

      slide.call(this, "x", -1, transition_time)
           .then(() => { resolve(page); })
           .catch(reject);

      setTimeout(() => {
        load.call(this, false, true)
            .then(() => {
               this.emit("next", state._current, page, last_page);
               resolve(page);
            })
      }, Math.floor(transition_time / 4));


    })
    .catch(reject);

  });

}

LayoutGrid.prototype.prev = function() {

  var state    = this._state,
      page     = state.page,
      size     = state.size,
      position = this._position,
      items    = state.items,
      last_page = Math.floor(items.length / (size.h * size.v));

  return new Promise((resolve, reject) => {

    if(page === 0)
       return resolve(page);
    else {
       clear.call(this, position.x + 1);
    }

    state.page = page = Math.max(0, page - 1);

    slide.call(this, "x", 1, transition_time)
         .then(() => { resolve(page); })
         .catch(reject);

    setTimeout(() => {
      load.call(this, false, true)
      .then(() => {
        this.emit("prev", state._current, page, last_page);
        resolve(page);
      })
    }, Math.floor(transition_time / 4));


  });

}

function calculate_grid_size(element) {

  var state    = this._state,
      size     = state.size,
      frame    = get_frame.call(this),
      padding  = get_space.call(this, frame, "padding"),
      margin   = get_space.call(this, element, "margin"),
      f        = $(frame),
      h, v;

  if(!(element instanceof HTMLElement))
     throw "Not a HTML element";

  element = $(element);

  h = Math.floor( (f.outerWidth() - padding.left - padding.right)  / (element.outerWidth() + margin.left + margin.right) );
  v = Math.floor( (f.outerHeight() - padding.top - padding.bottom) / (element.outerHeight() + margin.top + margin.bottom) );

  return {
    "h" : h,
    "v" : v
  };

}

function load(disable_transition, flip) {

  var state = this._state,
      page  = state.page,
      items = state.items,
      frame = get_frame.call(this),
      first = items.length ? items[0] : null;

  disable_transition = disable_transition || false;
  flip = flip || false;

  if(!!first) {

    var visible = $(first).is(':visible');

    if(!visible)
      frame.appendChild(first);

    state.size = calculate_grid_size.call(this, first);

    if(!visible)
      frame.removeChild(first);

  }

  var size      = state.size,
      per_page  = (size.h * size.v),
      start     = page * per_page,
      col_range = d3.range(page * size.h, page * size.h + size.h),
      items = state.items.slice(start, start + per_page),
      last_page = Math.floor(items.length / (size.h * size.v));

  //clear.call(this);

  var s = d3.select(frame)
    .selectAll("div.column")
    .data(col_range);

    s.enter()
     .append("div")
     .classed("column", true);

    s.exit().remove();

    return new Promise((resolve, reject) => {

      var queued = 0;

      d3.select(frame)
        .selectAll("div.column")
        .attr("data-index", function(d, index) {

          for(var y = 0, i, item; y < size.v; y++) {

            i = (y * size.h) + index;

            if(i > (items.length - 1))
               break;

            item = items[i];

            if(disable_transition) {

              d3.select(item)
                .style("opacity", 1);
            }
            else {

              queued++;

              d3.select(item)
                .style("opacity", 0)
                .transition()
                .ease(easing_fn)
                .duration(Math.round(transition_time / 2))
                .delay( ( ( flip ? ( (size.h - index) * (size.v - y)) : (index * y) ) * Math.round((15 / 1000) * transition_time) ) + Math.round((50 / 1000) * transition_time) )
                .style("opacity", 1)
                .on("end", () => {
                  if(!--queued)
                    resolve();
                });
              }

            this.appendChild(item);

          }

          return index;

        });

        if(!queued)
          resolve();

    })
    .then(() => {
      this.emit("load", state._current, page, last_page, start, per_page, items.length);
    })
}

function slide(axis, direction, time) {

  direction    = Math.max(-1, Math.min(1, direction));
  time         = time || transition_time || 0;

  var p        = this._position,
      g        = this._grid,
      parent   = $(this._parent),
      height   = parent.outerHeight(),
      width    = parent.outerWidth(),
      frame    = get_frame.call(this);

  if(direction < 0 && p[axis] === -2)
    move.call(this, axis === "x" ? 0 : p.x, axis === "y" ? 0 : p.y);
  else if(direction > 0 && p[axis] === 0)
    move.call(this, axis === "x" ? -2 : p.x, axis === "y" ? -2 : p.y);

  p = increment.call(this, axis, this._position[axis] + direction);

  //clear.call(this);

  return new Promise((resolve, reject) => {

    g.transition()
     .duration(time)
     .ease(easing_fn)
     .style("top", (p.y * height) + "px")
     .style("left", (p.x * width) + "px")
     .on("end", resolve);

  });

}

function move(x, y) {

  var p        = this._position,
      g        = this._grid,
      parent   = $(this._parent),
      height   = parent.outerHeight(),
      width    = parent.outerWidth(),
      elements = clear.call(this, p.x, p.y),
      frame ;

  y = p.y = typeof y === "number" ? y : p.y;
  x = p.x = typeof x === "number" ? x : p.x;

  clear.call(this, x, y);

  g.style("top", (y * height) + "px")
   .style("left", (x * width) + "px");

  frame    = get_frame.call(this);

  for(var i = 0; i < elements.length; i++)
    frame.appendChild(elements[i]);

  return frame;

}

function insert_content(frame, content) {

  return new Promise((resolve, reject) => {

    if(content instanceof HTMLElement) {

      clear.call(this, frame);
      fade_elements.call(this, content).then(resolve);
      frame.appendChild(content);

    }
    else if (typeof content === "string") {

      frame.innerHTML = content;
      fade_elements.call(this, frame).then(resolve);

    }

  });
}

function fade_elements(container, flip) {

  flip = !!flip;

  return new Promise((resolve, reject) => {

    const s = d3.select(container)
                .selectAll("*")
                .style("opacity", Number(flip));

    setTimeout(() => {

        s.transition()
         .ease(easing_fn)
         .duration(Math.round(transition_time / 2))
         .delay((d, i) => {
           return i * ((50 / transition_time) * transition_time)
         })
         .style("opacity", Number(!flip))
         .on("end", resolve);

    }, transition_time / 2);

  });
}

function clear(x, y) {

  const state   = this._state,
      size      = state.size,
      page      = state.page,
      per_page  = (size.h * size.v),
      start     = page * per_page,
      items     = state.items.slice(start, start + per_page),
      p         = this._position;

  var elements, frame, c;

  y        = typeof y === "number" ? y : p.y;
  x        = typeof x === "number" ? x : p.x;

  frame    = x instanceof HTMLElement ? x : get_frame.call(this, x, y);
  c         = frame.children;
  elements = [];

  for(var i = 0; i < c.length; i++) {
    elements.push(c[i]);
  }

  for(i = 0; i < elements.length; i++) {
    if(elements[i].parentNode)
      elements[i].parentNode.removeChild(elements[i]);
  }



  return elements;

}

function resize() {

  var self      = this,
      state   = this._state,
      g       = this._grid,
      p       = this._position,
      parent  = this._parent,
      w       = $(parent),
      padding = get_space.call(this, get_frame.call(this), "padding"),
      width   = w.outerWidth(),
      height  = w.outerHeight(),
      items   = state.items,
      first   = items.length ? items[0] : null,
      frame   = get_frame.call(this);

    if(!!first) {

      var visible = !!first.parentNode;

      if(!visible)
        frame.appendChild(first);

      state.size = calculate_grid_size.call(this, first);

      if(!visible)
        frame.removeChild(first);

    }

  g.selectAll(".top, .middle, .bottom")
   .style("width", (width * 3) + "px")
   .style("height", height + "px");

  g.style("width", (width * 3) + "px")
   .style("height", (height * 2) + "px")
   .style("left", (p.x * width) + "px")
   .style("top", (p.y * height) + "px")
   .selectAll(".frame")
   .style("width", (width) + "px")
   .style("height", (height) + "px")

}

function get_space(element, name) {

  element            = d3.select(element);

  var space_top    = Number.parseInt(element.style(`${name}-top`)),
      space_left   = Number.parseInt(element.style(`${name}-left`)),
      space_bottom = Number.parseInt(element.style(`${name}-bottom`)),
      space_right  = Number.parseInt(element.style(`${name}-right`));

  return {
    "top"    : space_top,
    "left"   : space_left,
    "bottom" : space_bottom,
    "right"  : space_right
  };
}

function get_frame(x, y) {

  var p      = this._position,
      frames = this._grid.selectAll("div.frame")._groups[0];

  y = Math.abs(typeof y === "number" ? y : p.y);
  x = Math.abs(typeof x === "number" ? x : p.x);

  return frames[(y * 3) + x];

}

function increment(axis, n) {

  var p = this._position;

  n = n || 0;

  switch (axis) {

    case "x":

      p.x = Math.min(0, Math.max(-2, n));

      break;

    case "y":

      p.y = Math.min(0, Math.max(-2, n));

      break;

    default:
      throw "Invalid axis";
  }

  return p;

}
