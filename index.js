var Parser, StringDecoder, stream, util, fs;

stream = require('stream');

util = require('util');

StringDecoder = require('string_decoder').StringDecoder;

fs = require('fs');

module.exports = function() {
  //set up options to make this independent
  if (options == null) {
    options = {};
  }
  //a crude attempt
  parser = new Parser(options);
  return parser;
};

Parser = function(options) {

  //constructor lets setup/check options
  var base15, base1, base4, base6, k, v;
  if (options == null) {
    options = {};
  }
  options.objectMode = true;
  this.options = {};
  for (k in options) {
    v = options[k];
    this.options[k] = v;
  }
  stream.Transform.call(this, this.options);
  if ((base15 = this.options).rowDelimiter == null) {
    base15.rowDelimiter = null;
  }
  if ((base1 = this.options).delimiter == null) {
    base1.delimiter = ',';
  }

  if ((base6 = this.options).objname == null) {
    base6.objname = false;
  }
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

Parser.prototype._flush = function(callback) {
  var err;
  try {
    this.__write(this.decoder.end(), true);
    if (this.line.length > 0) {
      this.__push(this.line);
    }
    return callback();
  } catch (error) {
    err = error;
    return this.emit('error', err);
  }
};

Parser.prototype.__push = function(line) {
  debugger;
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
      this.options.rowDelimiter = rowDelimiter;
      rowDelimiterLength = this.options.rowDelimiter.length;
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
    isRowDelimiter = this.options.rowDelimiter && chars.substr(i, this.options.rowDelimiter.length) === this.options.rowDelimiter;
    if (isRowDelimiter) {
      this.lines++;
    }
    isDelimiter = chars.substr(i, this.options.delimiter.length) === this.options.delimiter;
    if (isDelimiter || isRowDelimiter) {
      if (isRowDelimiter && this.line.length === 0 && this.field === '') {
        if (wasCommenting) {
          i += this.options.rowDelimiter.length;
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
        i += this.options.delimiter.length;
        this.nextChar = chars.charAt(i);
        if (end && !this.nextChar) {
          isRowDelimiter = true;
          this.line.push('');
        }
      }
      if (isRowDelimiter) {
        this.__push(this.line);
        this.line = [];
        i += (ref = this.options.rowDelimiter) != null ? ref.length : void 0;
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
      i++;
      if (end && i === l) {
        this.line.push(this.field);
      }

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
var csvTransform = new Parser();

fs.createReadStream(__dirname + '/csv/WDI_Data.csv').pipe(csvTransform);
var gdpGniConstant = [];
var gdpGniPerCapita = [];
var gdpGrowthOfIndia = [];
var gdpByContinent = [];
var gdpGniKeyArray = ['GDP at market prices (constant 2005 US$)', 'GNI (constant 2005 US$)'];
var gdpGniPerCapitaKeyArray = ['GDP per capita (constant 2005 US$)', 'GNI per capita (constant 2005 US$)'];
var gdpGrowthIndiaKey = 'GDP growth (annual %)';
var indiaCountryName = 'India';
var aggregatedGdpPerCapitaKey = 'GDP per capita (constant 2005 US$)';

csvTransform.on('readable', function() {
  while (record = csvTransform.read()) {
    //array is becoming big they should be split here!
    //filtering
    if (gdpGniKeyArray.indexOf(record['Indicator Name']) > 0) {
      gdpGniConstant.push(record);
    }
    if (gdpGniPerCapitaKeyArray.indexOf(record['Indicator Name']) > 0) {
      gdpGniPerCapita.push(record);
    }
    if (record['Indicator Name'] === gdpGrowthIndiaKey && record['Country Name'] === indiaCountryName) {
      gdpGrowthOfIndia.push(record);
    }
    if (record['Indicator Name'] === aggregatedGdpPerCapitaKey) {
      gdpByContinent.push(record);
    }
  }
});
csvTransform.on('finish', function() {
  //the array need s to be filtered.
  debugger;
  //sorting


  //write file
  fs.writeFile(__dirname + '/csv/test_gdp.json', JSON.stringify(gdpGniConstant));
  fs.writeFile(__dirname + '/csv/test_gni.json', JSON.stringify(gdpGniPerCapita));
  fs.writeFile(__dirname + '/csv/growth_gdp_india.json', JSON.stringify(gdpGrowthOfIndia));
  fs.writeFile(__dirname + '/csv/continent_gdp_.json', JSON.stringify(gdpByContinent));

});
