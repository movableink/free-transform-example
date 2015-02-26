/* jshint ignore:start */

/* jshint ignore:end */

define('free-transform-example/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'free-transform-example/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('free-transform-example/components/free-transform-container', ['exports', 'ember', 'free-transform-example/mixins/guides'], function (exports, Em, Guides) {

  'use strict';

  var FreeTransformContainer = Em['default'].Component.extend(Guides['default'], {
    _dragging: false,
    deltaX: 0,
    deltaY: 0,
    selectedModels: Em['default'].A(),

    // update our deltaX and deltaY, which get propagated to all free-transform
    // components
    mouseMove: function mouseMove(event) {
      if (!this._dragging) {
        return;
      }

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
      dragStart: function dragStart(startX, startY) {
        this._dragging = true;
        this.startX = startX;
        this.startY = startY;

        this.setGuideEdges();
      },

      dragEnd: function dragEnd() {
        this._dragging = false;

        this.trigger("finish"); // all free-transform components receive this
        this.setProperties({ deltaX: 0, deltaY: 0 });

        this.clearGuides();
      },

      toggleSelected: function toggleSelected(model) {
        if (this.get("selectedModels").contains(model)) {
          this.get("selectedModels").removeObject(model);
        } else {
          this.get("selectedModels").addObject(model);
        }
      }
    }
  });

  exports['default'] = FreeTransformContainer;

});
define('free-transform-example/components/free-transform', ['exports', 'ember'], function (exports, Em) {

  'use strict';

  var FreeTransform = Em['default'].Component.extend({
    dragging: false,
    draggingCorner: null, // corner that is currently being dragged
    selected: false,

    // How far element has been dragged from original position
    deltaX: 0,
    deltaY: 0,
    deltaW: 0,
    deltaH: 0,
    containerDeltaX: 0,
    containerDeltaY: 0,

    didInsertElement: function didInsertElement() {
      var _this = this;
      ["tl", "tr", "bl", "br"].forEach(function (corner) {
        _this.setupResizeCorner(corner);
      });
    },

    // We need to receive a 'finish' event from the container to let us know the
    // drag has completed.  It's a bit hacky.
    setupFinishEvent: (function () {
      var _this = this;
      this.get("container").on("finish", function () {
        if (_this.get("selected")) {
          _this.finalizeDrag();
        }
      });
    }).on("init"),

    // Add handlers to the corners
    setupResizeCorner: function setupResizeCorner(corner) {
      var _this = this;
      this.$(".overlay").on("mousedown", "." + corner, function (event) {
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

        workspace.on("mousemove", function (event) {
          _this.moveCorner(event);
        });

        workspace.one("mouseup", function (event) {
          event.stopPropagation();
          workspace.off("mousemove");
          _this.finalizeDrag();
          _this.draggingCorner = null;
        });
      });
    },

    // Compute the deltas as we drag the corners. Some corners only change the
    // width/height, while others can change the width/height/top/left values.
    moveCorner: function moveCorner(event) {
      var deltaX = event.screenX - this.startX;
      var deltaY = event.screenY - this.startY;

      if (this.draggingCorner === "tl" || this.draggingCorner === "bl") {
        // when dragging left handle, width changes inversely to left offset
        var deltaW = deltaX * -1;
        this.setProperties({ deltaX: deltaX, deltaW: deltaW });
      } else {
        this.set("deltaW", deltaX);
      }

      if (this.draggingCorner === "tl" || this.draggingCorner === "tr") {
        // when dragging top handle, height changes inversely to top offset
        var deltaH = deltaY * -1;
        this.setProperties({ deltaY: deltaY, deltaH: deltaH });
      } else {
        this.set("deltaH", deltaY);
      }
    },

    // As we move the mouse, we've been modifying the delta values. Add those into
    // the model's values and set the deltas back to zero.
    finalizeDrag: function finalizeDrag() {
      this.setProperties({
        "model.top": this.get("top"),
        "model.left": this.get("left"),
        "model.width": this.get("width"),
        "model.height": this.get("height"),
        deltaX: 0,
        deltaY: 0,
        deltaW: 0,
        deltaH: 0
      });
    },

    // Only augment our offset with the container's offset if we're selected
    groupDeltaY: (function () {
      if (this.get("selected")) {
        return this.get("containerDeltaY");
      }
      return 0;
    }).property("containerDeltaY", "selected"),

    groupDeltaX: (function () {
      if (this.get("selected")) {
        return this.get("containerDeltaX");
      }
      return 0;
    }).property("containerDeltaX", "selected"),

    // Used for setting the element's CSS as element is dragged
    top: (function () {
      return this.get("model.top") + this.get("deltaY") + this.get("groupDeltaY");
    }).property("model.top", "deltaY", "groupDeltaY"),

    left: (function () {
      return this.get("model.left") + this.get("deltaX") + this.get("groupDeltaX");
    }).property("model.left", "deltaX", "groupDeltaX"),

    width: (function () {
      return this.get("model.width") + this.get("deltaW");
    }).property("model.width", "deltaW"),

    height: (function () {
      return this.get("model.height") + this.get("deltaH");
    }).property("model.height", "deltaH"),

    // Actions
    mouseDown: function mouseDown(event) {
      this.sendAction("dragStart", event.screenX, event.screenY);
    },

    mouseUp: function mouseUp() {
      this.sendAction("dragEnd");
      if (this.get("containerDeltaX") === 0 && this.get("containerDeltaY") === 0) {
        this.toggleProperty("selected");
        this.sendAction("toggleSelected", this.get("model"));
      }
    }
  });

  exports['default'] = FreeTransform;

});
define('free-transform-example/controllers/application', ['exports', 'ember', 'jquery'], function (exports, Em, $) {

  'use strict';

  var ApplicationController = Em['default'].Controller.extend({

    // Brute-force function to generate a list of non-overlapping models
    models: (function () {
      var x, y, found;

      var iterations = 0;
      var count = 500;
      var size = 50;
      var width = $['default'](document).width() - size;
      var height = $['default'](document).height() - size;
      var affordance = size + 10;

      var modelList = [];
      for (var i = 0; i < count; i++) {
        found = false;
        while (!found) {
          iterations += 1;
          x = Math.floor(Math.random() * (width - size));
          y = Math.floor(Math.random() * (height - size));

          found = true;
          for (var j = 0, len = modelList.length; j < len; j++) {
            var model = modelList[j];
            if (model.get("top") > y - affordance && model.get("top") < y + affordance && model.get("left") > x - affordance && model.get("left") < x + affordance) {
              found = false;
              break;
            }
          }
          if (iterations > 5000) {
            return modelList;
          }
        }
        modelList.push(Em['default'].Object.create({ top: y, left: x, width: size, height: size }));
      }
      return modelList;
    }).property()
  });

  exports['default'] = ApplicationController;

});
define('free-transform-example/initializers/app-version', ['exports', 'free-transform-example/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;

  exports['default'] = {
    name: "App Version",
    initialize: function initialize(container, application) {
      var appName = classify(application.toString());
      Ember['default'].libraries.register(appName, config['default'].APP.version);
    }
  };

});
define('free-transform-example/initializers/export-application-global', ['exports', 'ember', 'free-transform-example/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  };

  exports['default'] = {
    name: "export-application-global",

    initialize: initialize
  };

});
define('free-transform-example/mixins/guides', ['exports', 'ember'], function (exports, Em) {

  'use strict';

  var Guides = Em['default'].Mixin.create({
    horizontalGuides: Em['default'].A(),
    verticalGuides: Em['default'].A(),

    // Check to see if any of the selected models' edges align with any of
    // the unselected models' edges, and create guides.
    checkForGuides: function checkForGuides(topDelta, leftDelta) {
      var i, len, mid, edge;
      this.get("horizontalGuides").clear();
      this.get("verticalGuides").clear();

      for (i = 0, len = this.selectedMidpointsH.length; i < len; i++) {
        mid = this.selectedMidpointsH[i];
        if (this.get("midpointsH").indexOf(mid + topDelta) >= 0) {
          this.get("horizontalGuides").pushObject(mid + topDelta);
        }
      }

      for (i = 0, len = this.selectedMidpointsV.length; i < len; i++) {
        mid = this.selectedMidpointsV[i];
        if (this.get("midpointsV").indexOf(mid + leftDelta) >= 0) {
          this.get("verticalGuides").pushObject(mid + leftDelta);
        }
      }

      for (i = 0, len = this.selectedEdgesH.length; i < len; i++) {
        edge = this.selectedEdgesH[i];
        if (this.get("edgesH").indexOf(edge + topDelta) >= 0) {
          this.get("horizontalGuides").pushObject(edge + topDelta);
        }
      }

      for (i = 0, len = this.selectedEdgesV.length; i < len; i++) {
        edge = this.selectedEdgesV[i];
        if (this.get("edgesV").indexOf(edge + leftDelta) >= 0) {
          this.get("verticalGuides").pushObject(edge + leftDelta);
        }
      }
    },

    // returns an array of both edges given the selected offset (left, top) and
    // dimension (width, height)
    getEdges: function getEdges(models, offset, dimension) {
      var edges = [];
      for (var i = 0, len = models.length; i < len; i++) {
        var model = models[i];
        edges.push(model.get(offset));
        edges.push(model.get(offset) + model.get(dimension));
      }

      return edges;
    },

    // returns an array of midpoints for a list of models
    getMidpoints: function getMidpoints(models, offset, dimension) {
      var midpoints = [];
      for (var i = 0, len = models.length; i < len; i++) {
        var model = models[i];
        midpoints.push(model.get(offset) + Math.round(model.get(dimension)) / 2);
      }

      return midpoints;
    },

    // Find all of the edges of all models and group them by selected/non-selected
    // in preparation for highlight alignment
    setGuideEdges: function setGuideEdges() {
      var models = this.get("models");
      var selected = this.get("selectedModels");

      var subtract = function subtract(a, b) {
        return a.reject(function (i) {
          return b.contains(i);
        });
      };

      var unselected = subtract(models, selected);

      // top and bottom edges of all selected elements
      this.selectedEdgesH = this.getEdges(selected, "top", "height");
      // top and bottom edges of unselected elements
      this.edgesH = this.getEdges(unselected, "top", "height");
      this.selectedEdgesV = this.getEdges(selected, "left", "width");
      this.edgesV = this.getEdges(unselected, "left", "width");

      // middle points for selected elements
      this.selectedMidpointsH = this.getMidpoints(selected, "top", "height");
      this.midpointsH = this.getMidpoints(unselected, "top", "height");
      this.selectedMidpointsV = this.getMidpoints(selected, "left", "width");
      this.midpointsV = this.getMidpoints(unselected, "left", "width");

      // sorting in advance makes it quicker to match edges
      this.selectedEdgesH.sort();
      this.selectedEdgesV.sort();

      this.checkForGuides(0, 0);
    },

    clearGuides: function clearGuides() {
      this.get("horizontalGuides").clear();
      this.get("verticalGuides").clear();
    }

  });

  exports['default'] = Guides;

});
define('free-transform-example/router', ['exports', 'ember', 'free-transform-example/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {});

  exports['default'] = Router;

});
define('free-transform-example/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0-beta.1+canary.d246e754",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0-beta.1+canary.d246e754",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        var el3 = dom.createTextNode("Free Transform");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h2");
        var el3 = dom.createTextNode("controller.model:");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("table");
        dom.setAttribute(el2,"class","data");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Left");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Top");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Width");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createTextNode("Height");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("td");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("td");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("td");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("td");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, component = hooks.component;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0, 5, 3]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),0,0);
        var morph3 = dom.createMorphAt(dom.childAt(element0, [7]),0,0);
        var morph4 = dom.createMorphAt(fragment,2,2,contextualElement);
        content(env, morph0, context, "model.left");
        content(env, morph1, context, "model.top");
        content(env, morph2, context, "model.width");
        content(env, morph3, context, "model.height");
        component(env, morph4, context, "free-transform-container", {"models": get(env, context, "models")}, child0);
        return fragment;
      }
    };
  }()));

});
define('free-transform-example/templates/components/free-transform-container', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.12.0-beta.1+canary.d246e754",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0-beta.1+canary.d246e754",
        blockParams: 1,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, component = hooks.component;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          set(env, context, "model", blockArguments[0]);
          component(env, morph0, context, "free-transform", {"dragStart": "dragStart", "dragEnd": "dragEnd", "toggleSelected": "toggleSelected", "model": get(env, context, "model"), "containerDeltaX": get(env, context, "deltaX"), "containerDeltaY": get(env, context, "deltaY"), "container": get(env, context, "this")}, child0);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0-beta.1+canary.d246e754",
        blockParams: 1,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","hguide");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var attrMorph0 = dom.createAttrMorph(element1, 'style');
          set(env, context, "guide", blockArguments[0]);
          attribute(env, attrMorph0, element1, "style", concat(env, ["top: ", get(env, context, "guide"), "px;"]));
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0-beta.1+canary.d246e754",
        blockParams: 1,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","vguide");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var attrMorph0 = dom.createAttrMorph(element0, 'style');
          set(env, context, "guide", blockArguments[0]);
          attribute(env, attrMorph0, element0, "style", concat(env, ["left: ", get(env, context, "guide"), "px;"]));
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0-beta.1+canary.d246e754",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","canvas");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(element2,1,1);
        var morph1 = dom.createMorphAt(element2,3,3);
        var morph2 = dom.createMorphAt(element2,5,5);
        block(env, morph0, context, "each", [get(env, context, "models")], {}, child0, null);
        block(env, morph1, context, "each", [get(env, context, "horizontalGuides")], {}, child1, null);
        block(env, morph2, context, "each", [get(env, context, "verticalGuides")], {}, child2, null);
        return fragment;
      }
    };
  }()));

});
define('free-transform-example/templates/components/free-transform', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.12.0-beta.1+canary.d246e754",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","handle tl");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","handle tr");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","handle bl");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","handle br");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.12.0-beta.1+canary.d246e754",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","overlay");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(fragment, [2]);
        var attrMorph0 = dom.createAttrMorph(element0, 'style');
        var morph0 = dom.createMorphAt(element1,1,1);
        var attrMorph1 = dom.createAttrMorph(element1, 'style');
        attribute(env, attrMorph0, element0, "style", concat(env, ["position: absolute; top: ", get(env, context, "top"), "px; left: ", get(env, context, "left"), "px; width: ", get(env, context, "width"), "px; height: ", get(env, context, "height"), "px; background-color: #6AF;"]));
        attribute(env, attrMorph1, element1, "style", concat(env, ["top: ", get(env, context, "top"), "px; left: ", get(env, context, "left"), "px; width: ", get(env, context, "width"), "px; height: ", get(env, context, "height"), "px;"]));
        block(env, morph0, context, "if", [get(env, context, "selected")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('free-transform-example/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/components/free-transform-container.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/free-transform-container.js should pass jshint', function() { 
    ok(true, 'components/free-transform-container.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/components/free-transform.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/free-transform.js should pass jshint', function() { 
    ok(true, 'components/free-transform.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/helpers/resolver', ['exports', 'ember/resolver', 'free-transform-example/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('free-transform-example/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/helpers/start-app', ['exports', 'ember', 'free-transform-example/app', 'free-transform-example/router', 'free-transform-example/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('free-transform-example/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/mixins/guides.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/guides.js should pass jshint', function() { 
    ok(true, 'mixins/guides.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('free-transform-example/tests/test-helper', ['free-transform-example/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('free-transform-example/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('free-transform-example/config/environment', ['ember'], function(Ember) {
  var prefix = 'free-transform-example';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("free-transform-example/tests/test-helper");
} else {
  require("free-transform-example/app")["default"].create({"name":"free-transform-example","version":"0.0.0.9a82fcff"});
}

/* jshint ignore:end */
//# sourceMappingURL=free-transform-example.map