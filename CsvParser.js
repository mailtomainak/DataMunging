var Parser, StringDecoder, stream, util, fs;

stream = require('stream');

util = require('util');

StringDecoder = require('string_decoder').StringDecoder;

fs = require('fs');

module.exports = function() {
  //set up options to make this independent
  // if (options == null) options{
  //   options = {};
  // }
  //a crude attempt
  //parser = new Parser(options);
  //parser = new Parser();
  return new Parser();
};

Parser = function() {
  stream.Transform.call(this, {
    objectMode: true
  });
  this.rowDelimiter;
  this.lines = 0;
  this.count = 0;
  this.decoder = new StringDecoder();
  this.buf = '';
  this.field = '';
  this.nextChar = null;
  this.closingQuote = 0;
  this.line = [];
  this.chunks = [];
  this.columns = true
  return this;
};

util.inherits(Parser, stream.Transform);

module.exports.Parser = Parser;

Parser.prototype._transform = function(chunk, encoding, callback) {

  var err;
  if (chunk instanceof Buffer) {
    chunk = this.decoder.write(chunk);
  }
  try {
    this.__write(chunk, false);
    return callback();
  } catch (error) {
    err = error;
    return this.emit('error', err);
  }
};
Parser.prototype.__push = function(line) {
  var field, i, j, len, lineAsColumns;
  if (this.columns === true) {
    this.columns = line;
    return;
  }
  this.count++;
  if (this.columns != null) {
    lineAsColumns = {};
    //an amazing loop
    for (i = j = 0, len = line.length; j < len; i = ++j) {
      field = line[i];
      lineAsColumns[this.columns[i]] = field;
    }
    return this.push(lineAsColumns);

  } else {
    return this.push(line);
  }
};

Parser.prototype.__write = function(chars, end, callback) {
  var acceptedLength, char, escapeIsQuote, i, isDelimiter, isEscape, isQuote, isRowDelimiter, l, ltrim, nextCharPos, ref, results, rowDelimiter, rowDelimiterLength, rtrim, wasCommenting;
  ltrim = false;
  rtrim = false;
  chars = this.buf + chars;
  l = chars.length;
  rowDelimiterLength = 0;
  i = 0;
  if (this.lines === 0 && 0xFEFF === chars.charCodeAt(0)) {
    i++;
  }
  while (i < l) {
    acceptedLength = 2;
    if (!end && (i + acceptedLength >= l)) {
      break;
    }
    char = this.nextChar ? this.nextChar : chars.charAt(i);
    this.nextChar = chars.charAt(i + 1);
    if ((this.field === '') && (char === '\n' || char === '\r')) {
      rowDelimiter = char;
      nextCharPos = i + 1;
    } else if (this.nextChar === '\n' || this.nextChar === '\r') {
      rowDelimiter = this.nextChar;
      nextCharPos = i + 2;
    }
    if (rowDelimiter) {
      if (rowDelimiter === '\r' && chars.charAt(nextCharPos) === '\n') {
        rowDelimiter += '\n';
      }
      this.rowDelimiter = rowDelimiter;
      rowDelimiterLength = this.rowDelimiter.length;
    }
    if (char === "\"") {
      escapeIsQuote = true;
      isEscape = this.nextChar === '"';
      isQuote = this.nextChar === '"';
      if (!(escapeIsQuote && !this.field)) {
        i++;
        char = this.nextChar;
        this.nextChar = chars.charAt(i + 1);
        this.field += char;
        i++;
        continue;
      }
    }
    isRowDelimiter = this.rowDelimiter && chars.substr(i, this.rowDelimiter.length) === this.rowDelimiter;
    if (isRowDelimiter) {
      this.lines++;
    }
    isDelimiter = chars.substr(i, 1) === ",";
    if (isDelimiter || isRowDelimiter) {
      if (isRowDelimiter && this.line.length === 0 && this.field === '') {
        if (wasCommenting) {
          i += this.rowDelimiter.length;
          this.nextChar = chars.charAt(i);
          continue;
        }
      }
      if (rtrim) {
        if (!this.closingQuote) {
          this.field = this.field.trimRight();
        }
      }
      this.line.push(this.field);
      this.closingQuote = 0;
      this.field = '';
      if (isDelimiter) {
        i += 1;
        this.nextChar = chars.charAt(i);
        if (end && !this.nextChar) {
          isRowDelimiter = true;
          this.line.push('');
        }
      }
      if (isRowDelimiter) {
        this.__push(this.line);
        this.line = [];
        i += (ref = this.rowDelimiter) != null ? ref.length : void 0;
        this.nextChar = chars.charAt(i);
        continue;
      }
    } else if (char === ' ' || char === '\t') {
      if (!(ltrim && !this.field)) {
        this.field += char;
      }
      if (end && i + 1 === l) {
        this.field = this.field.trimRight();
        this.line.push(this.field);
      }
      i++;
    } else {

      this.field += char;

      if (end && i === l) {
        this.line.push(this.field);
      }
      i++;

    }
  }
  this.buf = '';
  results = [];
  while (i < l) {
    this.buf += chars.charAt(i);
    results.push(i++);
  }
  return results;
};
module.exports = new Parser();
