'use strict'

function extend() {
  var sources = Array.prototype.slice.call(arguments);
  var dest = sources.shift();
  for (var i=0; i<sources.length; i++) {
    var source = sources[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
  }
  return dest;
}

module.exports = extend
