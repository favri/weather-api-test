'use strict';
module.exports = function(app) {
  let weatherCard = require('../controllers/weatherController');

  // weatherCard Routes

  // Get City Weather
  app.route('/weathercard')
    .get(weatherCard.get_weather);

  // Get last 24 hours max & Post hourly top
  app.route('/updatetops/last24')
    .get(weatherCard.get_tops)
    .post(weatherCard.update_hourly_tops);
  //   .put(todoList.update_a_task)
  //   .delete(todoList.delete_a_task);
};
