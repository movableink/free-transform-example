import Em from 'ember';
import Guides from 'free-transform-example/mixins/guides';

var FreeTransformContainer = Em.Component.extend(Guides, {
  _dragging: false,
  deltaX:    0,
  deltaY:    0,
  selectedModels: Em.A(),

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

    this.checkForGuides(deltaY, deltaX);
  },


  actions: {
    dragStart: function(startX, startY) {
      this._dragging = true;
      this.startX = startX;
      this.startY = startY;

      this.setGuideEdges();
    },

    dragEnd: function() {
      this._dragging = false;

      this.trigger('finish'); // all free-transform components receive this
      this.setProperties({deltaX: 0, deltaY: 0});

      this.clearGuides();
    },

    toggleSelected: function(model) {
      if(this.get('selectedModels').contains(model)) {
        this.get('selectedModels').removeObject(model);
      } else {
        this.get('selectedModels').addObject(model);
      }
    }
  }
});

export default FreeTransformContainer;
