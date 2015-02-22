import Em from 'ember';

var FreeTransform = Em.Component.extend({
  dragging: false,

  // How far element has been dragged from original position
  deltaX: 0,
  deltaY: 0,

  // Used for setting the element's CSS as element is dragged
  top: function() {
    return this.get('model.top') + this.get('deltaY');
  }.property('model.top', 'deltaY'),

  left: function() {
    return this.get('model.left') + this.get('deltaX');
  }.property('model.left', 'deltaX'),

  width: Em.computed.alias('model.width'),
  height: Em.computed.alias('model.height'),

  // Actions
  mouseDown: function(event) {
    this.dragging = true;

    this.startX = event.screenX;
    this.startY = event.screenY;
  },

  mouseMove: function(event) {
    if(!this.dragging) { return; }

    this.set('deltaX', event.screenX - this.startX);
    this.set('deltaY', event.screenY - this.startY);
  },

  mouseUp: function() {
    this.dragging = false;

    this.set('model.top', this.get('model.top') + this.deltaY);
    this.set('model.left', this.get('model.left') + this.deltaX);
    this.set('deltaX', 0);
    this.set('deltaY', 0);
  }
});

export default FreeTransform;
