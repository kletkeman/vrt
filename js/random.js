/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([], function() {
    return function random () {
      return d3.shuffle("ABCDEFGHIJKLMNOPGRSTKLMNOPQRSTUVWZabcdefghijklmnopgrstklmnopqrstuvwz".split("")).join("");
    };
});