var guid  = require('guid'),
    types = require('./types'),
    fs    = require('fs');

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
      
      if(vrt.Api.DataSet.collection[config.id])
        throw new Error('Duplicate id at `' + this.title +'` at dataset #'+key+', '+ vrt.Api.DataSet.collection[config.id].title + '\n' + JSON.stringify(config));

      config.group = this.title;
      config.sortKey = parseInt(key, 10);
      config.stacked = !!parent;

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

module.exports.load = function() {
  
  var dir = __dirname + '/../plots';
  var templates = fs.readdirSync(dir).sort();
  
  templates.forEach(function(name) {

    if(name.indexOf('disabled') === (name.length - 8) )
      return;

    var template = require(dir + '/' + name);
    template.compile();
  });
};
