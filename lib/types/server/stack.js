var Stack = require('../base/stack'),
	Template = require('../../base').Template;

Stack.prototype.write = function(data, callback) {
	
	if(this.mode)
	{	
		this.verify(data);
		
		var key       = data[this.identifier],
			context   = this;
		
		this.queue.stash(key, data)(function(id, set) {
			
			if(!id)
			{
				set(true);
				
				var dummy = {
					title: context.title, 
					datasets:{}
				}, blueprint = $.extend({}, context.blueprint);
				
				for(var sortKey in context.datasets); sortKey = ( (Number(sortKey) + 1) || 0);
				
				dummy.datasets[sortKey] = context.datasets[sortKey] = blueprint;
				
				Template.prototype.compile.call(dummy, context, function(err, obj) {
					
					if(err) throw err;

					context.save({datasets: context.datasets, queue: context.queue});
					context.onCreate();
					
					set(obj.id).release(context.identifier, key, function(id, data) {
						vrt.write(id, data, callback);
					});
				});
				
			}
			else
				this.release(context.identifier, key, function(id, data) {
					vrt.write(id, data, callback);
				});
			
		});
			
		
	}
	else
	{
		for(var i in this.datasets)
			vrt.write(this.datasets[i].id, data);
	}	
	
};

module.exports = {'Stack' : Stack};