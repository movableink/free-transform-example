import Em from 'ember';

var FreeTransformContainer = Em.Component.extend({
  _dragging: false,
  deltaX:    0,
  deltaY:    0,

  // update our deltaX and deltaY, which get propagated to all free-transform
  // components
  mouseMove: function(event) {
    if(!this._dragging) { return; }

    // it's probably better if our offsets are in whole numbers
    var deltaY = Math.round(event.screenY - this.startY);
    var deltaX = Math.round(event.screenX - this.startX);

    this.setProperties({
      deltaY: deltaY,
      deltaX: deltaX
    });
  },

  actions: {
    dragStart: function(startX, startY) {
      this._dragging = true;
      this.startX = startX;
      this.startY = startY;
    },

    dragEnd: function() {
      this._dragging = false;

      this.trigger('finish'); // all free-transform components receive this
      this.setProperties({deltaX: 0, deltaY: 0});
    }
  }
});

export default FreeTransformContainer;
