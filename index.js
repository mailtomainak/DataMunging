
var csvTransform = require('./CsvParser');
var fs = require('fs');
//code above this to move to module
//var csvTransform = new Parser();

var convertToFloat = function(val) {

  for (var key in val) {
    if (val.hasOwnProperty(key) && (val - parseFloat(val) + 1) >= 0) {
      val[key] = parseFloat(val[key]);
    }
  }
  return val;
};
//
// function search(nameKey, myArray){
//     for (var i=0; i < myArray.length; i++) {
//         if (myArray[i].name === nameKey) {
//             return myArray[i];
//         }
//     }
// }

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
    switch (record['Indicator Name']) {
      case 'GDP at market prices (constant 2005 US$)':
        gdpGniConstant.push({
          country: record['Country Name'],
          gdp: parseFloat(record['2005'])
        });
        break;
      case 'GNI (constant 2005 US$)':
        gdpGniConstant.push({
          country: record['Country Name'],
          gni: parseFloat(record['2005'])
        });
        break;
      default:

    }
    if (record['Indicator Name'] === 'GDP per capita (constant 2005 US$)' || record['Indicator Name'] === 'GNI per capita (constant 2005 US$)') {
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
  gdpGniConstant.sort(function(x, y) {
    return x.gdp - y.gdp
  }).reverse().slice(0, 15);
  fs.writeFile(__dirname + '/csv/test_gdp.json', JSON.stringify(gdpGniConstant));
  fs.writeFile(__dirname + '/csv/test_gni.json', JSON.stringify(gdpGniPerCapita));
  fs.writeFile(__dirname + '/csv/growth_gdp_india.json', JSON.stringify(gdpGrowthOfIndia));
  fs.writeFile(__dirname + '/csv/continent_gdp_.json', JSON.stringify(gdpByContinent));
});

csvTransform.on('error', function(error) {
  console.log(error.stack);
});
