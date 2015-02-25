import Em from 'ember';

var ApplicationController = Em.Controller.extend({

  // Brute-force function to generate a list of non-overlapping models
  models: function() {
    var x, y, found;

    var iterations = 0;
    var count = 500;
    var size = 50;
    var width = $(document).width() - size;
    var height = $(document).height() - size;
    var affordance = size + 10;

    var modelList = [];
    for(var i = 0; i < count; i++) {
      found = false;
      while(!found) {
        iterations += 1;
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
        if(iterations > 5000) { return modelList; }
      }
      modelList.push(Em.Object.create({top: y, left: x, width: size, height: size}));
    }
    return modelList;
  }.property()
});

export default ApplicationController;
