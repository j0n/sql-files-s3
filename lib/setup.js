var fs = require('fs'),
    async = require('async'),
    colors = require('colors'),
    readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
rl._setPrompt = rl.setPrompt;
rl.setPrompt = function(prompt, length) {
  rl._setPrompt(prompt, length ? length : prompt.split(/[\r\n]/).pop().stripColors.length);
};

var go = function(q, cb) {
  rl.question(q + ": ", function(answer) {
    cb(null, answer);
  });
}

var s3Credentials = function(callback) {
  async.series({
    key: go.bind(this, 'Amazon S3'.cyan+' key'),
    secret: go.bind(this, 'Amazon S3'.cyan+' secret'),
    bucket: go.bind(this, 'Amazon S3'.cyan+' bucket'),
    endpoint: go.bind(this, 'Amazon S3'.cyan+' endpoint')
  },
  callback)
}
var dbCredentials = function(callback) {
  async.series({
    name: go.bind(this, 'Database'.blue),
    host: go.bind(this, 'Database'.blue+' host'),
    user: go.bind(this, 'Database'.blue+' user'),
    password: go.bind(this, 'Database'.blue+' password')
  },
  callback)
}

var runValues = function(predfined, callback) {
  async.series({
    baseUrl: go.bind(this, 'Base url'.cyan+ ' (if files has urls that not include the domain)' + '['+ (predfined.baseUrl || '').blue + ']' ),
    table: go.bind(this, 'Database Table'.cyan+' ' + '['+ (predfined.table || '').blue + ']'),
    columns: go.bind(this, 'Columns'.cyan + '  (comma separated)'+ '['+ (predfined.columns|| '').blue + ']'),
    id: go.bind(this, 'Id column'.cyan + ' ['+ (predfined.id|| '').blue + ']'),
    writeToDB: go.bind(this, 'Update database'.cyan +' (if true the columns will be updated with S3 url)'+ '['+ (predfined.writeToDB || '').blue + ']'),
    start: go.bind(this, 'Index of the row to start with'.cyan+ ' ['+ (predfined.start || '').blue + ']'),
    amount: go.bind(this, 'Amount of rows to run throu'.cyan+ ' ['+ (predfined.amount || '').blue + ']') , 
    onlySelfHosted: go.bind(this , 'Only upload self hosted files'.cyan + ' ['+ (predfined.onlySelfHosted || '').blue + ']'),
    folder: go.bind(this, 'S3 Folder '.cyan + ' ['+ (predfined.folder || '').blue + ']'),
    dbFolder: go.bind(this, 'DB column to use as folder'.cyan + ' (if guid file path = /folder/row[guid]/file)'+ '['+ (predfined.dbFolder || '').blue + ']')
  },
  function(err, data) {
    for (var key in data) {
      predfined[key] = data[key].length > 0 ? data[key] : predfined[key];
    }
    fs.writeFile(__dirname+'/lite-config.js', 'module.exports = '+JSON.stringify(predfined, null, '\t'),{'flags': 'w+'}, function() {
      callback(predfined);
    });
  })
}
module.exports.setup = function(cb) {
  console.log('Setup your config'.green);
  var config = {};
  async.series({
    db: dbCredentials,
    s3: s3Credentials
  },
  function(err, config) {
    if (err) { throw err; }
    fs.writeFile('config.js', 'module.exports = '+JSON.stringify(config, null, '\t'), cb);
  })
}
module.exports.runSetup = function(cb) {
  fs.exists(__dirname+'/lite-config.js', function(exists) {
    if (exists) {
      var lite = require(__dirname+'/lite-config');
      runValues(lite, function(data) {
        cb(data)
      })
    }
    else {
      runValues({id: id, onlySelfHosted: true, dbFolder: guid, writeToDB: false}, function(data) {
        cb(data);
      })
    }
  })

}
