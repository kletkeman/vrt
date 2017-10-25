/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import $ from 'jquery';

export function Form (options) {

    options = options || {};

    this.element = document.createElement("form");

    DialogComponent.call(this, options.style, "form");

    this.element
         .classed("form-horizontal", true);

}

Form.prototype = Object.create(DialogComponent.prototype);

Form.prototype.valueOf = function () {
    return $(this.element.node()).serializeArray();
}
