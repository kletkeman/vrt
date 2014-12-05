/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
      'js/random'
    , 'lib/api'
], function(
      random
    , vrt
) {
    
    var root;
    
    function menu () {
        
        var commands = [], id = random(), selection;
        
        function add (name, title, desc, fn) {

            var args = Array.prototype.slice.call(arguments), obj;
            
            if(this !== invoke) {
                
                obj        = (this.menu = this.menu || menu()).destroy().add.apply(this.menu, arguments);
                obj.parent = this;
                
                return obj;
            }
            
            name = args.shift(),
            title = args.shift(),
            desc =  args.shift();
            
            if(typeof title === 'function' || title === undefined) {
                
                args.unshift(title);
                
                title = name;
                name  = undefined;
                desc  = undefined;
            }
            else if(typeof desc === 'function' || desc === undefined) {
                
                args.unshift(desc);
                
                desc  = title;
                title = name;
                name  = undefined;
            }

            commands.unshift(obj = {
                'name'        : String(name||""),
                'title'       : String(title),
                'description' : String(desc||""),
                'remove'      : remove,
                'add'         : add
                  
            });

            while( (fn = args.pop()) && (name = fn.name)) {
                obj[name] = fn;
            }

            return obj;

        };
        
        function remove (name) {
            var obj = get(name = name || this.name || this.title);
            return (commands = commands.filter(function(c) { return c !== obj; })), 
                    d3.select("#"+id).selectAll("li.item").remove(), obj;
        };
        
        function get (name) {
          return commands.filter(function(c) { return (c.name === name || c.title === name); })[0];
        };
        
        function destroy () {
            return selection.on("contextmenu", null), hide.call(invoke), this;
        };
                
        function invoke (d) {
            
            var m = d3.select("#"+id), items, e = d3.event;
            
            if(!commands.length || !e) return;
                        
            e.stopImmediatePropagation(), e.preventDefault();
            
            m = m.node() ? m : 
                d3.select("body")
                .append("ul")
                .attr("id", id)
                .attr("class", "contextmenu")
                .classed("sub", sub(d));
            
            (!m.classed("sub") && (clear(), (root = invoke)) );
                                    
            items = m.selectAll("li")
                     .classed("sub", sub)
                     .data(commands);
            
            items.each(show);
            
            items.selectAll("span.icon")
                 .attr("class", icon);
        
            items.selectAll("span.title")
                 .attr("class", "title")
                 .text(text);
            
            items = items.enter()
                 .append("li")
                 .attr("class", "item")
                 .classed("sub", sub)
                 .on("click", click)
                 .on("mouseover", over)
                 .on("mouseout", out)
                 .each(show);
            
            items.append("span")
                 .attr("class", icon);
        
            items.append("span")
                 .attr("class", "title")
                 .text(text);
            
            return appear.call(this, m), m;
            
        };
        
        return (selection = d3.select(this).on("contextmenu", invoke)), (invoke.id = id), (invoke.hide = hide), 
               (invoke.destroy = destroy), (invoke.add = add), (invoke.get = get), (invoke.remove = remove), invoke;
    };
    
    function hide (only_submenus) {
        
        var selection = d3.select("ul.contextmenu#"+this.id);
        
        return selection.selectAll('li.item')
                   .each(function (d) {
                        return d.menu && d.menu.destroy();
                    }).classed("selected", false),
               (!only_submenus && selection.call(disappear));
        
                
    };
    
    function show (d) { return (d.show && d.show.call(this, d, d3.event)); };
    function icon (d) { return "icon small " + d.name; };
    function click (d) { return d3.event.stopImmediatePropagation(), (d.click && d.click.call(this, d, d3.event)), clear(); };
    function text (d) { return d.title; };
    function sub (d) { return d && (typeof d.menu === 'function'); };
    function over (d) { 
        return hide.call(this.parentNode, true), (d.description && vrt.controls.status(d.description)), 
                (d.over && d.over.call(this, d, d3.event)), (d.menu && d3.select(this).classed("selected", true) && d.menu.call(this, d)); 
    };
    function out (d) { return (d.out && d.out.call(this, d, d3.event)), vrt.controls.status(""); };
        
    function appear (selection) {
            
        var e = d3.event, target = d3.select(e.target), width = selection.node().offsetWidth;
                
        if(target.classed("item sub"))
            return selection.style(
                {
                    'top' : (this.parentNode.offsetTop + e.target.offsetTop - (Math.round(e.target.offsetHeight / 2) + Math.round(this.offsetHeight / 2))) + 'px',
                    'left' : this.parentNode.offsetLeft + e.target.offsetLeft + e.target.offsetWidth + 'px',
                    'width' : '0px'
                })
                .transition(100)
                .style('width', width + 'px');
        
        return selection.style(
            {
                'top': e.clientY + 'px',
                'left': e.clientX + 'px',
                'opacity' : 0
            })
            .transition(200)
            .style('opacity', 1);
        
    };
    
    function disappear (selection) {
        return selection.transition(100).style('opacity', 0).remove();
    };
    
    function clear () {
        return root && root.hide() && (root = null);
        return root && root.hide() && (root = null);
    };
    
    window.addEventListener('click', clear, false);
            
    return menu;
    
});