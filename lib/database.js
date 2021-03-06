const mysql = require('mysql');
const Config = require('../lib/config');

const pool = mysql.createPool({
  connectionLimit   : 40,
  host              : Config.get('MySQL')['server'],
  user              : Config.get('MySQL')['username'],
  password          : Config.get('MySQL')['password'],
  database          : 'ariot',
  multipleStatements: true
});

const saveData = (table, data, time, miliseconds) => {
  pool.getConnection((err, connection) => {
    if(err) {
      // YOLO
    }

    connection.query('insert into ' + table + ' set `data` = ' + connection.escape(data) + ', `miliseconds` = ' + connection.escape(miliseconds) + ', `time` = ' + connection.escape(time), (error, results, fields) => {
      connection.release();
      if(error) {
        // YOLO
      }
    });
  });
};

const saveImageData = (url, coords, time, milliseconds) => {
  pool.getConnection((err, connection) => {
    if(err) {
      // YOLO
    }

    connection.query('insert into s3 set `url` = ' + connection.escape(url) + ', `time` = ' + connection.escape(time) + ', `coords` = ' + connection.escape(coords) + ', `miliseconds` = ' + connection.escape(milliseconds), (error, results, fields) => {
      connection.release();
      if(error) {
        // YOLO
      }
    });
  });
};

const getDataFromATable = (table, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if(err) {
        reject(err);
      }

      let sqlQuery = "";

      table.forEach((tableName) => {
        let tableHack = connection.escape(tableName);
        tableHack = tableHack.substring(1, tableHack.length-1);
        sqlQuery += 'select data, miliseconds, time from ' + tableHack + ' where `time` >= ' + connection.escape(startDate) + ' and `time` <= ' + connection.escape(endDate) + ';';
      });
      connection.query(sqlQuery, (error, results, fields) => {
        connection.release();
        if(error) {
          reject(err);
        }

        let sensorResult = [];
        let counter = 0;

        for(const sensor of table) {
          let sensor = table[counter];
          const data = {};
          data[sensor] = results[counter];
          sensorResult.push(data);
          counter += 1;
        }

        resolve(sensorResult);
      });
    });
  });
};

const getXLatestPoints = (sensor, limit = 1000) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if(err) {
        reject(err);
      }

      let sqlQuery = 'select data, miliseconds, time from ' + sensor + ' order by `time` desc limit ' + limit;

      connection.query(sqlQuery, (error, results, fields) => {
        connection.release();
        if(error) {
          reject(err);
        }

        resolve(results);
      });
    })
  });
};

const getImageData = (limit = 1) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if(err) {
        reject(err);
      }

      let sqlQuery = 'select url, coords, miliseconds, time from s3 order by `time` desc limit ' + limit;

      connection.query(sqlQuery, (err, results, fields) => {
        connection.release();
        if(err) {
          reject(err);
        }

        resolve(results);
      });
    });
  });
};

const getLog = (limit = 5) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if(err) {
        reject(err);
      }

      let sqlQuery = "";
      const sensors = ['u1', 'u2', 'gas', 'mag', 'gps', 'accl', 'gyro'];
      for(const sensor of sensors) {
        sqlQuery += 'select data, miliseconds, time from ' + sensor + ' order by `time` desc limit ' + limit + ';';
      }

      connection.query(sqlQuery, (err, results, fields) => {
        connection.release();

        if(err) {
          reject(err);
        }

        results[0].forEach((obj) => {
            obj.title = "u1";
        });

        results[1].forEach((obj) => {
            obj.title = "u2";
        });

        results[2].forEach((obj) => {
            obj.title = "gas";
        });

        results[3].forEach((obj) => {
            obj.title = "mag";
        });

        results[4].forEach((obj) => {
            obj.title = "gps";
        });

        results[5].forEach((obj) => {
            obj.title = "accl";
        });

        results[6].forEach((obj) => {
            obj.title = "gyro";
        });

        resolve(results);
      });
    });
  });
};

module.exports = {
  saveData: saveData,
  saveImageData: saveImageData,
  getDataFromATable: getDataFromATable,
  getXLatestPoints: getXLatestPoints,
  getImageData: getImageData,
  getLog: getLog
};
