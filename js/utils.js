'use strict';
var Kandinsky = Kandinsky || {};

Kandinsky.Utils = {};

Kandinsky.Utils.makeNew = function() {

  var utils = {};


  utils.browserSupportsSVG = function() {
    return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
  };

  utils.numericTickFormat = function(defaultTickFormat, unit) {
    if (unit === '%') {
      return function(d) { return defaultTickFormat(d) + '%' }
    }
    else {
      return defaultTickFormat;
    }
  };

  // computes left margin based on how
  // long tick labels on y axis are in terms of chars
  utils.leftMargin = function (frame, axis, tickFormat, axisEl) {
    var scale = axis.scale();
    var max_width = 0;
    var ticks = axisEl.selectAll('g').data(scale.ticks());

    ticks.enter().append('g').attr('class', 'tick');

    axisEl.selectAll('g.tick').data(scale.ticks()).append('text')
      .text(function (d) {
        return tickFormat(d);
      })
      .each(function () {
        var w = this.getBBox().width;
        max_width = Math.max(w, max_width);
      });

    ticks.remove();

    return Math.ceil(Math.max(frame.margin.left, max_width + axis.tickPadding()));
  };

  utils.translate = function (x, y) {
    return 'translate(' + x + ',' + y + ')'
  };

  utils.selectOrAppend = function(parentElement, elementName, klass, onNewElement) {
    var s = parentElement.select(elementName+'.'+klass);
    if (s.empty()) {
      s = parentElement.append(elementName).attr('class', klass);
      if (onNewElement) onNewElement(s);
    }
    return s;
  };

  utils.selectOrAppendG = function(parentElement, klass) {
    return this.selectOrAppend(parentElement, 'g', klass);
  };


  var YEAR_FORMAT = d3.time.format.utc('%Y');

  // parses first 4 chars of string
  // as year and creates a date object
  utils.parseYear = function(d) {
    var year = d.substr(0, 4);
    return YEAR_FORMAT.parse(year);
  };


  utils.splitText = function splitText(text) {
    var c, start = 0, words = [];
    for (var i = 0; i < text.length; i++) {
      c = text[i];
      if (c === ' ') {
        words.push(text.slice(start, i));
        start = i;
      }
      else if ((c === '-' || c === '/' || c === ',') && i !== 0 && text[i-1] !== ' ') {
        words.push(text.slice(start, i+1));
        i++;
        start = i;
      }
    }
    if (start < text.length) {
      words.push(text.slice(start, text.length));
    }
    return words;
  };

  // slices text into pieces, splits by spaces
  // only.
  utils.sliceText = function sliceText(str, slices) {
    if (arguments.length === 1) {
      return str.split(/ |-|\//gi);
    }
    if (slices === 1) return [str];
    var regex = / |-|(\/)/gi, result, indices = [];
    while ( (result = regex.exec(str)) ) {
      indices.push(result.index+1);
    }
    // if less slices available than needed
    // reduce number of slices to max available
    if (indices.length + 1< slices) {
      slices = indices.length + 1;
    }
    var parts = [];
    var start = 0, end;
    var sliceLen = str.length / slices;
    for (var i = 1; i<= slices; i++) {
      if (i === slices || start === indices[indices.length-1]) {
        parts.push( str.slice(start, str.length).trim() );
        return parts;
      }
      else {
        end = findClosest(indices, start + sliceLen);
        parts.push( str.slice(start, end).trim() );
        start = end;
        sliceLen = (str.length - end + 1) / (slices - i);
      }
    }
    return parts;
  };

  // finds closest match to the ideal number
  // in an array and returns it.
  // must contain only positive numbers in arr
  function findClosest(arr, ideal) {
    var diffs = arr.map(function(val) { return Math.abs(val - ideal)});
    var minDiff = d3.min(diffs);
    return arr[diffs.indexOf(minDiff)];
  }



  return utils;

};

Kandinsky.utils = Kandinsky.Utils.makeNew();
