/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

function add (element, propertyName) {

    var value = 0;

    while(element) {

      value += element[propertyName];
      if(element === document.body) break;
      element = element.parentNode;

    }

    return value;
};

export function Box (target) {

  var context = this, events = [];

  Object.defineProperty(this, 'target', {
    'enumerable' : false,
    'configurable' : true,
    'get' : function() {
      return target;
    }
  });

  this.reset();

  this.on = function (name, fn, context) {

      var target  = this.target.parentNode, args;

      context = context || window;

      if(arguments.length > 3)
         throw "minimum 3 arguments required";
      else if(typeof fn === 'function')
          context.addEventListener.apply(context, (args = [name, listener(target, fn), false])),
              args.unshift(context),
              events.push(args);

      return this;

  }

  this.destroy = function () {

      var args, context;

      while (args = events.pop())
          (context = args.shift()).removeEventListener.apply(context, args);

      return this;

  };

}

Box.prototype.reset = function () {

    var target = this.target;

    Object.defineProperty(this, 'top', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return add(target, 'offsetTop') - add(target.parentNode, 'scrollTop');
    }
  });

  Object.defineProperty(this, 'bottom', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return this.top + target.offsetHeight;
    }
  });

  Object.defineProperty(this, 'left', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return add(target, 'offsetLeft') - add(target.parentNode, 'scrollLeft');
    }
  });

  Object.defineProperty(this, 'right', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return this.left + target.offsetWidth;
    }
  });

  Object.defineProperty(this, 'scrollTop', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return add(target.parentNode, 'scrollTop');
    }
  });

  Object.defineProperty(this, 'scrollLeft', {
    'enumerable' : true,
    'configurable' : true,
    'get' : function() {
      return add(target.parentNode, 'scrollLeft');
    }
  });

  return this;
}

Box.prototype.freeze = function () {

  for(var key in this)
    if(key === 'top' || key === 'left' || key === 'scrollTop' || key === 'scrollLeft')
      (function (context, key, value) {

        Object.defineProperty(context, key,
          (key === 'scrollTop' || key === 'scrollLeft' ?
           {
            'enumerable' : true,
            'configuable' : true,
            'value' : 0
           } :
           ((key = key.capitalize()), {
            'enumerable' : true,
            'configuable' : true,
            'get' : function () {
                return value;
            }
           })));

      })(this, key, add(this.target, 'offset' + key.capitalize()));

  Object.defineProperty(this, 'scrollTop', {
      'enumerable' : true,
      'configurable' : true,
      'writable' : false,
      'value' : 0
    });

  Object.defineProperty(this, 'scrollLeft', {
      'enumerable' : true,
      'configurable' : true,
      'writable' : false,
      'value' : 0
    });

  return this;
}

Box.prototype.compare = function compare (x, y) {

  var box    = x,
      top    = this.top,
      bottom = this.bottom,
      right  = this.right,
      left   = this.left;

  if(box instanceof Box)
      return compare.call(this, box.left, box.top)    ||
             compare.call(this, box.right, box.top)   ||
             compare.call(this, box.left, box.bottom) ||
             compare.call(this, box.left, box.bottom);
  else
    return (x >= left && x <= right && y >= top && y <= bottom);

  return box;

}

function listener (t, fn) {
  return function(event) {
      fn.call(t, event);
  };
}
