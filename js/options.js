define([
    'jquery'
    , 'js/dialog'
    , 'js/dialog.component'
], function ($, Dialog, DialogComponent) {

    function Options (options) {

        var folders = {},
            context = this,
            folder;

        $.extend(this, options);

        options = [];

        this.prepend = function (obj, name) {

            var args = Array.prototype.slice.call(arguments),
                name, folder, length, nest;

            if (this instanceof DialogComponent || this instanceof Dialog) {

                for (name in folders) {

                    folder = folders[name];
                    length = folder.length;

                    nest = this.insert("folder", {
                        text      : name,
                        collapsed : true
                    }).nest();

                    while (length--)
                        nest.add.apply(nest, folder[length]);

                }

                nest = this.insert("folder", {
                    text: 'options',
                    collapsed: false
                }).nest();

                length = options.length;

                while (length--)
                    nest.add.apply(nest, options[length]);

                return nest;
            }

            if (typeof obj === 'object') {

                args = args.slice(2);
                args.unshift(obj);

                (folders[name] = folders[name] || []).push(args);

            } else {
                args.unshift(this);
                options.push(args);
            }

            return this;
        }
    }
    
    return Options;

})