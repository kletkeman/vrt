define([], function() {

      function add (element, propertyName) {
         
          var value = 0;
          
          while(true) {
            
            value += element[propertyName];
            if(element === document.body) break;
            element = element.parentNode;
         
          }

          return value;
      };
      
      function Box (target) {        
      
        var context = this, events = [];

        Object.defineProperty(this, 'top', {
          'enumerable' : true,
          'configurable' : true,
          'get' : function() {
            return add(target, 'offsetTop') + add(target.parentNode, 'scrollTop');
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
            return add(target, 'offsetLeft') + add(target.parentNode, 'scrollLeft');
          }
        });

        Object.defineProperty(this, 'right', {
          'enumerable' : true,
          'configurable' : true,
          'get' : function() {
            return this.left + target.offsetWidth;
          }
        });

        Object.defineProperty(this, 'target', {
          'enumerable' : false,
          'configurable' : true,
          'get' : function() {
            return target;
          }
        });
        
        Object.defineProperty(this, 'scrollTop', {
          'enumerable' : true,
          'configurable' : true,
          'get' : function() {
            return add(target.parentNode, 'scrollTop');
          }
        });
        
        this.center = Object.create({}, {
          'x' : {
            'enumerable' : true,
            'configurable' : true,
            'get' : function() {
              return context.right / 2;
            }
          },
          'y' : {
            'enumerable' : true,
            'configurable' : true,
            'get' : function() {
              return context.bottom / 2;
            }
          }
        });
        
        this.orientation = {
          'horizontal' : 1, 
          'vertical' : 1
        };
          
        this.on = function (name, fn, context) {

            var target  = this.target.parentNode, args;

            context = context || window;

            if(typeof fn === 'function')
                context.addEventListener.apply(context, (args = [name, listener(target, fn), false])), 
                    args.unshift(context), 
                    events.push(args);            
            
            return this;
          
        };
      
        this.destroy = function () {
          
            var args, context;
            
            while (args = events.pop())
                (context = args.shift()).removeEventListener.apply(context, args);
            
            return this;
          
        };

      };

      Box.prototype.freeze = function () {
        for(var key in this)
          if(key === 'top' || key === 'left' || key === 'scrollTop' || key === 'scrollLeft') 
            (function (context, key, value) {
                
              Object.defineProperty(context, key, 
                (key === 'scrollTop' || key === 'scrollLeft' ? 
                 {
                  'enumerable' : true,
                  'configuable' : false,
                  'value' : 0
                 } : 
                 ((key = key.capitalize()), {
                  'enumerable' : true,
                  'configuable' : false,
                  'get' : function () {
                      return value;
                  }
                 })));

            })(this, key, add(this.target, 'offset' + key.capitalize()));

        return (this.scrollTop = 0), (this.scrollLeft = 0), this;
      };

      Box.prototype.compare = function(x, y) {

        var box, top = this.top, bottom = this.bottom, right = this.right, left = this.left;

        if(x instanceof Box) {

          box                        = new Box(x.target);

          box.left                   = x.left     - left;
          box.right                  = x.right    - right;
          box.top                    = x.top      - top;
          box.bottom                 = x.bottom   - bottom;
          box.center.x               = x.center.x - this.center.x;
          box.center.y               = x.center.y - this.center.y;
        
          (function() {
              
              var args = Array.prototype.slice.call(arguments), key,
                  obj = x;
              
              while( (key = args.shift()) )
                  Object.defineProperty(box, key, {
                     'enumerable' : true,
                     'configurable' : true,
                     'value' : obj[key] - this[key]
                  });
              
          }).call(this, 'left', 'right', 'top', 'bottom');
            
          (function() {
              
              var args = Array.prototype.slice.call(arguments), key,
                  obj = x.center;
              
              while( (key = args.shift()) )
                  Object.defineProperty(box.center, key, {
                     'enumerable' : true,
                     'configurable' : true,
                     'value' : obj[key] - this[key]
                  });
              
          }).call(this.center, 'x', 'y');

          box.collision              = ( (x.left <= right && x.left >= left) || (x.right >= left && x.right <= right) ) &&
                                       ( (x.top  >= top && x.top <= bottom) || (x.bottom >= top && x.bottom <= bottom) );

          box.orientation.horizontal = (box.center.x < 0 ? -1 : (box.center.x === 0 ? 0 : 1));
          box.orientation.vertical   = (box.center.y < 0 ? -1 : (box.center.y === 0 ? 0 : 1));

        }
        else
          return (x >= left && x <= right && (y += (this.scrollTop * 2)) >= top && y <= bottom);

        return box;
      
      };
      
      function listener (t, fn) {
        return function(event) {
            fn.call(t, event);
        };
      };
            
      Box.prototype.toString = function () {
        return this.left + this.top + this.bottom + this.right;
      };

      return Box;
  
  });