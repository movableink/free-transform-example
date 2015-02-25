import Em from 'ember';

var ApplicationController = Em.Controller.extend({

  // Brute-force function to generate a list of non-overlapping models
  models: function() {
    var x, y, found;

    var count = 50;
    var size = 50;
    var width = 800;
    var height = 600;
    var affordance = size + 10;

    var modelList = [];
    for(var i = 0; i < count; i++) {
      found = false;
      while(!found) {
        x = Math.floor(Math.random() * (width - size));
        y = Math.floor(Math.random() * (height - size));

        found = true;
        for(var j = 0, len = modelList.length; j < len; j++) {
          var model = modelList[j];
          if(model.get('top') > y - affordance &&
             model.get('top') < y + affordance &&
             model.get('left') > x - affordance &&
             model.get('left') < x + affordance) {
            found = false;
            break;
          }
        }
      }
      modelList.push(Em.Object.create({top: y, left: x, width: size, height: size}));
    }
    return modelList;
  }.property()
});

export default ApplicationController;
