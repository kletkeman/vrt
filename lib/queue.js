;!(function(module) {

	function Queue(options) {
		
		options = options || {};
		
		this.identifier = {};
		this.timeouts = {};
		this.timeout = 0;
		
		$.extend(true, this, options);
	};
	
	Queue.prototype.__proto__ = Array.prototype;
	
	Queue.prototype.release = function(key, value, callback) {
		
		var len = this.length, i = 0, d, id = this.identifier[value], timeout = (this.timeouts[value] && (+new Date() - this.timeouts[value]) > this.timeout);
		
		if(!id)
			return this.timeout ? !( this.timeouts[value] || 
				(this.timeouts[value] = +new Date())) : false;
			
		while(len && i++ < len) {
			
			d = this.shift();
			
			if(d && d[key] === value) {
				
				if(this.timeouts[value] && !(timeout = false))
					delete this.timeouts[value];
					
				callback.call(this, id, d); i--;
			}
			else if(!timeout)
				d && this.push(d);
		}
		
		if(timeout)
			delete this.timeouts[value];
		
		return true;
		
	};
	
	Queue.prototype.stash = function(value, data) {
		
		var identifier = this.identifier[value],
			context = this;
			
		this.push(data);
				
		return function(callback) {
			
			callback.call(context, identifier,
				function(id) {
					context.identifier[value] = id;
					return context;
				}
			);
			
			return context;
		};
	};

	Queue.prototype.toJSON = function() {
		
		var that = $.extend({}, this);

		delete that.timeouts;
		delete that.timeout;

		return that;

	};


	if(module.exports)
		module.exports = Queue;
	else
		module.vrt.Api.Queue = Queue;

})(typeof module === 'undefined' ? window : module);