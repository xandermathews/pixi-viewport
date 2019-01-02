'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('./utils');
var Drag = require('./drag');
var Pinch = require('./pinch');
var Clamp = require('./clamp');
var ClampZoom = require('./clamp-zoom');
var Decelerate = require('./decelerate');
var Bounce = require('./bounce');
var Snap = require('./snap');
var SnapZoom = require('./snap-zoom');
var Follow = require('./follow');
var Wheel = require('./wheel');
var MouseEdges = require('./mouse-edges');

var PLUGIN_ORDER = ['drag', 'pinch', 'wheel', 'follow', 'mouse-edges', 'decelerate', 'bounce', 'snap-zoom', 'clamp-zoom', 'snap', 'clamp'];

var Viewport = function (_PIXI$Container) {
    _inherits(Viewport, _PIXI$Container);

    /**
     * @extends PIXI.Container
     * @extends EventEmitter
     * @param {object} [options]
     * @param {number} [options.screenWidth=window.innerWidth]
     * @param {number} [options.screenHeight=window.innerHeight]
     * @param {number} [options.worldWidth=this.width]
     * @param {number} [options.worldHeight=this.height]
     * @param {number} [options.threshold=5] number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
     * @param {boolean} [options.passiveWheel=true] whether the 'wheel' event is set to passive
     * @param {boolean} [options.stopPropagation=false] whether to stopPropagation of events that impact the viewport
     * @param {(PIXI.Rectangle|PIXI.Circle|PIXI.Ellipse|PIXI.Polygon|PIXI.RoundedRectangle)} [options.forceHitArea] change the default hitArea from world size to a new value
     * @param {boolean} [options.noTicker] set this if you want to manually call update() function on each frame
     * @param {PIXI.ticker.Ticker} [options.ticker=PIXI.ticker.shared] use this PIXI.ticker for updates
     * @param {PIXI.InteractionManager} [options.interaction=null] InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer postion relative to canvas location on screen
     * @param {HTMLElement} [options.divWheel=document.body] div to attach the wheel event
     * @fires clicked
     * @fires drag-start
     * @fires drag-end
     * @fires drag-remove
     * @fires pinch-start
     * @fires pinch-end
     * @fires pinch-remove
     * @fires snap-start
     * @fires snap-end
     * @fires snap-remove
     * @fires snap-zoom-start
     * @fires snap-zoom-end
     * @fires snap-zoom-remove
     * @fires bounce-x-start
     * @fires bounce-x-end
     * @fires bounce-y-start
     * @fires bounce-y-end
     * @fires bounce-remove
     * @fires wheel
     * @fires wheel-remove
     * @fires wheel-scroll
     * @fires wheel-scroll-remove
     * @fires mouse-edge-start
     * @fires mouse-edge-end
     * @fires mouse-edge-remove
     * @fires moved
     * @fires moved-end
     * @fires zoomed
     * @fires zoomed-end
     */
    function Viewport(options) {
        _classCallCheck(this, Viewport);

        options = options || {};

        var _this = _possibleConstructorReturn(this, (Viewport.__proto__ || Object.getPrototypeOf(Viewport)).call(this));

        _this.plugins = {};
        _this.pluginsList = [];
        _this._screenWidth = options.screenWidth;
        _this._screenHeight = options.screenHeight;
        _this._worldWidth = options.worldWidth;
        _this._worldHeight = options.worldHeight;
        _this.hitAreaFullScreen = utils.defaults(options.hitAreaFullScreen, true);
        _this.forceHitArea = options.forceHitArea;
        _this.passiveWheel = utils.defaults(options.passiveWheel, true);
        _this.stopEvent = options.stopPropagation;
        _this.threshold = utils.defaults(options.threshold, 5);
        _this.interaction = options.interaction || null;
        _this.div = options.divWheel || document.body;
        _this.listeners(_this.div);

        /**
         * active touch point ids on the viewport
         * @type {number[]}
         * @readonly
         */
        _this.touches = [];

        if (!options.noTicker) {
            _this.ticker = options.ticker || PIXI.ticker.shared;
            _this.tickerFunction = function () {
                return _this.update(_this.ticker.elapsedMS);
            };
            _this.ticker.add(_this.tickerFunction);
        }
        return _this;
    }

    /**
     * removes all event listeners from viewport
     * (useful for cleanup of wheel and ticker events when removing viewport)
     */


    _createClass(Viewport, [{
        key: 'removeListeners',
        value: function removeListeners() {
            this.ticker.remove(this.tickerFunction);
            this.div.removeEventListener('wheel', this.wheelFunction);
        }

        /**
         * overrides PIXI.Container's destroy to also remove the 'wheel' and PIXI.Ticker listeners
         */

    }, {
        key: 'destroy',
        value: function destroy(options) {
            _get(Viewport.prototype.__proto__ || Object.getPrototypeOf(Viewport.prototype), 'destroy', this).call(this, options);
            this.removeListeners();
        }

        /**
         * update viewport on each frame
         * by default, you do not need to call this unless you set options.noTicker=true
         */

    }, {
        key: 'update',
        value: function update(elapsed) {
            if (!this.pause) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.pluginsList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var plugin = _step.value;

                        plugin.update(elapsed);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                if (this.lastViewport) {
                    // check for moved-end event
                    if (this.lastViewport.x !== this.x || this.lastViewport.y !== this.y) {
                        this.moving = true;
                    } else {
                        if (this.moving) {
                            this.emit('moved-end', this);
                            this.moving = false;
                        }
                    }
                    // check for zoomed-end event
                    if (this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y) {
                        this.zooming = true;
                    } else {
                        if (this.zooming) {
                            this.emit('zoomed-end', this);
                            this.zooming = false;
                        }
                    }
                }

                if (!this.forceHitArea) {
                    this.hitArea.x = this.left;
                    this.hitArea.y = this.top;
                    this.hitArea.width = this.worldScreenWidth;
                    this.hitArea.height = this.worldScreenHeight;
                }
                this._dirty = this._dirty || !this.lastViewport || this.lastViewport.x !== this.x || this.lastViewport.y !== this.y || this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y;
                this.lastViewport = {
                    x: this.x,
                    y: this.y,
                    scaleX: this.scale.x,
                    scaleY: this.scale.y
                };
            }
        }

        /**
         * use this to set screen and world sizes--needed for pinch/wheel/clamp/bounce
         * @param {number} [screenWidth=window.innerWidth]
         * @param {number} [screenHeight=window.innerHeight]
         * @param {number} [worldWidth]
         * @param {number} [worldHeight]
         */

    }, {
        key: 'resize',
        value: function resize(screenWidth, screenHeight, worldWidth, worldHeight) {
            this._screenWidth = screenWidth || window.innerWidth;
            this._screenHeight = screenHeight || window.innerHeight;
            if (worldWidth) {
                this._worldWidth = worldWidth;
            }
            if (worldHeight) {
                this._worldHeight = worldHeight;
            }
            this.resizePlugins();
        }

        /**
         * called after a worldWidth/Height change
         * @private
         */

    }, {
        key: 'resizePlugins',
        value: function resizePlugins() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.pluginsList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var plugin = _step2.value;

                    plugin.resize();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }

        /**
         * screen width in screen pixels
         * @type {number}
         */

    }, {
        key: 'getVisibleBounds',


        /**
         * get visible bounds of viewport
         * @return {object} bounds { x, y, width, height }
         */
        value: function getVisibleBounds() {
            return { x: this.left, y: this.top, width: this.worldScreenWidth, height: this.worldScreenHeight };
        }

        /**
         * add input listeners
         * @private
         */

    }, {
        key: 'listeners',
        value: function listeners(div) {
            var _this2 = this;

            this.interactive = true;
            if (!this.forceHitArea) {
                this.hitArea = new PIXI.Rectangle(0, 0, this.worldWidth, this.worldHeight);
            }
            this.on('pointerdown', this.down);
            this.on('pointermove', this.move);
            this.on('pointerup', this.up);
            this.on('pointerupoutside', this.up);
            this.on('pointercancel', this.up);
            this.on('pointerout', this.up);
            this.wheelFunction = function (e) {
                return _this2.handleWheel(e);
            };
            div.addEventListener('wheel', this.wheelFunction, { passive: this.passiveWheel });
            this.leftDown = false;
        }

        /**
         * handle down events
         * @private
         */

    }, {
        key: 'down',
        value: function down(e) {
            if (this.pause) {
                return;
            }
            if (e.data.pointerType === 'mouse') {
                if (e.data.originalEvent.button == 0) {
                    this.leftDown = true;
                }
            } else {
                this.touches.push(e.data.pointerId);
            }

            if (this.countDownPointers() === 1) {
                this.last = { x: e.data.global.x, y: e.data.global.y

                    // clicked event does not fire if viewport is decelerating or bouncing
                };var decelerate = this.plugins['decelerate'];
                var bounce = this.plugins['bounce'];
                if ((!decelerate || !decelerate.isActive()) && (!bounce || !bounce.isActive())) {
                    this.clickedAvailable = true;
                } else {
                    this.clickedAvailable = false;
                }
            } else {
                this.clickedAvailable = false;
            }

            var stop = void 0;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.pluginsList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var plugin = _step3.value;

                    if (plugin.down(e)) {
                        stop = true;
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            if (stop && this.stopEvent) {
                e.stopPropagation();
            }
        }

        /**
         * whether change exceeds threshold
         * @private
         * @param {number} change
         */

    }, {
        key: 'checkThreshold',
        value: function checkThreshold(change) {
            if (Math.abs(change) >= this.threshold) {
                return true;
            }
            return false;
        }

        /**
         * handle move events
         * @private
         */

    }, {
        key: 'move',
        value: function move(e) {
            if (this.pause) {
                return;
            }

            var stop = void 0;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.pluginsList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var plugin = _step4.value;

                    if (plugin.move(e)) {
                        stop = true;
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            if (this.clickedAvailable) {
                var distX = e.data.global.x - this.last.x;
                var distY = e.data.global.y - this.last.y;
                if (this.checkThreshold(distX) || this.checkThreshold(distY)) {
                    this.clickedAvailable = false;
                }
            }

            if (stop && this.stopEvent) {
                e.stopPropagation();
            }
        }

        /**
         * handle up events
         * @private
         */

    }, {
        key: 'up',
        value: function up(e) {
            if (this.pause) {
                return;
            }

            if (e.data.originalEvent instanceof MouseEvent && e.data.originalEvent.button == 0) {
                this.leftDown = false;
            }

            if (e.data.pointerType !== 'mouse') {
                for (var i = 0; i < this.touches.length; i++) {
                    if (this.touches[i] === e.data.pointerId) {
                        this.touches.splice(i, 1);
                        break;
                    }
                }
            }

            var stop = void 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.pluginsList[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var plugin = _step5.value;

                    if (plugin.up(e)) {
                        stop = true;
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            if (this.clickedAvailable && this.countDownPointers() === 0) {
                // console.error("clicked");
                this.emit('clicked', { screen: this.last, world: this.toWorld(this.last), viewport: this });
                this.clickedAvailable = false;
            }

            if (stop && this.stopEvent) {
                e.stopPropagation();
            }
        }

        /**
         * gets pointer position if this.interaction is set
         * @param {UIEvent} evt
         * @private
         */

    }, {
        key: 'getPointerPosition',
        value: function getPointerPosition(evt) {
            var point = new PIXI.Point();
            if (this.interaction) {
                this.interaction.mapPositionToPoint(point, evt.clientX, evt.clientY);
            } else {
                point.x = evt.clientX;
                point.y = evt.clientY;
            }
            return point;
        }

        /**
         * handle wheel events
         * @private
         */

    }, {
        key: 'handleWheel',
        value: function handleWheel(e) {
            if (this.pause) {
                return;
            }

            // only handle wheel events where the mouse is over the viewport
            var point = this.toLocal(this.getPointerPosition(e));
            if (this.left <= point.x && point.x <= this.right && this.top <= point.y && point.y <= this.bottom) {
                var result = void 0;
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = this.pluginsList[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var plugin = _step6.value;

                        if (plugin.wheel(e)) {
                            result = true;
                        }
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                return result;
            }
        }

        /**
         * change coordinates from screen to world
         * @param {number|PIXI.Point} x
         * @param {number} [y]
         * @returns {PIXI.Point}
         */

    }, {
        key: 'toWorld',
        value: function toWorld() {
            if (arguments.length === 2) {
                var x = arguments[0];
                var y = arguments[1];
                return this.toLocal({ x: x, y: y });
            } else {
                return this.toLocal(arguments[0]);
            }
        }

        /**
         * change coordinates from world to screen
         * @param {number|PIXI.Point} x
         * @param {number} [y]
         * @returns {PIXI.Point}
         */

    }, {
        key: 'toScreen',
        value: function toScreen() {
            if (arguments.length === 2) {
                var x = arguments[0];
                var y = arguments[1];
                return this.toGlobal({ x: x, y: y });
            } else {
                var point = arguments[0];
                return this.toGlobal(point);
            }
        }

        /**
         * screen width in world coordinates
         * @type {number}
         * @readonly
         */

    }, {
        key: 'moveCenter',


        /**
         * move center of viewport to point
         * @param {(number|PIXI.PointLike)} x or point
         * @param {number} [y]
         * @return {Viewport} this
         */
        value: function moveCenter() /*x, y | PIXI.Point*/{
            var x = void 0,
                y = void 0;
            if (!isNaN(arguments[0])) {
                x = arguments[0];
                y = arguments[1];
            } else {
                x = arguments[0].x;
                y = arguments[0].y;
            }
            this.position.set((this.worldScreenWidth / 2 - x) * this.scale.x, (this.worldScreenHeight / 2 - y) * this.scale.y);
            this._reset();
            return this;
        }

        /**
         * top-left corner
         * @type {PIXI.PointLike}
         */

    }, {
        key: 'moveCorner',


        /**
         * move viewport's top-left corner; also clamps and resets decelerate and bounce (as needed)
         * @param {number|PIXI.Point} x|point
         * @param {number} y
         * @return {Viewport} this
         */
        value: function moveCorner() /*x, y | point*/{
            if (arguments.length === 1) {
                this.position.set(-arguments[0].x * this.scale.x, -arguments[0].y * this.scale.y);
            } else {
                this.position.set(-arguments[0] * this.scale.x, -arguments[1] * this.scale.y);
            }
            this._reset();
            return this;
        }

        /**
         * change zoom so the width fits in the viewport
         * @param {number} [width=this._worldWidth] in world coordinates
         * @param {boolean} [center] maintain the same center
         * @param {boolean} [scaleY=true] whether to set scaleY=scaleX
         * @param {boolean} [noClamp=false] whether to disable clamp-zoom
         * @return {Viewport} this
         */

    }, {
        key: 'fitWidth',
        value: function fitWidth(width, center) {
            var scaleY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var noClamp = arguments[3];

            var save = void 0;
            if (center) {
                save = this.center;
            }
            width = width || this.worldWidth;
            this.scale.x = this.screenWidth / width;

            if (scaleY) {
                this.scale.y = this.scale.x;
            }

            var clampZoom = this.plugins['clamp-zoom'];
            if (!noClamp && clampZoom) {
                clampZoom.clamp();
            }

            if (center) {
                this.moveCenter(save);
            }
            return this;
        }

        /**
         * change zoom so the height fits in the viewport
         * @param {number} [height=this._worldHeight] in world coordinates
         * @param {boolean} [center] maintain the same center of the screen after zoom
         * @param {boolean} [scaleX=true] whether to set scaleX = scaleY
         * @param {boolean} [noClamp=false] whether to disable clamp-zoom
         * @return {Viewport} this
         */

    }, {
        key: 'fitHeight',
        value: function fitHeight(height, center) {
            var scaleX = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var noClamp = arguments[3];

            var save = void 0;
            if (center) {
                save = this.center;
            }
            height = height || this.worldHeight;
            this.scale.y = this.screenHeight / height;

            if (scaleX) {
                this.scale.x = this.scale.y;
            }

            var clampZoom = this.plugins['clamp-zoom'];
            if (!noClamp && clampZoom) {
                clampZoom.clamp();
            }

            if (center) {
                this.moveCenter(save);
            }
            return this;
        }

        /**
         * change zoom so it fits the entire world in the viewport
         * @param {boolean} [center] maintain the same center of the screen after zoom
         * @return {Viewport} this
         */

    }, {
        key: 'fitWorld',
        value: function fitWorld(center) {
            var save = void 0;
            if (center) {
                save = this.center;
            }
            this.scale.x = this.screenWidth / this.worldWidth;
            this.scale.y = this.screenHeight / this.worldHeight;
            if (this.scale.x < this.scale.y) {
                this.scale.y = this.scale.x;
            } else {
                this.scale.x = this.scale.y;
            }

            var clampZoom = this.plugins['clamp-zoom'];
            if (clampZoom) {
                clampZoom.clamp();
            }

            if (center) {
                this.moveCenter(save);
            }
            return this;
        }

        /**
         * change zoom so it fits the size or the entire world in the viewport
         * @param {boolean} [center] maintain the same center of the screen after zoom
         * @param {number} [width] desired width
         * @param {number} [height] desired height
         * @return {Viewport} this
         */

    }, {
        key: 'fit',
        value: function fit(center, width, height) {
            var save = void 0;
            if (center) {
                save = this.center;
            }
            width = width || this.worldWidth;
            height = height || this.worldHeight;
            this.scale.x = this.screenWidth / width;
            this.scale.y = this.screenHeight / height;
            if (this.scale.x < this.scale.y) {
                this.scale.y = this.scale.x;
            } else {
                this.scale.x = this.scale.y;
            }
            var clampZoom = this.plugins['clamp-zoom'];
            if (clampZoom) {
                clampZoom.clamp();
            }
            if (center) {
                this.moveCenter(save);
            }
            return this;
        }

        /**
         * zoom viewport by a certain percent (in both x and y direction)
         * @param {number} percent change (e.g., 0.25 would increase a starting scale of 1.0 to 1.25)
         * @param {boolean} [center] maintain the same center of the screen after zoom
         * @return {Viewport} the viewport
         */

    }, {
        key: 'zoomPercent',
        value: function zoomPercent(percent, center) {
            var save = void 0;
            if (center) {
                save = this.center;
            }
            var scale = this.scale.x + this.scale.x * percent;
            this.scale.set(scale);
            var clampZoom = this.plugins['clamp-zoom'];
            if (clampZoom) {
                clampZoom.clamp();
            }
            if (center) {
                this.moveCenter(save);
            }
            return this;
        }

        /**
         * zoom viewport by increasing/decreasing width by a certain number of pixels
         * @param {number} change in pixels
         * @param {boolean} [center] maintain the same center of the screen after zoom
         * @return {Viewport} the viewport
         */

    }, {
        key: 'zoom',
        value: function zoom(change, center) {
            this.fitWidth(change + this.worldScreenWidth, center);
            return this;
        }

        /**
         * @param {object} [options]
         * @param {number} [options.width] the desired width to snap (to maintain aspect ratio, choose only width or height)
         * @param {number} [options.height] the desired height to snap (to maintain aspect ratio, choose only width or height)
         * @param {number} [options.time=1000]
         * @param {string|function} [options.ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
         * @param {PIXI.Point} [options.center] place this point at center during zoom instead of center of the viewport
         * @param {boolean} [options.interrupt=true] pause snapping with any user input on the viewport
         * @param {boolean} [options.removeOnComplete] removes this plugin after snapping is complete
         * @param {boolean} [options.removeOnInterrupt] removes this plugin if interrupted by any user input
         * @param {boolean} [options.forceStart] starts the snap immediately regardless of whether the viewport is at the desired zoom
         * @param {boolean} [options.noMove] zoom but do not move
         */

    }, {
        key: 'snapZoom',
        value: function snapZoom(options) {
            this.plugins['snap-zoom'] = new SnapZoom(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * @private
         * @typedef OutOfBounds
         * @type {object}
         * @property {boolean} left
         * @property {boolean} right
         * @property {boolean} top
         * @property {boolean} bottom
         */

        /**
         * is container out of world bounds
         * @return {OutOfBounds}
         * @private
         */

    }, {
        key: 'OOB',
        value: function OOB() {
            var result = {};
            result.left = this.left < 0;
            result.right = this.right > this._worldWidth;
            result.top = this.top < 0;
            result.bottom = this.bottom > this._worldHeight;
            result.cornerPoint = {
                x: this._worldWidth * this.scale.x - this._screenWidth,
                y: this._worldHeight * this.scale.y - this._screenHeight
            };
            return result;
        }

        /**
         * world coordinates of the right edge of the screen
         * @type {number}
         */

    }, {
        key: 'countDownPointers',


        /**
         * count of mouse/touch pointers that are down on the viewport
         * @private
         * @return {number}
         */
        value: function countDownPointers() {
            return (this.leftDown ? 1 : 0) + this.touches.length;
        }

        /**
         * array of touch pointers that are down on the viewport
         * @private
         * @return {PIXI.InteractionTrackingData[]}
         */

    }, {
        key: 'getTouchPointers',
        value: function getTouchPointers() {
            var results = [];
            var pointers = this.trackedPointers;
            for (var key in pointers) {
                var pointer = pointers[key];
                if (this.touches.indexOf(pointer.pointerId) !== -1) {
                    results.push(pointer);
                }
            }
            return results;
        }

        /**
         * array of pointers that are down on the viewport
         * @private
         * @return {PIXI.InteractionTrackingData[]}
         */

    }, {
        key: 'getPointers',
        value: function getPointers() {
            var results = [];
            var pointers = this.trackedPointers;
            for (var key in pointers) {
                results.push(pointers[key]);
            }
            return results;
        }

        /**
         * clamps and resets bounce and decelerate (as needed) after manually moving viewport
         * @private
         */

    }, {
        key: '_reset',
        value: function _reset() {
            if (this.plugins['bounce']) {
                this.plugins['bounce'].reset();
                this.plugins['bounce'].bounce();
            }
            if (this.plugins['decelerate']) {
                this.plugins['decelerate'].reset();
            }
            if (this.plugins['snap']) {
                this.plugins['snap'].reset();
            }
            if (this.plugins['clamp']) {
                this.plugins['clamp'].update();
            }
            if (this.plugins['clamp-zoom']) {
                this.plugins['clamp-zoom'].clamp();
            }
        }

        // PLUGINS

        /**
         * Inserts a user plugin into the viewport
         * @param {string} name of plugin
         * @param {Plugin} plugin - instantiated Plugin class
         * @param {number} [index=last element] plugin is called current order: 'drag', 'pinch', 'wheel', 'follow', 'mouse-edges', 'decelerate', 'bounce', 'snap-zoom', 'clamp-zoom', 'snap', 'clamp'
         */

    }, {
        key: 'userPlugin',
        value: function userPlugin(name, plugin) {
            var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PLUGIN_ORDER.length;

            this.plugins[name] = plugin;
            var current = PLUGIN_ORDER.indexOf(name);
            if (current !== -1) {
                PLUGIN_ORDER.splice(current, 1);
            }
            PLUGIN_ORDER.splice(index, 0, name);
            this.pluginsSort();
        }

        /**
         * removes installed plugin
         * @param {string} type of plugin (e.g., 'drag', 'pinch')
         */

    }, {
        key: 'removePlugin',
        value: function removePlugin(type) {
            if (this.plugins[type]) {
                this.plugins[type] = null;
                this.emit(type + '-remove');
                this.pluginsSort();
            }
        }

        /**
         * pause plugin
         * @param {string} type of plugin (e.g., 'drag', 'pinch')
         */

    }, {
        key: 'pausePlugin',
        value: function pausePlugin(type) {
            if (this.plugins[type]) {
                this.plugins[type].pause();
            }
        }

        /**
         * resume plugin
         * @param {string} type of plugin (e.g., 'drag', 'pinch')
         */

    }, {
        key: 'resumePlugin',
        value: function resumePlugin(type) {
            if (this.plugins[type]) {
                this.plugins[type].resume();
            }
        }

        /**
         * sort plugins for updates
         * @private
         */

    }, {
        key: 'pluginsSort',
        value: function pluginsSort() {
            this.pluginsList = [];
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = PLUGIN_ORDER[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var plugin = _step7.value;

                    if (this.plugins[plugin]) {
                        this.pluginsList.push(this.plugins[plugin]);
                    }
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }
        }

        /**
         * enable one-finger touch to drag
         * @param {object} [options]
         * @param {string} [options.direction=all] direction to drag (all, x, or y)
         * @param {boolean} [options.wheel=true] use wheel to scroll in y direction (unless wheel plugin is active)
         * @param {number} [options.wheelScroll=10] number of pixels to scroll with each wheel spin
         * @param {boolean} [options.reverse] reverse the direction of the wheel scroll
         * @param {string} [options.underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
         */

    }, {
        key: 'drag',
        value: function drag(options) {
            this.plugins['drag'] = new Drag(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * clamp to world boundaries or other provided boundaries
         * NOTES:
         *   clamp is disabled if called with no options; use { direction: 'all' } for all edge clamping
         *   screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
         * @param {object} [options]
         * @param {(number|boolean)} [options.left] clamp left; true=0
         * @param {(number|boolean)} [options.right] clamp right; true=viewport.worldWidth
         * @param {(number|boolean)} [options.top] clamp top; true=0
         * @param {(number|boolean)} [options.bottom] clamp bottom; true=viewport.worldHeight
         * @param {string} [options.direction] (all, x, or y) using clamps of [0, viewport.worldWidth/viewport.worldHeight]; replaces left/right/top/bottom if set
         * @param {string} [options.underflow=center] (none OR (top/bottom/center and left/right/center) OR center) where to place world if too small for screen (e.g., top-right, center, none, bottomleft)
         * @return {Viewport} this
         */

    }, {
        key: 'clamp',
        value: function clamp(options) {
            this.plugins['clamp'] = new Clamp(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * decelerate after a move
         * @param {object} [options]
         * @param {number} [options.friction=0.95] percent to decelerate after movement
         * @param {number} [options.bounce=0.8] percent to decelerate when past boundaries (only applicable when viewport.bounce() is active)
         * @param {number} [options.minSpeed=0.01] minimum velocity before stopping/reversing acceleration
         * @return {Viewport} this
         */

    }, {
        key: 'decelerate',
        value: function decelerate(options) {
            this.plugins['decelerate'] = new Decelerate(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * bounce on borders
         * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
         * @param {object} [options]
         * @param {string} [options.sides=all] all, horizontal, vertical, or combination of top, bottom, right, left (e.g., 'top-bottom-right')
         * @param {number} [options.friction=0.5] friction to apply to decelerate if active
         * @param {number} [options.time=150] time in ms to finish bounce
         * @param {string|function} [options.ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
         * @param {string} [options.underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
         * @return {Viewport} this
         */

    }, {
        key: 'bounce',
        value: function bounce(options) {
            this.plugins['bounce'] = new Bounce(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * enable pinch to zoom and two-finger touch to drag
         * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
         * @param {number} [options.percent=1.0] percent to modify pinch speed
         * @param {boolean} [options.noDrag] disable two-finger dragging
         * @param {PIXI.Point} [options.center] place this point at center during zoom instead of center of two fingers
         * @return {Viewport} this
         */

    }, {
        key: 'pinch',
        value: function pinch(options) {
            this.plugins['pinch'] = new Pinch(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * snap to a point
         * @param {number} x
         * @param {number} y
         * @param {object} [options]
         * @param {boolean} [options.topLeft] snap to the top-left of viewport instead of center
         * @param {number} [options.friction=0.8] friction/frame to apply if decelerate is active
         * @param {number} [options.time=1000]
         * @param {string|function} [options.ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
         * @param {boolean} [options.interrupt=true] pause snapping with any user input on the viewport
         * @param {boolean} [options.removeOnComplete] removes this plugin after snapping is complete
         * @param {boolean} [options.removeOnInterrupt] removes this plugin if interrupted by any user input
         * @param {boolean} [options.forceStart] starts the snap immediately regardless of whether the viewport is at the desired location
         * @return {Viewport} this
         */

    }, {
        key: 'snap',
        value: function snap(x, y, options) {
            this.plugins['snap'] = new Snap(this, x, y, options);
            this.pluginsSort();
            return this;
        }

        /**
         * follow a target
         * NOTE: uses the (x, y) as the center to follow; for PIXI.Sprite to work properly, use sprite.anchor.set(0.5)
         * @param {PIXI.DisplayObject} target to follow (object must include {x: x-coordinate, y: y-coordinate})
         * @param {object} [options]
         * @param {number} [options.speed=0] to follow in pixels/frame (0=teleport to location)
         * @param {number} [options.radius] radius (in world coordinates) of center circle where movement is allowed without moving the viewport
         * @return {Viewport} this
         */

    }, {
        key: 'follow',
        value: function follow(target, options) {
            this.plugins['follow'] = new Follow(this, target, options);
            this.pluginsSort();
            return this;
        }

        /**
         * zoom using mouse wheel
         * @param {object} [options]
         * @param {number} [options.percent=0.1] percent to scroll with each spin
         * @param {boolean} [options.reverse] reverse the direction of the scroll
         * @param {PIXI.Point} [options.center] place this point at center during zoom instead of current mouse position
         * @return {Viewport} this
         */

    }, {
        key: 'wheel',
        value: function wheel(options) {
            this.plugins['wheel'] = new Wheel(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * enable clamping of zoom to constraints
         * NOTE: screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
         * @param {object} [options]
         * @param {number} [options.minWidth] minimum width
         * @param {number} [options.minHeight] minimum height
         * @param {number} [options.maxWidth] maximum width
         * @param {number} [options.maxHeight] maximum height
         * @return {Viewport} this
         */

    }, {
        key: 'clampZoom',
        value: function clampZoom(options) {
            this.plugins['clamp-zoom'] = new ClampZoom(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * Scroll viewport when mouse hovers near one of the edges or radius-distance from center of screen.
         * @param {object} [options]
         * @param {number} [options.radius] distance from center of screen in screen pixels
         * @param {number} [options.distance] distance from all sides in screen pixels
         * @param {number} [options.top] alternatively, set top distance (leave unset for no top scroll)
         * @param {number} [options.bottom] alternatively, set bottom distance (leave unset for no top scroll)
         * @param {number} [options.left] alternatively, set left distance (leave unset for no top scroll)
         * @param {number} [options.right] alternatively, set right distance (leave unset for no top scroll)
         * @param {number} [options.speed=8] speed in pixels/frame to scroll viewport
         * @param {boolean} [options.reverse] reverse direction of scroll
         * @param {boolean} [options.noDecelerate] don't use decelerate plugin even if it's installed
         * @param {boolean} [options.linear] if using radius, use linear movement (+/- 1, +/- 1) instead of angled movement (Math.cos(angle from center), Math.sin(angle from center))
         */

    }, {
        key: 'mouseEdges',
        value: function mouseEdges(options) {
            this.plugins['mouse-edges'] = new MouseEdges(this, options);
            this.pluginsSort();
            return this;
        }

        /**
         * pause viewport (including animation updates such as decelerate)
         * NOTE: when setting pause=true, all touches and mouse actions are cleared (i.e., if mousedown was active, it becomes inactive for purposes of the viewport)
         * @type {boolean}
         */

    }, {
        key: 'ensureVisible',


        /**
         * move the viewport so the bounding box is visible
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */
        value: function ensureVisible(x, y, width, height) {
            if (x < this.left) {
                this.left = x;
            } else if (x + width > this.right) {
                this.right = x + width;
            }
            if (y < this.top) {
                this.top = y;
            } else if (y + height > this.bottom) {
                this.bottom = y + height;
            }
        }
    }, {
        key: 'screenWidth',
        get: function get() {
            return this._screenWidth;
        },
        set: function set(value) {
            this._screenWidth = value;
        }

        /**
         * screen height in screen pixels
         * @type {number}
         */

    }, {
        key: 'screenHeight',
        get: function get() {
            return this._screenHeight;
        },
        set: function set(value) {
            this._screenHeight = value;
        }

        /**
         * world width in pixels
         * @type {number}
         */

    }, {
        key: 'worldWidth',
        get: function get() {
            if (this._worldWidth) {
                return this._worldWidth;
            } else {
                return this.width;
            }
        },
        set: function set(value) {
            this._worldWidth = value;
            this.resizePlugins();
        }

        /**
         * world height in pixels
         * @type {number}
         */

    }, {
        key: 'worldHeight',
        get: function get() {
            if (this._worldHeight) {
                return this._worldHeight;
            } else {
                return this.height;
            }
        },
        set: function set(value) {
            this._worldHeight = value;
            this.resizePlugins();
        }
    }, {
        key: 'worldScreenWidth',
        get: function get() {
            return this.screenWidth / this.scale.x;
        }

        /**
         * screen height in world coordinates
         * @type {number}
         * @readonly
         */

    }, {
        key: 'worldScreenHeight',
        get: function get() {
            return this.screenHeight / this.scale.y;
        }

        /**
         * world width in screen coordinates
         * @type {number}
         * @readonly
         */

    }, {
        key: 'screenWorldWidth',
        get: function get() {
            return this.worldWidth * this.scale.x;
        }

        /**
         * world height in screen coordinates
         * @type {number}
         * @readonly
         */

    }, {
        key: 'screenWorldHeight',
        get: function get() {
            return this.worldHeight * this.scale.y;
        }

        /**
         * get center of screen in world coordinates
         * @type {PIXI.PointLike}
         */

    }, {
        key: 'center',
        get: function get() {
            return { x: this.worldScreenWidth / 2 - this.x / this.scale.x, y: this.worldScreenHeight / 2 - this.y / this.scale.y };
        },
        set: function set(value) {
            this.moveCenter(value);
        }
    }, {
        key: 'corner',
        get: function get() {
            return { x: -this.x / this.scale.x, y: -this.y / this.scale.y };
        },
        set: function set(value) {
            this.moveCorner(value);
        }
    }, {
        key: 'right',
        get: function get() {
            return -this.x / this.scale.x + this.worldScreenWidth;
        },
        set: function set(value) {
            this.x = -value * this.scale.x + this.screenWidth;
            this._reset();
        }

        /**
         * world coordinates of the left edge of the screen
         * @type {number}
         */

    }, {
        key: 'left',
        get: function get() {
            return -this.x / this.scale.x;
        },
        set: function set(value) {
            this.x = -value * this.scale.x;
            this._reset();
        }

        /**
         * world coordinates of the top edge of the screen
         * @type {number}
         */

    }, {
        key: 'top',
        get: function get() {
            return -this.y / this.scale.y;
        },
        set: function set(value) {
            this.y = -value * this.scale.y;
            this._reset();
        }

        /**
         * world coordinates of the bottom edge of the screen
         * @type {number}
         */

    }, {
        key: 'bottom',
        get: function get() {
            return -this.y / this.scale.y + this.worldScreenHeight;
        },
        set: function set(value) {
            this.y = -value * this.scale.y + this.screenHeight;
            this._reset();
        }
        /**
         * determines whether the viewport is dirty (i.e., needs to be renderered to the screen because of a change)
         * @type {boolean}
         */

    }, {
        key: 'dirty',
        get: function get() {
            return this._dirty;
        },
        set: function set(value) {
            this._dirty = value;
        }

        /**
         * permanently changes the Viewport's hitArea
         * NOTE: normally the hitArea = PIXI.Rectangle(Viewport.left, Viewport.top, Viewport.worldScreenWidth, Viewport.worldScreenHeight)
         * @type {(PIXI.Rectangle|PIXI.Circle|PIXI.Ellipse|PIXI.Polygon|PIXI.RoundedRectangle)}
         */

    }, {
        key: 'forceHitArea',
        get: function get() {
            return this._forceHitArea;
        },
        set: function set(value) {
            if (value) {
                this._forceHitArea = value;
                this.hitArea = value;
            } else {
                this._forceHitArea = false;
                this.hitArea = new PIXI.Rectangle(0, 0, this.worldWidth, this.worldHeight);
            }
        }
    }, {
        key: 'pause',
        get: function get() {
            return this._pause;
        },
        set: function set(value) {
            this._pause = value;
            this.lastViewport = null;
            this.moving = false;
            this.zooming = false;
            if (value) {
                this.touches = [];
                this.leftDown = false;
            }
        }
    }]);

    return Viewport;
}(PIXI.Container);

/**
 * fires after a mouse or touch click
 * @event Viewport#clicked
 * @type {object}
 * @property {PIXI.PointLike} screen
 * @property {PIXI.PointLike} world
 * @property {Viewport} viewport
 */

/**
 * fires when a drag starts
 * @event Viewport#drag-start
 * @type {object}
 * @property {PIXI.PointLike} screen
 * @property {PIXI.PointLike} world
 * @property {Viewport} viewport
 */

/**
 * fires when a drag ends
 * @event Viewport#drag-end
 * @type {object}
 * @property {PIXI.PointLike} screen
 * @property {PIXI.PointLike} world
 * @property {Viewport} viewport
 */

/**
 * fires when a pinch starts
 * @event Viewport#pinch-start
 * @type {Viewport}
 */

/**
 * fires when a pinch end
 * @event Viewport#pinch-end
 * @type {Viewport}
 */

/**
 * fires when a snap starts
 * @event Viewport#snap-start
 * @type {Viewport}
 */

/**
 * fires when a snap ends
 * @event Viewport#snap-end
 * @type {Viewport}
 */

/**
 * fires when a snap-zoom starts
 * @event Viewport#snap-zoom-start
 * @type {Viewport}
 */

/**
 * fires when a snap-zoom ends
 * @event Viewport#snap-zoom-end
 * @type {Viewport}
 */

/**
 * fires when a bounce starts in the x direction
 * @event Viewport#bounce-x-start
 * @type {Viewport}
 */

/**
 * fires when a bounce ends in the x direction
 * @event Viewport#bounce-x-end
 * @type {Viewport}
 */

/**
 * fires when a bounce starts in the y direction
 * @event Viewport#bounce-y-start
 * @type {Viewport}
 */

/**
 * fires when a bounce ends in the y direction
 * @event Viewport#bounce-y-end
 * @type {Viewport}
 */

/**
 * fires when for a mouse wheel event
 * @event Viewport#wheel
 * @type {object}
 * @property {object} wheel
 * @property {number} wheel.dx
 * @property {number} wheel.dy
 * @property {number} wheel.dz
 * @property {Viewport} viewport
 */

/**
 * fires when a wheel-scroll occurs
 * @event Viewport#wheel-scroll
 * @type {Viewport}
 */

/**
 * fires when a mouse-edge starts to scroll
 * @event Viewport#mouse-edge-start
 * @type {Viewport}
 */

/**
 * fires when the mouse-edge scrolling ends
 * @event Viewport#mouse-edge-end
 * @type {Viewport}
 */

/**
 * fires when viewport moves through UI interaction, deceleration, or follow
 * @event Viewport#moved
 * @type {object}
 * @property {Viewport} viewport
 * @property {string} type (drag, snap, pinch, follow, bounce-x, bounce-y, clamp-x, clamp-y, decelerate, mouse-edges, wheel)
 */

/**
 * fires when viewport moves through UI interaction, deceleration, or follow
 * @event Viewport#zoomed
 * @type {object}
 * @property {Viewport} viewport
 * @property {string} type (drag-zoom, pinch, wheel, clamp-zoom)
 */

/**
 * fires when viewport stops moving for any reason
 * @event Viewport#moved-end
 * @type {Viewport}
 */

/**
 * fires when viewport stops zooming for any rason
 * @event Viewport#zoomed-end
 * @type {Viewport}
 */

if (typeof PIXI !== 'undefined') {
    PIXI.extras.Viewport = Viewport;
}

module.exports = Viewport;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy92aWV3cG9ydC5qcyJdLCJuYW1lcyI6WyJ1dGlscyIsInJlcXVpcmUiLCJEcmFnIiwiUGluY2giLCJDbGFtcCIsIkNsYW1wWm9vbSIsIkRlY2VsZXJhdGUiLCJCb3VuY2UiLCJTbmFwIiwiU25hcFpvb20iLCJGb2xsb3ciLCJXaGVlbCIsIk1vdXNlRWRnZXMiLCJQTFVHSU5fT1JERVIiLCJWaWV3cG9ydCIsIm9wdGlvbnMiLCJwbHVnaW5zIiwicGx1Z2luc0xpc3QiLCJfc2NyZWVuV2lkdGgiLCJzY3JlZW5XaWR0aCIsIl9zY3JlZW5IZWlnaHQiLCJzY3JlZW5IZWlnaHQiLCJfd29ybGRXaWR0aCIsIndvcmxkV2lkdGgiLCJfd29ybGRIZWlnaHQiLCJ3b3JsZEhlaWdodCIsImhpdEFyZWFGdWxsU2NyZWVuIiwiZGVmYXVsdHMiLCJmb3JjZUhpdEFyZWEiLCJwYXNzaXZlV2hlZWwiLCJzdG9wRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJ0aHJlc2hvbGQiLCJpbnRlcmFjdGlvbiIsImRpdiIsImRpdldoZWVsIiwiZG9jdW1lbnQiLCJib2R5IiwibGlzdGVuZXJzIiwidG91Y2hlcyIsIm5vVGlja2VyIiwidGlja2VyIiwiUElYSSIsInNoYXJlZCIsInRpY2tlckZ1bmN0aW9uIiwidXBkYXRlIiwiZWxhcHNlZE1TIiwiYWRkIiwicmVtb3ZlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIndoZWVsRnVuY3Rpb24iLCJyZW1vdmVMaXN0ZW5lcnMiLCJlbGFwc2VkIiwicGF1c2UiLCJwbHVnaW4iLCJsYXN0Vmlld3BvcnQiLCJ4IiwieSIsIm1vdmluZyIsImVtaXQiLCJzY2FsZVgiLCJzY2FsZSIsInNjYWxlWSIsInpvb21pbmciLCJoaXRBcmVhIiwibGVmdCIsInRvcCIsIndpZHRoIiwid29ybGRTY3JlZW5XaWR0aCIsImhlaWdodCIsIndvcmxkU2NyZWVuSGVpZ2h0IiwiX2RpcnR5Iiwid2luZG93IiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwicmVzaXplUGx1Z2lucyIsInJlc2l6ZSIsImludGVyYWN0aXZlIiwiUmVjdGFuZ2xlIiwib24iLCJkb3duIiwibW92ZSIsInVwIiwiZSIsImhhbmRsZVdoZWVsIiwiYWRkRXZlbnRMaXN0ZW5lciIsInBhc3NpdmUiLCJsZWZ0RG93biIsImRhdGEiLCJwb2ludGVyVHlwZSIsIm9yaWdpbmFsRXZlbnQiLCJidXR0b24iLCJwdXNoIiwicG9pbnRlcklkIiwiY291bnREb3duUG9pbnRlcnMiLCJsYXN0IiwiZ2xvYmFsIiwiZGVjZWxlcmF0ZSIsImJvdW5jZSIsImlzQWN0aXZlIiwiY2xpY2tlZEF2YWlsYWJsZSIsInN0b3AiLCJjaGFuZ2UiLCJNYXRoIiwiYWJzIiwiZGlzdFgiLCJkaXN0WSIsImNoZWNrVGhyZXNob2xkIiwiTW91c2VFdmVudCIsImkiLCJsZW5ndGgiLCJzcGxpY2UiLCJzY3JlZW4iLCJ3b3JsZCIsInRvV29ybGQiLCJ2aWV3cG9ydCIsImV2dCIsInBvaW50IiwiUG9pbnQiLCJtYXBQb3NpdGlvblRvUG9pbnQiLCJjbGllbnRYIiwiY2xpZW50WSIsInRvTG9jYWwiLCJnZXRQb2ludGVyUG9zaXRpb24iLCJyaWdodCIsImJvdHRvbSIsInJlc3VsdCIsIndoZWVsIiwiYXJndW1lbnRzIiwidG9HbG9iYWwiLCJpc05hTiIsInBvc2l0aW9uIiwic2V0IiwiX3Jlc2V0IiwiY2VudGVyIiwibm9DbGFtcCIsInNhdmUiLCJjbGFtcFpvb20iLCJjbGFtcCIsIm1vdmVDZW50ZXIiLCJwZXJjZW50IiwiZml0V2lkdGgiLCJwbHVnaW5zU29ydCIsImNvcm5lclBvaW50IiwicmVzdWx0cyIsInBvaW50ZXJzIiwidHJhY2tlZFBvaW50ZXJzIiwia2V5IiwicG9pbnRlciIsImluZGV4T2YiLCJyZXNldCIsIm5hbWUiLCJpbmRleCIsImN1cnJlbnQiLCJ0eXBlIiwicmVzdW1lIiwidGFyZ2V0IiwidmFsdWUiLCJtb3ZlQ29ybmVyIiwiX2ZvcmNlSGl0QXJlYSIsIl9wYXVzZSIsIkNvbnRhaW5lciIsImV4dHJhcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFFBQVNDLFFBQVEsU0FBUixDQUFmO0FBQ0EsSUFBTUMsT0FBT0QsUUFBUSxRQUFSLENBQWI7QUFDQSxJQUFNRSxRQUFRRixRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQU1HLFFBQVFILFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBTUksWUFBWUosUUFBUSxjQUFSLENBQWxCO0FBQ0EsSUFBTUssYUFBYUwsUUFBUSxjQUFSLENBQW5CO0FBQ0EsSUFBTU0sU0FBU04sUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNTyxPQUFPUCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1RLFdBQVdSLFFBQVEsYUFBUixDQUFqQjtBQUNBLElBQU1TLFNBQVNULFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTVUsUUFBUVYsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNVyxhQUFhWCxRQUFRLGVBQVIsQ0FBbkI7O0FBRUEsSUFBTVksZUFBZSxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLFFBQTNCLEVBQXFDLGFBQXJDLEVBQW9ELFlBQXBELEVBQWtFLFFBQWxFLEVBQTRFLFdBQTVFLEVBQXlGLFlBQXpGLEVBQXVHLE1BQXZHLEVBQStHLE9BQS9HLENBQXJCOztJQUVNQyxROzs7QUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThDQSxzQkFBWUMsT0FBWixFQUNBO0FBQUE7O0FBQ0lBLGtCQUFVQSxXQUFXLEVBQXJCOztBQURKOztBQUdJLGNBQUtDLE9BQUwsR0FBZSxFQUFmO0FBQ0EsY0FBS0MsV0FBTCxHQUFtQixFQUFuQjtBQUNBLGNBQUtDLFlBQUwsR0FBb0JILFFBQVFJLFdBQTVCO0FBQ0EsY0FBS0MsYUFBTCxHQUFxQkwsUUFBUU0sWUFBN0I7QUFDQSxjQUFLQyxXQUFMLEdBQW1CUCxRQUFRUSxVQUEzQjtBQUNBLGNBQUtDLFlBQUwsR0FBb0JULFFBQVFVLFdBQTVCO0FBQ0EsY0FBS0MsaUJBQUwsR0FBeUIxQixNQUFNMkIsUUFBTixDQUFlWixRQUFRVyxpQkFBdkIsRUFBMEMsSUFBMUMsQ0FBekI7QUFDQSxjQUFLRSxZQUFMLEdBQW9CYixRQUFRYSxZQUE1QjtBQUNBLGNBQUtDLFlBQUwsR0FBb0I3QixNQUFNMkIsUUFBTixDQUFlWixRQUFRYyxZQUF2QixFQUFxQyxJQUFyQyxDQUFwQjtBQUNBLGNBQUtDLFNBQUwsR0FBaUJmLFFBQVFnQixlQUF6QjtBQUNBLGNBQUtDLFNBQUwsR0FBaUJoQyxNQUFNMkIsUUFBTixDQUFlWixRQUFRaUIsU0FBdkIsRUFBa0MsQ0FBbEMsQ0FBakI7QUFDQSxjQUFLQyxXQUFMLEdBQW1CbEIsUUFBUWtCLFdBQVIsSUFBdUIsSUFBMUM7QUFDQSxjQUFLQyxHQUFMLEdBQVduQixRQUFRb0IsUUFBUixJQUFvQkMsU0FBU0MsSUFBeEM7QUFDQSxjQUFLQyxTQUFMLENBQWUsTUFBS0osR0FBcEI7O0FBRUE7Ozs7O0FBS0EsY0FBS0ssT0FBTCxHQUFlLEVBQWY7O0FBRUEsWUFBSSxDQUFDeEIsUUFBUXlCLFFBQWIsRUFDQTtBQUNJLGtCQUFLQyxNQUFMLEdBQWMxQixRQUFRMEIsTUFBUixJQUFrQkMsS0FBS0QsTUFBTCxDQUFZRSxNQUE1QztBQUNBLGtCQUFLQyxjQUFMLEdBQXNCO0FBQUEsdUJBQU0sTUFBS0MsTUFBTCxDQUFZLE1BQUtKLE1BQUwsQ0FBWUssU0FBeEIsQ0FBTjtBQUFBLGFBQXRCO0FBQ0Esa0JBQUtMLE1BQUwsQ0FBWU0sR0FBWixDQUFnQixNQUFLSCxjQUFyQjtBQUNIO0FBOUJMO0FBK0JDOztBQUVEOzs7Ozs7OzswQ0FLQTtBQUNJLGlCQUFLSCxNQUFMLENBQVlPLE1BQVosQ0FBbUIsS0FBS0osY0FBeEI7QUFDQSxpQkFBS1YsR0FBTCxDQUFTZSxtQkFBVCxDQUE2QixPQUE3QixFQUFzQyxLQUFLQyxhQUEzQztBQUNIOztBQUVEOzs7Ozs7Z0NBR1FuQyxPLEVBQ1I7QUFDSSx3SEFBY0EsT0FBZDtBQUNBLGlCQUFLb0MsZUFBTDtBQUNIOztBQUVEOzs7Ozs7OytCQUlPQyxPLEVBQ1A7QUFDSSxnQkFBSSxDQUFDLEtBQUtDLEtBQVYsRUFDQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNJLHlDQUFtQixLQUFLcEMsV0FBeEIsOEhBQ0E7QUFBQSw0QkFEU3FDLE1BQ1Q7O0FBQ0lBLCtCQUFPVCxNQUFQLENBQWNPLE9BQWQ7QUFDSDtBQUpMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBTUksb0JBQUksS0FBS0csWUFBVCxFQUNBO0FBQ0k7QUFDQSx3QkFBSSxLQUFLQSxZQUFMLENBQWtCQyxDQUFsQixLQUF3QixLQUFLQSxDQUE3QixJQUFrQyxLQUFLRCxZQUFMLENBQWtCRSxDQUFsQixLQUF3QixLQUFLQSxDQUFuRSxFQUNBO0FBQ0ksNkJBQUtDLE1BQUwsR0FBYyxJQUFkO0FBQ0gscUJBSEQsTUFLQTtBQUNJLDRCQUFJLEtBQUtBLE1BQVQsRUFDQTtBQUNJLGlDQUFLQyxJQUFMLENBQVUsV0FBVixFQUF1QixJQUF2QjtBQUNBLGlDQUFLRCxNQUFMLEdBQWMsS0FBZDtBQUNIO0FBQ0o7QUFDRDtBQUNBLHdCQUFJLEtBQUtILFlBQUwsQ0FBa0JLLE1BQWxCLEtBQTZCLEtBQUtDLEtBQUwsQ0FBV0wsQ0FBeEMsSUFBNkMsS0FBS0QsWUFBTCxDQUFrQk8sTUFBbEIsS0FBNkIsS0FBS0QsS0FBTCxDQUFXSixDQUF6RixFQUNBO0FBQ0ksNkJBQUtNLE9BQUwsR0FBZSxJQUFmO0FBQ0gscUJBSEQsTUFLQTtBQUNJLDRCQUFJLEtBQUtBLE9BQVQsRUFDQTtBQUNJLGlDQUFLSixJQUFMLENBQVUsWUFBVixFQUF3QixJQUF4QjtBQUNBLGlDQUFLSSxPQUFMLEdBQWUsS0FBZjtBQUNIO0FBQ0o7QUFFSjs7QUFFRCxvQkFBSSxDQUFDLEtBQUtuQyxZQUFWLEVBQ0E7QUFDSSx5QkFBS29DLE9BQUwsQ0FBYVIsQ0FBYixHQUFpQixLQUFLUyxJQUF0QjtBQUNBLHlCQUFLRCxPQUFMLENBQWFQLENBQWIsR0FBaUIsS0FBS1MsR0FBdEI7QUFDQSx5QkFBS0YsT0FBTCxDQUFhRyxLQUFiLEdBQXFCLEtBQUtDLGdCQUExQjtBQUNBLHlCQUFLSixPQUFMLENBQWFLLE1BQWIsR0FBc0IsS0FBS0MsaUJBQTNCO0FBQ0g7QUFDRCxxQkFBS0MsTUFBTCxHQUFjLEtBQUtBLE1BQUwsSUFBZSxDQUFDLEtBQUtoQixZQUFyQixJQUNWLEtBQUtBLFlBQUwsQ0FBa0JDLENBQWxCLEtBQXdCLEtBQUtBLENBRG5CLElBQ3dCLEtBQUtELFlBQUwsQ0FBa0JFLENBQWxCLEtBQXdCLEtBQUtBLENBRHJELElBRVYsS0FBS0YsWUFBTCxDQUFrQkssTUFBbEIsS0FBNkIsS0FBS0MsS0FBTCxDQUFXTCxDQUY5QixJQUVtQyxLQUFLRCxZQUFMLENBQWtCTyxNQUFsQixLQUE2QixLQUFLRCxLQUFMLENBQVdKLENBRnpGO0FBR0EscUJBQUtGLFlBQUwsR0FBb0I7QUFDaEJDLHVCQUFHLEtBQUtBLENBRFE7QUFFaEJDLHVCQUFHLEtBQUtBLENBRlE7QUFHaEJHLDRCQUFRLEtBQUtDLEtBQUwsQ0FBV0wsQ0FISDtBQUloQk0sNEJBQVEsS0FBS0QsS0FBTCxDQUFXSjtBQUpILGlCQUFwQjtBQU1IO0FBQ0o7O0FBRUQ7Ozs7Ozs7Ozs7K0JBT090QyxXLEVBQWFFLFksRUFBY0UsVSxFQUFZRSxXLEVBQzlDO0FBQ0ksaUJBQUtQLFlBQUwsR0FBb0JDLGVBQWVxRCxPQUFPQyxVQUExQztBQUNBLGlCQUFLckQsYUFBTCxHQUFxQkMsZ0JBQWdCbUQsT0FBT0UsV0FBNUM7QUFDQSxnQkFBSW5ELFVBQUosRUFDQTtBQUNJLHFCQUFLRCxXQUFMLEdBQW1CQyxVQUFuQjtBQUNIO0FBQ0QsZ0JBQUlFLFdBQUosRUFDQTtBQUNJLHFCQUFLRCxZQUFMLEdBQW9CQyxXQUFwQjtBQUNIO0FBQ0QsaUJBQUtrRCxhQUFMO0FBQ0g7O0FBRUQ7Ozs7Ozs7d0NBS0E7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDSSxzQ0FBbUIsS0FBSzFELFdBQXhCLG1JQUNBO0FBQUEsd0JBRFNxQyxNQUNUOztBQUNJQSwyQkFBT3NCLE1BQVA7QUFDSDtBQUpMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLQzs7QUFFRDs7Ozs7Ozs7O0FBb0VBOzs7OzJDQUtBO0FBQ0ksbUJBQU8sRUFBRXBCLEdBQUcsS0FBS1MsSUFBVixFQUFnQlIsR0FBRyxLQUFLUyxHQUF4QixFQUE2QkMsT0FBTyxLQUFLQyxnQkFBekMsRUFBMkRDLFFBQVEsS0FBS0MsaUJBQXhFLEVBQVA7QUFDSDs7QUFFRDs7Ozs7OztrQ0FJVXBDLEcsRUFDVjtBQUFBOztBQUNJLGlCQUFLMkMsV0FBTCxHQUFtQixJQUFuQjtBQUNBLGdCQUFJLENBQUMsS0FBS2pELFlBQVYsRUFDQTtBQUNJLHFCQUFLb0MsT0FBTCxHQUFlLElBQUl0QixLQUFLb0MsU0FBVCxDQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixLQUFLdkQsVUFBOUIsRUFBMEMsS0FBS0UsV0FBL0MsQ0FBZjtBQUNIO0FBQ0QsaUJBQUtzRCxFQUFMLENBQVEsYUFBUixFQUF1QixLQUFLQyxJQUE1QjtBQUNBLGlCQUFLRCxFQUFMLENBQVEsYUFBUixFQUF1QixLQUFLRSxJQUE1QjtBQUNBLGlCQUFLRixFQUFMLENBQVEsV0FBUixFQUFxQixLQUFLRyxFQUExQjtBQUNBLGlCQUFLSCxFQUFMLENBQVEsa0JBQVIsRUFBNEIsS0FBS0csRUFBakM7QUFDQSxpQkFBS0gsRUFBTCxDQUFRLGVBQVIsRUFBeUIsS0FBS0csRUFBOUI7QUFDQSxpQkFBS0gsRUFBTCxDQUFRLFlBQVIsRUFBc0IsS0FBS0csRUFBM0I7QUFDQSxpQkFBS2hDLGFBQUwsR0FBcUIsVUFBQ2lDLENBQUQ7QUFBQSx1QkFBTyxPQUFLQyxXQUFMLENBQWlCRCxDQUFqQixDQUFQO0FBQUEsYUFBckI7QUFDQWpELGdCQUFJbUQsZ0JBQUosQ0FBcUIsT0FBckIsRUFBOEIsS0FBS25DLGFBQW5DLEVBQWtELEVBQUVvQyxTQUFTLEtBQUt6RCxZQUFoQixFQUFsRDtBQUNBLGlCQUFLMEQsUUFBTCxHQUFnQixLQUFoQjtBQUNIOztBQUVEOzs7Ozs7OzZCQUlLSixDLEVBQ0w7QUFDSSxnQkFBSSxLQUFLOUIsS0FBVCxFQUNBO0FBQ0k7QUFDSDtBQUNELGdCQUFJOEIsRUFBRUssSUFBRixDQUFPQyxXQUFQLEtBQXVCLE9BQTNCLEVBQ0E7QUFDSSxvQkFBSU4sRUFBRUssSUFBRixDQUFPRSxhQUFQLENBQXFCQyxNQUFyQixJQUErQixDQUFuQyxFQUNBO0FBQ0kseUJBQUtKLFFBQUwsR0FBZ0IsSUFBaEI7QUFDSDtBQUNKLGFBTkQsTUFRQTtBQUNJLHFCQUFLaEQsT0FBTCxDQUFhcUQsSUFBYixDQUFrQlQsRUFBRUssSUFBRixDQUFPSyxTQUF6QjtBQUNIOztBQUVELGdCQUFJLEtBQUtDLGlCQUFMLE9BQTZCLENBQWpDLEVBQ0E7QUFDSSxxQkFBS0MsSUFBTCxHQUFZLEVBQUV2QyxHQUFHMkIsRUFBRUssSUFBRixDQUFPUSxNQUFQLENBQWN4QyxDQUFuQixFQUFzQkMsR0FBRzBCLEVBQUVLLElBQUYsQ0FBT1EsTUFBUCxDQUFjdkM7O0FBRW5EO0FBRlksaUJBQVosQ0FHQSxJQUFNd0MsYUFBYSxLQUFLakYsT0FBTCxDQUFhLFlBQWIsQ0FBbkI7QUFDQSxvQkFBTWtGLFNBQVMsS0FBS2xGLE9BQUwsQ0FBYSxRQUFiLENBQWY7QUFDQSxvQkFBSSxDQUFDLENBQUNpRixVQUFELElBQWUsQ0FBQ0EsV0FBV0UsUUFBWCxFQUFqQixNQUE0QyxDQUFDRCxNQUFELElBQVcsQ0FBQ0EsT0FBT0MsUUFBUCxFQUF4RCxDQUFKLEVBQ0E7QUFDSSx5QkFBS0MsZ0JBQUwsR0FBd0IsSUFBeEI7QUFDSCxpQkFIRCxNQUtBO0FBQ0kseUJBQUtBLGdCQUFMLEdBQXdCLEtBQXhCO0FBQ0g7QUFDSixhQWZELE1BaUJBO0FBQ0kscUJBQUtBLGdCQUFMLEdBQXdCLEtBQXhCO0FBQ0g7O0FBRUQsZ0JBQUlDLGFBQUo7QUF0Q0o7QUFBQTtBQUFBOztBQUFBO0FBdUNJLHNDQUFtQixLQUFLcEYsV0FBeEIsbUlBQ0E7QUFBQSx3QkFEU3FDLE1BQ1Q7O0FBQ0ksd0JBQUlBLE9BQU8wQixJQUFQLENBQVlHLENBQVosQ0FBSixFQUNBO0FBQ0lrQiwrQkFBTyxJQUFQO0FBQ0g7QUFDSjtBQTdDTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQThDSSxnQkFBSUEsUUFBUSxLQUFLdkUsU0FBakIsRUFDQTtBQUNJcUQsa0JBQUVwRCxlQUFGO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7dUNBS2V1RSxNLEVBQ2Y7QUFDSSxnQkFBSUMsS0FBS0MsR0FBTCxDQUFTRixNQUFULEtBQW9CLEtBQUt0RSxTQUE3QixFQUNBO0FBQ0ksdUJBQU8sSUFBUDtBQUNIO0FBQ0QsbUJBQU8sS0FBUDtBQUNIOztBQUVEOzs7Ozs7OzZCQUlLbUQsQyxFQUNMO0FBQ0ksZ0JBQUksS0FBSzlCLEtBQVQsRUFDQTtBQUNJO0FBQ0g7O0FBRUQsZ0JBQUlnRCxhQUFKO0FBTko7QUFBQTtBQUFBOztBQUFBO0FBT0ksc0NBQW1CLEtBQUtwRixXQUF4QixtSUFDQTtBQUFBLHdCQURTcUMsTUFDVDs7QUFDSSx3QkFBSUEsT0FBTzJCLElBQVAsQ0FBWUUsQ0FBWixDQUFKLEVBQ0E7QUFDSWtCLCtCQUFPLElBQVA7QUFDSDtBQUNKO0FBYkw7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFlSSxnQkFBSSxLQUFLRCxnQkFBVCxFQUNBO0FBQ0ksb0JBQU1LLFFBQVF0QixFQUFFSyxJQUFGLENBQU9RLE1BQVAsQ0FBY3hDLENBQWQsR0FBa0IsS0FBS3VDLElBQUwsQ0FBVXZDLENBQTFDO0FBQ0Esb0JBQU1rRCxRQUFRdkIsRUFBRUssSUFBRixDQUFPUSxNQUFQLENBQWN2QyxDQUFkLEdBQWtCLEtBQUtzQyxJQUFMLENBQVV0QyxDQUExQztBQUNBLG9CQUFJLEtBQUtrRCxjQUFMLENBQW9CRixLQUFwQixLQUE4QixLQUFLRSxjQUFMLENBQW9CRCxLQUFwQixDQUFsQyxFQUNBO0FBQ0kseUJBQUtOLGdCQUFMLEdBQXdCLEtBQXhCO0FBQ0g7QUFDSjs7QUFFRCxnQkFBSUMsUUFBUSxLQUFLdkUsU0FBakIsRUFDQTtBQUNJcUQsa0JBQUVwRCxlQUFGO0FBQ0g7QUFFSjs7QUFFRDs7Ozs7OzsyQkFJR29ELEMsRUFDSDtBQUNJLGdCQUFJLEtBQUs5QixLQUFULEVBQ0E7QUFDSTtBQUNIOztBQUVELGdCQUFJOEIsRUFBRUssSUFBRixDQUFPRSxhQUFQLFlBQWdDa0IsVUFBaEMsSUFBOEN6QixFQUFFSyxJQUFGLENBQU9FLGFBQVAsQ0FBcUJDLE1BQXJCLElBQStCLENBQWpGLEVBQ0E7QUFDSSxxQkFBS0osUUFBTCxHQUFnQixLQUFoQjtBQUNIOztBQUVELGdCQUFJSixFQUFFSyxJQUFGLENBQU9DLFdBQVAsS0FBdUIsT0FBM0IsRUFDQTtBQUNJLHFCQUFLLElBQUlvQixJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS3RFLE9BQUwsQ0FBYXVFLE1BQWpDLEVBQXlDRCxHQUF6QyxFQUNBO0FBQ0ksd0JBQUksS0FBS3RFLE9BQUwsQ0FBYXNFLENBQWIsTUFBb0IxQixFQUFFSyxJQUFGLENBQU9LLFNBQS9CLEVBQ0E7QUFDSSw2QkFBS3RELE9BQUwsQ0FBYXdFLE1BQWIsQ0FBb0JGLENBQXBCLEVBQXVCLENBQXZCO0FBQ0E7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsZ0JBQUlSLGFBQUo7QUF2Qko7QUFBQTtBQUFBOztBQUFBO0FBd0JJLHNDQUFtQixLQUFLcEYsV0FBeEIsbUlBQ0E7QUFBQSx3QkFEU3FDLE1BQ1Q7O0FBQ0ksd0JBQUlBLE9BQU80QixFQUFQLENBQVVDLENBQVYsQ0FBSixFQUNBO0FBQ0lrQiwrQkFBTyxJQUFQO0FBQ0g7QUFDSjtBQTlCTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWdDSSxnQkFBSSxLQUFLRCxnQkFBTCxJQUF5QixLQUFLTixpQkFBTCxPQUE2QixDQUExRCxFQUNBO0FBQ0w7QUFDUyxxQkFBS25DLElBQUwsQ0FBVSxTQUFWLEVBQXFCLEVBQUVxRCxRQUFRLEtBQUtqQixJQUFmLEVBQXFCa0IsT0FBTyxLQUFLQyxPQUFMLENBQWEsS0FBS25CLElBQWxCLENBQTVCLEVBQXFEb0IsVUFBVSxJQUEvRCxFQUFyQjtBQUNBLHFCQUFLZixnQkFBTCxHQUF3QixLQUF4QjtBQUNIOztBQUVELGdCQUFJQyxRQUFRLEtBQUt2RSxTQUFqQixFQUNBO0FBQ0lxRCxrQkFBRXBELGVBQUY7QUFDSDtBQUNKOztBQUVEOzs7Ozs7OzsyQ0FLbUJxRixHLEVBQ25CO0FBQ0ksZ0JBQUlDLFFBQVEsSUFBSTNFLEtBQUs0RSxLQUFULEVBQVo7QUFDQSxnQkFBSSxLQUFLckYsV0FBVCxFQUNBO0FBQ0kscUJBQUtBLFdBQUwsQ0FBaUJzRixrQkFBakIsQ0FBb0NGLEtBQXBDLEVBQTJDRCxJQUFJSSxPQUEvQyxFQUF3REosSUFBSUssT0FBNUQ7QUFDSCxhQUhELE1BS0E7QUFDSUosc0JBQU03RCxDQUFOLEdBQVU0RCxJQUFJSSxPQUFkO0FBQ0FILHNCQUFNNUQsQ0FBTixHQUFVMkQsSUFBSUssT0FBZDtBQUNIO0FBQ0QsbUJBQU9KLEtBQVA7QUFDSDs7QUFFRDs7Ozs7OztvQ0FJWWxDLEMsRUFDWjtBQUNJLGdCQUFJLEtBQUs5QixLQUFULEVBQ0E7QUFDSTtBQUNIOztBQUVEO0FBQ0EsZ0JBQU1nRSxRQUFRLEtBQUtLLE9BQUwsQ0FBYSxLQUFLQyxrQkFBTCxDQUF3QnhDLENBQXhCLENBQWIsQ0FBZDtBQUNBLGdCQUFJLEtBQUtsQixJQUFMLElBQWFvRCxNQUFNN0QsQ0FBbkIsSUFBd0I2RCxNQUFNN0QsQ0FBTixJQUFXLEtBQUtvRSxLQUF4QyxJQUFpRCxLQUFLMUQsR0FBTCxJQUFZbUQsTUFBTTVELENBQW5FLElBQXdFNEQsTUFBTTVELENBQU4sSUFBVyxLQUFLb0UsTUFBNUYsRUFDQTtBQUNJLG9CQUFJQyxlQUFKO0FBREo7QUFBQTtBQUFBOztBQUFBO0FBRUksMENBQW1CLEtBQUs3RyxXQUF4QixtSUFDQTtBQUFBLDRCQURTcUMsTUFDVDs7QUFDSSw0QkFBSUEsT0FBT3lFLEtBQVAsQ0FBYTVDLENBQWIsQ0FBSixFQUNBO0FBQ0kyQyxxQ0FBUyxJQUFUO0FBQ0g7QUFDSjtBQVJMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBU0ksdUJBQU9BLE1BQVA7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Ozs7a0NBT0E7QUFDSSxnQkFBSUUsVUFBVWxCLE1BQVYsS0FBcUIsQ0FBekIsRUFDQTtBQUNJLG9CQUFNdEQsSUFBSXdFLFVBQVUsQ0FBVixDQUFWO0FBQ0Esb0JBQU12RSxJQUFJdUUsVUFBVSxDQUFWLENBQVY7QUFDQSx1QkFBTyxLQUFLTixPQUFMLENBQWEsRUFBRWxFLElBQUYsRUFBS0MsSUFBTCxFQUFiLENBQVA7QUFDSCxhQUxELE1BT0E7QUFDSSx1QkFBTyxLQUFLaUUsT0FBTCxDQUFhTSxVQUFVLENBQVYsQ0FBYixDQUFQO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7O21DQU9BO0FBQ0ksZ0JBQUlBLFVBQVVsQixNQUFWLEtBQXFCLENBQXpCLEVBQ0E7QUFDSSxvQkFBTXRELElBQUl3RSxVQUFVLENBQVYsQ0FBVjtBQUNBLG9CQUFNdkUsSUFBSXVFLFVBQVUsQ0FBVixDQUFWO0FBQ0EsdUJBQU8sS0FBS0MsUUFBTCxDQUFjLEVBQUV6RSxJQUFGLEVBQUtDLElBQUwsRUFBZCxDQUFQO0FBQ0gsYUFMRCxNQU9BO0FBQ0ksb0JBQU00RCxRQUFRVyxVQUFVLENBQVYsQ0FBZDtBQUNBLHVCQUFPLEtBQUtDLFFBQUwsQ0FBY1osS0FBZCxDQUFQO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7OztBQXFEQTs7Ozs7O3FDQU1XLHFCQUNYO0FBQ0ksZ0JBQUk3RCxVQUFKO0FBQUEsZ0JBQU9DLFVBQVA7QUFDQSxnQkFBSSxDQUFDeUUsTUFBTUYsVUFBVSxDQUFWLENBQU4sQ0FBTCxFQUNBO0FBQ0l4RSxvQkFBSXdFLFVBQVUsQ0FBVixDQUFKO0FBQ0F2RSxvQkFBSXVFLFVBQVUsQ0FBVixDQUFKO0FBQ0gsYUFKRCxNQU1BO0FBQ0l4RSxvQkFBSXdFLFVBQVUsQ0FBVixFQUFheEUsQ0FBakI7QUFDQUMsb0JBQUl1RSxVQUFVLENBQVYsRUFBYXZFLENBQWpCO0FBQ0g7QUFDRCxpQkFBSzBFLFFBQUwsQ0FBY0MsR0FBZCxDQUFrQixDQUFDLEtBQUtoRSxnQkFBTCxHQUF3QixDQUF4QixHQUE0QlosQ0FBN0IsSUFBa0MsS0FBS0ssS0FBTCxDQUFXTCxDQUEvRCxFQUFrRSxDQUFDLEtBQUtjLGlCQUFMLEdBQXlCLENBQXpCLEdBQTZCYixDQUE5QixJQUFtQyxLQUFLSSxLQUFMLENBQVdKLENBQWhIO0FBQ0EsaUJBQUs0RSxNQUFMO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7QUFhQTs7Ozs7O3FDQU1XLGdCQUNYO0FBQ0ksZ0JBQUlMLFVBQVVsQixNQUFWLEtBQXFCLENBQXpCLEVBQ0E7QUFDSSxxQkFBS3FCLFFBQUwsQ0FBY0MsR0FBZCxDQUFrQixDQUFDSixVQUFVLENBQVYsRUFBYXhFLENBQWQsR0FBa0IsS0FBS0ssS0FBTCxDQUFXTCxDQUEvQyxFQUFrRCxDQUFDd0UsVUFBVSxDQUFWLEVBQWF2RSxDQUFkLEdBQWtCLEtBQUtJLEtBQUwsQ0FBV0osQ0FBL0U7QUFDSCxhQUhELE1BS0E7QUFDSSxxQkFBSzBFLFFBQUwsQ0FBY0MsR0FBZCxDQUFrQixDQUFDSixVQUFVLENBQVYsQ0FBRCxHQUFnQixLQUFLbkUsS0FBTCxDQUFXTCxDQUE3QyxFQUFnRCxDQUFDd0UsVUFBVSxDQUFWLENBQUQsR0FBZ0IsS0FBS25FLEtBQUwsQ0FBV0osQ0FBM0U7QUFDSDtBQUNELGlCQUFLNEUsTUFBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7aUNBUVNsRSxLLEVBQU9tRSxNLEVBQ2hCO0FBQUEsZ0JBRHdCeEUsTUFDeEIsdUVBRCtCLElBQy9CO0FBQUEsZ0JBRHFDeUUsT0FDckM7O0FBQ0ksZ0JBQUlDLGFBQUo7QUFDQSxnQkFBSUYsTUFBSixFQUNBO0FBQ0lFLHVCQUFPLEtBQUtGLE1BQVo7QUFDSDtBQUNEbkUsb0JBQVFBLFNBQVMsS0FBSzVDLFVBQXRCO0FBQ0EsaUJBQUtzQyxLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLckMsV0FBTCxHQUFtQmdELEtBQWxDOztBQUVBLGdCQUFJTCxNQUFKLEVBQ0E7QUFDSSxxQkFBS0QsS0FBTCxDQUFXSixDQUFYLEdBQWUsS0FBS0ksS0FBTCxDQUFXTCxDQUExQjtBQUNIOztBQUVELGdCQUFNaUYsWUFBWSxLQUFLekgsT0FBTCxDQUFhLFlBQWIsQ0FBbEI7QUFDQSxnQkFBSSxDQUFDdUgsT0FBRCxJQUFZRSxTQUFoQixFQUNBO0FBQ0lBLDBCQUFVQyxLQUFWO0FBQ0g7O0FBRUQsZ0JBQUlKLE1BQUosRUFDQTtBQUNJLHFCQUFLSyxVQUFMLENBQWdCSCxJQUFoQjtBQUNIO0FBQ0QsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7OztrQ0FRVW5FLE0sRUFBUWlFLE0sRUFDbEI7QUFBQSxnQkFEMEIxRSxNQUMxQix1RUFEaUMsSUFDakM7QUFBQSxnQkFEdUMyRSxPQUN2Qzs7QUFDSSxnQkFBSUMsYUFBSjtBQUNBLGdCQUFJRixNQUFKLEVBQ0E7QUFDSUUsdUJBQU8sS0FBS0YsTUFBWjtBQUNIO0FBQ0RqRSxxQkFBU0EsVUFBVSxLQUFLNUMsV0FBeEI7QUFDQSxpQkFBS29DLEtBQUwsQ0FBV0osQ0FBWCxHQUFlLEtBQUtwQyxZQUFMLEdBQW9CZ0QsTUFBbkM7O0FBRUEsZ0JBQUlULE1BQUosRUFDQTtBQUNJLHFCQUFLQyxLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLSyxLQUFMLENBQVdKLENBQTFCO0FBQ0g7O0FBRUQsZ0JBQU1nRixZQUFZLEtBQUt6SCxPQUFMLENBQWEsWUFBYixDQUFsQjtBQUNBLGdCQUFJLENBQUN1SCxPQUFELElBQVlFLFNBQWhCLEVBQ0E7QUFDSUEsMEJBQVVDLEtBQVY7QUFDSDs7QUFFRCxnQkFBSUosTUFBSixFQUNBO0FBQ0kscUJBQUtLLFVBQUwsQ0FBZ0JILElBQWhCO0FBQ0g7QUFDRCxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7O2lDQUtTRixNLEVBQ1Q7QUFDSSxnQkFBSUUsYUFBSjtBQUNBLGdCQUFJRixNQUFKLEVBQ0E7QUFDSUUsdUJBQU8sS0FBS0YsTUFBWjtBQUNIO0FBQ0QsaUJBQUt6RSxLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLckMsV0FBTCxHQUFtQixLQUFLSSxVQUF2QztBQUNBLGlCQUFLc0MsS0FBTCxDQUFXSixDQUFYLEdBQWUsS0FBS3BDLFlBQUwsR0FBb0IsS0FBS0ksV0FBeEM7QUFDQSxnQkFBSSxLQUFLb0MsS0FBTCxDQUFXTCxDQUFYLEdBQWUsS0FBS0ssS0FBTCxDQUFXSixDQUE5QixFQUNBO0FBQ0kscUJBQUtJLEtBQUwsQ0FBV0osQ0FBWCxHQUFlLEtBQUtJLEtBQUwsQ0FBV0wsQ0FBMUI7QUFDSCxhQUhELE1BS0E7QUFDSSxxQkFBS0ssS0FBTCxDQUFXTCxDQUFYLEdBQWUsS0FBS0ssS0FBTCxDQUFXSixDQUExQjtBQUNIOztBQUVELGdCQUFNZ0YsWUFBWSxLQUFLekgsT0FBTCxDQUFhLFlBQWIsQ0FBbEI7QUFDQSxnQkFBSXlILFNBQUosRUFDQTtBQUNJQSwwQkFBVUMsS0FBVjtBQUNIOztBQUVELGdCQUFJSixNQUFKLEVBQ0E7QUFDSSxxQkFBS0ssVUFBTCxDQUFnQkgsSUFBaEI7QUFDSDtBQUNELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs0QkFPSUYsTSxFQUFRbkUsSyxFQUFPRSxNLEVBQ25CO0FBQ0ksZ0JBQUltRSxhQUFKO0FBQ0EsZ0JBQUlGLE1BQUosRUFDQTtBQUNJRSx1QkFBTyxLQUFLRixNQUFaO0FBQ0g7QUFDRG5FLG9CQUFRQSxTQUFTLEtBQUs1QyxVQUF0QjtBQUNBOEMscUJBQVNBLFVBQVUsS0FBSzVDLFdBQXhCO0FBQ0EsaUJBQUtvQyxLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLckMsV0FBTCxHQUFtQmdELEtBQWxDO0FBQ0EsaUJBQUtOLEtBQUwsQ0FBV0osQ0FBWCxHQUFlLEtBQUtwQyxZQUFMLEdBQW9CZ0QsTUFBbkM7QUFDQSxnQkFBSSxLQUFLUixLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLSyxLQUFMLENBQVdKLENBQTlCLEVBQ0E7QUFDSSxxQkFBS0ksS0FBTCxDQUFXSixDQUFYLEdBQWUsS0FBS0ksS0FBTCxDQUFXTCxDQUExQjtBQUNILGFBSEQsTUFLQTtBQUNJLHFCQUFLSyxLQUFMLENBQVdMLENBQVgsR0FBZSxLQUFLSyxLQUFMLENBQVdKLENBQTFCO0FBQ0g7QUFDRCxnQkFBTWdGLFlBQVksS0FBS3pILE9BQUwsQ0FBYSxZQUFiLENBQWxCO0FBQ0EsZ0JBQUl5SCxTQUFKLEVBQ0E7QUFDSUEsMEJBQVVDLEtBQVY7QUFDSDtBQUNELGdCQUFJSixNQUFKLEVBQ0E7QUFDSSxxQkFBS0ssVUFBTCxDQUFnQkgsSUFBaEI7QUFDSDtBQUNELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7O29DQU1ZSSxPLEVBQVNOLE0sRUFDckI7QUFDSSxnQkFBSUUsYUFBSjtBQUNBLGdCQUFJRixNQUFKLEVBQ0E7QUFDSUUsdUJBQU8sS0FBS0YsTUFBWjtBQUNIO0FBQ0QsZ0JBQU16RSxRQUFRLEtBQUtBLEtBQUwsQ0FBV0wsQ0FBWCxHQUFlLEtBQUtLLEtBQUwsQ0FBV0wsQ0FBWCxHQUFlb0YsT0FBNUM7QUFDQSxpQkFBSy9FLEtBQUwsQ0FBV3VFLEdBQVgsQ0FBZXZFLEtBQWY7QUFDQSxnQkFBTTRFLFlBQVksS0FBS3pILE9BQUwsQ0FBYSxZQUFiLENBQWxCO0FBQ0EsZ0JBQUl5SCxTQUFKLEVBQ0E7QUFDSUEsMEJBQVVDLEtBQVY7QUFDSDtBQUNELGdCQUFJSixNQUFKLEVBQ0E7QUFDSSxxQkFBS0ssVUFBTCxDQUFnQkgsSUFBaEI7QUFDSDtBQUNELG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OzZCQU1LbEMsTSxFQUFRZ0MsTSxFQUNiO0FBQ0ksaUJBQUtPLFFBQUwsQ0FBY3ZDLFNBQVMsS0FBS2xDLGdCQUE1QixFQUE4Q2tFLE1BQTlDO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7O2lDQWFTdkgsTyxFQUNUO0FBQ0ksaUJBQUtDLE9BQUwsQ0FBYSxXQUFiLElBQTRCLElBQUlQLFFBQUosQ0FBYSxJQUFiLEVBQW1CTSxPQUFuQixDQUE1QjtBQUNBLGlCQUFLK0gsV0FBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OztBQVVBOzs7Ozs7Ozs4QkFNQTtBQUNJLGdCQUFNaEIsU0FBUyxFQUFmO0FBQ0FBLG1CQUFPN0QsSUFBUCxHQUFjLEtBQUtBLElBQUwsR0FBWSxDQUExQjtBQUNBNkQsbUJBQU9GLEtBQVAsR0FBZSxLQUFLQSxLQUFMLEdBQWEsS0FBS3RHLFdBQWpDO0FBQ0F3RyxtQkFBTzVELEdBQVAsR0FBYSxLQUFLQSxHQUFMLEdBQVcsQ0FBeEI7QUFDQTRELG1CQUFPRCxNQUFQLEdBQWdCLEtBQUtBLE1BQUwsR0FBYyxLQUFLckcsWUFBbkM7QUFDQXNHLG1CQUFPaUIsV0FBUCxHQUFxQjtBQUNqQnZGLG1CQUFHLEtBQUtsQyxXQUFMLEdBQW1CLEtBQUt1QyxLQUFMLENBQVdMLENBQTlCLEdBQWtDLEtBQUt0QyxZQUR6QjtBQUVqQnVDLG1CQUFHLEtBQUtqQyxZQUFMLEdBQW9CLEtBQUtxQyxLQUFMLENBQVdKLENBQS9CLEdBQW1DLEtBQUtyQztBQUYxQixhQUFyQjtBQUlBLG1CQUFPMEcsTUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7QUEyRkE7Ozs7OzRDQU1BO0FBQ0ksbUJBQU8sQ0FBQyxLQUFLdkMsUUFBTCxHQUFnQixDQUFoQixHQUFvQixDQUFyQixJQUEwQixLQUFLaEQsT0FBTCxDQUFhdUUsTUFBOUM7QUFDSDs7QUFFRDs7Ozs7Ozs7MkNBTUE7QUFDSSxnQkFBTWtDLFVBQVUsRUFBaEI7QUFDQSxnQkFBTUMsV0FBVyxLQUFLQyxlQUF0QjtBQUNBLGlCQUFLLElBQUlDLEdBQVQsSUFBZ0JGLFFBQWhCLEVBQ0E7QUFDSSxvQkFBTUcsVUFBVUgsU0FBU0UsR0FBVCxDQUFoQjtBQUNBLG9CQUFJLEtBQUs1RyxPQUFMLENBQWE4RyxPQUFiLENBQXFCRCxRQUFRdkQsU0FBN0IsTUFBNEMsQ0FBQyxDQUFqRCxFQUNBO0FBQ0ltRCw0QkFBUXBELElBQVIsQ0FBYXdELE9BQWI7QUFDSDtBQUNKO0FBQ0QsbUJBQU9KLE9BQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7c0NBTUE7QUFDSSxnQkFBTUEsVUFBVSxFQUFoQjtBQUNBLGdCQUFNQyxXQUFXLEtBQUtDLGVBQXRCO0FBQ0EsaUJBQUssSUFBSUMsR0FBVCxJQUFnQkYsUUFBaEIsRUFDQTtBQUNJRCx3QkFBUXBELElBQVIsQ0FBYXFELFNBQVNFLEdBQVQsQ0FBYjtBQUNIO0FBQ0QsbUJBQU9ILE9BQVA7QUFDSDs7QUFFRDs7Ozs7OztpQ0FLQTtBQUNJLGdCQUFJLEtBQUtoSSxPQUFMLENBQWEsUUFBYixDQUFKLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhLFFBQWIsRUFBdUJzSSxLQUF2QjtBQUNBLHFCQUFLdEksT0FBTCxDQUFhLFFBQWIsRUFBdUJrRixNQUF2QjtBQUNIO0FBQ0QsZ0JBQUksS0FBS2xGLE9BQUwsQ0FBYSxZQUFiLENBQUosRUFDQTtBQUNJLHFCQUFLQSxPQUFMLENBQWEsWUFBYixFQUEyQnNJLEtBQTNCO0FBQ0g7QUFDRCxnQkFBSSxLQUFLdEksT0FBTCxDQUFhLE1BQWIsQ0FBSixFQUNBO0FBQ0kscUJBQUtBLE9BQUwsQ0FBYSxNQUFiLEVBQXFCc0ksS0FBckI7QUFDSDtBQUNELGdCQUFJLEtBQUt0SSxPQUFMLENBQWEsT0FBYixDQUFKLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhLE9BQWIsRUFBc0I2QixNQUF0QjtBQUNIO0FBQ0QsZ0JBQUksS0FBSzdCLE9BQUwsQ0FBYSxZQUFiLENBQUosRUFDQTtBQUNJLHFCQUFLQSxPQUFMLENBQWEsWUFBYixFQUEyQjBILEtBQTNCO0FBQ0g7QUFDSjs7QUFFRDs7QUFFQTs7Ozs7Ozs7O21DQU1XYSxJLEVBQU1qRyxNLEVBQ2pCO0FBQUEsZ0JBRHlCa0csS0FDekIsdUVBRCtCM0ksYUFBYWlHLE1BQzVDOztBQUNJLGlCQUFLOUYsT0FBTCxDQUFhdUksSUFBYixJQUFxQmpHLE1BQXJCO0FBQ0EsZ0JBQU1tRyxVQUFVNUksYUFBYXdJLE9BQWIsQ0FBcUJFLElBQXJCLENBQWhCO0FBQ0EsZ0JBQUlFLFlBQVksQ0FBQyxDQUFqQixFQUNBO0FBQ0k1SSw2QkFBYWtHLE1BQWIsQ0FBb0IwQyxPQUFwQixFQUE2QixDQUE3QjtBQUNIO0FBQ0Q1SSx5QkFBYWtHLE1BQWIsQ0FBb0J5QyxLQUFwQixFQUEyQixDQUEzQixFQUE4QkQsSUFBOUI7QUFDQSxpQkFBS1QsV0FBTDtBQUNIOztBQUVEOzs7Ozs7O3FDQUlhWSxJLEVBQ2I7QUFDSSxnQkFBSSxLQUFLMUksT0FBTCxDQUFhMEksSUFBYixDQUFKLEVBQ0E7QUFDSSxxQkFBSzFJLE9BQUwsQ0FBYTBJLElBQWIsSUFBcUIsSUFBckI7QUFDQSxxQkFBSy9GLElBQUwsQ0FBVStGLE9BQU8sU0FBakI7QUFDQSxxQkFBS1osV0FBTDtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7b0NBSVlZLEksRUFDWjtBQUNJLGdCQUFJLEtBQUsxSSxPQUFMLENBQWEwSSxJQUFiLENBQUosRUFDQTtBQUNJLHFCQUFLMUksT0FBTCxDQUFhMEksSUFBYixFQUFtQnJHLEtBQW5CO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7OztxQ0FJYXFHLEksRUFDYjtBQUNJLGdCQUFJLEtBQUsxSSxPQUFMLENBQWEwSSxJQUFiLENBQUosRUFDQTtBQUNJLHFCQUFLMUksT0FBTCxDQUFhMEksSUFBYixFQUFtQkMsTUFBbkI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7O3NDQUtBO0FBQ0ksaUJBQUsxSSxXQUFMLEdBQW1CLEVBQW5CO0FBREo7QUFBQTtBQUFBOztBQUFBO0FBRUksc0NBQW1CSixZQUFuQixtSUFDQTtBQUFBLHdCQURTeUMsTUFDVDs7QUFDSSx3QkFBSSxLQUFLdEMsT0FBTCxDQUFhc0MsTUFBYixDQUFKLEVBQ0E7QUFDSSw2QkFBS3JDLFdBQUwsQ0FBaUIyRSxJQUFqQixDQUFzQixLQUFLNUUsT0FBTCxDQUFhc0MsTUFBYixDQUF0QjtBQUNIO0FBQ0o7QUFSTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBU0M7O0FBRUQ7Ozs7Ozs7Ozs7Ozs2QkFTS3ZDLE8sRUFDTDtBQUNJLGlCQUFLQyxPQUFMLENBQWEsTUFBYixJQUF1QixJQUFJZCxJQUFKLENBQVMsSUFBVCxFQUFlYSxPQUFmLENBQXZCO0FBQ0EsaUJBQUsrSCxXQUFMO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFjTS9ILE8sRUFDTjtBQUNJLGlCQUFLQyxPQUFMLENBQWEsT0FBYixJQUF3QixJQUFJWixLQUFKLENBQVUsSUFBVixFQUFnQlcsT0FBaEIsQ0FBeEI7QUFDQSxpQkFBSytILFdBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O21DQVFXL0gsTyxFQUNYO0FBQ0ksaUJBQUtDLE9BQUwsQ0FBYSxZQUFiLElBQTZCLElBQUlWLFVBQUosQ0FBZSxJQUFmLEVBQXFCUyxPQUFyQixDQUE3QjtBQUNBLGlCQUFLK0gsV0FBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7K0JBV08vSCxPLEVBQ1A7QUFDSSxpQkFBS0MsT0FBTCxDQUFhLFFBQWIsSUFBeUIsSUFBSVQsTUFBSixDQUFXLElBQVgsRUFBaUJRLE9BQWpCLENBQXpCO0FBQ0EsaUJBQUsrSCxXQUFMO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs4QkFRTS9ILE8sRUFDTjtBQUNJLGlCQUFLQyxPQUFMLENBQWEsT0FBYixJQUF3QixJQUFJYixLQUFKLENBQVUsSUFBVixFQUFnQlksT0FBaEIsQ0FBeEI7QUFDQSxpQkFBSytILFdBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkFlS3RGLEMsRUFBR0MsQyxFQUFHMUMsTyxFQUNYO0FBQ0ksaUJBQUtDLE9BQUwsQ0FBYSxNQUFiLElBQXVCLElBQUlSLElBQUosQ0FBUyxJQUFULEVBQWVnRCxDQUFmLEVBQWtCQyxDQUFsQixFQUFxQjFDLE9BQXJCLENBQXZCO0FBQ0EsaUJBQUsrSCxXQUFMO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Ozs7K0JBU09jLE0sRUFBUTdJLE8sRUFDZjtBQUNJLGlCQUFLQyxPQUFMLENBQWEsUUFBYixJQUF5QixJQUFJTixNQUFKLENBQVcsSUFBWCxFQUFpQmtKLE1BQWpCLEVBQXlCN0ksT0FBekIsQ0FBekI7QUFDQSxpQkFBSytILFdBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7OzhCQVFNL0gsTyxFQUNOO0FBQ0ksaUJBQUtDLE9BQUwsQ0FBYSxPQUFiLElBQXdCLElBQUlMLEtBQUosQ0FBVSxJQUFWLEVBQWdCSSxPQUFoQixDQUF4QjtBQUNBLGlCQUFLK0gsV0FBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7OztrQ0FVVS9ILE8sRUFDVjtBQUNJLGlCQUFLQyxPQUFMLENBQWEsWUFBYixJQUE2QixJQUFJWCxTQUFKLENBQWMsSUFBZCxFQUFvQlUsT0FBcEIsQ0FBN0I7QUFDQSxpQkFBSytILFdBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O21DQWNXL0gsTyxFQUNYO0FBQ0ksaUJBQUtDLE9BQUwsQ0FBYSxhQUFiLElBQThCLElBQUlKLFVBQUosQ0FBZSxJQUFmLEVBQXFCRyxPQUFyQixDQUE5QjtBQUNBLGlCQUFLK0gsV0FBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OztBQW1CQTs7Ozs7OztzQ0FPY3RGLEMsRUFBR0MsQyxFQUFHVSxLLEVBQU9FLE0sRUFDM0I7QUFDSSxnQkFBSWIsSUFBSSxLQUFLUyxJQUFiLEVBQ0E7QUFDSSxxQkFBS0EsSUFBTCxHQUFZVCxDQUFaO0FBQ0gsYUFIRCxNQUlLLElBQUlBLElBQUlXLEtBQUosR0FBWSxLQUFLeUQsS0FBckIsRUFDTDtBQUNJLHFCQUFLQSxLQUFMLEdBQWFwRSxJQUFJVyxLQUFqQjtBQUNIO0FBQ0QsZ0JBQUlWLElBQUksS0FBS1MsR0FBYixFQUNBO0FBQ0kscUJBQUtBLEdBQUwsR0FBV1QsQ0FBWDtBQUNILGFBSEQsTUFJSyxJQUFJQSxJQUFJWSxNQUFKLEdBQWEsS0FBS3dELE1BQXRCLEVBQ0w7QUFDSSxxQkFBS0EsTUFBTCxHQUFjcEUsSUFBSVksTUFBbEI7QUFDSDtBQUNKOzs7NEJBeG5DRDtBQUNJLG1CQUFPLEtBQUtuRCxZQUFaO0FBQ0gsUzswQkFDZTJJLEssRUFDaEI7QUFDSSxpQkFBSzNJLFlBQUwsR0FBb0IySSxLQUFwQjtBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksbUJBQU8sS0FBS3pJLGFBQVo7QUFDSCxTOzBCQUNnQnlJLEssRUFDakI7QUFDSSxpQkFBS3pJLGFBQUwsR0FBcUJ5SSxLQUFyQjtBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksZ0JBQUksS0FBS3ZJLFdBQVQsRUFDQTtBQUNJLHVCQUFPLEtBQUtBLFdBQVo7QUFDSCxhQUhELE1BS0E7QUFDSSx1QkFBTyxLQUFLNkMsS0FBWjtBQUNIO0FBQ0osUzswQkFDYzBGLEssRUFDZjtBQUNJLGlCQUFLdkksV0FBTCxHQUFtQnVJLEtBQW5CO0FBQ0EsaUJBQUtsRixhQUFMO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBS0E7QUFDSSxnQkFBSSxLQUFLbkQsWUFBVCxFQUNBO0FBQ0ksdUJBQU8sS0FBS0EsWUFBWjtBQUNILGFBSEQsTUFLQTtBQUNJLHVCQUFPLEtBQUs2QyxNQUFaO0FBQ0g7QUFDSixTOzBCQUNld0YsSyxFQUNoQjtBQUNJLGlCQUFLckksWUFBTCxHQUFvQnFJLEtBQXBCO0FBQ0EsaUJBQUtsRixhQUFMO0FBQ0g7Ozs0QkE2UkQ7QUFDSSxtQkFBTyxLQUFLeEQsV0FBTCxHQUFtQixLQUFLMEMsS0FBTCxDQUFXTCxDQUFyQztBQUNIOztBQUVEOzs7Ozs7Ozs0QkFNQTtBQUNJLG1CQUFPLEtBQUtuQyxZQUFMLEdBQW9CLEtBQUt3QyxLQUFMLENBQVdKLENBQXRDO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzRCQU1BO0FBQ0ksbUJBQU8sS0FBS2xDLFVBQUwsR0FBa0IsS0FBS3NDLEtBQUwsQ0FBV0wsQ0FBcEM7QUFDSDs7QUFFRDs7Ozs7Ozs7NEJBTUE7QUFDSSxtQkFBTyxLQUFLL0IsV0FBTCxHQUFtQixLQUFLb0MsS0FBTCxDQUFXSixDQUFyQztBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksbUJBQU8sRUFBRUQsR0FBRyxLQUFLWSxnQkFBTCxHQUF3QixDQUF4QixHQUE0QixLQUFLWixDQUFMLEdBQVMsS0FBS0ssS0FBTCxDQUFXTCxDQUFyRCxFQUF3REMsR0FBRyxLQUFLYSxpQkFBTCxHQUF5QixDQUF6QixHQUE2QixLQUFLYixDQUFMLEdBQVMsS0FBS0ksS0FBTCxDQUFXSixDQUE1RyxFQUFQO0FBQ0gsUzswQkFDVW9HLEssRUFDWDtBQUNJLGlCQUFLbEIsVUFBTCxDQUFnQmtCLEtBQWhCO0FBQ0g7Ozs0QkErQkQ7QUFDSSxtQkFBTyxFQUFFckcsR0FBRyxDQUFDLEtBQUtBLENBQU4sR0FBVSxLQUFLSyxLQUFMLENBQVdMLENBQTFCLEVBQTZCQyxHQUFHLENBQUMsS0FBS0EsQ0FBTixHQUFVLEtBQUtJLEtBQUwsQ0FBV0osQ0FBckQsRUFBUDtBQUNILFM7MEJBQ1VvRyxLLEVBQ1g7QUFDSSxpQkFBS0MsVUFBTCxDQUFnQkQsS0FBaEI7QUFDSDs7OzRCQXFRRDtBQUNJLG1CQUFPLENBQUMsS0FBS3JHLENBQU4sR0FBVSxLQUFLSyxLQUFMLENBQVdMLENBQXJCLEdBQXlCLEtBQUtZLGdCQUFyQztBQUNILFM7MEJBQ1N5RixLLEVBQ1Y7QUFDSSxpQkFBS3JHLENBQUwsR0FBUyxDQUFDcUcsS0FBRCxHQUFTLEtBQUtoRyxLQUFMLENBQVdMLENBQXBCLEdBQXdCLEtBQUtyQyxXQUF0QztBQUNBLGlCQUFLa0gsTUFBTDtBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksbUJBQU8sQ0FBQyxLQUFLN0UsQ0FBTixHQUFVLEtBQUtLLEtBQUwsQ0FBV0wsQ0FBNUI7QUFDSCxTOzBCQUNRcUcsSyxFQUNUO0FBQ0ksaUJBQUtyRyxDQUFMLEdBQVMsQ0FBQ3FHLEtBQUQsR0FBUyxLQUFLaEcsS0FBTCxDQUFXTCxDQUE3QjtBQUNBLGlCQUFLNkUsTUFBTDtBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksbUJBQU8sQ0FBQyxLQUFLNUUsQ0FBTixHQUFVLEtBQUtJLEtBQUwsQ0FBV0osQ0FBNUI7QUFDSCxTOzBCQUNPb0csSyxFQUNSO0FBQ0ksaUJBQUtwRyxDQUFMLEdBQVMsQ0FBQ29HLEtBQUQsR0FBUyxLQUFLaEcsS0FBTCxDQUFXSixDQUE3QjtBQUNBLGlCQUFLNEUsTUFBTDtBQUNIOztBQUVEOzs7Ozs7OzRCQUtBO0FBQ0ksbUJBQU8sQ0FBQyxLQUFLNUUsQ0FBTixHQUFVLEtBQUtJLEtBQUwsQ0FBV0osQ0FBckIsR0FBeUIsS0FBS2EsaUJBQXJDO0FBQ0gsUzswQkFDVXVGLEssRUFDWDtBQUNJLGlCQUFLcEcsQ0FBTCxHQUFTLENBQUNvRyxLQUFELEdBQVMsS0FBS2hHLEtBQUwsQ0FBV0osQ0FBcEIsR0FBd0IsS0FBS3BDLFlBQXRDO0FBQ0EsaUJBQUtnSCxNQUFMO0FBQ0g7QUFDRDs7Ozs7Ozs0QkFLQTtBQUNJLG1CQUFPLEtBQUs5RCxNQUFaO0FBQ0gsUzswQkFDU3NGLEssRUFDVjtBQUNJLGlCQUFLdEYsTUFBTCxHQUFjc0YsS0FBZDtBQUNIOztBQUVEOzs7Ozs7Ozs0QkFNQTtBQUNJLG1CQUFPLEtBQUtFLGFBQVo7QUFDSCxTOzBCQUNnQkYsSyxFQUNqQjtBQUNJLGdCQUFJQSxLQUFKLEVBQ0E7QUFDSSxxQkFBS0UsYUFBTCxHQUFxQkYsS0FBckI7QUFDQSxxQkFBSzdGLE9BQUwsR0FBZTZGLEtBQWY7QUFDSCxhQUpELE1BTUE7QUFDSSxxQkFBS0UsYUFBTCxHQUFxQixLQUFyQjtBQUNBLHFCQUFLL0YsT0FBTCxHQUFlLElBQUl0QixLQUFLb0MsU0FBVCxDQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixLQUFLdkQsVUFBOUIsRUFBMEMsS0FBS0UsV0FBL0MsQ0FBZjtBQUNIO0FBQ0o7Ozs0QkE0VVc7QUFBRSxtQkFBTyxLQUFLdUksTUFBWjtBQUFvQixTOzBCQUN4QkgsSyxFQUNWO0FBQ0ksaUJBQUtHLE1BQUwsR0FBY0gsS0FBZDtBQUNBLGlCQUFLdEcsWUFBTCxHQUFvQixJQUFwQjtBQUNBLGlCQUFLRyxNQUFMLEdBQWMsS0FBZDtBQUNBLGlCQUFLSyxPQUFMLEdBQWUsS0FBZjtBQUNBLGdCQUFJOEYsS0FBSixFQUNBO0FBQ0kscUJBQUt0SCxPQUFMLEdBQWUsRUFBZjtBQUNBLHFCQUFLZ0QsUUFBTCxHQUFnQixLQUFoQjtBQUNIO0FBQ0o7Ozs7RUF4eUNrQjdDLEtBQUt1SCxTOztBQXMwQzVCOzs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7O0FBU0E7Ozs7Ozs7OztBQVNBOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7Ozs7Ozs7QUFXQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7O0FBTUE7Ozs7OztBQU1BLElBQUksT0FBT3ZILElBQVAsS0FBZ0IsV0FBcEIsRUFDQTtBQUNJQSxTQUFLd0gsTUFBTCxDQUFZcEosUUFBWixHQUF1QkEsUUFBdkI7QUFDSDs7QUFFRHFKLE9BQU9DLE9BQVAsR0FBaUJ0SixRQUFqQiIsImZpbGUiOiJ2aWV3cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHV0aWxzID0gIHJlcXVpcmUoJy4vdXRpbHMnKVxuY29uc3QgRHJhZyA9IHJlcXVpcmUoJy4vZHJhZycpXG5jb25zdCBQaW5jaCA9IHJlcXVpcmUoJy4vcGluY2gnKVxuY29uc3QgQ2xhbXAgPSByZXF1aXJlKCcuL2NsYW1wJylcbmNvbnN0IENsYW1wWm9vbSA9IHJlcXVpcmUoJy4vY2xhbXAtem9vbScpXG5jb25zdCBEZWNlbGVyYXRlID0gcmVxdWlyZSgnLi9kZWNlbGVyYXRlJylcbmNvbnN0IEJvdW5jZSA9IHJlcXVpcmUoJy4vYm91bmNlJylcbmNvbnN0IFNuYXAgPSByZXF1aXJlKCcuL3NuYXAnKVxuY29uc3QgU25hcFpvb20gPSByZXF1aXJlKCcuL3NuYXAtem9vbScpXG5jb25zdCBGb2xsb3cgPSByZXF1aXJlKCcuL2ZvbGxvdycpXG5jb25zdCBXaGVlbCA9IHJlcXVpcmUoJy4vd2hlZWwnKVxuY29uc3QgTW91c2VFZGdlcyA9IHJlcXVpcmUoJy4vbW91c2UtZWRnZXMnKVxuXG5jb25zdCBQTFVHSU5fT1JERVIgPSBbJ2RyYWcnLCAncGluY2gnLCAnd2hlZWwnLCAnZm9sbG93JywgJ21vdXNlLWVkZ2VzJywgJ2RlY2VsZXJhdGUnLCAnYm91bmNlJywgJ3NuYXAtem9vbScsICdjbGFtcC16b29tJywgJ3NuYXAnLCAnY2xhbXAnXVxuXG5jbGFzcyBWaWV3cG9ydCBleHRlbmRzIFBJWEkuQ29udGFpbmVyXG57XG4gICAgLyoqXG4gICAgICogQGV4dGVuZHMgUElYSS5Db250YWluZXJcbiAgICAgKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNjcmVlbldpZHRoPXdpbmRvdy5pbm5lcldpZHRoXVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zY3JlZW5IZWlnaHQ9d2luZG93LmlubmVySGVpZ2h0XVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53b3JsZFdpZHRoPXRoaXMud2lkdGhdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndvcmxkSGVpZ2h0PXRoaXMuaGVpZ2h0XVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy50aHJlc2hvbGQ9NV0gbnVtYmVyIG9mIHBpeGVscyB0byBtb3ZlIHRvIHRyaWdnZXIgYW4gaW5wdXQgZXZlbnQgKGUuZy4sIGRyYWcsIHBpbmNoKSBvciBkaXNhYmxlIGEgY2xpY2tlZCBldmVudFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucGFzc2l2ZVdoZWVsPXRydWVdIHdoZXRoZXIgdGhlICd3aGVlbCcgZXZlbnQgaXMgc2V0IHRvIHBhc3NpdmVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnN0b3BQcm9wYWdhdGlvbj1mYWxzZV0gd2hldGhlciB0byBzdG9wUHJvcGFnYXRpb24gb2YgZXZlbnRzIHRoYXQgaW1wYWN0IHRoZSB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7KFBJWEkuUmVjdGFuZ2xlfFBJWEkuQ2lyY2xlfFBJWEkuRWxsaXBzZXxQSVhJLlBvbHlnb258UElYSS5Sb3VuZGVkUmVjdGFuZ2xlKX0gW29wdGlvbnMuZm9yY2VIaXRBcmVhXSBjaGFuZ2UgdGhlIGRlZmF1bHQgaGl0QXJlYSBmcm9tIHdvcmxkIHNpemUgdG8gYSBuZXcgdmFsdWVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm5vVGlja2VyXSBzZXQgdGhpcyBpZiB5b3Ugd2FudCB0byBtYW51YWxseSBjYWxsIHVwZGF0ZSgpIGZ1bmN0aW9uIG9uIGVhY2ggZnJhbWVcbiAgICAgKiBAcGFyYW0ge1BJWEkudGlja2VyLlRpY2tlcn0gW29wdGlvbnMudGlja2VyPVBJWEkudGlja2VyLnNoYXJlZF0gdXNlIHRoaXMgUElYSS50aWNrZXIgZm9yIHVwZGF0ZXNcbiAgICAgKiBAcGFyYW0ge1BJWEkuSW50ZXJhY3Rpb25NYW5hZ2VyfSBbb3B0aW9ucy5pbnRlcmFjdGlvbj1udWxsXSBJbnRlcmFjdGlvbk1hbmFnZXIsIGF2YWlsYWJsZSBmcm9tIGluc3RhbnRpYXRlZCBXZWJHTFJlbmRlcmVyL0NhbnZhc1JlbmRlcmVyLnBsdWdpbnMuaW50ZXJhY3Rpb24gLSB1c2VkIHRvIGNhbGN1bGF0ZSBwb2ludGVyIHBvc3Rpb24gcmVsYXRpdmUgdG8gY2FudmFzIGxvY2F0aW9uIG9uIHNjcmVlblxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLmRpdldoZWVsPWRvY3VtZW50LmJvZHldIGRpdiB0byBhdHRhY2ggdGhlIHdoZWVsIGV2ZW50XG4gICAgICogQGZpcmVzIGNsaWNrZWRcbiAgICAgKiBAZmlyZXMgZHJhZy1zdGFydFxuICAgICAqIEBmaXJlcyBkcmFnLWVuZFxuICAgICAqIEBmaXJlcyBkcmFnLXJlbW92ZVxuICAgICAqIEBmaXJlcyBwaW5jaC1zdGFydFxuICAgICAqIEBmaXJlcyBwaW5jaC1lbmRcbiAgICAgKiBAZmlyZXMgcGluY2gtcmVtb3ZlXG4gICAgICogQGZpcmVzIHNuYXAtc3RhcnRcbiAgICAgKiBAZmlyZXMgc25hcC1lbmRcbiAgICAgKiBAZmlyZXMgc25hcC1yZW1vdmVcbiAgICAgKiBAZmlyZXMgc25hcC16b29tLXN0YXJ0XG4gICAgICogQGZpcmVzIHNuYXAtem9vbS1lbmRcbiAgICAgKiBAZmlyZXMgc25hcC16b29tLXJlbW92ZVxuICAgICAqIEBmaXJlcyBib3VuY2UteC1zdGFydFxuICAgICAqIEBmaXJlcyBib3VuY2UteC1lbmRcbiAgICAgKiBAZmlyZXMgYm91bmNlLXktc3RhcnRcbiAgICAgKiBAZmlyZXMgYm91bmNlLXktZW5kXG4gICAgICogQGZpcmVzIGJvdW5jZS1yZW1vdmVcbiAgICAgKiBAZmlyZXMgd2hlZWxcbiAgICAgKiBAZmlyZXMgd2hlZWwtcmVtb3ZlXG4gICAgICogQGZpcmVzIHdoZWVsLXNjcm9sbFxuICAgICAqIEBmaXJlcyB3aGVlbC1zY3JvbGwtcmVtb3ZlXG4gICAgICogQGZpcmVzIG1vdXNlLWVkZ2Utc3RhcnRcbiAgICAgKiBAZmlyZXMgbW91c2UtZWRnZS1lbmRcbiAgICAgKiBAZmlyZXMgbW91c2UtZWRnZS1yZW1vdmVcbiAgICAgKiBAZmlyZXMgbW92ZWRcbiAgICAgKiBAZmlyZXMgbW92ZWQtZW5kXG4gICAgICogQGZpcmVzIHpvb21lZFxuICAgICAqIEBmaXJlcyB6b29tZWQtZW5kXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcbiAgICB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5wbHVnaW5zID0ge31cbiAgICAgICAgdGhpcy5wbHVnaW5zTGlzdCA9IFtdXG4gICAgICAgIHRoaXMuX3NjcmVlbldpZHRoID0gb3B0aW9ucy5zY3JlZW5XaWR0aFxuICAgICAgICB0aGlzLl9zY3JlZW5IZWlnaHQgPSBvcHRpb25zLnNjcmVlbkhlaWdodFxuICAgICAgICB0aGlzLl93b3JsZFdpZHRoID0gb3B0aW9ucy53b3JsZFdpZHRoXG4gICAgICAgIHRoaXMuX3dvcmxkSGVpZ2h0ID0gb3B0aW9ucy53b3JsZEhlaWdodFxuICAgICAgICB0aGlzLmhpdEFyZWFGdWxsU2NyZWVuID0gdXRpbHMuZGVmYXVsdHMob3B0aW9ucy5oaXRBcmVhRnVsbFNjcmVlbiwgdHJ1ZSlcbiAgICAgICAgdGhpcy5mb3JjZUhpdEFyZWEgPSBvcHRpb25zLmZvcmNlSGl0QXJlYVxuICAgICAgICB0aGlzLnBhc3NpdmVXaGVlbCA9IHV0aWxzLmRlZmF1bHRzKG9wdGlvbnMucGFzc2l2ZVdoZWVsLCB0cnVlKVxuICAgICAgICB0aGlzLnN0b3BFdmVudCA9IG9wdGlvbnMuc3RvcFByb3BhZ2F0aW9uXG4gICAgICAgIHRoaXMudGhyZXNob2xkID0gdXRpbHMuZGVmYXVsdHMob3B0aW9ucy50aHJlc2hvbGQsIDUpXG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSBvcHRpb25zLmludGVyYWN0aW9uIHx8IG51bGxcbiAgICAgICAgdGhpcy5kaXYgPSBvcHRpb25zLmRpdldoZWVsIHx8IGRvY3VtZW50LmJvZHlcbiAgICAgICAgdGhpcy5saXN0ZW5lcnModGhpcy5kaXYpXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGFjdGl2ZSB0b3VjaCBwb2ludCBpZHMgb24gdGhlIHZpZXdwb3J0XG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJbXX1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRvdWNoZXMgPSBbXVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5ub1RpY2tlcilcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy50aWNrZXIgPSBvcHRpb25zLnRpY2tlciB8fCBQSVhJLnRpY2tlci5zaGFyZWRcbiAgICAgICAgICAgIHRoaXMudGlja2VyRnVuY3Rpb24gPSAoKSA9PiB0aGlzLnVwZGF0ZSh0aGlzLnRpY2tlci5lbGFwc2VkTVMpXG4gICAgICAgICAgICB0aGlzLnRpY2tlci5hZGQodGhpcy50aWNrZXJGdW5jdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgYWxsIGV2ZW50IGxpc3RlbmVycyBmcm9tIHZpZXdwb3J0XG4gICAgICogKHVzZWZ1bCBmb3IgY2xlYW51cCBvZiB3aGVlbCBhbmQgdGlja2VyIGV2ZW50cyB3aGVuIHJlbW92aW5nIHZpZXdwb3J0KVxuICAgICAqL1xuICAgIHJlbW92ZUxpc3RlbmVycygpXG4gICAge1xuICAgICAgICB0aGlzLnRpY2tlci5yZW1vdmUodGhpcy50aWNrZXJGdW5jdGlvbilcbiAgICAgICAgdGhpcy5kaXYucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLndoZWVsRnVuY3Rpb24pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogb3ZlcnJpZGVzIFBJWEkuQ29udGFpbmVyJ3MgZGVzdHJveSB0byBhbHNvIHJlbW92ZSB0aGUgJ3doZWVsJyBhbmQgUElYSS5UaWNrZXIgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveShvcHRpb25zKVxuICAgIHtcbiAgICAgICAgc3VwZXIuZGVzdHJveShvcHRpb25zKVxuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHZpZXdwb3J0IG9uIGVhY2ggZnJhbWVcbiAgICAgKiBieSBkZWZhdWx0LCB5b3UgZG8gbm90IG5lZWQgdG8gY2FsbCB0aGlzIHVubGVzcyB5b3Ugc2V0IG9wdGlvbnMubm9UaWNrZXI9dHJ1ZVxuICAgICAqL1xuICAgIHVwZGF0ZShlbGFwc2VkKVxuICAgIHtcbiAgICAgICAgaWYgKCF0aGlzLnBhdXNlKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zTGlzdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKGVsYXBzZWQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxhc3RWaWV3cG9ydClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3IgbW92ZWQtZW5kIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFZpZXdwb3J0LnggIT09IHRoaXMueCB8fCB0aGlzLmxhc3RWaWV3cG9ydC55ICE9PSB0aGlzLnkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmluZyA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubW92aW5nKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmVkLWVuZCcsIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmluZyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHpvb21lZC1lbmQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0Vmlld3BvcnQuc2NhbGVYICE9PSB0aGlzLnNjYWxlLnggfHwgdGhpcy5sYXN0Vmlld3BvcnQuc2NhbGVZICE9PSB0aGlzLnNjYWxlLnkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnpvb21pbmcgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnpvb21pbmcpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnem9vbWVkLWVuZCcsIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvb21pbmcgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5mb3JjZUhpdEFyZWEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaXRBcmVhLnggPSB0aGlzLmxlZnRcbiAgICAgICAgICAgICAgICB0aGlzLmhpdEFyZWEueSA9IHRoaXMudG9wXG4gICAgICAgICAgICAgICAgdGhpcy5oaXRBcmVhLndpZHRoID0gdGhpcy53b3JsZFNjcmVlbldpZHRoXG4gICAgICAgICAgICAgICAgdGhpcy5oaXRBcmVhLmhlaWdodCA9IHRoaXMud29ybGRTY3JlZW5IZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2RpcnR5ID0gdGhpcy5fZGlydHkgfHwgIXRoaXMubGFzdFZpZXdwb3J0IHx8XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0Vmlld3BvcnQueCAhPT0gdGhpcy54IHx8IHRoaXMubGFzdFZpZXdwb3J0LnkgIT09IHRoaXMueSB8fFxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFZpZXdwb3J0LnNjYWxlWCAhPT0gdGhpcy5zY2FsZS54IHx8IHRoaXMubGFzdFZpZXdwb3J0LnNjYWxlWSAhPT0gdGhpcy5zY2FsZS55XG4gICAgICAgICAgICB0aGlzLmxhc3RWaWV3cG9ydCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLngsXG4gICAgICAgICAgICAgICAgeTogdGhpcy55LFxuICAgICAgICAgICAgICAgIHNjYWxlWDogdGhpcy5zY2FsZS54LFxuICAgICAgICAgICAgICAgIHNjYWxlWTogdGhpcy5zY2FsZS55XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1c2UgdGhpcyB0byBzZXQgc2NyZWVuIGFuZCB3b3JsZCBzaXplcy0tbmVlZGVkIGZvciBwaW5jaC93aGVlbC9jbGFtcC9ib3VuY2VcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NjcmVlbldpZHRoPXdpbmRvdy5pbm5lcldpZHRoXVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbc2NyZWVuSGVpZ2h0PXdpbmRvdy5pbm5lckhlaWdodF1cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3dvcmxkV2lkdGhdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt3b3JsZEhlaWdodF1cbiAgICAgKi9cbiAgICByZXNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCwgd29ybGRXaWR0aCwgd29ybGRIZWlnaHQpXG4gICAge1xuICAgICAgICB0aGlzLl9zY3JlZW5XaWR0aCA9IHNjcmVlbldpZHRoIHx8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgIHRoaXMuX3NjcmVlbkhlaWdodCA9IHNjcmVlbkhlaWdodCB8fCB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICAgICAgaWYgKHdvcmxkV2lkdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmxkV2lkdGggPSB3b3JsZFdpZHRoXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdvcmxkSGVpZ2h0KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLl93b3JsZEhlaWdodCA9IHdvcmxkSGVpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNpemVQbHVnaW5zKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjYWxsZWQgYWZ0ZXIgYSB3b3JsZFdpZHRoL0hlaWdodCBjaGFuZ2VcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlc2l6ZVBsdWdpbnMoKVxuICAgIHtcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIHRoaXMucGx1Z2luc0xpc3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHBsdWdpbi5yZXNpemUoKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2NyZWVuIHdpZHRoIGluIHNjcmVlbiBwaXhlbHNcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzY3JlZW5XaWR0aCgpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2NyZWVuV2lkdGhcbiAgICB9XG4gICAgc2V0IHNjcmVlbldpZHRoKHZhbHVlKVxuICAgIHtcbiAgICAgICAgdGhpcy5fc2NyZWVuV2lkdGggPSB2YWx1ZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNjcmVlbiBoZWlnaHQgaW4gc2NyZWVuIHBpeGVsc1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHNjcmVlbkhlaWdodCgpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2NyZWVuSGVpZ2h0XG4gICAgfVxuICAgIHNldCBzY3JlZW5IZWlnaHQodmFsdWUpXG4gICAge1xuICAgICAgICB0aGlzLl9zY3JlZW5IZWlnaHQgPSB2YWx1ZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHdvcmxkIHdpZHRoIGluIHBpeGVsc1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHdvcmxkV2lkdGgoKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMuX3dvcmxkV2lkdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93b3JsZFdpZHRoXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53aWR0aFxuICAgICAgICB9XG4gICAgfVxuICAgIHNldCB3b3JsZFdpZHRoKHZhbHVlKVxuICAgIHtcbiAgICAgICAgdGhpcy5fd29ybGRXaWR0aCA9IHZhbHVlXG4gICAgICAgIHRoaXMucmVzaXplUGx1Z2lucygpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd29ybGQgaGVpZ2h0IGluIHBpeGVsc1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHdvcmxkSGVpZ2h0KClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLl93b3JsZEhlaWdodClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkSGVpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWlnaHRcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXQgd29ybGRIZWlnaHQodmFsdWUpXG4gICAge1xuICAgICAgICB0aGlzLl93b3JsZEhlaWdodCA9IHZhbHVlXG4gICAgICAgIHRoaXMucmVzaXplUGx1Z2lucygpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0IHZpc2libGUgYm91bmRzIG9mIHZpZXdwb3J0XG4gICAgICogQHJldHVybiB7b2JqZWN0fSBib3VuZHMgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cbiAgICAgKi9cbiAgICBnZXRWaXNpYmxlQm91bmRzKClcbiAgICB7XG4gICAgICAgIHJldHVybiB7IHg6IHRoaXMubGVmdCwgeTogdGhpcy50b3AsIHdpZHRoOiB0aGlzLndvcmxkU2NyZWVuV2lkdGgsIGhlaWdodDogdGhpcy53b3JsZFNjcmVlbkhlaWdodCB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkIGlucHV0IGxpc3RlbmVyc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgbGlzdGVuZXJzKGRpdilcbiAgICB7XG4gICAgICAgIHRoaXMuaW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICAgIGlmICghdGhpcy5mb3JjZUhpdEFyZWEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuaGl0QXJlYSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgwLCAwLCB0aGlzLndvcmxkV2lkdGgsIHRoaXMud29ybGRIZWlnaHQpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vbigncG9pbnRlcmRvd24nLCB0aGlzLmRvd24pXG4gICAgICAgIHRoaXMub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5tb3ZlKVxuICAgICAgICB0aGlzLm9uKCdwb2ludGVydXAnLCB0aGlzLnVwKVxuICAgICAgICB0aGlzLm9uKCdwb2ludGVydXBvdXRzaWRlJywgdGhpcy51cClcbiAgICAgICAgdGhpcy5vbigncG9pbnRlcmNhbmNlbCcsIHRoaXMudXApXG4gICAgICAgIHRoaXMub24oJ3BvaW50ZXJvdXQnLCB0aGlzLnVwKVxuICAgICAgICB0aGlzLndoZWVsRnVuY3Rpb24gPSAoZSkgPT4gdGhpcy5oYW5kbGVXaGVlbChlKVxuICAgICAgICBkaXYuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLndoZWVsRnVuY3Rpb24sIHsgcGFzc2l2ZTogdGhpcy5wYXNzaXZlV2hlZWwgfSlcbiAgICAgICAgdGhpcy5sZWZ0RG93biA9IGZhbHNlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIGRvd24gZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkb3duKGUpXG4gICAge1xuICAgICAgICBpZiAodGhpcy5wYXVzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUuZGF0YS5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKGUuZGF0YS5vcmlnaW5hbEV2ZW50LmJ1dHRvbiA9PSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMubGVmdERvd24gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZXMucHVzaChlLmRhdGEucG9pbnRlcklkKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY291bnREb3duUG9pbnRlcnMoKSA9PT0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5sYXN0ID0geyB4OiBlLmRhdGEuZ2xvYmFsLngsIHk6IGUuZGF0YS5nbG9iYWwueSB9XG5cbiAgICAgICAgICAgIC8vIGNsaWNrZWQgZXZlbnQgZG9lcyBub3QgZmlyZSBpZiB2aWV3cG9ydCBpcyBkZWNlbGVyYXRpbmcgb3IgYm91bmNpbmdcbiAgICAgICAgICAgIGNvbnN0IGRlY2VsZXJhdGUgPSB0aGlzLnBsdWdpbnNbJ2RlY2VsZXJhdGUnXVxuICAgICAgICAgICAgY29uc3QgYm91bmNlID0gdGhpcy5wbHVnaW5zWydib3VuY2UnXVxuICAgICAgICAgICAgaWYgKCghZGVjZWxlcmF0ZSB8fCAhZGVjZWxlcmF0ZS5pc0FjdGl2ZSgpKSAmJiAoIWJvdW5jZSB8fCAhYm91bmNlLmlzQWN0aXZlKCkpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tlZEF2YWlsYWJsZSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRBdmFpbGFibGUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jbGlja2VkQXZhaWxhYmxlID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdG9wXG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiB0aGlzLnBsdWdpbnNMaXN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAocGx1Z2luLmRvd24oZSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3RvcCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RvcCAmJiB0aGlzLnN0b3BFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hldGhlciBjaGFuZ2UgZXhjZWVkcyB0aHJlc2hvbGRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjaGFuZ2VcbiAgICAgKi9cbiAgICBjaGVja1RocmVzaG9sZChjaGFuZ2UpXG4gICAge1xuICAgICAgICBpZiAoTWF0aC5hYnMoY2hhbmdlKSA+PSB0aGlzLnRocmVzaG9sZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW92ZSBldmVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG1vdmUoZSlcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdG9wXG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiB0aGlzLnBsdWdpbnNMaXN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAocGx1Z2luLm1vdmUoZSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3RvcCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmNsaWNrZWRBdmFpbGFibGUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3RYID0gZS5kYXRhLmdsb2JhbC54IC0gdGhpcy5sYXN0LnhcbiAgICAgICAgICAgIGNvbnN0IGRpc3RZID0gZS5kYXRhLmdsb2JhbC55IC0gdGhpcy5sYXN0LnlcbiAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrVGhyZXNob2xkKGRpc3RYKSB8fCB0aGlzLmNoZWNrVGhyZXNob2xkKGRpc3RZKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrZWRBdmFpbGFibGUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0b3AgJiYgdGhpcy5zdG9wRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGFuZGxlIHVwIGV2ZW50c1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXAoZSlcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLmRhdGEub3JpZ2luYWxFdmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQgJiYgZS5kYXRhLm9yaWdpbmFsRXZlbnQuYnV0dG9uID09IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubGVmdERvd24gPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGUuZGF0YS5wb2ludGVyVHlwZSAhPT0gJ21vdXNlJylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRvdWNoZXMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlc1tpXSA9PT0gZS5kYXRhLnBvaW50ZXJJZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG91Y2hlcy5zcGxpY2UoaSwgMSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RvcFxuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zTGlzdClcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHBsdWdpbi51cChlKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY2xpY2tlZEF2YWlsYWJsZSAmJiB0aGlzLmNvdW50RG93blBvaW50ZXJzKCkgPT09IDApXG4gICAgICAgIHtcblx0XHRcdC8vIGNvbnNvbGUuZXJyb3IoXCJjbGlja2VkXCIpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdjbGlja2VkJywgeyBzY3JlZW46IHRoaXMubGFzdCwgd29ybGQ6IHRoaXMudG9Xb3JsZCh0aGlzLmxhc3QpLCB2aWV3cG9ydDogdGhpcyB9KVxuICAgICAgICAgICAgdGhpcy5jbGlja2VkQXZhaWxhYmxlID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdG9wICYmIHRoaXMuc3RvcEV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXRzIHBvaW50ZXIgcG9zaXRpb24gaWYgdGhpcy5pbnRlcmFjdGlvbiBpcyBzZXRcbiAgICAgKiBAcGFyYW0ge1VJRXZlbnR9IGV2dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0UG9pbnRlclBvc2l0aW9uKGV2dClcbiAgICB7XG4gICAgICAgIGxldCBwb2ludCA9IG5ldyBQSVhJLlBvaW50KClcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ubWFwUG9zaXRpb25Ub1BvaW50KHBvaW50LCBldnQuY2xpZW50WCwgZXZ0LmNsaWVudFkpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBwb2ludC54ID0gZXZ0LmNsaWVudFhcbiAgICAgICAgICAgIHBvaW50LnkgPSBldnQuY2xpZW50WVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb2ludFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhhbmRsZSB3aGVlbCBldmVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGhhbmRsZVdoZWVsKGUpXG4gICAge1xuICAgICAgICBpZiAodGhpcy5wYXVzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBvbmx5IGhhbmRsZSB3aGVlbCBldmVudHMgd2hlcmUgdGhlIG1vdXNlIGlzIG92ZXIgdGhlIHZpZXdwb3J0XG4gICAgICAgIGNvbnN0IHBvaW50ID0gdGhpcy50b0xvY2FsKHRoaXMuZ2V0UG9pbnRlclBvc2l0aW9uKGUpKVxuICAgICAgICBpZiAodGhpcy5sZWZ0IDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJpZ2h0ICYmIHRoaXMudG9wIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB0aGlzLmJvdHRvbSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHJlc3VsdFxuICAgICAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIHRoaXMucGx1Z2luc0xpc3QpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi53aGVlbChlKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGFuZ2UgY29vcmRpbmF0ZXMgZnJvbSBzY3JlZW4gdG8gd29ybGRcbiAgICAgKiBAcGFyYW0ge251bWJlcnxQSVhJLlBvaW50fSB4XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt5XVxuICAgICAqIEByZXR1cm5zIHtQSVhJLlBvaW50fVxuICAgICAqL1xuICAgIHRvV29ybGQoKVxuICAgIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSBhcmd1bWVudHNbMF1cbiAgICAgICAgICAgIGNvbnN0IHkgPSBhcmd1bWVudHNbMV1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvTG9jYWwoeyB4LCB5IH0pXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b0xvY2FsKGFyZ3VtZW50c1swXSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoYW5nZSBjb29yZGluYXRlcyBmcm9tIHdvcmxkIHRvIHNjcmVlblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfFBJWEkuUG9pbnR9IHhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldXG4gICAgICogQHJldHVybnMge1BJWEkuUG9pbnR9XG4gICAgICovXG4gICAgdG9TY3JlZW4oKVxuICAgIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSBhcmd1bWVudHNbMF1cbiAgICAgICAgICAgIGNvbnN0IHkgPSBhcmd1bWVudHNbMV1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvR2xvYmFsKHsgeCwgeSB9KVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgcG9pbnQgPSBhcmd1bWVudHNbMF1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvR2xvYmFsKHBvaW50KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2NyZWVuIHdpZHRoIGluIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBnZXQgd29ybGRTY3JlZW5XaWR0aCgpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JlZW5XaWR0aCAvIHRoaXMuc2NhbGUueFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNjcmVlbiBoZWlnaHQgaW4gd29ybGQgY29vcmRpbmF0ZXNcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIGdldCB3b3JsZFNjcmVlbkhlaWdodCgpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JlZW5IZWlnaHQgLyB0aGlzLnNjYWxlLnlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3b3JsZCB3aWR0aCBpbiBzY3JlZW4gY29vcmRpbmF0ZXNcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIGdldCBzY3JlZW5Xb3JsZFdpZHRoKClcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLndvcmxkV2lkdGggKiB0aGlzLnNjYWxlLnhcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3b3JsZCBoZWlnaHQgaW4gc2NyZWVuIGNvb3JkaW5hdGVzXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICBnZXQgc2NyZWVuV29ybGRIZWlnaHQoKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRIZWlnaHQgKiB0aGlzLnNjYWxlLnlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXQgY2VudGVyIG9mIHNjcmVlbiBpbiB3b3JsZCBjb29yZGluYXRlc1xuICAgICAqIEB0eXBlIHtQSVhJLlBvaW50TGlrZX1cbiAgICAgKi9cbiAgICBnZXQgY2VudGVyKClcbiAgICB7XG4gICAgICAgIHJldHVybiB7IHg6IHRoaXMud29ybGRTY3JlZW5XaWR0aCAvIDIgLSB0aGlzLnggLyB0aGlzLnNjYWxlLngsIHk6IHRoaXMud29ybGRTY3JlZW5IZWlnaHQgLyAyIC0gdGhpcy55IC8gdGhpcy5zY2FsZS55IH1cbiAgICB9XG4gICAgc2V0IGNlbnRlcih2YWx1ZSlcbiAgICB7XG4gICAgICAgIHRoaXMubW92ZUNlbnRlcih2YWx1ZSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBtb3ZlIGNlbnRlciBvZiB2aWV3cG9ydCB0byBwb2ludFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxQSVhJLlBvaW50TGlrZSl9IHggb3IgcG9pbnRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBtb3ZlQ2VudGVyKC8qeCwgeSB8IFBJWEkuUG9pbnQqLylcbiAgICB7XG4gICAgICAgIGxldCB4LCB5XG4gICAgICAgIGlmICghaXNOYU4oYXJndW1lbnRzWzBdKSlcbiAgICAgICAge1xuICAgICAgICAgICAgeCA9IGFyZ3VtZW50c1swXVxuICAgICAgICAgICAgeSA9IGFyZ3VtZW50c1sxXVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgeCA9IGFyZ3VtZW50c1swXS54XG4gICAgICAgICAgICB5ID0gYXJndW1lbnRzWzBdLnlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvc2l0aW9uLnNldCgodGhpcy53b3JsZFNjcmVlbldpZHRoIC8gMiAtIHgpICogdGhpcy5zY2FsZS54LCAodGhpcy53b3JsZFNjcmVlbkhlaWdodCAvIDIgLSB5KSAqIHRoaXMuc2NhbGUueSlcbiAgICAgICAgdGhpcy5fcmVzZXQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHRvcC1sZWZ0IGNvcm5lclxuICAgICAqIEB0eXBlIHtQSVhJLlBvaW50TGlrZX1cbiAgICAgKi9cbiAgICBnZXQgY29ybmVyKClcbiAgICB7XG4gICAgICAgIHJldHVybiB7IHg6IC10aGlzLnggLyB0aGlzLnNjYWxlLngsIHk6IC10aGlzLnkgLyB0aGlzLnNjYWxlLnkgfVxuICAgIH1cbiAgICBzZXQgY29ybmVyKHZhbHVlKVxuICAgIHtcbiAgICAgICAgdGhpcy5tb3ZlQ29ybmVyKHZhbHVlKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG1vdmUgdmlld3BvcnQncyB0b3AtbGVmdCBjb3JuZXI7IGFsc28gY2xhbXBzIGFuZCByZXNldHMgZGVjZWxlcmF0ZSBhbmQgYm91bmNlIChhcyBuZWVkZWQpXG4gICAgICogQHBhcmFtIHtudW1iZXJ8UElYSS5Qb2ludH0geHxwb2ludFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBtb3ZlQ29ybmVyKC8qeCwgeSB8IHBvaW50Ki8pXG4gICAge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi5zZXQoLWFyZ3VtZW50c1swXS54ICogdGhpcy5zY2FsZS54LCAtYXJndW1lbnRzWzBdLnkgKiB0aGlzLnNjYWxlLnkpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnNldCgtYXJndW1lbnRzWzBdICogdGhpcy5zY2FsZS54LCAtYXJndW1lbnRzWzFdICogdGhpcy5zY2FsZS55KVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jlc2V0KClcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGFuZ2Ugem9vbSBzbyB0aGUgd2lkdGggZml0cyBpbiB0aGUgdmlld3BvcnRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3dpZHRoPXRoaXMuX3dvcmxkV2lkdGhdIGluIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbY2VudGVyXSBtYWludGFpbiB0aGUgc2FtZSBjZW50ZXJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzY2FsZVk9dHJ1ZV0gd2hldGhlciB0byBzZXQgc2NhbGVZPXNjYWxlWFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQ2xhbXA9ZmFsc2VdIHdoZXRoZXIgdG8gZGlzYWJsZSBjbGFtcC16b29tXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBmaXRXaWR0aCh3aWR0aCwgY2VudGVyLCBzY2FsZVk9dHJ1ZSwgbm9DbGFtcClcbiAgICB7XG4gICAgICAgIGxldCBzYXZlXG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNhdmUgPSB0aGlzLmNlbnRlclxuICAgICAgICB9XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgdGhpcy53b3JsZFdpZHRoXG4gICAgICAgIHRoaXMuc2NhbGUueCA9IHRoaXMuc2NyZWVuV2lkdGggLyB3aWR0aFxuXG4gICAgICAgIGlmIChzY2FsZVkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueSA9IHRoaXMuc2NhbGUueFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhbXBab29tID0gdGhpcy5wbHVnaW5zWydjbGFtcC16b29tJ11cbiAgICAgICAgaWYgKCFub0NsYW1wICYmIGNsYW1wWm9vbSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2xhbXBab29tLmNsYW1wKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUNlbnRlcihzYXZlKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2hhbmdlIHpvb20gc28gdGhlIGhlaWdodCBmaXRzIGluIHRoZSB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0PXRoaXMuX3dvcmxkSGVpZ2h0XSBpbiB3b3JsZCBjb29yZGluYXRlc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NlbnRlcl0gbWFpbnRhaW4gdGhlIHNhbWUgY2VudGVyIG9mIHRoZSBzY3JlZW4gYWZ0ZXIgem9vbVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NjYWxlWD10cnVlXSB3aGV0aGVyIHRvIHNldCBzY2FsZVggPSBzY2FsZVlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0NsYW1wPWZhbHNlXSB3aGV0aGVyIHRvIGRpc2FibGUgY2xhbXAtem9vbVxuICAgICAqIEByZXR1cm4ge1ZpZXdwb3J0fSB0aGlzXG4gICAgICovXG4gICAgZml0SGVpZ2h0KGhlaWdodCwgY2VudGVyLCBzY2FsZVg9dHJ1ZSwgbm9DbGFtcClcbiAgICB7XG4gICAgICAgIGxldCBzYXZlXG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNhdmUgPSB0aGlzLmNlbnRlclxuICAgICAgICB9XG4gICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCB0aGlzLndvcmxkSGVpZ2h0XG4gICAgICAgIHRoaXMuc2NhbGUueSA9IHRoaXMuc2NyZWVuSGVpZ2h0IC8gaGVpZ2h0XG5cbiAgICAgICAgaWYgKHNjYWxlWClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS54ID0gdGhpcy5zY2FsZS55XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGFtcFpvb20gPSB0aGlzLnBsdWdpbnNbJ2NsYW1wLXpvb20nXVxuICAgICAgICBpZiAoIW5vQ2xhbXAgJiYgY2xhbXBab29tKVxuICAgICAgICB7XG4gICAgICAgICAgICBjbGFtcFpvb20uY2xhbXAoKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNlbnRlcilcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5tb3ZlQ2VudGVyKHNhdmUpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGFuZ2Ugem9vbSBzbyBpdCBmaXRzIHRoZSBlbnRpcmUgd29ybGQgaW4gdGhlIHZpZXdwb3J0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbY2VudGVyXSBtYWludGFpbiB0aGUgc2FtZSBjZW50ZXIgb2YgdGhlIHNjcmVlbiBhZnRlciB6b29tXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBmaXRXb3JsZChjZW50ZXIpXG4gICAge1xuICAgICAgICBsZXQgc2F2ZVxuICAgICAgICBpZiAoY2VudGVyKVxuICAgICAgICB7XG4gICAgICAgICAgICBzYXZlID0gdGhpcy5jZW50ZXJcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjYWxlLnggPSB0aGlzLnNjcmVlbldpZHRoIC8gdGhpcy53b3JsZFdpZHRoXG4gICAgICAgIHRoaXMuc2NhbGUueSA9IHRoaXMuc2NyZWVuSGVpZ2h0IC8gdGhpcy53b3JsZEhlaWdodFxuICAgICAgICBpZiAodGhpcy5zY2FsZS54IDwgdGhpcy5zY2FsZS55KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnkgPSB0aGlzLnNjYWxlLnhcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2NhbGUueCA9IHRoaXMuc2NhbGUueVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhbXBab29tID0gdGhpcy5wbHVnaW5zWydjbGFtcC16b29tJ11cbiAgICAgICAgaWYgKGNsYW1wWm9vbSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2xhbXBab29tLmNsYW1wKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUNlbnRlcihzYXZlKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2hhbmdlIHpvb20gc28gaXQgZml0cyB0aGUgc2l6ZSBvciB0aGUgZW50aXJlIHdvcmxkIGluIHRoZSB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NlbnRlcl0gbWFpbnRhaW4gdGhlIHNhbWUgY2VudGVyIG9mIHRoZSBzY3JlZW4gYWZ0ZXIgem9vbVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbd2lkdGhdIGRlc2lyZWQgd2lkdGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2hlaWdodF0gZGVzaXJlZCBoZWlnaHRcbiAgICAgKiBAcmV0dXJuIHtWaWV3cG9ydH0gdGhpc1xuICAgICAqL1xuICAgIGZpdChjZW50ZXIsIHdpZHRoLCBoZWlnaHQpXG4gICAge1xuICAgICAgICBsZXQgc2F2ZVxuICAgICAgICBpZiAoY2VudGVyKVxuICAgICAgICB7XG4gICAgICAgICAgICBzYXZlID0gdGhpcy5jZW50ZXJcbiAgICAgICAgfVxuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IHRoaXMud29ybGRXaWR0aFxuICAgICAgICBoZWlnaHQgPSBoZWlnaHQgfHwgdGhpcy53b3JsZEhlaWdodFxuICAgICAgICB0aGlzLnNjYWxlLnggPSB0aGlzLnNjcmVlbldpZHRoIC8gd2lkdGhcbiAgICAgICAgdGhpcy5zY2FsZS55ID0gdGhpcy5zY3JlZW5IZWlnaHQgLyBoZWlnaHRcbiAgICAgICAgaWYgKHRoaXMuc2NhbGUueCA8IHRoaXMuc2NhbGUueSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zY2FsZS55ID0gdGhpcy5zY2FsZS54XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNjYWxlLnggPSB0aGlzLnNjYWxlLnlcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjbGFtcFpvb20gPSB0aGlzLnBsdWdpbnNbJ2NsYW1wLXpvb20nXVxuICAgICAgICBpZiAoY2xhbXBab29tKVxuICAgICAgICB7XG4gICAgICAgICAgICBjbGFtcFpvb20uY2xhbXAoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUNlbnRlcihzYXZlKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogem9vbSB2aWV3cG9ydCBieSBhIGNlcnRhaW4gcGVyY2VudCAoaW4gYm90aCB4IGFuZCB5IGRpcmVjdGlvbilcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudCBjaGFuZ2UgKGUuZy4sIDAuMjUgd291bGQgaW5jcmVhc2UgYSBzdGFydGluZyBzY2FsZSBvZiAxLjAgdG8gMS4yNSlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjZW50ZXJdIG1haW50YWluIHRoZSBzYW1lIGNlbnRlciBvZiB0aGUgc2NyZWVuIGFmdGVyIHpvb21cbiAgICAgKiBAcmV0dXJuIHtWaWV3cG9ydH0gdGhlIHZpZXdwb3J0XG4gICAgICovXG4gICAgem9vbVBlcmNlbnQocGVyY2VudCwgY2VudGVyKVxuICAgIHtcbiAgICAgICAgbGV0IHNhdmVcbiAgICAgICAgaWYgKGNlbnRlcilcbiAgICAgICAge1xuICAgICAgICAgICAgc2F2ZSA9IHRoaXMuY2VudGVyXG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2NhbGUgPSB0aGlzLnNjYWxlLnggKyB0aGlzLnNjYWxlLnggKiBwZXJjZW50XG4gICAgICAgIHRoaXMuc2NhbGUuc2V0KHNjYWxlKVxuICAgICAgICBjb25zdCBjbGFtcFpvb20gPSB0aGlzLnBsdWdpbnNbJ2NsYW1wLXpvb20nXVxuICAgICAgICBpZiAoY2xhbXBab29tKVxuICAgICAgICB7XG4gICAgICAgICAgICBjbGFtcFpvb20uY2xhbXAoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjZW50ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUNlbnRlcihzYXZlKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogem9vbSB2aWV3cG9ydCBieSBpbmNyZWFzaW5nL2RlY3JlYXNpbmcgd2lkdGggYnkgYSBjZXJ0YWluIG51bWJlciBvZiBwaXhlbHNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY2hhbmdlIGluIHBpeGVsc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NlbnRlcl0gbWFpbnRhaW4gdGhlIHNhbWUgY2VudGVyIG9mIHRoZSBzY3JlZW4gYWZ0ZXIgem9vbVxuICAgICAqIEByZXR1cm4ge1ZpZXdwb3J0fSB0aGUgdmlld3BvcnRcbiAgICAgKi9cbiAgICB6b29tKGNoYW5nZSwgY2VudGVyKVxuICAgIHtcbiAgICAgICAgdGhpcy5maXRXaWR0aChjaGFuZ2UgKyB0aGlzLndvcmxkU2NyZWVuV2lkdGgsIGNlbnRlcilcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndpZHRoXSB0aGUgZGVzaXJlZCB3aWR0aCB0byBzbmFwICh0byBtYWludGFpbiBhc3BlY3QgcmF0aW8sIGNob29zZSBvbmx5IHdpZHRoIG9yIGhlaWdodClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuaGVpZ2h0XSB0aGUgZGVzaXJlZCBoZWlnaHQgdG8gc25hcCAodG8gbWFpbnRhaW4gYXNwZWN0IHJhdGlvLCBjaG9vc2Ugb25seSB3aWR0aCBvciBoZWlnaHQpXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnRpbWU9MTAwMF1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gW29wdGlvbnMuZWFzZT1lYXNlSW5PdXRTaW5lXSBlYXNlIGZ1bmN0aW9uIG9yIG5hbWUgKHNlZSBodHRwOi8vZWFzaW5ncy5uZXQvIGZvciBzdXBwb3J0ZWQgbmFtZXMpXG4gICAgICogQHBhcmFtIHtQSVhJLlBvaW50fSBbb3B0aW9ucy5jZW50ZXJdIHBsYWNlIHRoaXMgcG9pbnQgYXQgY2VudGVyIGR1cmluZyB6b29tIGluc3RlYWQgb2YgY2VudGVyIG9mIHRoZSB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaW50ZXJydXB0PXRydWVdIHBhdXNlIHNuYXBwaW5nIHdpdGggYW55IHVzZXIgaW5wdXQgb24gdGhlIHZpZXdwb3J0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZW1vdmVPbkNvbXBsZXRlXSByZW1vdmVzIHRoaXMgcGx1Z2luIGFmdGVyIHNuYXBwaW5nIGlzIGNvbXBsZXRlXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZW1vdmVPbkludGVycnVwdF0gcmVtb3ZlcyB0aGlzIHBsdWdpbiBpZiBpbnRlcnJ1cHRlZCBieSBhbnkgdXNlciBpbnB1dFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZm9yY2VTdGFydF0gc3RhcnRzIHRoZSBzbmFwIGltbWVkaWF0ZWx5IHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgdmlld3BvcnQgaXMgYXQgdGhlIGRlc2lyZWQgem9vbVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubm9Nb3ZlXSB6b29tIGJ1dCBkbyBub3QgbW92ZVxuICAgICAqL1xuICAgIHNuYXBab29tKG9wdGlvbnMpXG4gICAge1xuICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAtem9vbSddID0gbmV3IFNuYXBab29tKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHR5cGVkZWYgT3V0T2ZCb3VuZHNcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gbGVmdFxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gcmlnaHRcbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IHRvcFxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYm90dG9tXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBpcyBjb250YWluZXIgb3V0IG9mIHdvcmxkIGJvdW5kc1xuICAgICAqIEByZXR1cm4ge091dE9mQm91bmRzfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgT09CKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9XG4gICAgICAgIHJlc3VsdC5sZWZ0ID0gdGhpcy5sZWZ0IDwgMFxuICAgICAgICByZXN1bHQucmlnaHQgPSB0aGlzLnJpZ2h0ID4gdGhpcy5fd29ybGRXaWR0aFxuICAgICAgICByZXN1bHQudG9wID0gdGhpcy50b3AgPCAwXG4gICAgICAgIHJlc3VsdC5ib3R0b20gPSB0aGlzLmJvdHRvbSA+IHRoaXMuX3dvcmxkSGVpZ2h0XG4gICAgICAgIHJlc3VsdC5jb3JuZXJQb2ludCA9IHtcbiAgICAgICAgICAgIHg6IHRoaXMuX3dvcmxkV2lkdGggKiB0aGlzLnNjYWxlLnggLSB0aGlzLl9zY3JlZW5XaWR0aCxcbiAgICAgICAgICAgIHk6IHRoaXMuX3dvcmxkSGVpZ2h0ICogdGhpcy5zY2FsZS55IC0gdGhpcy5fc2NyZWVuSGVpZ2h0XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHdvcmxkIGNvb3JkaW5hdGVzIG9mIHRoZSByaWdodCBlZGdlIG9mIHRoZSBzY3JlZW5cbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldCByaWdodCgpXG4gICAge1xuICAgICAgICByZXR1cm4gLXRoaXMueCAvIHRoaXMuc2NhbGUueCArIHRoaXMud29ybGRTY3JlZW5XaWR0aFxuICAgIH1cbiAgICBzZXQgcmlnaHQodmFsdWUpXG4gICAge1xuICAgICAgICB0aGlzLnggPSAtdmFsdWUgKiB0aGlzLnNjYWxlLnggKyB0aGlzLnNjcmVlbldpZHRoXG4gICAgICAgIHRoaXMuX3Jlc2V0KClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3b3JsZCBjb29yZGluYXRlcyBvZiB0aGUgbGVmdCBlZGdlIG9mIHRoZSBzY3JlZW5cbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBsZWZ0KClcbiAgICB7XG4gICAgICAgIHJldHVybiAtdGhpcy54IC8gdGhpcy5zY2FsZS54XG4gICAgfVxuICAgIHNldCBsZWZ0KHZhbHVlKVxuICAgIHtcbiAgICAgICAgdGhpcy54ID0gLXZhbHVlICogdGhpcy5zY2FsZS54XG4gICAgICAgIHRoaXMuX3Jlc2V0KClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3b3JsZCBjb29yZGluYXRlcyBvZiB0aGUgdG9wIGVkZ2Ugb2YgdGhlIHNjcmVlblxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHRvcCgpXG4gICAge1xuICAgICAgICByZXR1cm4gLXRoaXMueSAvIHRoaXMuc2NhbGUueVxuICAgIH1cbiAgICBzZXQgdG9wKHZhbHVlKVxuICAgIHtcbiAgICAgICAgdGhpcy55ID0gLXZhbHVlICogdGhpcy5zY2FsZS55XG4gICAgICAgIHRoaXMuX3Jlc2V0KClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3b3JsZCBjb29yZGluYXRlcyBvZiB0aGUgYm90dG9tIGVkZ2Ugb2YgdGhlIHNjcmVlblxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IGJvdHRvbSgpXG4gICAge1xuICAgICAgICByZXR1cm4gLXRoaXMueSAvIHRoaXMuc2NhbGUueSArIHRoaXMud29ybGRTY3JlZW5IZWlnaHRcbiAgICB9XG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcbiAgICB7XG4gICAgICAgIHRoaXMueSA9IC12YWx1ZSAqIHRoaXMuc2NhbGUueSArIHRoaXMuc2NyZWVuSGVpZ2h0XG4gICAgICAgIHRoaXMuX3Jlc2V0KClcbiAgICB9XG4gICAgLyoqXG4gICAgICogZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSB2aWV3cG9ydCBpcyBkaXJ0eSAoaS5lLiwgbmVlZHMgdG8gYmUgcmVuZGVyZXJlZCB0byB0aGUgc2NyZWVuIGJlY2F1c2Ugb2YgYSBjaGFuZ2UpXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGRpcnR5KClcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kaXJ0eVxuICAgIH1cbiAgICBzZXQgZGlydHkodmFsdWUpXG4gICAge1xuICAgICAgICB0aGlzLl9kaXJ0eSA9IHZhbHVlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcGVybWFuZW50bHkgY2hhbmdlcyB0aGUgVmlld3BvcnQncyBoaXRBcmVhXG4gICAgICogTk9URTogbm9ybWFsbHkgdGhlIGhpdEFyZWEgPSBQSVhJLlJlY3RhbmdsZShWaWV3cG9ydC5sZWZ0LCBWaWV3cG9ydC50b3AsIFZpZXdwb3J0LndvcmxkU2NyZWVuV2lkdGgsIFZpZXdwb3J0LndvcmxkU2NyZWVuSGVpZ2h0KVxuICAgICAqIEB0eXBlIHsoUElYSS5SZWN0YW5nbGV8UElYSS5DaXJjbGV8UElYSS5FbGxpcHNlfFBJWEkuUG9seWdvbnxQSVhJLlJvdW5kZWRSZWN0YW5nbGUpfVxuICAgICAqL1xuICAgIGdldCBmb3JjZUhpdEFyZWEoKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvcmNlSGl0QXJlYVxuICAgIH1cbiAgICBzZXQgZm9yY2VIaXRBcmVhKHZhbHVlKVxuICAgIHtcbiAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLl9mb3JjZUhpdEFyZWEgPSB2YWx1ZVxuICAgICAgICAgICAgdGhpcy5oaXRBcmVhID0gdmFsdWVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuX2ZvcmNlSGl0QXJlYSA9IGZhbHNlXG4gICAgICAgICAgICB0aGlzLmhpdEFyZWEgPSBuZXcgUElYSS5SZWN0YW5nbGUoMCwgMCwgdGhpcy53b3JsZFdpZHRoLCB0aGlzLndvcmxkSGVpZ2h0KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY291bnQgb2YgbW91c2UvdG91Y2ggcG9pbnRlcnMgdGhhdCBhcmUgZG93biBvbiB0aGUgdmlld3BvcnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgKi9cbiAgICBjb3VudERvd25Qb2ludGVycygpXG4gICAge1xuICAgICAgICByZXR1cm4gKHRoaXMubGVmdERvd24gPyAxIDogMCkgKyB0aGlzLnRvdWNoZXMubGVuZ3RoXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYXJyYXkgb2YgdG91Y2ggcG9pbnRlcnMgdGhhdCBhcmUgZG93biBvbiB0aGUgdmlld3BvcnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge1BJWEkuSW50ZXJhY3Rpb25UcmFja2luZ0RhdGFbXX1cbiAgICAgKi9cbiAgICBnZXRUb3VjaFBvaW50ZXJzKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXVxuICAgICAgICBjb25zdCBwb2ludGVycyA9IHRoaXMudHJhY2tlZFBvaW50ZXJzXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBwb2ludGVycylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgcG9pbnRlciA9IHBvaW50ZXJzW2tleV1cbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZXMuaW5kZXhPZihwb2ludGVyLnBvaW50ZXJJZCkgIT09IC0xKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChwb2ludGVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYXJyYXkgb2YgcG9pbnRlcnMgdGhhdCBhcmUgZG93biBvbiB0aGUgdmlld3BvcnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge1BJWEkuSW50ZXJhY3Rpb25UcmFja2luZ0RhdGFbXX1cbiAgICAgKi9cbiAgICBnZXRQb2ludGVycygpXG4gICAge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gW11cbiAgICAgICAgY29uc3QgcG9pbnRlcnMgPSB0aGlzLnRyYWNrZWRQb2ludGVyc1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gcG9pbnRlcnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChwb2ludGVyc1trZXldKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY2xhbXBzIGFuZCByZXNldHMgYm91bmNlIGFuZCBkZWNlbGVyYXRlIChhcyBuZWVkZWQpIGFmdGVyIG1hbnVhbGx5IG1vdmluZyB2aWV3cG9ydFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc2V0KClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbJ2JvdW5jZSddKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ2JvdW5jZSddLnJlc2V0KClcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snYm91bmNlJ10uYm91bmNlKClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydkZWNlbGVyYXRlJ10pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snZGVjZWxlcmF0ZSddLnJlc2V0KClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydzbmFwJ10pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLnJlc2V0KClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydjbGFtcCddKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ2NsYW1wJ10udXBkYXRlKClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydjbGFtcC16b29tJ10pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snY2xhbXAtem9vbSddLmNsYW1wKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBMVUdJTlNcblxuICAgIC8qKlxuICAgICAqIEluc2VydHMgYSB1c2VyIHBsdWdpbiBpbnRvIHRoZSB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHBsdWdpblxuICAgICAqIEBwYXJhbSB7UGx1Z2lufSBwbHVnaW4gLSBpbnN0YW50aWF0ZWQgUGx1Z2luIGNsYXNzXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleD1sYXN0IGVsZW1lbnRdIHBsdWdpbiBpcyBjYWxsZWQgY3VycmVudCBvcmRlcjogJ2RyYWcnLCAncGluY2gnLCAnd2hlZWwnLCAnZm9sbG93JywgJ21vdXNlLWVkZ2VzJywgJ2RlY2VsZXJhdGUnLCAnYm91bmNlJywgJ3NuYXAtem9vbScsICdjbGFtcC16b29tJywgJ3NuYXAnLCAnY2xhbXAnXG4gICAgICovXG4gICAgdXNlclBsdWdpbihuYW1lLCBwbHVnaW4sIGluZGV4PVBMVUdJTl9PUkRFUi5sZW5ndGgpXG4gICAge1xuICAgICAgICB0aGlzLnBsdWdpbnNbbmFtZV0gPSBwbHVnaW5cbiAgICAgICAgY29uc3QgY3VycmVudCA9IFBMVUdJTl9PUkRFUi5pbmRleE9mKG5hbWUpXG4gICAgICAgIGlmIChjdXJyZW50ICE9PSAtMSlcbiAgICAgICAge1xuICAgICAgICAgICAgUExVR0lOX09SREVSLnNwbGljZShjdXJyZW50LCAxKVxuICAgICAgICB9XG4gICAgICAgIFBMVUdJTl9PUkRFUi5zcGxpY2UoaW5kZXgsIDAsIG5hbWUpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgaW5zdGFsbGVkIHBsdWdpblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIG9mIHBsdWdpbiAoZS5nLiwgJ2RyYWcnLCAncGluY2gnKVxuICAgICAqL1xuICAgIHJlbW92ZVBsdWdpbih0eXBlKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1t0eXBlXSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW5zW3R5cGVdID0gbnVsbFxuICAgICAgICAgICAgdGhpcy5lbWl0KHR5cGUgKyAnLXJlbW92ZScpXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNTb3J0KClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHBhdXNlIHBsdWdpblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIG9mIHBsdWdpbiAoZS5nLiwgJ2RyYWcnLCAncGluY2gnKVxuICAgICAqL1xuICAgIHBhdXNlUGx1Z2luKHR5cGUpXG4gICAge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW3R5cGVdKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbdHlwZV0ucGF1c2UoKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVzdW1lIHBsdWdpblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIG9mIHBsdWdpbiAoZS5nLiwgJ2RyYWcnLCAncGluY2gnKVxuICAgICAqL1xuICAgIHJlc3VtZVBsdWdpbih0eXBlKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1t0eXBlXSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW5zW3R5cGVdLnJlc3VtZSgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzb3J0IHBsdWdpbnMgZm9yIHVwZGF0ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHBsdWdpbnNTb3J0KClcbiAgICB7XG4gICAgICAgIHRoaXMucGx1Z2luc0xpc3QgPSBbXVxuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgUExVR0lOX09SREVSKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5wbHVnaW5zW3BsdWdpbl0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW5zTGlzdC5wdXNoKHRoaXMucGx1Z2luc1twbHVnaW5dKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZW5hYmxlIG9uZS1maW5nZXIgdG91Y2ggdG8gZHJhZ1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlyZWN0aW9uPWFsbF0gZGlyZWN0aW9uIHRvIGRyYWcgKGFsbCwgeCwgb3IgeSlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndoZWVsPXRydWVdIHVzZSB3aGVlbCB0byBzY3JvbGwgaW4geSBkaXJlY3Rpb24gKHVubGVzcyB3aGVlbCBwbHVnaW4gaXMgYWN0aXZlKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53aGVlbFNjcm9sbD0xMF0gbnVtYmVyIG9mIHBpeGVscyB0byBzY3JvbGwgd2l0aCBlYWNoIHdoZWVsIHNwaW5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJldmVyc2VdIHJldmVyc2UgdGhlIGRpcmVjdGlvbiBvZiB0aGUgd2hlZWwgc2Nyb2xsXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnVuZGVyZmxvdz1jZW50ZXJdICh0b3AvYm90dG9tL2NlbnRlciBhbmQgbGVmdC9yaWdodC9jZW50ZXIsIG9yIGNlbnRlcikgd2hlcmUgdG8gcGxhY2Ugd29ybGQgaWYgdG9vIHNtYWxsIGZvciBzY3JlZW5cbiAgICAgKi9cbiAgICBkcmFnKG9wdGlvbnMpXG4gICAge1xuICAgICAgICB0aGlzLnBsdWdpbnNbJ2RyYWcnXSA9IG5ldyBEcmFnKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNsYW1wIHRvIHdvcmxkIGJvdW5kYXJpZXMgb3Igb3RoZXIgcHJvdmlkZWQgYm91bmRhcmllc1xuICAgICAqIE5PVEVTOlxuICAgICAqICAgY2xhbXAgaXMgZGlzYWJsZWQgaWYgY2FsbGVkIHdpdGggbm8gb3B0aW9uczsgdXNlIHsgZGlyZWN0aW9uOiAnYWxsJyB9IGZvciBhbGwgZWRnZSBjbGFtcGluZ1xuICAgICAqICAgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCwgd29ybGRXaWR0aCwgYW5kIHdvcmxkSGVpZ2h0IG5lZWRzIHRvIGJlIHNldCBmb3IgdGhpcyB0byB3b3JrIHByb3Blcmx5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxib29sZWFuKX0gW29wdGlvbnMubGVmdF0gY2xhbXAgbGVmdDsgdHJ1ZT0wXG4gICAgICogQHBhcmFtIHsobnVtYmVyfGJvb2xlYW4pfSBbb3B0aW9ucy5yaWdodF0gY2xhbXAgcmlnaHQ7IHRydWU9dmlld3BvcnQud29ybGRXaWR0aFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxib29sZWFuKX0gW29wdGlvbnMudG9wXSBjbGFtcCB0b3A7IHRydWU9MFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxib29sZWFuKX0gW29wdGlvbnMuYm90dG9tXSBjbGFtcCBib3R0b207IHRydWU9dmlld3BvcnQud29ybGRIZWlnaHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlyZWN0aW9uXSAoYWxsLCB4LCBvciB5KSB1c2luZyBjbGFtcHMgb2YgWzAsIHZpZXdwb3J0LndvcmxkV2lkdGgvdmlld3BvcnQud29ybGRIZWlnaHRdOyByZXBsYWNlcyBsZWZ0L3JpZ2h0L3RvcC9ib3R0b20gaWYgc2V0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnVuZGVyZmxvdz1jZW50ZXJdIChub25lIE9SICh0b3AvYm90dG9tL2NlbnRlciBhbmQgbGVmdC9yaWdodC9jZW50ZXIpIE9SIGNlbnRlcikgd2hlcmUgdG8gcGxhY2Ugd29ybGQgaWYgdG9vIHNtYWxsIGZvciBzY3JlZW4gKGUuZy4sIHRvcC1yaWdodCwgY2VudGVyLCBub25lLCBib3R0b21sZWZ0KVxuICAgICAqIEByZXR1cm4ge1ZpZXdwb3J0fSB0aGlzXG4gICAgICovXG4gICAgY2xhbXAob3B0aW9ucylcbiAgICB7XG4gICAgICAgIHRoaXMucGx1Z2luc1snY2xhbXAnXSA9IG5ldyBDbGFtcCh0aGlzLCBvcHRpb25zKVxuICAgICAgICB0aGlzLnBsdWdpbnNTb3J0KClcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkZWNlbGVyYXRlIGFmdGVyIGEgbW92ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZnJpY3Rpb249MC45NV0gcGVyY2VudCB0byBkZWNlbGVyYXRlIGFmdGVyIG1vdmVtZW50XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJvdW5jZT0wLjhdIHBlcmNlbnQgdG8gZGVjZWxlcmF0ZSB3aGVuIHBhc3QgYm91bmRhcmllcyAob25seSBhcHBsaWNhYmxlIHdoZW4gdmlld3BvcnQuYm91bmNlKCkgaXMgYWN0aXZlKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5taW5TcGVlZD0wLjAxXSBtaW5pbXVtIHZlbG9jaXR5IGJlZm9yZSBzdG9wcGluZy9yZXZlcnNpbmcgYWNjZWxlcmF0aW9uXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBkZWNlbGVyYXRlKG9wdGlvbnMpXG4gICAge1xuICAgICAgICB0aGlzLnBsdWdpbnNbJ2RlY2VsZXJhdGUnXSA9IG5ldyBEZWNlbGVyYXRlKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGJvdW5jZSBvbiBib3JkZXJzXG4gICAgICogTk9URTogc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCwgd29ybGRXaWR0aCwgYW5kIHdvcmxkSGVpZ2h0IG5lZWRzIHRvIGJlIHNldCBmb3IgdGhpcyB0byB3b3JrIHByb3Blcmx5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zaWRlcz1hbGxdIGFsbCwgaG9yaXpvbnRhbCwgdmVydGljYWwsIG9yIGNvbWJpbmF0aW9uIG9mIHRvcCwgYm90dG9tLCByaWdodCwgbGVmdCAoZS5nLiwgJ3RvcC1ib3R0b20tcmlnaHQnKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5mcmljdGlvbj0wLjVdIGZyaWN0aW9uIHRvIGFwcGx5IHRvIGRlY2VsZXJhdGUgaWYgYWN0aXZlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnRpbWU9MTUwXSB0aW1lIGluIG1zIHRvIGZpbmlzaCBib3VuY2VcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gW29wdGlvbnMuZWFzZT1lYXNlSW5PdXRTaW5lXSBlYXNlIGZ1bmN0aW9uIG9yIG5hbWUgKHNlZSBodHRwOi8vZWFzaW5ncy5uZXQvIGZvciBzdXBwb3J0ZWQgbmFtZXMpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnVuZGVyZmxvdz1jZW50ZXJdICh0b3AvYm90dG9tL2NlbnRlciBhbmQgbGVmdC9yaWdodC9jZW50ZXIsIG9yIGNlbnRlcikgd2hlcmUgdG8gcGxhY2Ugd29ybGQgaWYgdG9vIHNtYWxsIGZvciBzY3JlZW5cbiAgICAgKiBAcmV0dXJuIHtWaWV3cG9ydH0gdGhpc1xuICAgICAqL1xuICAgIGJvdW5jZShvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWydib3VuY2UnXSA9IG5ldyBCb3VuY2UodGhpcywgb3B0aW9ucylcbiAgICAgICAgdGhpcy5wbHVnaW5zU29ydCgpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZW5hYmxlIHBpbmNoIHRvIHpvb20gYW5kIHR3by1maW5nZXIgdG91Y2ggdG8gZHJhZ1xuICAgICAqIE5PVEU6IHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQsIHdvcmxkV2lkdGgsIGFuZCB3b3JsZEhlaWdodCBuZWVkcyB0byBiZSBzZXQgZm9yIHRoaXMgdG8gd29yayBwcm9wZXJseVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5wZXJjZW50PTEuMF0gcGVyY2VudCB0byBtb2RpZnkgcGluY2ggc3BlZWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm5vRHJhZ10gZGlzYWJsZSB0d28tZmluZ2VyIGRyYWdnaW5nXG4gICAgICogQHBhcmFtIHtQSVhJLlBvaW50fSBbb3B0aW9ucy5jZW50ZXJdIHBsYWNlIHRoaXMgcG9pbnQgYXQgY2VudGVyIGR1cmluZyB6b29tIGluc3RlYWQgb2YgY2VudGVyIG9mIHR3byBmaW5nZXJzXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICBwaW5jaChvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWydwaW5jaCddID0gbmV3IFBpbmNoKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNuYXAgdG8gYSBwb2ludFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50b3BMZWZ0XSBzbmFwIHRvIHRoZSB0b3AtbGVmdCBvZiB2aWV3cG9ydCBpbnN0ZWFkIG9mIGNlbnRlclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5mcmljdGlvbj0wLjhdIGZyaWN0aW9uL2ZyYW1lIHRvIGFwcGx5IGlmIGRlY2VsZXJhdGUgaXMgYWN0aXZlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnRpbWU9MTAwMF1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gW29wdGlvbnMuZWFzZT1lYXNlSW5PdXRTaW5lXSBlYXNlIGZ1bmN0aW9uIG9yIG5hbWUgKHNlZSBodHRwOi8vZWFzaW5ncy5uZXQvIGZvciBzdXBwb3J0ZWQgbmFtZXMpXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pbnRlcnJ1cHQ9dHJ1ZV0gcGF1c2Ugc25hcHBpbmcgd2l0aCBhbnkgdXNlciBpbnB1dCBvbiB0aGUgdmlld3BvcnRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlbW92ZU9uQ29tcGxldGVdIHJlbW92ZXMgdGhpcyBwbHVnaW4gYWZ0ZXIgc25hcHBpbmcgaXMgY29tcGxldGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlbW92ZU9uSW50ZXJydXB0XSByZW1vdmVzIHRoaXMgcGx1Z2luIGlmIGludGVycnVwdGVkIGJ5IGFueSB1c2VyIGlucHV0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5mb3JjZVN0YXJ0XSBzdGFydHMgdGhlIHNuYXAgaW1tZWRpYXRlbHkgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSB2aWV3cG9ydCBpcyBhdCB0aGUgZGVzaXJlZCBsb2NhdGlvblxuICAgICAqIEByZXR1cm4ge1ZpZXdwb3J0fSB0aGlzXG4gICAgICovXG4gICAgc25hcCh4LCB5LCBvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10gPSBuZXcgU25hcCh0aGlzLCB4LCB5LCBvcHRpb25zKVxuICAgICAgICB0aGlzLnBsdWdpbnNTb3J0KClcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBmb2xsb3cgYSB0YXJnZXRcbiAgICAgKiBOT1RFOiB1c2VzIHRoZSAoeCwgeSkgYXMgdGhlIGNlbnRlciB0byBmb2xsb3c7IGZvciBQSVhJLlNwcml0ZSB0byB3b3JrIHByb3Blcmx5LCB1c2Ugc3ByaXRlLmFuY2hvci5zZXQoMC41KVxuICAgICAqIEBwYXJhbSB7UElYSS5EaXNwbGF5T2JqZWN0fSB0YXJnZXQgdG8gZm9sbG93IChvYmplY3QgbXVzdCBpbmNsdWRlIHt4OiB4LWNvb3JkaW5hdGUsIHk6IHktY29vcmRpbmF0ZX0pXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zcGVlZD0wXSB0byBmb2xsb3cgaW4gcGl4ZWxzL2ZyYW1lICgwPXRlbGVwb3J0IHRvIGxvY2F0aW9uKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yYWRpdXNdIHJhZGl1cyAoaW4gd29ybGQgY29vcmRpbmF0ZXMpIG9mIGNlbnRlciBjaXJjbGUgd2hlcmUgbW92ZW1lbnQgaXMgYWxsb3dlZCB3aXRob3V0IG1vdmluZyB0aGUgdmlld3BvcnRcbiAgICAgKiBAcmV0dXJuIHtWaWV3cG9ydH0gdGhpc1xuICAgICAqL1xuICAgIGZvbGxvdyh0YXJnZXQsIG9wdGlvbnMpXG4gICAge1xuICAgICAgICB0aGlzLnBsdWdpbnNbJ2ZvbGxvdyddID0gbmV3IEZvbGxvdyh0aGlzLCB0YXJnZXQsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHpvb20gdXNpbmcgbW91c2Ugd2hlZWxcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnBlcmNlbnQ9MC4xXSBwZXJjZW50IHRvIHNjcm9sbCB3aXRoIGVhY2ggc3BpblxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmV2ZXJzZV0gcmV2ZXJzZSB0aGUgZGlyZWN0aW9uIG9mIHRoZSBzY3JvbGxcbiAgICAgKiBAcGFyYW0ge1BJWEkuUG9pbnR9IFtvcHRpb25zLmNlbnRlcl0gcGxhY2UgdGhpcyBwb2ludCBhdCBjZW50ZXIgZHVyaW5nIHpvb20gaW5zdGVhZCBvZiBjdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4gICAgICogQHJldHVybiB7Vmlld3BvcnR9IHRoaXNcbiAgICAgKi9cbiAgICB3aGVlbChvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWyd3aGVlbCddID0gbmV3IFdoZWVsKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGVuYWJsZSBjbGFtcGluZyBvZiB6b29tIHRvIGNvbnN0cmFpbnRzXG4gICAgICogTk9URTogc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCwgd29ybGRXaWR0aCwgYW5kIHdvcmxkSGVpZ2h0IG5lZWRzIHRvIGJlIHNldCBmb3IgdGhpcyB0byB3b3JrIHByb3Blcmx5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5taW5XaWR0aF0gbWluaW11bSB3aWR0aFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5taW5IZWlnaHRdIG1pbmltdW0gaGVpZ2h0XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdpZHRoXSBtYXhpbXVtIHdpZHRoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heEhlaWdodF0gbWF4aW11bSBoZWlnaHRcbiAgICAgKiBAcmV0dXJuIHtWaWV3cG9ydH0gdGhpc1xuICAgICAqL1xuICAgIGNsYW1wWm9vbShvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWydjbGFtcC16b29tJ10gPSBuZXcgQ2xhbXBab29tKHRoaXMsIG9wdGlvbnMpXG4gICAgICAgIHRoaXMucGx1Z2luc1NvcnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNjcm9sbCB2aWV3cG9ydCB3aGVuIG1vdXNlIGhvdmVycyBuZWFyIG9uZSBvZiB0aGUgZWRnZXMgb3IgcmFkaXVzLWRpc3RhbmNlIGZyb20gY2VudGVyIG9mIHNjcmVlbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnJhZGl1c10gZGlzdGFuY2UgZnJvbSBjZW50ZXIgb2Ygc2NyZWVuIGluIHNjcmVlbiBwaXhlbHNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZGlzdGFuY2VdIGRpc3RhbmNlIGZyb20gYWxsIHNpZGVzIGluIHNjcmVlbiBwaXhlbHNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMudG9wXSBhbHRlcm5hdGl2ZWx5LCBzZXQgdG9wIGRpc3RhbmNlIChsZWF2ZSB1bnNldCBmb3Igbm8gdG9wIHNjcm9sbClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuYm90dG9tXSBhbHRlcm5hdGl2ZWx5LCBzZXQgYm90dG9tIGRpc3RhbmNlIChsZWF2ZSB1bnNldCBmb3Igbm8gdG9wIHNjcm9sbClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubGVmdF0gYWx0ZXJuYXRpdmVseSwgc2V0IGxlZnQgZGlzdGFuY2UgKGxlYXZlIHVuc2V0IGZvciBubyB0b3Agc2Nyb2xsKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5yaWdodF0gYWx0ZXJuYXRpdmVseSwgc2V0IHJpZ2h0IGRpc3RhbmNlIChsZWF2ZSB1bnNldCBmb3Igbm8gdG9wIHNjcm9sbClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc3BlZWQ9OF0gc3BlZWQgaW4gcGl4ZWxzL2ZyYW1lIHRvIHNjcm9sbCB2aWV3cG9ydFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmV2ZXJzZV0gcmV2ZXJzZSBkaXJlY3Rpb24gb2Ygc2Nyb2xsXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5ub0RlY2VsZXJhdGVdIGRvbid0IHVzZSBkZWNlbGVyYXRlIHBsdWdpbiBldmVuIGlmIGl0J3MgaW5zdGFsbGVkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5saW5lYXJdIGlmIHVzaW5nIHJhZGl1cywgdXNlIGxpbmVhciBtb3ZlbWVudCAoKy8tIDEsICsvLSAxKSBpbnN0ZWFkIG9mIGFuZ2xlZCBtb3ZlbWVudCAoTWF0aC5jb3MoYW5nbGUgZnJvbSBjZW50ZXIpLCBNYXRoLnNpbihhbmdsZSBmcm9tIGNlbnRlcikpXG4gICAgICovXG4gICAgbW91c2VFZGdlcyhvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5wbHVnaW5zWydtb3VzZS1lZGdlcyddID0gbmV3IE1vdXNlRWRnZXModGhpcywgb3B0aW9ucylcbiAgICAgICAgdGhpcy5wbHVnaW5zU29ydCgpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcGF1c2Ugdmlld3BvcnQgKGluY2x1ZGluZyBhbmltYXRpb24gdXBkYXRlcyBzdWNoIGFzIGRlY2VsZXJhdGUpXG4gICAgICogTk9URTogd2hlbiBzZXR0aW5nIHBhdXNlPXRydWUsIGFsbCB0b3VjaGVzIGFuZCBtb3VzZSBhY3Rpb25zIGFyZSBjbGVhcmVkIChpLmUuLCBpZiBtb3VzZWRvd24gd2FzIGFjdGl2ZSwgaXQgYmVjb21lcyBpbmFjdGl2ZSBmb3IgcHVycG9zZXMgb2YgdGhlIHZpZXdwb3J0KVxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBwYXVzZSgpIHsgcmV0dXJuIHRoaXMuX3BhdXNlIH1cbiAgICBzZXQgcGF1c2UodmFsdWUpXG4gICAge1xuICAgICAgICB0aGlzLl9wYXVzZSA9IHZhbHVlXG4gICAgICAgIHRoaXMubGFzdFZpZXdwb3J0ID0gbnVsbFxuICAgICAgICB0aGlzLm1vdmluZyA9IGZhbHNlXG4gICAgICAgIHRoaXMuem9vbWluZyA9IGZhbHNlXG4gICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVzID0gW11cbiAgICAgICAgICAgIHRoaXMubGVmdERvd24gPSBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbW92ZSB0aGUgdmlld3BvcnQgc28gdGhlIGJvdW5kaW5nIGJveCBpcyB2aXNpYmxlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAgICAgKi9cbiAgICBlbnN1cmVWaXNpYmxlKHgsIHksIHdpZHRoLCBoZWlnaHQpXG4gICAge1xuICAgICAgICBpZiAoeCA8IHRoaXMubGVmdClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5sZWZ0ID0geFxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHggKyB3aWR0aCA+IHRoaXMucmlnaHQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHQgPSB4ICsgd2lkdGhcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSA8IHRoaXMudG9wKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnRvcCA9IHlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh5ICsgaGVpZ2h0ID4gdGhpcy5ib3R0b20pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYm90dG9tID0geSArIGhlaWdodFxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIGZpcmVzIGFmdGVyIGEgbW91c2Ugb3IgdG91Y2ggY2xpY2tcbiAqIEBldmVudCBWaWV3cG9ydCNjbGlja2VkXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtQSVhJLlBvaW50TGlrZX0gc2NyZWVuXG4gKiBAcHJvcGVydHkge1BJWEkuUG9pbnRMaWtlfSB3b3JsZFxuICogQHByb3BlcnR5IHtWaWV3cG9ydH0gdmlld3BvcnRcbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gYSBkcmFnIHN0YXJ0c1xuICogQGV2ZW50IFZpZXdwb3J0I2RyYWctc3RhcnRcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge1BJWEkuUG9pbnRMaWtlfSBzY3JlZW5cbiAqIEBwcm9wZXJ0eSB7UElYSS5Qb2ludExpa2V9IHdvcmxkXG4gKiBAcHJvcGVydHkge1ZpZXdwb3J0fSB2aWV3cG9ydFxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIGRyYWcgZW5kc1xuICogQGV2ZW50IFZpZXdwb3J0I2RyYWctZW5kXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtQSVhJLlBvaW50TGlrZX0gc2NyZWVuXG4gKiBAcHJvcGVydHkge1BJWEkuUG9pbnRMaWtlfSB3b3JsZFxuICogQHByb3BlcnR5IHtWaWV3cG9ydH0gdmlld3BvcnRcbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gYSBwaW5jaCBzdGFydHNcbiAqIEBldmVudCBWaWV3cG9ydCNwaW5jaC1zdGFydFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIHBpbmNoIGVuZFxuICogQGV2ZW50IFZpZXdwb3J0I3BpbmNoLWVuZFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIHNuYXAgc3RhcnRzXG4gKiBAZXZlbnQgVmlld3BvcnQjc25hcC1zdGFydFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIHNuYXAgZW5kc1xuICogQGV2ZW50IFZpZXdwb3J0I3NuYXAtZW5kXG4gKiBAdHlwZSB7Vmlld3BvcnR9XG4gKi9cblxuLyoqXG4gKiBmaXJlcyB3aGVuIGEgc25hcC16b29tIHN0YXJ0c1xuICogQGV2ZW50IFZpZXdwb3J0I3NuYXAtem9vbS1zdGFydFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIHNuYXAtem9vbSBlbmRzXG4gKiBAZXZlbnQgVmlld3BvcnQjc25hcC16b29tLWVuZFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIGJvdW5jZSBzdGFydHMgaW4gdGhlIHggZGlyZWN0aW9uXG4gKiBAZXZlbnQgVmlld3BvcnQjYm91bmNlLXgtc3RhcnRcbiAqIEB0eXBlIHtWaWV3cG9ydH1cbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gYSBib3VuY2UgZW5kcyBpbiB0aGUgeCBkaXJlY3Rpb25cbiAqIEBldmVudCBWaWV3cG9ydCNib3VuY2UteC1lbmRcbiAqIEB0eXBlIHtWaWV3cG9ydH1cbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gYSBib3VuY2Ugc3RhcnRzIGluIHRoZSB5IGRpcmVjdGlvblxuICogQGV2ZW50IFZpZXdwb3J0I2JvdW5jZS15LXN0YXJ0XG4gKiBAdHlwZSB7Vmlld3BvcnR9XG4gKi9cblxuLyoqXG4gKiBmaXJlcyB3aGVuIGEgYm91bmNlIGVuZHMgaW4gdGhlIHkgZGlyZWN0aW9uXG4gKiBAZXZlbnQgVmlld3BvcnQjYm91bmNlLXktZW5kXG4gKiBAdHlwZSB7Vmlld3BvcnR9XG4gKi9cblxuLyoqXG4gKiBmaXJlcyB3aGVuIGZvciBhIG1vdXNlIHdoZWVsIGV2ZW50XG4gKiBAZXZlbnQgVmlld3BvcnQjd2hlZWxcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge29iamVjdH0gd2hlZWxcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aGVlbC5keFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHdoZWVsLmR5XG4gKiBAcHJvcGVydHkge251bWJlcn0gd2hlZWwuZHpcbiAqIEBwcm9wZXJ0eSB7Vmlld3BvcnR9IHZpZXdwb3J0XG4gKi9cblxuLyoqXG4gKiBmaXJlcyB3aGVuIGEgd2hlZWwtc2Nyb2xsIG9jY3Vyc1xuICogQGV2ZW50IFZpZXdwb3J0I3doZWVsLXNjcm9sbFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiBhIG1vdXNlLWVkZ2Ugc3RhcnRzIHRvIHNjcm9sbFxuICogQGV2ZW50IFZpZXdwb3J0I21vdXNlLWVkZ2Utc3RhcnRcbiAqIEB0eXBlIHtWaWV3cG9ydH1cbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gdGhlIG1vdXNlLWVkZ2Ugc2Nyb2xsaW5nIGVuZHNcbiAqIEBldmVudCBWaWV3cG9ydCNtb3VzZS1lZGdlLWVuZFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiB2aWV3cG9ydCBtb3ZlcyB0aHJvdWdoIFVJIGludGVyYWN0aW9uLCBkZWNlbGVyYXRpb24sIG9yIGZvbGxvd1xuICogQGV2ZW50IFZpZXdwb3J0I21vdmVkXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtWaWV3cG9ydH0gdmlld3BvcnRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0eXBlIChkcmFnLCBzbmFwLCBwaW5jaCwgZm9sbG93LCBib3VuY2UteCwgYm91bmNlLXksIGNsYW1wLXgsIGNsYW1wLXksIGRlY2VsZXJhdGUsIG1vdXNlLWVkZ2VzLCB3aGVlbClcbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gdmlld3BvcnQgbW92ZXMgdGhyb3VnaCBVSSBpbnRlcmFjdGlvbiwgZGVjZWxlcmF0aW9uLCBvciBmb2xsb3dcbiAqIEBldmVudCBWaWV3cG9ydCN6b29tZWRcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge1ZpZXdwb3J0fSB2aWV3cG9ydFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHR5cGUgKGRyYWctem9vbSwgcGluY2gsIHdoZWVsLCBjbGFtcC16b29tKVxuICovXG5cbi8qKlxuICogZmlyZXMgd2hlbiB2aWV3cG9ydCBzdG9wcyBtb3ZpbmcgZm9yIGFueSByZWFzb25cbiAqIEBldmVudCBWaWV3cG9ydCNtb3ZlZC1lbmRcbiAqIEB0eXBlIHtWaWV3cG9ydH1cbiAqL1xuXG4vKipcbiAqIGZpcmVzIHdoZW4gdmlld3BvcnQgc3RvcHMgem9vbWluZyBmb3IgYW55IHJhc29uXG4gKiBAZXZlbnQgVmlld3BvcnQjem9vbWVkLWVuZFxuICogQHR5cGUge1ZpZXdwb3J0fVxuICovXG5cbmlmICh0eXBlb2YgUElYSSAhPT0gJ3VuZGVmaW5lZCcpXG57XG4gICAgUElYSS5leHRyYXMuVmlld3BvcnQgPSBWaWV3cG9ydFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdwb3J0XG4iXX0=