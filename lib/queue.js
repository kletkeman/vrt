;!(function(module) {

	function Queue(options) {
		this.identifier = {};
		$.extend(true, this, options);
	};
	
	Queue.prototype.__proto__ = Array.prototype;
	
	Queue.prototype.release = function(key, value, callback) {
		
		var len = this.length, i = 0, d, id = this.identifier[value];
		
		if(!id)
			return false;
			
		while(len && i++ < len) {
			
			d = this.shift();
			
			if(d && d[key] === value) {
				callback.call(this, id, d); i--;
			}
			else
				d && this.push(d);
		}
		
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


	if(module.exports)
		module.exports = Queue;
	else
		module.vrt.Api.Queue = Queue;

})(typeof module === 'undefined' ? window : module);