var fs = require('fs'),
    sqlImageS3 = require('./lib/sql-image-s3'),
    setup = require('./lib/setup');

var configExists = function(cb) {
  fs.exists('./config.js', function(exists) {
    if (!exists) {
      setup.setup(function(err) {
        if (err) { throw err }
        cb(true);
      });
    }
    cb(true)
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
