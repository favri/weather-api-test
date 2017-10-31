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
        return obj.current.temp_c
      }))
      let mintemp = Math.min.apply(Math, lastHoursArray.map(function (obj) {
        return obj.current.temp_c
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

exports.get_all = function (req, res) {
  let connectAndSend = function () {
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
            res.send(docs)
            resolve(docs);
          }
        })

      })
    });
  }
  connectAndSend();
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
        connectAndPost(weatherObj);
      });
      // Request failed
      resp.on("error", (err) => {
        console.log("Error: " + err.message);
      });
    })
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
            let registeredHours = [];

            // Get data object Hour for comparison
            let dataDate = new Date(0);
            dataDate.setUTCSeconds(data.location.localtime_epoch);
            let dataHours = dataDate.getHours();

            // Loop over db documents and get hours to compare
            docs.forEach(function (doc) {
              let docDate = new Date(0);
              docDate.setUTCSeconds(doc.location.localtime_epoch);
              let docHours = docDate.getHours();
              registeredHours.push(docHours);
              // add dynamic property to object just for updating purpose
              doc.location.uploadTime = docHours;
            })

            // if weather API response data hour is not in documents hour array, add new object to db
            if (registeredHours.indexOf(dataHours) <= -1){
              console.log('registeredHours',registeredHours);
              console.log('dataHours',dataHours);
              console.log('object to add');
              lastHoursCollection.insertOne(data);
              res.send({
                status: 200,
                Message: 'succesfully created',
                data: data
              });
            }
            // Record founded for current hour then document must be updated
            else {
              let modifyObj = {};
              docs.forEach(function (doc) {
                if (doc.location.uploadTime = dataHours){
                  modifyObj = doc;
                }
              })
              console.log('registeredHours',registeredHours);
              console.log('dataHours',dataHours);
              console.log('find an object to update');
              console.log('modifyObj', modifyObj._id);
              lastHoursCollection.replaceOne({"_id":modifyObj._id},data);
              res.send({
                status: 200,
                Message: 'succesfully updated document',
                data: data });
            }
            // if (docs.length >= 24) {
            //   console.log('tengo que updetear en db')
            //
            //   // Get data object Hour for comparison
            //   let dataDate = new Date(0);
            //   dataDate.setUTCSeconds(data.location.localtime_epoch);
            //   let dataHours = dataDate.getHours();
            //
            //   // Set a new date to 0 for db time comparison
            //   let docDate = new Date(0);
            //
            //   docs.forEach(function (doc) {
            //     docDate.setUTCSeconds(doc.location.localtime_epoch);
            //     let docHours = docDate.getHours();
            //
            //     if (dataHours === docHours) {
            //       console.log('hours match y update');
            //     }
            //     else {
            //       console.log('no hours match');
            //     }
            //   })
            // }
            // else {
            //   console.log('no tengo 24 valores aun');
            //   let dataToPush = [];
            //   // Get data object Hour for comparison
            //   let dataDate = new Date(0);
            //   dataDate.setUTCSeconds(data.location.localtime_epoch);
            //   let dataHours = dataDate.getHours();
            //
            //   docs.forEach(function (doc) {
            //     // Set a new date to 0 for db time comparison and fix epoch vs gmt diference
            //     let docDate = new Date(0);
            //     docDate.setUTCSeconds(doc.location.localtime_epoch);
            //     let docHours = docDate.getHours() + gmtFix;
            //
            //     if (dataHours === docHours) {
            //       console.log('find an object to update');
            //     }
            //     else {
            //       console.log('no object to update');
            //       if (dataToPush.indexOf(data) === -1){
            //         dataToPush.push(data);
            //       }
            //     }
            //   })
            //   console.log('dataToPush',dataToPush);
            // }
          }
        })
        resolve(db);
      })
    })
  };
  getWeatherJson();
};