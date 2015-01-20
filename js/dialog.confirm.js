/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog', 'lib/api'], function (Dialog, vrt) {
    
    function Confirm (title, html, callback) {
        
        var dialog = this;
        
        if(arguments.length < 3)
            throw "Invalid number of arguments";
        else if(typeof callback !== 'function')
            throw "First argument must be a function";
        
        vrt.controls.blur(true);
        
        Dialog.call(this, 'confirmation-dialog', {
            'left'   : function () {
                  return Math.round( (window.innerWidth / 2) - (this.offsetWidth / 2) )  + "px"
            },
            'top' : function () {
                  return Math.round( (window.innerHeight / 2) - (this.offsetHeight / 2) )  + "px"
            }
        }, {
            'size'    : "smallest",
            'isModal' : true
        });
        
        this.insert("titlebar", {
            'text': title
        })
        .insert("html", {
            'html'   : html,
            'style'  : {
                'margin' : "8px"
            }
        })
        .insert("form", {
            'style'  : {
                'margin'     : "8px",
                'text-align' : 'right'
            }
        })
        .nest()
        .insert("button", {
            
            'type'   : "danger",
            'text'   : "Yes",
            'action' : callback.bind(this, true)
        })
        .insert("button", {
            'style'  : {
                'margin-left' : "8px"
            },
            'text'   : "No",
            'action' : callback.bind(this, false)
        })
        .on("destroy", function () {
            vrt.controls.blur(false);
        })
        .each("action", function dismiss () {
           dialog.destroy(); 
        });
    }
    
    Confirm.prototype = Object.create(Dialog.prototype);
    
    return Confirm;
    
});