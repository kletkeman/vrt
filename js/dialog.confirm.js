/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {Dialog} from "./dialog.js";
import {DialogComponent} from "./dialog.component.js";

export function Confirm (title, html, callback) {

    var dialog = this, n;

    if(arguments.length < 2)
        throw "Invalid number of arguments";

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

    n = this.insert("titlebar", {
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
    .nest();

    if(typeof callback === "function")
      n.insert("button", {

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
      });

    n.on("destroy", function () {

    })
    .each("action", function dismiss () {
       dialog.destroy();
    });
}

Confirm.prototype = Object.create(Dialog.prototype);
