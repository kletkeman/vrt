/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";

export function HTML (options) {

   options = options || {};

   DialogComponent.call(this, options.style, "html");

   this.element.html(options.html);

}

HTML.prototype = Object.create(DialogComponent.prototype);
