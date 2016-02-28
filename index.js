var fs = require('fs'),
  stream = require('stream'),
  util = require('util');
var Transform = stream.Transform;

function CsvTransform(filters) {
  //pass config entries to pass to the options object
  //we might need to set the buffer size
  Transform.call(this);
  this.value = '';
  this.headers = [];
  this.values = [];
  this.line = 0;
  this.filters=filters;
}
util.inherits(CsvTransform, Transform);
CsvTransform.prototype._transform = function(chunk, enc, cb) {
  //do the actual thing
  // move to a different module and require in local scope
  var c;
  var i;
  //  chunk = chunk.toString().replace(/ /g,'').replace(/['"]+/g, '');
  //you have been hacked
  chunk = chunk.toString().replace(/\//g, '').split('"').map(function(v, i) {
      return i % 2 === 0 ? v : v.replace(',', '');
    })
    .join('"').replace(/['"]+/g, '').trim();
  //replace comma within text
  for (i = 0; i < chunk.length; i++) {
    c = chunk.charAt(i);

    if (c === ',') {
      this.addValue();
    } else if (c === '\r') {
    this.addValue();
      if (this.line > 0) {
        //this.push will have to be delayed
        this.push(JSON.stringify(this.toObject()));
      }
      this.values = [];
      this.line++;
    } else {
      this.value += c;
    }
  }
  cb();
};

CsvTransform.prototype.toObject = function() {
  var i;
  var obj = {};
  for (i = 0; i < this.headers.length; i++) {
    //object creation is happening here
    obj[this.headers[i]] = this.values[i];
  }
  if (obj['Indicator Name'] === 'GDP at market prices (constant 2005 US$)') {
    return obj;
  }
  return;
};
CsvTransform.prototype.addValue = function() {
  if (this.line === 0) {
    this.headers.push(this.value);
  } else {
    this.values.push(this.value);
  }
  this.value = '';
};


var csvTransform = new CsvTransform();

//var writeStream = fs.createWriteStream(__dirname + '/csv/test.txt')
fs.createReadStream(__dirname + '/csv/WDI_Data.csv').pipe(csvTransform);


var myArray =[];
csvTransform.on('data',(chunk)=>{myArray.push(chunk.toString());});
csvTransform.on('end',()=>{
  console.log(myArray);
});
