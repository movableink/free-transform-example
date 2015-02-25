import Em from 'ember';

var Guides = Em.Mixin.create({
  horizontalGuides: Em.A(),
  verticalGuides: Em.A(),

  // Check to see if any of the selected models' edges align with any of
  // the unselected models' edges, and create guides.
  checkForGuides: function(topDelta, leftDelta) {
    var i, len, mid, edge;
    this.get('horizontalGuides').clear();
    this.get('verticalGuides').clear();

    for(i = 0, len = this.selectedMidpointsH.length; i < len; i++) {
      mid = this.selectedMidpointsH[i];
      if(this.get('midpointsH').indexOf(mid + topDelta) >= 0) {
        this.get('horizontalGuides').pushObject(mid + topDelta);
      }
    }

    for(i = 0, len = this.selectedMidpointsV.length; i < len; i++) {
      mid = this.selectedMidpointsV[i];
      if(this.get('midpointsV').indexOf(mid + leftDelta) >= 0) {
        this.get('verticalGuides').pushObject(mid + leftDelta);
      }
    }

    for(i = 0, len = this.selectedEdgesH.length; i < len; i++) {
      edge = this.selectedEdgesH[i];
      if(this.get('edgesH').indexOf(edge + topDelta) >= 0) {
        this.get('horizontalGuides').pushObject(edge + topDelta);
      }
    }

    for(i = 0, len = this.selectedEdgesV.length; i < len; i++) {
      edge = this.selectedEdgesV[i];
      if(this.get('edgesV').indexOf(edge + leftDelta) >= 0) {
        this.get('verticalGuides').pushObject(edge + leftDelta);
      }
    }
  },

  // returns an array of both edges given the selected offset (left, top) and
  // dimension (width, height)
  getEdges: function(models, offset, dimension) {
    var edges = [];
    for(var i = 0, len = models.length; i < len; i++) {
      var model = models[i];
      edges.push(model.get(offset));
      edges.push(model.get(offset) + model.get(dimension));
    }

    return edges;
  },

  // returns an array of midpoints for a list of models
  getMidpoints: function(models, offset, dimension) {
    var midpoints = [];
    for(var i = 0, len = models.length; i < len; i++) {
      var model = models[i];
      midpoints.push(model.get(offset) + Math.round(model.get(dimension)) / 2);
    }

    return midpoints;
  },

  // Find all of the edges of all models and group them by selected/non-selected
  // in preparation for highlight alignment
  setGuideEdges: function() {
    var models = this.get('models');
    var selected = this.get('selectedModels');

    var subtract = function(a, b) {
      return a.reject(function(i) { return b.contains(i); });
    };

    var unselected = subtract(models, selected);

    // top and bottom edges of all selected elements
    this.selectedEdgesH = this.getEdges(selected,   'top',  'height');
    // top and bottom edges of unselected elements
    this.edgesH         = this.getEdges(unselected, 'top',  'height');
    this.selectedEdgesV = this.getEdges(selected,   'left', 'width');
    this.edgesV         = this.getEdges(unselected, 'left', 'width');

    // middle points for selected elements
    this.selectedMidpointsH = this.getMidpoints(selected,   'top',  'height');
    this.midpointsH         = this.getMidpoints(unselected, 'top',  'height');
    this.selectedMidpointsV = this.getMidpoints(selected,   'left', 'width');
    this.midpointsV         = this.getMidpoints(unselected, 'left', 'width');

    // sorting in advance makes it quicker to match edges
    this.selectedEdgesH.sort();
    this.selectedEdgesV.sort();

    this.checkForGuides(0,0);
  },

  clearGuides: function() {
    this.get('horizontalGuides').clear();
    this.get('verticalGuides').clear();
  }

});

export default Guides;
