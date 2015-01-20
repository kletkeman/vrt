/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define(['d3'], function (d3) {
    return function random () {
      return d3.shuffle("ABCDEFGHIJKLMNOPGRSTKLMNOPQRSTUVWZabcdefghijklmnopgrstklmnopqrstuvwz".split("")).join("").substr(0,16);
    };
});