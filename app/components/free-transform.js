import Em from 'ember';

var FreeTransform = Em.Component.extend({
  dragging: false,
  draggingCorner: null, // corner that is currently being dragged

  // How far element has been dragged from original position
  deltaX: 0,
  deltaY: 0,
  deltaW: 0,
  deltaH: 0,

  didInsertElement: function() {
    var _this = this;
    ["tl", "tr", "bl", "br"].forEach(function(corner) {
      _this.setupResizeCorner(corner);
    });
  },

  // Add handlers to the corners
  setupResizeCorner: function(corner) {
    var _this = this;
    this.$(".overlay").on('mousedown', '.' + corner, function(event) {
      // Don't drag the entire element, just the corner
      event.stopPropagation();

      _this.draggingCorner = corner;
      _this.startX = event.screenX;
      _this.startY = event.screenY;

      // We could attach the handlers to just the corners themselves, but it
      // means that if your mouse happens to move off the corner handle by even
      // a pixel, the mousemove will be broken.  Attaching to the parent container
      // allows us to ensure we always capture the mousemove events.
      var workspace = _this.$().parent().parent();

      workspace.on('mousemove', function(event) {
        _this.moveCorner(event);
      });

      workspace.one('mouseup', function() {
        workspace.off('mousemove');
        _this.finalizeDrag();
        _this.draggingCorner = null;
      });
    });
  },

  // Compute the deltas as we drag the corners. Some corners only change the
  // width/height, while others can change the width/height/top/left values.
  moveCorner: function(event) {
    var deltaX = event.screenX - this.startX;
    var deltaY = event.screenY - this.startY;

    if(this.draggingCorner === 'tl' || this.draggingCorner == 'bl') {
      // when dragging left handle, width changes inversely to left offset
      var deltaW = deltaX * -1;
      this.setProperties({deltaX: deltaX, deltaW: deltaW});
    } else {
      this.set('deltaW', deltaX);
    }

    if(this.draggingCorner === 'tl' || this.draggingCorner == 'tr') {
      // when dragging top handle, height changes inversely to top offset
      var deltaH = deltaY * -1;
      this.setProperties({deltaY: deltaY, deltaH: -1 * deltaY});
    } else {
      this.set('deltaH', deltaY);
    }
  },

  // As we move the mouse, we've been modifying the delta values. Add those into
  // the model's values and set the deltas back to zero.
  finalizeDrag: function() {
    this.setProperties({
      'model.top': this.get('top'),
      'model.left': this.get('left'),
      'model.width': this.get('width'),
      'model.height': this.get('height'),
      'deltaX': 0,
      'deltaY': 0,
      'deltaW': 0,
      'deltaH': 0
    });
  },

  // Used for setting the element's CSS as element is dragged
  top: function() {
    return this.get('model.top') + this.get('deltaY');
  }.property('model.top', 'deltaY'),

  left: function() {
    return this.get('model.left') + this.get('deltaX');
  }.property('model.left', 'deltaX'),

  width: function() {
    return this.get('model.width') + this.get('deltaW');
  }.property('model.width', 'deltaW'),

  height: function() {
    return this.get('model.height') + this.get('deltaH');
  }.property('model.height', 'deltaH'),

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
    this.finalizeDrag();
  }
});

export default FreeTransform;
