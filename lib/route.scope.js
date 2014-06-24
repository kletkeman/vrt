define([], function() {

    function Singleton (key, parent) {

        this.key = key;
        this.parent = parent;

        Object.defineProperty(this, 'value', {
            'get' : function() {
                return parent[key];
            },
            'set' : function(value) {
                parent[key] = value;
            }
        });

    };
    
    function Scope () {

        var data,            tree, 
            original_data,   original_tree;

        Object.defineProperties(this, {
            
            'data' : {

                'get' : function() {
                    return original_data instanceof Singleton ? original_data.value : original_data;
                },

                'set' : function(value) {

                    if(value === undefined)
                        return (original_data = data = value);

                    data = value instanceof Singleton ? 
                        value.value : value;

                    if(original_data instanceof Singleton && !(value instanceof Singleton) )
                       original_data.value = value;
                    else
                        original_data = value;
                }

            }
        });

    };
    
    Scope.Singleton = Singleton;
    
    return Scope;
    
});

