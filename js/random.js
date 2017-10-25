/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import * as d3 from 'd3';

export function random () {
  return d3.shuffle("ABCDEFGHIJKLMNOPGRSTKLMNOPQRSTUVWZabcdefghijklmnopgrstklmnopqrstuvwz".split("")).join("").substr(0,16);
};
