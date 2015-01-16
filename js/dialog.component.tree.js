define(['js/dialog.component'], function (DialogComponent) {
    
    function TreeView(options) {

        options = options || {};

        DialogComponent.call(this, options.style);

    }

    TreeView.prototype = new DialogComponent("tree");


    return TreeView;

})