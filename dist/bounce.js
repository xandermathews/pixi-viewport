'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('./utils');
var Plugin = require('./plugin');

module.exports = function (_Plugin) {
    _inherits(Bounce, _Plugin);

    /**
     * @private
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {string} [options.sides=all] all, horizontal, vertical, or combination of top, bottom, right, left (e.g., 'top-bottom-right')
     * @param {number} [options.friction=0.5] friction to apply to decelerate if active
     * @param {number} [options.time=150] time in ms to finish bounce
     * @param {string|function} [ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
     * @param {string} [options.underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
     * @fires bounce-start-x
     * @fires bounce.end-x
     * @fires bounce-start-y
     * @fires bounce-end-y
     */
    function Bounce(parent, options) {
        _classCallCheck(this, Bounce);

        var _this = _possibleConstructorReturn(this, (Bounce.__proto__ || Object.getPrototypeOf(Bounce)).call(this, parent));

        options = options || {};
        _this.time = options.time || 150;
        _this.ease = utils.ease(options.ease, 'easeInOutSine');
        _this.friction = options.friction || 0.5;
        options.sides = options.sides || 'all';
        if (options.sides) {
            if (options.sides === 'all') {
                _this.top = _this.bottom = _this.left = _this.right = true;
            } else if (options.sides === 'horizontal') {
                _this.right = _this.left = true;
            } else if (options.sides === 'vertical') {
                _this.top = _this.bottom = true;
            } else {
                _this.top = options.sides.indexOf('top') !== -1;
                _this.bottom = options.sides.indexOf('bottom') !== -1;
                _this.left = options.sides.indexOf('left') !== -1;
                _this.right = options.sides.indexOf('right') !== -1;
            }
        }
        _this.parseUnderflow(options.underflow || 'center');
        _this.last = {};
        _this.reset();
        //console.log("bouncer", this);
        return _this;
    }

    _createClass(Bounce, [{
        key: 'parseUnderflow',
        value: function parseUnderflow(clamp) {
            clamp = clamp.toLowerCase();
            if (clamp === 'center') {
                this.underflowX = 0;
                this.underflowY = 0;
            } else {
                this.underflowX = clamp.indexOf('left') !== -1 ? -1 : clamp.indexOf('right') !== -1 ? 1 : 0;
                this.underflowY = clamp.indexOf('top') !== -1 ? -1 : clamp.indexOf('bottom') !== -1 ? 1 : 0;
            }
        }
    }, {
        key: 'isActive',
        value: function isActive() {
            return this.toX !== null || this.toY !== null;
        }
    }, {
        key: 'down',
        value: function down() {
            // console.error("who calls down?");
            this.toX = this.toY = null;
        }
    }, {
        key: 'up',
        value: function up() {
            // console.error("who calls up?", this.isActive(), this.paused);
            this.bounce();
        }
    }, {
        key: 'update',
        value: function update(elapsed) {
            // console.error("who calls update?", elapsed);
            if (this.paused) {
                return;
            }

            this.bounce();
            if (this.toX) {
                var toX = this.toX;
                toX.time += elapsed;
                this.parent.emit('moved', { viewport: this.parent, type: 'bounce-x' });
                if (toX.time >= this.time) {
                    this.parent.x = toX.end;
                    this.toX = null;
                    this.parent.emit('bounce-x-end', this.parent);
                } else {
                    this.parent.x = this.ease(toX.time, toX.start, toX.delta, this.time);
                }
            }
            if (this.toY) {
                var toY = this.toY;
                toY.time += elapsed;
                this.parent.emit('moved', { viewport: this.parent, type: 'bounce-y' });
                if (toY.time >= this.time) {
                    this.parent.y = toY.end;
                    this.toY = null;
                    this.parent.emit('bounce-y-end', this.parent);
                } else {
                    this.parent.y = this.ease(toY.time, toY.start, toY.delta, this.time);
                }
            }
        }
    }, {
        key: 'calcUnderflowX',
        value: function calcUnderflowX() {
            var x = void 0;
            switch (this.underflowX) {
                case -1:
                    x = 0;
                    break;
                case 1:
                    x = this.parent.screenWidth - this.parent.screenWorldWidth;
                    break;
                default:
                    x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
            }
            return x;
        }
    }, {
        key: 'calcUnderflowY',
        value: function calcUnderflowY() {
            var y = void 0;
            switch (this.underflowY) {
                case -1:
                    y = 0;
                    break;
                case 1:
                    y = this.parent.screenHeight - this.parent.screenWorldHeight;
                    break;
                default:
                    y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
            }
            return y;
        }
    }, {
        key: 'bounce',
        value: function bounce() {
            if (this.paused) {
                return;
            }

            var oob = void 0;
            var decelerate = this.parent.plugins['decelerate'];
            if (decelerate && (decelerate.x || decelerate.y)) {
                if (decelerate.x && decelerate.percentChangeX === decelerate.friction || decelerate.y && decelerate.percentChangeY === decelerate.friction) {
                    oob = this.parent.OOB();
                    if (oob.left && this.left || oob.right && this.right) {
                        decelerate.percentChangeX = this.friction;
                    }
                    if (oob.top && this.top || oob.bottom && this.bottom) {
                        decelerate.percentChangeY = this.friction;
                    }
                }
            }
            var drag = this.parent.plugins['drag'] || {};
            var pinch = this.parent.plugins['pinch'] || {};
            decelerate = decelerate || {};
            if (!drag.active && !pinch.active && (!this.toX || !this.toY) && (!decelerate.x || !decelerate.y)) {
                oob = oob || this.parent.OOB();
                var point = oob.cornerPoint;
                // console.log("going to bounce", {oob, point, decelerate, config: this});
                if (!this.toX && !decelerate.x) {
                    var x = null;
                    if (oob.left && this.left) {
                        x = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : 0;
                    } else if (oob.right && this.right) {
                        x = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : -point.x;
                    }
                    if (x !== null && this.parent.x !== x) {
                        this.toX = { time: 0, start: this.parent.x, delta: x - this.parent.x, end: x };
                        this.parent.emit('bounce-x-start', this.parent);
                    }
                }
                if (!this.toY && !decelerate.y) {
                    var y = null;
                    if (oob.top && this.top) {
                        y = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : 0;
                    } else if (oob.bottom && this.bottom) {
                        y = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : -point.y;
                    }
                    if (y !== null && this.parent.y !== y) {
                        this.toY = { time: 0, start: this.parent.y, delta: y - this.parent.y, end: y };
                        this.parent.emit('bounce-y-start', this.parent);
                    }
                }
            }
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.toX = this.toY = null;
        }
    }]);

    return Bounce;
}(Plugin);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ib3VuY2UuanMiXSwibmFtZXMiOlsidXRpbHMiLCJyZXF1aXJlIiwiUGx1Z2luIiwibW9kdWxlIiwiZXhwb3J0cyIsInBhcmVudCIsIm9wdGlvbnMiLCJ0aW1lIiwiZWFzZSIsImZyaWN0aW9uIiwic2lkZXMiLCJ0b3AiLCJib3R0b20iLCJsZWZ0IiwicmlnaHQiLCJpbmRleE9mIiwicGFyc2VVbmRlcmZsb3ciLCJ1bmRlcmZsb3ciLCJsYXN0IiwicmVzZXQiLCJjbGFtcCIsInRvTG93ZXJDYXNlIiwidW5kZXJmbG93WCIsInVuZGVyZmxvd1kiLCJ0b1giLCJ0b1kiLCJib3VuY2UiLCJlbGFwc2VkIiwicGF1c2VkIiwiZW1pdCIsInZpZXdwb3J0IiwidHlwZSIsIngiLCJlbmQiLCJzdGFydCIsImRlbHRhIiwieSIsInNjcmVlbldpZHRoIiwic2NyZWVuV29ybGRXaWR0aCIsInNjcmVlbkhlaWdodCIsInNjcmVlbldvcmxkSGVpZ2h0Iiwib29iIiwiZGVjZWxlcmF0ZSIsInBsdWdpbnMiLCJwZXJjZW50Q2hhbmdlWCIsInBlcmNlbnRDaGFuZ2VZIiwiT09CIiwiZHJhZyIsInBpbmNoIiwiYWN0aXZlIiwicG9pbnQiLCJjb3JuZXJQb2ludCIsImNhbGNVbmRlcmZsb3dYIiwiY2FsY1VuZGVyZmxvd1kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxRQUFTQyxRQUFRLFNBQVIsQ0FBZjtBQUNBLElBQU1DLFNBQVNELFFBQVEsVUFBUixDQUFmOztBQUVBRSxPQUFPQyxPQUFQO0FBQUE7O0FBRUk7Ozs7Ozs7Ozs7Ozs7O0FBY0Esb0JBQVlDLE1BQVosRUFBb0JDLE9BQXBCLEVBQ0E7QUFBQTs7QUFBQSxvSEFDVUQsTUFEVjs7QUFFSUMsa0JBQVVBLFdBQVcsRUFBckI7QUFDQSxjQUFLQyxJQUFMLEdBQVlELFFBQVFDLElBQVIsSUFBZ0IsR0FBNUI7QUFDQSxjQUFLQyxJQUFMLEdBQVlSLE1BQU1RLElBQU4sQ0FBV0YsUUFBUUUsSUFB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QUFLYyxjQUFMLEVBQTdELEdBQXFGLENBQUNILE1BQU1kLENBQWhHO0FBQ0g7QUFDRCx3QkFBSUEsTUFBTSxJQUFOLElBQWMsS0FBSy9CLE1BQUwsQ0FBWStCLENBQVosS0FBa0JBLENBQXBDLEVBQ0E7QUFDSSw2QkFBS1gsR0FBTCxHQUFXLEVBQUVsQixNQUFNLENBQVIsRUFBVzJCLE9BQU8sS0FBSzdCLE1BQUwsQ0FBWStCLENBQTlCLEVBQWlDRCxPQUFPQyxJQUFJLEtBQUsvQixNQUFMLENBQVkrQixDQUF4RCxFQUEyREgsS0FBS0csQ0FBaEUsRUFBWDtBQUNBLDZCQUFLL0IsTUFBTCxDQUFZd0IsSUFBWixDQUFpQixnQkFBakIsRUFBbUMsS0FBS3hCLE1BQXhDO0FBQ0g7QUFDSjtBQUNKO0FBQ0o7QUFwT0w7QUFBQTtBQUFBLGdDQXVPSTtBQUNJLGlCQUFLbUIsR0FBTCxHQUFXLEtBQUtDLEdBQUwsR0FBVyxJQUF0QjtBQUNIO0FBek9MOztBQUFBO0FBQUEsRUFBc0N2QixNQUF0QyIsImZpbGUiOiJib3VuY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB1dGlscyA9ICByZXF1aXJlKCcuL3V0aWxzJylcbmNvbnN0IFBsdWdpbiA9IHJlcXVpcmUoJy4vcGx1Z2luJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBCb3VuY2UgZXh0ZW5kcyBQbHVnaW5cbntcbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Vmlld3BvcnR9IHBhcmVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2lkZXM9YWxsXSBhbGwsIGhvcml6b250YWwsIHZlcnRpY2FsLCBvciBjb21iaW5hdGlvbiBvZiB0b3AsIGJvdHRvbSwgcmlnaHQsIGxlZnQgKGUuZy4sICd0b3AtYm90dG9tLXJpZ2h0JylcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuZnJpY3Rpb249MC41XSBmcmljdGlvbiB0byBhcHBseSB0byBkZWNlbGVyYXRlIGlmIGFjdGl2ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy50aW1lPTE1MF0gdGltZSBpbiBtcyB0byBmaW5pc2ggYm91bmNlXG4gICAgICogQHBhcmFtIHtzdHJpbmd8ZnVuY3Rpb259IFtlYXNlPWVhc2VJbk91dFNpbmVdIGVhc2UgZnVuY3Rpb24gb3IgbmFtZSAoc2VlIGh0dHA6Ly9lYXNpbmdzLm5ldC8gZm9yIHN1cHBvcnRlZCBuYW1lcylcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudW5kZXJmbG93PWNlbnRlcl0gKHRvcC9ib3R0b20vY2VudGVyIGFuZCBsZWZ0L3JpZ2h0L2NlbnRlciwgb3IgY2VudGVyKSB3aGVyZSB0byBwbGFjZSB3b3JsZCBpZiB0b28gc21hbGwgZm9yIHNjcmVlblxuICAgICAqIEBmaXJlcyBib3VuY2Utc3RhcnQteFxuICAgICAqIEBmaXJlcyBib3VuY2UuZW5kLXhcbiAgICAgKiBAZmlyZXMgYm91bmNlLXN0YXJ0LXlcbiAgICAgKiBAZmlyZXMgYm91bmNlLWVuZC15XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocGFyZW50LCBvcHRpb25zKVxuICAgIHtcbiAgICAgICAgc3VwZXIocGFyZW50KVxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgICB0aGlzLnRpbWUgPSBvcHRpb25zLnRpbWUgfHwgMTUwXG4gICAgICAgIHRoaXMuZWFzZSA9IHV0aWxzLmVhc2Uob3B0aW9ucy5lYXNlLCAnZWFzZUluT3V0U2luZScpXG4gICAgICAgIHRoaXMuZnJpY3Rpb24gPSBvcHRpb25zLmZyaWN0aW9uIHx8IDAuNVxuICAgICAgICBvcHRpb25zLnNpZGVzID0gb3B0aW9ucy5zaWRlcyB8fCAnYWxsJ1xuICAgICAgICBpZiAob3B0aW9ucy5zaWRlcylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2lkZXMgPT09ICdhbGwnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudG9wID0gdGhpcy5ib3R0b20gPSB0aGlzLmxlZnQgPSB0aGlzLnJpZ2h0ID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zaWRlcyA9PT0gJ2hvcml6b250YWwnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucmlnaHQgPSB0aGlzLmxlZnQgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNpZGVzID09PSAndmVydGljYWwnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMudG9wID0gdGhpcy5ib3R0b20gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy50b3AgPSBvcHRpb25zLnNpZGVzLmluZGV4T2YoJ3RvcCcpICE9PSAtMVxuICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tID0gb3B0aW9ucy5zaWRlcy5pbmRleE9mKCdib3R0b20nKSAhPT0gLTFcbiAgICAgICAgICAgICAgICB0aGlzLmxlZnQgPSBvcHRpb25zLnNpZGVzLmluZGV4T2YoJ2xlZnQnKSAhPT0gLTFcbiAgICAgICAgICAgICAgICB0aGlzLnJpZ2h0ID0gb3B0aW9ucy5zaWRlcy5pbmRleE9mKCdyaWdodCcpICE9PSAtMVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFyc2VVbmRlcmZsb3cob3B0aW9ucy51bmRlcmZsb3cgfHwgJ2NlbnRlcicpXG4gICAgICAgIHRoaXMubGFzdCA9IHt9XG4gICAgICAgIHRoaXMucmVzZXQoKVxuXHRcdC8vY29uc29sZS5sb2coXCJib3VuY2VyXCIsIHRoaXMpO1xuICAgIH1cblxuICAgIHBhcnNlVW5kZXJmbG93KGNsYW1wKVxuICAgIHtcbiAgICAgICAgY2xhbXAgPSBjbGFtcC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGlmIChjbGFtcCA9PT0gJ2NlbnRlcicpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMudW5kZXJmbG93WCA9IDBcbiAgICAgICAgICAgIHRoaXMudW5kZXJmbG93WSA9IDBcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMudW5kZXJmbG93WCA9IChjbGFtcC5pbmRleE9mKCdsZWZ0JykgIT09IC0xKSA/IC0xIDogKGNsYW1wLmluZGV4T2YoJ3JpZ2h0JykgIT09IC0xKSA/IDEgOiAwXG4gICAgICAgICAgICB0aGlzLnVuZGVyZmxvd1kgPSAoY2xhbXAuaW5kZXhPZigndG9wJykgIT09IC0xKSA/IC0xIDogKGNsYW1wLmluZGV4T2YoJ2JvdHRvbScpICE9PSAtMSkgPyAxIDogMFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNBY3RpdmUoKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9YICE9PSBudWxsIHx8IHRoaXMudG9ZICE9PSBudWxsXG4gICAgfVxuXG4gICAgZG93bigpXG4gICAge1xuXHRcdC8vIGNvbnNvbGUuZXJyb3IoXCJ3aG8gY2FsbHMgZG93bj9cIik7XG4gICAgICAgIHRoaXMudG9YID0gdGhpcy50b1kgPSBudWxsXG4gICAgfVxuXG4gICAgdXAoKVxuICAgIHtcblx0XHQvLyBjb25zb2xlLmVycm9yKFwid2hvIGNhbGxzIHVwP1wiLCB0aGlzLmlzQWN0aXZlKCksIHRoaXMucGF1c2VkKTtcbiAgICAgICAgdGhpcy5ib3VuY2UoKVxuICAgIH1cblxuICAgIHVwZGF0ZShlbGFwc2VkKVxuICAgIHtcblx0XHQvLyBjb25zb2xlLmVycm9yKFwid2hvIGNhbGxzIHVwZGF0ZT9cIiwgZWxhcHNlZCk7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJvdW5jZSgpXG4gICAgICAgIGlmICh0aGlzLnRvWClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdG9YID0gdGhpcy50b1hcbiAgICAgICAgICAgIHRvWC50aW1lICs9IGVsYXBzZWRcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ21vdmVkJywgeyB2aWV3cG9ydDogdGhpcy5wYXJlbnQsIHR5cGU6ICdib3VuY2UteCcgfSlcbiAgICAgICAgICAgIGlmICh0b1gudGltZSA+PSB0aGlzLnRpbWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueCA9IHRvWC5lbmRcbiAgICAgICAgICAgICAgICB0aGlzLnRvWCA9IG51bGxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdib3VuY2UteC1lbmQnLCB0aGlzLnBhcmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC54ID0gdGhpcy5lYXNlKHRvWC50aW1lLCB0b1guc3RhcnQsIHRvWC5kZWx0YSwgdGhpcy50aW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnRvWSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgdG9ZID0gdGhpcy50b1lcbiAgICAgICAgICAgIHRvWS50aW1lICs9IGVsYXBzZWRcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ21vdmVkJywgeyB2aWV3cG9ydDogdGhpcy5wYXJlbnQsIHR5cGU6ICdib3VuY2UteScgfSlcbiAgICAgICAgICAgIGlmICh0b1kudGltZSA+PSB0aGlzLnRpbWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueSA9IHRvWS5lbmRcbiAgICAgICAgICAgICAgICB0aGlzLnRvWSA9IG51bGxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdib3VuY2UteS1lbmQnLCB0aGlzLnBhcmVudClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC55ID0gdGhpcy5lYXNlKHRvWS50aW1lLCB0b1kuc3RhcnQsIHRvWS5kZWx0YSwgdGhpcy50aW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FsY1VuZGVyZmxvd1goKVxuICAgIHtcbiAgICAgICAgbGV0IHhcbiAgICAgICAgc3dpdGNoICh0aGlzLnVuZGVyZmxvd1gpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgLTE6XG4gICAgICAgICAgICAgICAgeCA9IDBcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHggPSAodGhpcy5wYXJlbnQuc2NyZWVuV2lkdGggLSB0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHggPSAodGhpcy5wYXJlbnQuc2NyZWVuV2lkdGggLSB0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoKSAvIDJcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geFxuICAgIH1cblxuICAgIGNhbGNVbmRlcmZsb3dZKClcbiAgICB7XG4gICAgICAgIGxldCB5XG4gICAgICAgIHN3aXRjaCAodGhpcy51bmRlcmZsb3dZKVxuICAgICAgICB7XG4gICAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgICAgIHkgPSAwXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICB5ID0gKHRoaXMucGFyZW50LnNjcmVlbkhlaWdodCAtIHRoaXMucGFyZW50LnNjcmVlbldvcmxkSGVpZ2h0KVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHkgPSAodGhpcy5wYXJlbnQuc2NyZWVuSGVpZ2h0IC0gdGhpcy5wYXJlbnQuc2NyZWVuV29ybGRIZWlnaHQpIC8gMlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB5XG4gICAgfVxuXG4gICAgYm91bmNlKClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb29iXG4gICAgICAgIGxldCBkZWNlbGVyYXRlID0gdGhpcy5wYXJlbnQucGx1Z2luc1snZGVjZWxlcmF0ZSddXG4gICAgICAgIGlmIChkZWNlbGVyYXRlICYmIChkZWNlbGVyYXRlLnggfHwgZGVjZWxlcmF0ZS55KSlcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKChkZWNlbGVyYXRlLnggJiYgZGVjZWxlcmF0ZS5wZXJjZW50Q2hhbmdlWCA9PT0gZGVjZWxlcmF0ZS5mcmljdGlvbikgfHwgKGRlY2VsZXJhdGUueSAmJiBkZWNlbGVyYXRlLnBlcmNlbnRDaGFuZ2VZID09PSBkZWNlbGVyYXRlLmZyaWN0aW9uKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvb2IgPSB0aGlzLnBhcmVudC5PT0IoKVxuICAgICAgICAgICAgICAgIGlmICgob29iLmxlZnQgJiYgdGhpcy5sZWZ0KSB8fCAob29iLnJpZ2h0ICYmIHRoaXMucmlnaHQpKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjZWxlcmF0ZS5wZXJjZW50Q2hhbmdlWCA9IHRoaXMuZnJpY3Rpb25cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChvb2IudG9wICYmIHRoaXMudG9wKSB8fCAob29iLmJvdHRvbSAmJiB0aGlzLmJvdHRvbSkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkZWNlbGVyYXRlLnBlcmNlbnRDaGFuZ2VZID0gdGhpcy5mcmljdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkcmFnID0gdGhpcy5wYXJlbnQucGx1Z2luc1snZHJhZyddIHx8IHt9XG4gICAgICAgIGNvbnN0IHBpbmNoID0gdGhpcy5wYXJlbnQucGx1Z2luc1sncGluY2gnXSB8fCB7fVxuICAgICAgICBkZWNlbGVyYXRlID0gZGVjZWxlcmF0ZSB8fCB7fVxuICAgICAgICBpZiAoIWRyYWcuYWN0aXZlICYmICFwaW5jaC5hY3RpdmUgJiYgKCghdGhpcy50b1ggfHwgIXRoaXMudG9ZKSAmJiAoIWRlY2VsZXJhdGUueCB8fCAhZGVjZWxlcmF0ZS55KSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG9vYiA9IG9vYiB8fCB0aGlzLnBhcmVudC5PT0IoKVxuICAgICAgICAgICAgY29uc3QgcG9pbnQgPSBvb2IuY29ybmVyUG9pbnRcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiZ29pbmcgdG8gYm91bmNlXCIsIHtvb2IsIHBvaW50LCBkZWNlbGVyYXRlLCBjb25maWc6IHRoaXN9KTtcbiAgICAgICAgICAgIGlmICghdGhpcy50b1ggJiYgIWRlY2VsZXJhdGUueClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsZXQgeCA9IG51bGxcbiAgICAgICAgICAgICAgICBpZiAob29iLmxlZnQgJiYgdGhpcy5sZWZ0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICh0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoIDwgdGhpcy5wYXJlbnQuc2NyZWVuV2lkdGgpID8gdGhpcy5jYWxjVW5kZXJmbG93WCgpIDogMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvb2IucmlnaHQgJiYgdGhpcy5yaWdodClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHggPSAodGhpcy5wYXJlbnQuc2NyZWVuV29ybGRXaWR0aCA8IHRoaXMucGFyZW50LnNjcmVlbldpZHRoKSA/IHRoaXMuY2FsY1VuZGVyZmxvd1goKSA6IC1wb2ludC54XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh4ICE9PSBudWxsICYmIHRoaXMucGFyZW50LnggIT09IHgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvWCA9IHsgdGltZTogMCwgc3RhcnQ6IHRoaXMucGFyZW50LngsIGRlbHRhOiB4IC0gdGhpcy5wYXJlbnQueCwgZW5kOiB4IH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuZW1pdCgnYm91bmNlLXgtc3RhcnQnLCB0aGlzLnBhcmVudClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMudG9ZICYmICFkZWNlbGVyYXRlLnkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSBudWxsXG4gICAgICAgICAgICAgICAgaWYgKG9vYi50b3AgJiYgdGhpcy50b3ApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB5ID0gKHRoaXMucGFyZW50LnNjcmVlbldvcmxkSGVpZ2h0IDwgdGhpcy5wYXJlbnQuc2NyZWVuSGVpZ2h0KSA/IHRoaXMuY2FsY1VuZGVyZmxvd1koKSA6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob29iLmJvdHRvbSAmJiB0aGlzLmJvdHRvbSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHkgPSAodGhpcy5wYXJlbnQuc2NyZWVuV29ybGRIZWlnaHQgPCB0aGlzLnBhcmVudC5zY3JlZW5IZWlnaHQpID8gdGhpcy5jYWxjVW5kZXJmbG93WSgpIDogLXBvaW50LnlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHkgIT09IG51bGwgJiYgdGhpcy5wYXJlbnQueSAhPT0geSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9ZID0geyB0aW1lOiAwLCBzdGFydDogdGhpcy5wYXJlbnQueSwgZGVsdGE6IHkgLSB0aGlzLnBhcmVudC55LCBlbmQ6IHkgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdib3VuY2UteS1zdGFydCcsIHRoaXMucGFyZW50KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KClcbiAgICB7XG4gICAgICAgIHRoaXMudG9YID0gdGhpcy50b1kgPSBudWxsXG4gICAgfVxufVxuIl19