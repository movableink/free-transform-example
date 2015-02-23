import Em from 'ember';

var ApplicationController = Em.Controller.extend({
  models: [
    Em.Object.create({top: 50, left: 50, width: 300, height: 200}),
    Em.Object.create({top: 80, left: 400, width: 300, height: 200}),
    Em.Object.create({top: 280, left: 100, width: 150, height: 200})
  ]
});

export default ApplicationController;
