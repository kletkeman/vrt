var guid  = require('guid'),
    types = require('./types'),
    fs    = require('fs'),
    argv  = require("optimist").argv;

var Template = function(options) {

	this.id = Guid.create().toString(),
	this.creationDate = (new Date()).toJSON();
    this.datasets = {};

	$.extend(true, this, options);
};

Template.prototype.compile = function(parent, callback) {
  
  if(this.datasets instanceof Object) {
    
    for(var key in this.datasets) {
      
      var config = this.datasets[key];

      if(config.type === 'stack')
        Template.prototype.compile.call(config, this);
      
      if(vrt.Api.DataSet.collection[config.id]) {
        vrt.log.warn('Duplicate id at `' + this.title +'` at dataset #'+key+', '+ vrt.Api.DataSet.collection[config.id].title + '\n' + JSON.stringify(config), ", skipping");
        continue;
      }

      config.group = this.title;
      config.sortKey = Number(key);
      config.stacked = !!parent;
      config._filename = this._filename;

      vrt.create(config, callback);
      
    }
  }
  else
    throw new Error('No datasets specified');
};

Template.prototype.title = null,
Template.prototype.description = null,
Template.prototype.createdBy = null,
Template.prototype.datasets = null;

module.exports.Template = Template;
module.exports.Types = types;

module.exports.load = function(callback) {

      vrt.store.reload(function(err) {
    
            if(err) throw err;
        
            if(argv.initialize) {
        
                  var dir = __dirname + '/../dashboards';
                    
                  fs.readdirSync(dir).sort().forEach(function(name) {
            
                    if(name.indexOf('disabled') === (name.length - 8) )
                      return;
            
                    return vrt.producer.load(dir + '/' + name).submit();
            
                  });
                    
                  
            }
          
          if(typeof callback === 'function')
                return callback();

      });

};
