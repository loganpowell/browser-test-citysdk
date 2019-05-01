import census from 'citysdk'

/*
 browserify src/index.js -o bundle.js -t [ babelify --presets [ @babel/preset-env ]
 */

console.log("BLOOPING IN THE BLOOPER");

census({
    "vintage" : "2017",
    "geoHierarchy" : {
      "county": "*"
    },
    "sourcePath" : ["acs", "acs5"],
    "values" : ["B19083_001E"],    // GINI index
    "geoResolution" : "500k"
  },
  (e, r) => console.log(r)
);

