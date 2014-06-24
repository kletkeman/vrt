define([], function() {
    return function random () {
      return d3.shuffle("ABCDEFGHIJKLMNOPGRSTKLMNOPQRSTUVWZabcdefghijklmnopgrstklmnopqrstuvwz".split("")).join("");
    };
});