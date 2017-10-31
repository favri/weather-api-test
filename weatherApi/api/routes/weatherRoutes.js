'use strict';
module.exports = function(app) {
  let weatherCard = require('../controllers/weatherController');

  // weatherCard Routes

  // Get City Weather
  app.route('/weathercard')
    .get(weatherCard.get_weather);

  // Get last 24 hours max/min & Post hourly obj
  app.route('/updatetops/last24')
    .get(weatherCard.get_tops)
    .post(weatherCard.update_hourly_tops);

  // Get all DB objects
  app.route('/fulldb')
    .get(weatherCard.get_all);
};
