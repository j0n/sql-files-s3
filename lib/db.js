var mysql = require('mysql'),
    colors = require('colors'),
    settings = require('../config'),
    pool = mysql.createPool({
      host : settings.db.host,
      user : settings.db.user,
      password : settings.db.password,
      database : settings.db.name,
      debug: false
    });
// sorry for this, none node err, res callback...
exports.connect = function(callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      console.log('database error, did you enter correct db credentials?'.red);
      throw new Error(err);
    }
    else {
      connection.once('error', function(err) {
        if (!err.fatal) {
          return;
        }
        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
          throw err;
        }
        console.log('Re-connecting lost connection: ' + err.stack);
        connection = mysql.createConnection(connection.config);
        //handleDisconnect(connection);
        connection.connect();
      });
      callback(connection);
    }

  });
}
exports.escape = function(string) {
  return mysql.escape(string);
}
