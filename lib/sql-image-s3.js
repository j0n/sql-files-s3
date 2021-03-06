var colors = require('colors'),
    async = require('async'),
    http = require('http'),
    knox = require('knox');

var current = 0,
    config,
    client,
    db,
    rows = [];
    connection = false, 
    options = {
      onlySelfHosted: false,
      columns: 'image'
    }

module.exports.migrate = function(setup) {
  config = require('../config');
  db = require('./db');
  client = knox.createClient({
    key: config.s3.key
    , secret: config.s3.secret
    , bucket: config.s3.bucket
    , endpoint: config.s3.endpoint
  });
  for (var key in setup) {
    options[key] = setup[key];
  }
  options.columns = options.columns.replace(' ', '').split(',');
  console.log('Files will be uploaded to '.cyan+'/'.blue+(options.folder.length>0?options.folder+'/':'').blue+(options.dbFolder.length>0?'row['+options.dbFolder+']/':'').blue+'filename'.blue);
  getRows();
}


var getRows = function() {
  db.connect(function(con) {
    connection = con;
    var q = connection.query('SELECT * from ?? LIMIT ?, ?', [options.table, options.start*1, options.amount*1], function(err, res) {
      if (err) { throw err; }
      console.info('Amont of rows:'.cyan, res.length);
      rows = res;
      fixItem();
    });
  });
}
var getAndUpload = function(url, cb) {
  async.waterfall([
    getImage.bind(this, url),
    uploadFile
  ], cb);
}
var fixItem = function() {
  if (current < options.amount) {
    var found = false,
        asyncDo = {};
    for (var i = 0, ii=options.columns.length;i<ii;i++) {
      if (rows[current][options.columns[i]] !== null && rows[current][options.columns[i]] !== '') {
        found = true;
        asyncDo[options.columns[i]] = getAndUpload.bind(this, rows[current][options.columns[i]]);
      }
    }
    if (found) 
      async.series(asyncDo, updateDB);
    else {
      console.log('Row dont got any values in '.magenta + options.columns.join(' or ').cyan);
      current++;
      fixItem();
    }
  }
  else {
    console.log('FINISHED'.green);
    process.kill();
  }
}
var uploadFile = function (res, url, callback) {

  if (res === null || typeof res.headers['content-length'] === 'undefined') {
    console.log('NOT FOUND file'.red, url);
    return callback(null, url)
  }
  var headers = {
    'x-amz-acl': 'public-read' 
    , 'Content-Length': res.headers['content-length']
    , 'Content-Type': res.headers['content-type']
  };
  var s3url = '/' +  (options.folder ? options.folder + '/': '');
  if (options.dbFolder.length > 0) {
    s3url += rows[current][options.dbFolder] + '/';
  }
  var folders = url.split('/');
  s3url += folders[folders.length-1];
  var req = client.putStream(res, s3url, headers, function() {
    console.log('Uploaded to S3'.cyan, req.url.yellow);
    callback(null, req.url)
  });
}
var updateDB = function(err, values) {
  if (err || options.writeToDB === 'false') { current++; return fixItem(); }
  var where = {};
  where[options.id] = rows[current][options.id];
  console.log('Trying to update db row'.yellow, where);
  var q = connection.query('UPDATE ?? SET ? WHERE ?', [options.table, values, where], function() {
    if (err) console.log(err.toString().red);
    else console.log('Row UPDATED with values'.green, values);
    current++;
    fixItem();
  });
}
var getImage = function(url, cb) {
  var orginalUrl = url;
  if (url.indexOf('amazonaws') > -1 && url.indexOf(config.s3.bucket) > -1) {
    console.info('Already uploaded'.green);
    return cb(true, null, url);
  }
  if (url.indexOf('http') < 0) {
    url = options.baseUrl+url
  }
  else if (url.indexOf(options.baseUrl) < 0 && options.onlySelfHosted){
    console.info('Will only upload selfhosted files'.red);
    return cb(true, null, url);
  }
  if (url.indexOf('https') > -1) {
    console.info('Dont support https right now'.red, url.yellow);
    return cb(true, null, url);
  }
  http.get(url, function(res){
    console.log('fetched '.cyan +url.yellow);
    if (typeof res.headers['content-length'] === 'undefined') {
      cb(null, res, orginalUrl);
    }
    else {
      cb(null, res, url);
    }
  })
  .on('error', function(err) {
    console.log('Couldnt fetch'.red + orginalUrl.red);
    return cb(null, null, orginalUrl);
  });
}
