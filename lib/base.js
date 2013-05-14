var guid  = require('guid'),
    types = require('./types'),
    fs    = require('fs');

var Template = function() {
	this.id = Guid.create().toString(),
	this.creationDate = (new Date()).toJSON();
  this.datasets = {};
};

Template.prototype.compile = function() {
  
  if(this.datasets instanceof Object && Object.keys(this.datasets).length) {
    
    for(var key in this.datasets) {
      
      var config = this.datasets[key];
      
      if(vrt.Api.DataSet.collection[config.id])
        throw new Error('Duplicate id at `' + this.title +'` at dataset #'+key+', '+ vrt.Api.DataSet.collection[config.id].title + '\n' + JSON.stringify(config));

      config.group = this.title;
      config.sortKey = parseInt(key, 10);
      
      vrt.create(config);
      
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
    var template = require(dir + '/' + name);
    template.compile();
  });
};
