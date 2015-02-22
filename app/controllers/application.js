import Em from 'ember';

var ApplicationController = Em.Controller.extend({
  model: Em.Object.create({top: 50, left: 50, width: 300, height: 200})
});

export default ApplicationController;
