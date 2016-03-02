(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  The navigator plugin was written by Alexandr Truhin (aka bumbu)

	  Modifications tracked on Github
	*/

	(function() {

	// if module is not defined, use the traditional behaviour of
	// initialising in place using elements defined on window
	if (false) {
	  // initialise using globally defined, jquery and cytoscape
	  initialize(jQuery, cytoscape);
	}
	// otherwise export the initialize function allowing users of
	// the library finer control over the initialiation process
	else {
	  module.exports = initialize;
	}

	function initialize($ /* = window.jQuery */, $$ /* = window.cytoscape */){

	  // throw reference errors if either jQuery or Cytoscape have not been defined
	  if (!$) {
	    throw new ReferenceError('Cytoscape Navigator depends on jQuery >=1.4');
	  }
	  if (!$$) {
	    throw new ReferenceError('Cytoscape Navigator depends on Cytoscape >= 2.2');
	  }
	  if (!$.fn.cytoscape) {
	    throw new ReferenceError('In order to use this library Cytoscape ' +
	                             'must have registered jQuery');
	  }

	  var Navigator = function ( element, options ) {
	    this._init(element, options);
	  };

	  Navigator.prototype = {

	    constructor: Navigator,

	  /****************************
	    Main functions
	  ****************************/

	    _init: function ( element, options ) {
	      var that = this;

	      this.$element = $(element);
	      this.options = $.extend(true, {}, $.fn.cytoscapeNavigator.defaults, options);

	      this.$element.cytoscape(function(){
	        that.cy = that.$element.cytoscape('get');

	        // Cache bounding box
	        that.boundingBox = that.cy.elements().boundingBox();

	        // Init components
	        that._initPanel();
	        that._initThumbnail();
	        that._initView();
	        that._initOverlay();
	      });

	      // Cache sizes
	      this.width = this.$element.width();
	      this.height = this.$element.height();
	    },

	    destroy: function () {
	      // If container is not created by navigator and its removal is prohibited
	      if (this.options.container && !this.options.removeCustomContainer) {
	        this.$panel.empty();
	      } else {
	        this.$panel.remove();
	      }
	      this.$element.removeData('navigator');
	    },

	  /****************************
	    Navigator elements functions
	  ****************************/

	    /*
	     * Used inner attributes
	     *
	     * w {number} width
	     * h {number} height
	     */
	    _initPanel: function () {
	      var options = this.options;

	      if( options.container ) {
	        if( options.container instanceof jQuery ){
	          if( options.container.length > 0 ){
	            this.$panel = options.container.first();
	          } else {
	            $.error("Container for jquery.cyNavigator is empty");
	            return;
	          }
	        } else if ( $(options.container).length > 0 ) {
	          this.$panel = $(options.container).first();
	        } else {
	          $.error("There is no any element matching your selector for jquery.cyNavigator");
	          return;
	        }
	      } else {
	        this.$panel = $('<div class="cytoscape-navigator"/>');
	        $('body').append(this.$panel);
	      }

	      this._setupPanel();

	      this.cy.on('resize', $.proxy(this.resize, this));
	    },

	    _setupPanel: function () {
	      var options = this.options;

	      // Cache sizes
	      this.panelWidth = this.$panel.width();
	      this.panelHeight = this.$panel.height();
	    },

	    /*
	     * Used inner attributes
	     *
	     * zoom {number}
	     * pan {object} - {x: 0, y: 0}
	     */
	    _initThumbnail: function () {
	      // Create thumbnail
	      this.$thumbnail = $('<canvas/>');

	      // Add thumbnail canvas to the DOM
	      this.$panel.append(this.$thumbnail);

	      // Setup thumbnail
	      this._setupThumbnailSizes();
	      this._setupThumbnail();

	      // Repopulate thumbnail after graph render
	      this.cy.on('initrender', $.proxy(this._checkThumbnailSizesAndUpdate, this));

	      // Thumbnail updates
	      if (this.options.thumbnailLiveFramerate === false) {
	        this._hookGraphUpdates();
	      } else {
	        this._setGraphUpdatesTimer();
	      }
	    },

	    _setupThumbnail: function () {

	      // Setup Canvas
	      if( !this._thumbnailSetup ){ // only need to setup once
	        this.$thumbnail.attr('width', this.panelWidth);
	        this.$thumbnail.attr('height', this.panelHeight);
	        this._thumbnailSetup = true;
	      }

	      this._updateThumbnailImage();
	    },

	    _setupThumbnailSizes: function () {
	      // Update bounding box cache
	      this.boundingBox = this.cy.elements().boundingBox();

	      this.thumbnailZoom = Math.min(this.panelHeight / this.boundingBox.h,
	                                    this.panelWidth / this.boundingBox.w);

	      // Used on thumbnail generation
	      this.thumbnailPan = {
	        x: (this.panelWidth - this.thumbnailZoom *
	           (this.boundingBox.x1 + this.boundingBox.x2))/2,
	        y: (this.panelHeight - this.thumbnailZoom *
	           (this.boundingBox.y1 + this.boundingBox.y2))/2,
	      };
	    },

	    // If bounding box has changed then update sizes
	    // Otherwise just update the thumbnail
	    _checkThumbnailSizesAndUpdate: function () {
	      // Cache previous values
	      var _zoom = this.thumbnailZoom,
	          _pan_x = this.thumbnailPan.x,
	          _pan_y = this.thumbnailPan.y;

	      this._setupThumbnailSizes();

	      if (_zoom !== this.thumbnailZoom || _pan_x !== this.thumbnailPan.x ||
	          _pan_y !== this.thumbnailPan.y) {
	        this._setupThumbnail();
	        this._setupView();
	      } else {
	        this._updateThumbnailImage();
	      }
	    },

	    /*
	     * Used inner attributes
	     *
	     * w {number} width
	     * h {number} height
	     * x {number}
	     * y {number}
	     * borderWidth {number}
	     * locked {boolean}
	     */
	    _initView: function () {
	      var that = this;

	      that.$view = $('<div class="cytoscape-navigatorView"/>');
	      that.$panel.append(this.$view);

	      // Compute borders
	      that.viewBorderTop = parseInt(this.$view.css('border-top-width'), 10);
	      that.viewBorderRight = parseInt(this.$view.css('border-right-width'), 10);
	      that.viewBorderBottom = parseInt(this.$view.css('border-bottom-width'), 10);
	      that.viewBorderLeft = parseInt(this.$view.css('border-left-width'), 10);

	      // Abstract borders
	      that.viewBorderHorizontal = this.viewBorderLeft + this.viewBorderRight;
	      that.viewBorderVertical = this.viewBorderTop + this.viewBorderBottom;

	      that._setupView();

	      // Hook graph zoom and pan
	      that.cy.on('zoom pan', $.proxy(this._setupView, this));
	    },

	    _setupView: function () {
	      if (this.viewLocked) {
	        return;
	      }

	      var cyZoom = this.cy.zoom(),
	          cyPan = this.cy.pan();

	      // Horizontal computation
	      this.viewW = this.width / cyZoom * this.thumbnailZoom;
	      this.viewX = -cyPan.x * this.viewW / this.width +
	                   this.thumbnailPan.x - this.viewBorderLeft;

	      // Vertical computation
	      this.viewH = this.height / cyZoom * this.thumbnailZoom;
	      this.viewY = -cyPan.y * this.viewH / this.height +
	                   this.thumbnailPan.y - this.viewBorderTop;

	      // CSS view
	      this.$view
	        .width(this.viewW)
	        .height(this.viewH)
	        .css({
	          left: this.viewX,
	          top: this.viewY
	        });
	    },

	    /*
	     * Used inner attributes
	     *
	     * timeout {number} used to keep stable frame rate
	     * lastMoveStartTime {number}
	     * inMovement {boolean}
	     * hookPoint {object} {x: 0, y: 0}
	     */
	    _initOverlay: function () {
	      // Used to capture mouse events
	      this.$overlay = $('<div class="cytoscape-navigatorOverlay"/>');

	      // Add overlay to the DOM
	      this.$panel.append(this.$overlay);

	      // Init some attributes
	      this.overlayHookPointX = 0;
	      this.overlayHookPointY = 0;

	      // Listen for events
	      this._initEventsHandling();
	    },

	    /****************************
	      Event handling functions
	    ****************************/

	    resize: function () {
	      // Cache sizes
	      this.width = this.$element.width();
	      this.height = this.$element.height();

	      this._thumbnailSetup = false;
	      this._setupPanel();
	      this._checkThumbnailSizesAndUpdate();
	      this._setupView();
	    },

	    _initEventsHandling: function () {
	      var that = this,
	          eventsLocal = [
	          // Mouse events
	            'mousedown',
	            'mousewheel',
	            'DOMMouseScroll', // Mozilla specific event
	          // Touch events
	            'touchstart',
	          ],
	        eventsGlobal = [
	          'mouseup',
	          'mouseout',
	          'mousemove',
	        // Touch events
	          'touchmove',
	          'touchend',
	        ];

	      // handle events and stop their propagation
	      this.$overlay.on(eventsLocal.join(' '), function (ev) {
	        // Touch events
	        if (ev.type === 'touchstart') {
	          // Will count as middle of View
	          ev.offsetX = that.viewX + that.viewW / 2;
	          ev.offsetY = that.viewY + that.viewH / 2;
	        }

	        // Normalize offset for browsers which do not provide that value
	        if (ev.offsetX === undefined || ev.offsetY === undefined) {
	          var targetOffset = $(ev.target).offset();
	          ev.offsetX = ev.pageX - targetOffset.left;
	          ev.offsetY = ev.pageY - targetOffset.top;
	        }

	        if (ev.type === 'mousedown' || ev.type === 'touchstart') {
	          that._eventMoveStart(ev);
	        } else if (ev.type === 'mousewheel' || ev.type === 'DOMMouseScroll') {
	          that._eventZoom(ev);
	        }

	        // Prevent default and propagation
	        // Don't use peventPropagation as it breaks mouse events
	        return false;
	      });

	      // Hook global events
	      $(window).on(eventsGlobal.join(' '), function (ev) {
	        // Do not make any computations if it is has no effect on Navigator
	        if (!that.overlayInMovement) {
	          return;
	        }

	        // Touch events
	        if (ev.type === 'touchend') {
	          // Will count as middle of View
	          ev.offsetX = that.viewX + that.viewW / 2;
	          ev.offsetY = that.viewY + that.viewH / 2;
	        } else if (ev.type === 'touchmove') {
	          // Hack - we take in account only first touch
	          ev.pageX = ev.originalEvent.touches[0].pageX;
	          ev.pageY = ev.originalEvent.touches[0].pageY;
	        }

	        // Normalize offset for browsers which do not provide that value
	        if (ev.offsetX === undefined || ev.offsetY === undefined) {
	          var targetOffset = $(ev.target).offset();
	          ev.offsetX = ev.pageX - targetOffset.left;
	          ev.offsetY = ev.pageY - targetOffset.top;
	        }

	        // Translate global events into local coordinates
	        if (ev.target !== that.$overlay[0]) {
	          var targetOffset = $(ev.target).offset(),
	              overlayOffset = that.$overlay.offset();

	          ev.offsetX = ev.offsetX - overlayOffset.left + targetOffset.left;
	          ev.offsetY = ev.offsetY - overlayOffset.top + targetOffset.top;
	        }

	        if (ev.type === 'mousemove' || ev.type === 'touchmove') {
	          that._eventMove(ev);
	        } else if (ev.type === 'mouseup' || ev.type === 'touchend') {
	          that._eventMoveEnd(ev);
	        }

	        // Prevent default and propagation
	        // Don't use peventPropagation as it breaks mouse events
	        return false;
	      });
	    },

	    _eventMoveStart: function (ev) {
	      var now = new Date().getTime();

	      // Check if it was double click
	      if (this.overlayLastMoveStartTime &&
	          this.overlayLastMoveStartTime + this.options.dblClickDelay > now) {
	        // Reset lastMoveStartTime
	        this.overlayLastMoveStartTime = 0;
	        // Enable View in order to move it to the center
	        this.overlayInMovement = true;

	        // Set hook point as View center
	        this.overlayHookPointX = this.viewW / 2;
	        this.overlayHookPointY = this.viewH / 2;

	        // Move View to start point
	        if (this.options.viewLiveFramerate !== false) {
	          this._eventMove({
	            offsetX: this.panelWidth / 2,
	            offsetY: this.panelHeight / 2
	          });
	        } else {
	          this._eventMoveEnd({
	            offsetX: this.panelWidth / 2,
	            offsetY: this.panelHeight / 2
	          });
	        }

	        // View should be inactive as we don't want to move it right after double click
	        this.overlayInMovement = false;
	      }
	      // This is a single click
	      // Take care as single click happens before double click 2 times
	      else {
	        this.overlayLastMoveStartTime = now;
	        this.overlayInMovement = true;
	        // Lock view moving caused by cy events
	        this.viewLocked = true;

	        // if event started in View
	        if (ev.offsetX >= this.viewX && ev.offsetX <= this.viewX + this.viewW &&
	            ev.offsetY >= this.viewY && ev.offsetY <= this.viewY + this.viewH
	        ) {
	          this.overlayHookPointX = ev.offsetX - this.viewX;
	          this.overlayHookPointY = ev.offsetY - this.viewY;
	        }
	        // if event started in Thumbnail (outside of View)
	        else {
	          // Set hook point as View center
	          this.overlayHookPointX = this.viewW / 2;
	          this.overlayHookPointY = this.viewH / 2;

	          // Move View to start point
	          this._eventMove(ev);
	        }
	      }
	    },

	    _eventMove: function (ev) {
	      var that = this;

	      this._checkMousePosition(ev);

	      // break if it is useless event
	      if (!this.overlayInMovement) {
	        return;
	      }

	      // Update cache
	      this.viewX = ev.offsetX - this.overlayHookPointX;
	      this.viewY = ev.offsetY - this.overlayHookPointY;

	      // Update view position
	      this.$view.css('left', this.viewX);
	      this.$view.css('top', this.viewY);

	      // Move Cy
	      if (this.options.viewLiveFramerate !== false) {
	        // trigger instantly
	        if (this.options.viewLiveFramerate === 0) {
	          this._moveCy();
	        }
	        // trigger less often than frame rate
	        else if (!this.overlayTimeout) {
	          // Set a timeout for graph movement
	          this.overlayTimeout = setTimeout(function () {
	            that._moveCy();
	            that.overlayTimeout = false;
	          }, 1000/this.options.viewLiveFramerate);
	        }
	      }
	    },

	    _checkMousePosition: function (ev) {
	      // If mouse in over View
	      if(ev.offsetX > this.viewX && ev.offsetX < this.viewX + this.viewBorderHorizontal + this.viewW &&
	         ev.offsetY > this.viewY && ev.offsetY < this.viewY + this.viewBorderVertical + this.viewH) {
	        this.$panel.addClass('mouseover-view');
	      } else {
	        this.$panel.removeClass('mouseover-view');
	      }
	    },

	    _eventMoveEnd: function (ev) {
	      // Unlock view changing caused by graph events
	      this.viewLocked = false;

	      // Remove class when mouse is not over Navigator
	      this.$panel.removeClass('mouseover-view');

	      if (!this.overlayInMovement) {
	        return;
	      }

	      // Trigger one last move
	      this._eventMove(ev);

	      // If mode is not live then move graph on drag end
	      if (this.options.viewLiveFramerate === false) {
	        this._moveCy();
	      }

	      // Stop movement permission
	      this.overlayInMovement = false;
	    },

	    _eventZoom: function (ev) {
	      var zoomRate = Math.pow(10, ev.originalEvent.wheelDeltaY / 1000 ||
	                                  ev.originalEvent.wheelDelta / 1000 ||
	                                  ev.originalEvent.detail / -32),
	          mousePosition = {
	            left: ev.offsetX,
	            top: ev.offsetY
	          };

	      if (this.cy.zoomingEnabled()) {
	        this._zoomCy(zoomRate, mousePosition);
	      }
	    },

	    _hookGraphUpdates: function () {
	      this.cy.on('position add remove data style', $.proxy(this._checkThumbnailSizesAndUpdate, this, false));
	    },

	    _setGraphUpdatesTimer: function () {
	      var delay = 1000.0 / this.options.thumbnailLiveFramerate,
	          that = this,
	          updateFunction = function () {
	            // Use timeout instead of interval as it is not accumulating events if events pool is not processed fast enough
	            setTimeout(function (){
	              that._checkThumbnailSizesAndUpdate(true);
	              updateFunction();
	            }, delay);
	          };

	      // Init infinite loop
	      updateFunction();
	    },

	    _updateThumbnailImage: function (force_refresh) {
	    var that = this;

	    if( this._thumbnailUpdating ){
	      return;
	    }

	    this._thumbnailUpdating = true;


	    var raf = !window ? null : (window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame);

	    raf = raf || function (fn) {
	      if (fn) {
	        setTimeout(fn, 1000 / 60);
	      }
	    };

	    var requestAnimationFrame = function(fn){
	      raf(fn);
	    };

	    var render = function(){
	      var canvas = that.$thumbnail[0];
	      var cxt = canvas.getContext('2d');

	      var w = that.panelWidth;
	      var h = that.panelHeight;
	      var bb = that.boundingBox;
	      var zoom = Math.min(w/bb.w, h/bb.h);
	      var pxRatio = 1;
	      var pan = {
	        x: (w - zoom*( bb.x1 + bb.x2 ))/2,
	        y: (h - zoom*( bb.y1 + bb.y2 ))/2
	      };


	      cxt.setTransform(1, 0, 0, 1, 0, 0);
	      cxt.clearRect(0, 0, w, h);

	      // Copy scaled thumbnail to buffer
	      that.cy.renderTo(cxt, zoom, pan, pxRatio);

	      requestAnimationFrame( render );
	    };

	    requestAnimationFrame( render );

	  },

	  /****************************
	    Navigator view moving
	  ****************************/

	    _moveCy: function () {
	      this.cy.pan({
	        x: -(this.viewX + this.viewBorderLeft - this.thumbnailPan.x) * this.width / this.viewW,
	        y: -(this.viewY + this.viewBorderLeft - this.thumbnailPan.y) * this.height / this.viewH
	      });
	    },

	  /**
	   * Zooms graph.
	   *
	   * @this {cytoscapeNavigator}
	   * @param {number} zoomRate The zoom rate value. 1 is 100%.
	   */
	    _zoomCy: function (zoomRate, zoomCenterRaw) {
	      var zoomCenter,
	          isZoomCenterInView = false;

	      zoomCenter = {
	        x: this.width / 2,
	        y: this.height / 2
	      };

	      this.cy.zoom({
	        level: this.cy.zoom() * zoomRate,
	        renderedPosition: zoomCenter
	      });
	    }
	  };

	  $.fn.cytoscapeNavigator = function ( option ) {
	    var _arguments = arguments;

	    return this.each(function () {
	      var $this = $(this),
	          data = $this.data('navigator'),
	          options = typeof option == 'object' && option;

	      if (!data) {
	        $this.data('navigator', (data = new Navigator(this, options)));
	      }

	      if (typeof option === 'string') {
	        if (data[option] === undefined) {
	          $.error("cyNavigator has no such method");
	        } else if (typeof data[option] !== typeof function(){}) {
	          $.error("cyNavigator."+option+" is not a function");
	        } else if (option.charAt(0) == '_') {
	          $.error("cyNavigator." + option + " is a private function");
	        } else {
	          data[option].call(data, Array.prototype.slice.call(_arguments, 1));
	        }
	      }
	    });
	  };

	  $.fn.cytoscapeNavigator.Constructor = Navigator;

	  $.fn.cytoscapeNavigator.defaults = {
	    container: false, // can be a HTML or jQuery element or jQuery selector
	    viewLiveFramerate: 0, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
	    thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
	    thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set false to disable
	    dblClickDelay: 200, // milliseconds
	    removeCustomContainer: true, // destroy the container specified by user on plugin destroy
	  };

	  $.fn.cyNavigator = $.fn.cytoscapeNavigator;

	  $$('core', 'navigator', function( options ){
	    var cy = this;

	    $( cy.container() ).cytoscapeNavigator( options );
	  });

	}
	})();


/***/ }
/******/ ])
});
;