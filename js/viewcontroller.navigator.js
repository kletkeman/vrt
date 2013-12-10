ViewController.prototype.navigator = function() {
    
    var subgrids = [],
        
        config = {
        
            layout: {
                name: 'vrt-navigator-layout',
                padding: 0,
                panels: [
                    { type: 'main', minSize: 600, overflow: 'hidden' }
                ]
            },
            
            grid: { 
                name: 'vrt-navigator-dashboards-grid',
                style: 'border: 0px; border-left: 1px solid silver',
                show: {
                 selectColumn: true
                },
                columns: [              
                    { field: 'title', caption: 'Dashboard Name', size: '100%', resizable: true, sortable: true },
                    { field: 'count', caption: '#', size: '80px', attr: 'align="center"', resizable: true, sortable: true }
                ],
                records: Object.keys(vrt.Api.DataSet.groups).filter(function(g) {
                                return !vrt.Api.DataSet.groups[g].__vrt_hide_group__;
                           }).sort().map(function(t,i) {
                                return {recid: i, title: t, count: vrt.Api.DataSet.groups[t].length };
                           }),
                onExpand: function (event) {
                    
                    var _id = 'vrt-navigator-dashboards-subgrid-' + event.recid;
                    
                    if (w2ui.hasOwnProperty(_id)) w2ui[_id].destroy();
                    $('#'+ event.box_id).css({ margin: '0px', padding: '0px', width: '100%' }).animate({ height: '250px' }, 100);
                    
                    setTimeout(function () {
                                        
                        subgrids.push(
                            
                            $('#'+ event.box_id).w2grid({
                            
                            name: _id, 
                            show: { columnHeaders: true },
                            fixedBody: true,
                            columns: [				
                                { field: 'title', caption: 'Title', size: '40%' },
                                { field: 'description', caption: 'Description', size: '40%' },
                                { field: 'bufferSize', caption: 'bufferSize', size: '10%' },
                                { field: 'step', caption: 'Step', size: '10%' },
                            ],
                            records: (function() {
                                
                                var i = 0, records = [];
                            
                                vrt.Api.DataSet.groups[grid.records[event.recid].title].forEach(
                                function(w) {
                                
                                    if(w instanceof vrt.Api.Stack)
                                        for(var k in w.datasets) {
                                            records.push($.extend({recid: i++}, w.datasets[k]));
                                        }
                                    else
                                        records.push($.extend({recid: i++}, w));
                                });
                                
                                return records;
                    
                            })()
                        }) 
                    );
                    
                    grid.resize();
                   
                        
                    }, 300);
                }
            }
    };

    var layout = $().w2layout(config.layout),
        grid   = $().w2grid(config.grid);

	w2popup.open({
		title 	: 'VRT - Dashboards',
		width	: Math.round($(document).width() * .5),
		height	: Math.round($(document).height() * .5),
		showMax : true,
		body 	: '<div id="main" style="position: absolute; left: 0px; top: 0px; right: 0px; bottom: 0px;"></div>',
		onOpen  : function (event) {
			event.onComplete = function () {
                
                var titles = grid.records.map(function(d) { return d.title; }),
                    indexes = [], tabs = w2ui["vrt-navigation-toolbar-tabs"];
                
				$('#w2ui-popup #main').w2render(layout);
                
                tabs && tabs.tabs.forEach(
                function(t) {
                    var index;
                    if( (index = titles.indexOf(t.caption)) > -1)
                        indexes.push(index);
                });
               
                layout.content('main', grid);
                
                grid.select.apply(grid, indexes);
			}
		},
		onMax : function (event) { 
			event.onComplete = function () {
				layout.resize();
			}
		},
		onMin : function (event) {
			event.onComplete = function () {
				layout.resize();
			}
		},
        onClose: function (event) {
            event.onComplete = function () {
                
                var index, tabs = w2ui["vrt-navigation-toolbar-tabs"],
                    captions = !tabs || tabs.tabs.map(function(t) { return t.caption; }),
                    removed = false;
                
                grid.records.forEach(
                function(record) {
                    if(tabs && !record.selected && (index = captions.indexOf(record.title)) > -1) {
                        tabs.remove(tabs.tabs[index].id);
                        if(!removed && (removed = true))
                            vrt.controls.hideAll();
                    }
                });
                
                grid.records.forEach(
                function(record) {
                    if(record.selected && (!tabs || captions.indexOf(record.title === -1)))
                        vrt.controls.open(record.title);
                });
            
                
                while(subgrids.length)
                    subgrids.pop().destroy();
                
                layout.destroy();
                grid.destroy();
                
            }
        }
	});

    
};