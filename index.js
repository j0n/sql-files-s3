var fs = require('fs'),
    sqlImageS3 = require('./lib/sql-image-s3'),
    setup = require('./lib/setup');

var configExists = function(cb) {
  fs.exists('./config.js', function(exists) {
    if (!exists || process.argv.splice(2).indexOf('-f') > -1){
      setup.setup(function(err) {
        if (err) { throw err }
        cb(true);
      });
    }
    else {
      cb(true)
    }
  })
}

var kickoff = function() {
  configExists(function() {
    setup.runSetup(function(config) {
      sqlImageS3.migrate(config);
    });
  })
}

kickoff();
