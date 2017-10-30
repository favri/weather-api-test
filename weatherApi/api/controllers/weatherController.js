const https = require('https');
const mongodb = require('mongodb');
const mongodbUri = 'mongodb://favri:fabric10@ds033153.mlab.com:33153/hourly-tops';
const apiKey = 'AIzaSyDkICVcDUQ0eYkYQ7QDRzGC8PIIUg3SYro';
const googleTranslate = require('google-translate')(apiKey);
const apixuUrl = 'https://api.apixu.com/v1/current.json?key=';
const apixuToken = '409167ff741942d9a59201326170304';
const q = '&q=';
const city = 'Buenos+Aires';
let weatherNow = {};
let hourlyTops = {};

exports.get_weather = function (req, res) {
  https.get(apixuUrl + apixuToken + q + city, (resp) => {
    let data = '';
    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      weatherNow = JSON.parse(data);
      let temperature = weatherNow.current.temp_c;
      let humidity = weatherNow.current.humidity;
      let dayCondition = '';

      // Translate Day Condition with google translate API node module
      googleTranslate.translate(weatherNow.current.condition.text, 'es', function (err, translation) {
        dayCondition = translation.translatedText;

        // Build weather object for endpoint reply
        let weatherObj = {
          temperature: temperature,
          humidity: humidity,
          dayCondition: dayCondition
        };
        res.send(weatherObj);
      });
    });
    // Request failed
    resp.on("error", (err) => {
      console.log("Error: " + err.message);
    });
  });
};

exports.get_tops = function (req, res) {
  let connectAndGet = function () {
    return new Promise(function (resolve, reject) {
      mongodb.MongoClient.connect(mongodbUri, function (err, db) {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      })
    }).then(function (db) {
      return new Promise(function (resolve, reject) {
        let lastHoursCollection = db.collection('hourly-tops');
        lastHoursCollection.find().toArray(function (err, docs) {
          if (err) {
            reject(err);
          }
          else {
            resolve(docs);
          }
        })
      })
    }).then(function (docs) {
      let lastHoursArray = docs;
      let maxtemp = Math.max.apply(Math, lastHoursArray.map(function (obj) {
        return obj.temperature
      }))
      let mintemp = Math.min.apply(Math, lastHoursArray.map(function (obj) {
        return obj.temperature
      }))
      let tempsObj = {
        maxtemp: maxtemp,
        mintemp: mintemp
      };
      res.send(tempsObj);
      return tempsObj
    })
  };
  connectAndGet();
};

exports.update_hourly_tops = function (req, res) {
  const getWeatherJson = function () {
    https.get(apixuUrl + apixuToken + q + city, (resp) => {
      let data = '';
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });
      // The whole response has been received. Check amount of results stored and update.
      resp.on('end', () => {
        let weatherObj = JSON.parse(data);
        weatherSolved(weatherObj);
      });
      // Request failed
      resp.on("error", (err) => {
        console.log("Error: " + err.message);
      });
    })
  };
  const weatherSolved = function (data) {
    connectAndPost(data);
  };
  const connectAndPost = function (data) {
    return new Promise(function (resolve, reject) {
      mongodb.MongoClient.connect(mongodbUri, function (err, db) {
        if (err) {
          reject(err);
        } else {
         resolve(db);
        }
      })
    }).then(function (db) {
      return new Promise(function (resolve, reject) {
        let lastHoursCollection = db.collection('hourly-tops');
        lastHoursCollection.find().toArray(function (err, docs) {
          if (err) {
            reject(err);
          }
          else {

            if (docs.length >= 24) {
              console.log('tengo que updetear en db')
            }
            else {
              let localtime = data.location;
              console.log('aún no tengo 24 valores');
              console.log('localtime',localtime);
              console.log('docs', docs);
            }
            resolve(db, docs);
          }
        })
      })
    })
  };
  getWeatherJson();


};
