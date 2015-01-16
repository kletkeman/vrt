define(['js/dialog.component'], function (DialogComponent) {

    function Folder(options) {

        options = options || {};

        DialogComponent.call(this, options.style);

    }

    Folder.prototype = new DialogComponent("folder");

    return Folder;

})