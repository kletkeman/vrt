define(['jquery', 'w2ui', 'lib/api'], function ($, w2, vrt) {
  
    var w2popup = w2.w2popup, w2ui = w2.w2ui;
        
    function navigator () {
    
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
                    records: Object.keys(vrt.groups).filter(function(g) {
                                    return !vrt.groups[g].__vrt_hide_group__;
                               }).sort().map(function(t,i) {
                                    return {recid: i, title: t, count: vrt.groups[t].length };
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
                                records: (function () {

                                    var i = 0, records = [];

                                    vrt.groups[grid.records[event.recid].title].forEach(
                                    function(w) {
                                        records.push($.extend({recid: i++}, w));
                                    });

                                    return records;

                                })(),
                                onDblClick: function (e) {
                                    return vrt.get(this.get(e.recid).id, function (err, obj) {
                                        return err || obj.open();
                                    });
                                }
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
                        indexes = [];

                    $('#w2ui-popup #main').w2render(layout);

                    vrt.controls.dock.windows.forEach(
                    function(w) {
                        var index;
                        if( (index = titles.indexOf(w.name)) > -1)
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

                    var index, windows = vrt.controls.dock.windows,
                        captions = windows.map(function(w) { return w.name; }),
                        window;

                    grid.records.forEach(
                    function(record) {
                        if(!record.selected && (index = captions.indexOf(record.title)) > -1 && (window = windows[index])) {
                            window.remove();
                        }
                    });

                    grid.records.forEach(
                    function(record) {
                        if(record.selected && captions.indexOf(record.title) === -1)
                            vrt.controls.open(record.title);
                    })


                    while(subgrids.length)
                        subgrids.pop().destroy();

                    layout.destroy();
                    grid.destroy();

                }
            }
        });

    };

    return navigator;

});
