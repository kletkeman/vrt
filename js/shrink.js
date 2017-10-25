/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

import * as d3 from 'd3';

export function shrink (factor) {

  var selection = ((factor = factor || 1), d3.select(this));

  return selection.style('background-size', !arguments.length ? null :
         selection.style("background-size")
                  .replace(/\d+/gi,
                    function(n) {
                      return Math.floor(Number(n) * factor);
                    })
                  );

};
