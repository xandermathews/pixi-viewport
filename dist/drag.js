'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('./utils');
var Plugin = require('./plugin');

module.exports = function (_Plugin) {
    _inherits(Drag, _Plugin);

    /**
     * enable one-finger touch to drag
     * @private
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {string} [options.direction=all] direction to drag (all, x, or y)
     * @param {boolean} [options.wheel=true] use wheel to scroll in y direction (unless wheel plugin is active)
     * @param {number} [options.wheelScroll=1] number of pixels to scroll with each wheel spin
     * @param {boolean} [options.reverse] reverse the direction of the wheel scroll
     * @param {boolean|string} [options.clampWheel] (true, x, or y) clamp wheel (to avoid weird bounce with mouse wheel)
     * @param {string} [options.underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
     */
    function Drag(parent, options) {
        _classCallCheck(this, Drag);

        options = options || {};

        var _this = _possibleConstructorReturn(this, (Drag.__proto__ || Object.getPrototypeOf(Drag)).call(this, parent));

        _this.moved = false;
        _this.wheelActive = utils.defaults(options.wheel, true);
        _this.wheelScroll = options.wheelScroll || 1;
        _this.reverse = options.reverse ? 1 : -1;
        _this.clampWheel = options.clampWheel;
        _this.xDirection = !options.direction || options.direction === 'all' || options.direction === 'x';
        _this.yDirection = !options.direction || options.direction === 'all' || options.direction === 'y';
        _this.parseUnderflow(options.underflow || 'center');
        //console.log(this);
        return _this;
    }

    _createClass(Drag, [{
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
        key: 'down',
        value: function down(e) {
            if (this.paused) {
                return;
            }
            var count = this.parent.countDownPointers();
            if ((count === 1 || count > 1 && !this.parent.plugins['pinch']) && this.parent.parent) {
                var parent = this.parent.parent.toLocal(e.data.global);
                this.last = { x: e.data.global.x, y: e.data.global.y, parent: parent };
                this.current = e.data.pointerId;
                return true;
            } else {
                this.last = null;
            }
        }
    }, {
        key: 'move',
        value: function move(e) {
            if (this.paused) {
                return;
            }
            if (this.last && this.current === e.data.pointerId) {
                var x = e.data.global.x;
                var y = e.data.global.y;
                var count = this.parent.countDownPointers();
                if (count === 1 || count > 1 && !this.parent.plugins['pinch']) {
                    var distX = x - this.last.x;
                    var distY = y - this.last.y;
                    if (this.moved || this.xDirection && this.parent.checkThreshold(distX) || this.yDirection && this.parent.checkThreshold(distY)) {
                        var newParent = this.parent.parent.toLocal(e.data.global);
                        if (this.xDirection) {
                            this.parent.x += newParent.x - this.last.parent.x;
                        }
                        if (this.yDirection) {
                            this.parent.y += newParent.y - this.last.parent.y;
                        }
                        this.last = { x: x, y: y, parent: newParent };
                        if (!this.moved) {
                            this.parent.emit('drag-start', { screen: this.last, world: this.parent.toWorld(this.last), viewport: this.parent });
                        }
                        this.moved = true;
                        this.parent.emit('moved', { viewport: this.parent, type: 'drag' });
                        return true;
                    }
                } else {
                    this.moved = false;
                }
            }
        }
    }, {
        key: 'up',
        value: function up() {
            var touches = this.parent.getTouchPointers();
            if (touches.length === 1) {
                var pointer = touches[0];
                if (pointer.last) {
                    var parent = this.parent.parent.toLocal(pointer.last);
                    this.last = { x: pointer.last.x, y: pointer.last.y, parent: parent };
                    this.current = pointer.last.data.pointerId;
                }
                this.moved = false;
                return true;
            } else if (this.last) {
                if (this.moved) {
                    this.parent.emit('drag-end', { screen: this.last, world: this.parent.toWorld(this.last), viewport: this.parent });
                    this.last = this.moved = false;
                    return true;
                }
            }
        }
    }, {
        key: 'wheel',
        value: function wheel(e) {
            if (this.paused) {
                return;
            }

            if (this.wheelActive) {
                var wheel = this.parent.plugins['wheel'];
                if (!wheel) {
                    if (this.xDirection) {
                        this.parent.x += e.deltaX * this.wheelScroll * this.reverse;
                    }
                    if (this.yDirection) {
                        this.parent.y += e.deltaY * this.wheelScroll * this.reverse;
                    }
                    if (this.clampWheel) {
                        this.clamp();
                    }
                    this.parent.emit('wheel-scroll', this.parent);
                    this.parent.emit('moved', this.parent);
                    if (!this.parent.passiveWheel) {
                        e.preventDefault();
                    }
                    return true;
                }
            }
        }
    }, {
        key: 'resume',
        value: function resume() {
            this.last = null;
            this.paused = false;
        }
    }, {
        key: 'clamp',
        value: function clamp() {
            var decelerate = this.parent.plugins['decelerate'] || {};
            if (this.clampWheel !== 'y') {
                if (this.parent.screenWorldWidth < this.parent.screenWidth) {
                    switch (this.underflowX) {
                        case -1:
                            this.parent.x = 0;
                            break;
                        case 1:
                            this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth;
                            break;
                        default:
                            this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
                    }
                } else {
                    if (this.parent.left < 0) {
                        this.parent.x = 0;
                        decelerate.x = 0;
                    } else if (this.parent.right > this.parent.worldWidth) {
                        this.parent.x = -this.parent.worldWidth * this.parent.scale.x + this.parent.screenWidth;
                        decelerate.x = 0;
                    }
                }
            }
            if (this.clampWheel !== 'x') {
                if (this.parent.screenWorldHeight < this.parent.screenHeight) {
                    switch (this.underflowY) {
                        case -1:
                            this.parent.y = 0;
                            break;
                        case 1:
                            this.parent.y = this.parent.screenHeight - this.parent.screenWorldHeight;
                            break;
                        default:
                            this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
                    }
                } else {
                    if (this.parent.top < 0) {
                        this.parent.y = 0;
                        decelerate.y = 0;
                    }
                    if (this.parent.bottom > this.parent.worldHeight) {
                        this.parent.y = -this.parent.worldHeight * this.parent.scale.y + this.parent.screenHeight;
                        decelerate.y = 0;
                    }
                }
            }
        }
    }, {
        key: 'active',
        get: function get() {
            return this.moved;
        }
    }]);

    return Drag;
}(Plugin);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9kcmFnLmpzIl0sIm5hbWVzIjpbInV0aWxzIiwicmVxdWlyZSIsIlBsdWdpbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJwYXJlbnQiLCJvcHRpb25zIiwibW92ZWQiLCJ3aGVlbEFjdGl2ZSIsImRlZmF1bHRzIiwid2hlZWwiLCJ3aGVlbFNjcm9sbCIsInJldmVyc2UiLCJjbGFtcFdoZWVsIiwieERpcmVjdGlvbiIsImRpcmVjdGlvbiIsInlEaXJlY3Rpb24iLCJwYXJzZVVuZGVyZmxvdyIsInVuZGVyZmxvdyIsImNsYW1wIiwidG9Mb3dlckNhc2UiLCJ1bmRlcmZsb3dYIiwidW5kZXJmbG93WSIsImluZGV4T2YiLCJlIiwicGF1c2VkIiwiY291bnQiLCJjb3VudERvd25Qb2ludGVycyIsInBsdWdpbnMiLCJ0b0xvY2FsIiwiZGF0YSIsImdsb2JhbCIsImxhc3QiLCJ4IiwieSIsImN1cnJlbnQiLCJwb2ludGVySWQiLCJkaXN0WCIsImRpc3RZIiwiY2hlY2tUaHJlc2hvbGQiLCJuZXdQYXJlbnQiLCJlbWl0Iiwic2NyZWVuIiwid29ybGQiLCJ0b1dvcmxkIiwidmlld3BvcnQiLCJ0eXBlIiwidG91Y2hlcyIsImdldFRvdWNoUG9pbnRlcnMiLCJsZW5ndGgiLCJwb2ludGVyIiwiZGVsdGFYIiwiZGVsdGFZIiwicGFzc2l2ZVdoZWVsIiwicHJldmVudERlZmF1bHQiLCJkZWNlbGVyYXRlIiwic2NyZWVuV29ybGRXaWR0aCIsInNjcmVlbldpZHRoIiwibGVmdCIsInJpZ2h0Iiwid29ybGRXaWR0aCIsInNjYWxlIiwic2NyZWVuV29ybGRIZWlnaHQiLCJzY3JlZW5IZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJ3b3JsZEhlaWdodCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQU1BLFFBQVNDLFFBQVEsU0FBUixDQUFmO0FBQ0EsSUFBTUMsU0FBU0QsUUFBUSxVQUFSLENBQWY7O0FBRUFFLE9BQU9DLE9BQVA7QUFBQTs7QUFFSTs7Ozs7Ozs7Ozs7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QUs3RCxNQUFMLENBQVl3RCxLQUFaLENBQWtCM0IsQ0FBN0MsR0FBaUQsS0FBSzdCLE1BQUwsQ0FBWTBELFlBQTdFO0FBQ0FSLG1DQUFXckIsQ0FBWCxHQUFlLENBQWY7QUFDSDtBQUNKO0FBQ0o7QUFDSjtBQWxQTDtBQUFBO0FBQUEsNEJBaUVJO0FBQ0ksbUJBQU8sS0FBSzNCLEtBQVo7QUFDSDtBQW5FTDs7QUFBQTtBQUFBLEVBQW9DTCxNQUFwQyIsImZpbGUiOiJkcmFnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgdXRpbHMgPSAgcmVxdWlyZSgnLi91dGlscycpXG5jb25zdCBQbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbicpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZyBleHRlbmRzIFBsdWdpblxue1xuICAgIC8qKlxuICAgICAqIGVuYWJsZSBvbmUtZmluZ2VyIHRvdWNoIHRvIGRyYWdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Vmlld3BvcnR9IHBhcmVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlyZWN0aW9uPWFsbF0gZGlyZWN0aW9uIHRvIGRyYWcgKGFsbCwgeCwgb3IgeSlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndoZWVsPXRydWVdIHVzZSB3aGVlbCB0byBzY3JvbGwgaW4geSBkaXJlY3Rpb24gKHVubGVzcyB3aGVlbCBwbHVnaW4gaXMgYWN0aXZlKVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53aGVlbFNjcm9sbD0xXSBudW1iZXIgb2YgcGl4ZWxzIHRvIHNjcm9sbCB3aXRoIGVhY2ggd2hlZWwgc3BpblxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmV2ZXJzZV0gcmV2ZXJzZSB0aGUgZGlyZWN0aW9uIG9mIHRoZSB3aGVlbCBzY3JvbGxcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW58c3RyaW5nfSBbb3B0aW9ucy5jbGFtcFdoZWVsXSAodHJ1ZSwgeCwgb3IgeSkgY2xhbXAgd2hlZWwgKHRvIGF2b2lkIHdlaXJkIGJvdW5jZSB3aXRoIG1vdXNlIHdoZWVsKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy51bmRlcmZsb3c9Y2VudGVyXSAodG9wL2JvdHRvbS9jZW50ZXIgYW5kIGxlZnQvcmlnaHQvY2VudGVyLCBvciBjZW50ZXIpIHdoZXJlIHRvIHBsYWNlIHdvcmxkIGlmIHRvbyBzbWFsbCBmb3Igc2NyZWVuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocGFyZW50LCBvcHRpb25zKVxuICAgIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICAgICAgc3VwZXIocGFyZW50KVxuICAgICAgICB0aGlzLm1vdmVkID0gZmFsc2VcbiAgICAgICAgdGhpcy53aGVlbEFjdGl2ZSA9IHV0aWxzLmRlZmF1bHRzKG9wdGlvbnMud2hlZWwsIHRydWUpXG4gICAgICAgIHRoaXMud2hlZWxTY3JvbGwgPSBvcHRpb25zLndoZWVsU2Nyb2xsIHx8IDFcbiAgICAgICAgdGhpcy5yZXZlcnNlID0gb3B0aW9ucy5yZXZlcnNlID8gMSA6IC0xXG4gICAgICAgIHRoaXMuY2xhbXBXaGVlbCA9IG9wdGlvbnMuY2xhbXBXaGVlbFxuICAgICAgICB0aGlzLnhEaXJlY3Rpb24gPSAhb3B0aW9ucy5kaXJlY3Rpb24gfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT09ICdhbGwnIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09PSAneCdcbiAgICAgICAgdGhpcy55RGlyZWN0aW9uID0gIW9wdGlvbnMuZGlyZWN0aW9uIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09PSAnYWxsJyB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PT0gJ3knXG4gICAgICAgIHRoaXMucGFyc2VVbmRlcmZsb3cob3B0aW9ucy51bmRlcmZsb3cgfHwgJ2NlbnRlcicpXG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzKTtcbiAgICB9XG5cbiAgICBwYXJzZVVuZGVyZmxvdyhjbGFtcClcbiAgICB7XG4gICAgICAgIGNsYW1wID0gY2xhbXAudG9Mb3dlckNhc2UoKVxuICAgICAgICBpZiAoY2xhbXAgPT09ICdjZW50ZXInKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnVuZGVyZmxvd1ggPSAwXG4gICAgICAgICAgICB0aGlzLnVuZGVyZmxvd1kgPSAwXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnVuZGVyZmxvd1ggPSAoY2xhbXAuaW5kZXhPZignbGVmdCcpICE9PSAtMSkgPyAtMSA6IChjbGFtcC5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkgPyAxIDogMFxuICAgICAgICAgICAgdGhpcy51bmRlcmZsb3dZID0gKGNsYW1wLmluZGV4T2YoJ3RvcCcpICE9PSAtMSkgPyAtMSA6IChjbGFtcC5pbmRleE9mKCdib3R0b20nKSAhPT0gLTEpID8gMSA6IDBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRvd24oZSlcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLnBhcmVudC5jb3VudERvd25Qb2ludGVycygpXG4gICAgICAgIGlmICgoY291bnQgPT09IDEgfHwgKGNvdW50ID4gMSAmJiAhdGhpcy5wYXJlbnQucGx1Z2luc1sncGluY2gnXSkpICYmIHRoaXMucGFyZW50LnBhcmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnQucGFyZW50LnRvTG9jYWwoZS5kYXRhLmdsb2JhbClcbiAgICAgICAgICAgIHRoaXMubGFzdCA9IHsgeDogZS5kYXRhLmdsb2JhbC54LCB5OiBlLmRhdGEuZ2xvYmFsLnksIHBhcmVudCB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBlLmRhdGEucG9pbnRlcklkXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5sYXN0ID0gbnVsbFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGFjdGl2ZSgpXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3ZlZFxuICAgIH1cblxuICAgIG1vdmUoZSlcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubGFzdCAmJiB0aGlzLmN1cnJlbnQgPT09IGUuZGF0YS5wb2ludGVySWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSBlLmRhdGEuZ2xvYmFsLnhcbiAgICAgICAgICAgIGNvbnN0IHkgPSBlLmRhdGEuZ2xvYmFsLnlcbiAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5wYXJlbnQuY291bnREb3duUG9pbnRlcnMoKVxuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAxIHx8IChjb3VudCA+IDEgJiYgIXRoaXMucGFyZW50LnBsdWdpbnNbJ3BpbmNoJ10pKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RYID0geCAtIHRoaXMubGFzdC54XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzdFkgPSB5IC0gdGhpcy5sYXN0LnlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3ZlZCB8fCAoKHRoaXMueERpcmVjdGlvbiAmJiB0aGlzLnBhcmVudC5jaGVja1RocmVzaG9sZChkaXN0WCkpIHx8ICh0aGlzLnlEaXJlY3Rpb24gJiYgdGhpcy5wYXJlbnQuY2hlY2tUaHJlc2hvbGQoZGlzdFkpKSkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdQYXJlbnQgPSB0aGlzLnBhcmVudC5wYXJlbnQudG9Mb2NhbChlLmRhdGEuZ2xvYmFsKVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy54RGlyZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC54ICs9IG5ld1BhcmVudC54IC0gdGhpcy5sYXN0LnBhcmVudC54XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMueURpcmVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueSArPSBuZXdQYXJlbnQueSAtIHRoaXMubGFzdC5wYXJlbnQueVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdCA9IHsgeCwgeSwgcGFyZW50OiBuZXdQYXJlbnQgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubW92ZWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ2RyYWctc3RhcnQnLCB7IHNjcmVlbjogdGhpcy5sYXN0LCB3b3JsZDogdGhpcy5wYXJlbnQudG9Xb3JsZCh0aGlzLmxhc3QpLCB2aWV3cG9ydDogdGhpcy5wYXJlbnR9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ21vdmVkJywgeyB2aWV3cG9ydDogdGhpcy5wYXJlbnQsIHR5cGU6ICdkcmFnJyB9KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVkID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwKClcbiAgICB7XG4gICAgICAgIGNvbnN0IHRvdWNoZXMgPSB0aGlzLnBhcmVudC5nZXRUb3VjaFBvaW50ZXJzKClcbiAgICAgICAgaWYgKHRvdWNoZXMubGVuZ3RoID09PSAxKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBwb2ludGVyID0gdG91Y2hlc1swXVxuICAgICAgICAgICAgaWYgKHBvaW50ZXIubGFzdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudC5wYXJlbnQudG9Mb2NhbChwb2ludGVyLmxhc3QpXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0ID0geyB4OiBwb2ludGVyLmxhc3QueCwgeTogcG9pbnRlci5sYXN0LnksIHBhcmVudCB9XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gcG9pbnRlci5sYXN0LmRhdGEucG9pbnRlcklkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1vdmVkID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5sYXN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3ZlZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdkcmFnLWVuZCcsIHtzY3JlZW46IHRoaXMubGFzdCwgd29ybGQ6IHRoaXMucGFyZW50LnRvV29ybGQodGhpcy5sYXN0KSwgdmlld3BvcnQ6IHRoaXMucGFyZW50fSlcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3QgPSB0aGlzLm1vdmVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2hlZWwoZSlcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnBhdXNlZClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy53aGVlbEFjdGl2ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgd2hlZWwgPSB0aGlzLnBhcmVudC5wbHVnaW5zWyd3aGVlbCddXG4gICAgICAgICAgICBpZiAoIXdoZWVsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnhEaXJlY3Rpb24pXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC54ICs9IGUuZGVsdGFYICogdGhpcy53aGVlbFNjcm9sbCAqIHRoaXMucmV2ZXJzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy55RGlyZWN0aW9uKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueSArPSBlLmRlbHRhWSAqIHRoaXMud2hlZWxTY3JvbGwgKiB0aGlzLnJldmVyc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xhbXBXaGVlbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xhbXAoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCd3aGVlbC1zY3JvbGwnLCB0aGlzLnBhcmVudClcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdtb3ZlZCcsIHRoaXMucGFyZW50KVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5wYXJlbnQucGFzc2l2ZVdoZWVsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXN1bWUoKVxuICAgIHtcbiAgICAgICAgdGhpcy5sYXN0ID0gbnVsbFxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlXG4gICAgfVxuXG4gICAgY2xhbXAoKVxuICAgIHtcbiAgICAgICAgY29uc3QgZGVjZWxlcmF0ZSA9IHRoaXMucGFyZW50LnBsdWdpbnNbJ2RlY2VsZXJhdGUnXSB8fCB7fVxuICAgICAgICBpZiAodGhpcy5jbGFtcFdoZWVsICE9PSAneScpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoIDwgdGhpcy5wYXJlbnQuc2NyZWVuV2lkdGgpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0aGlzLnVuZGVyZmxvd1gpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueCA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnggPSAodGhpcy5wYXJlbnQuc2NyZWVuV2lkdGggLSB0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnggPSAodGhpcy5wYXJlbnQuc2NyZWVuV2lkdGggLSB0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZFdpZHRoKSAvIDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50LmxlZnQgPCAwKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZGVjZWxlcmF0ZS54ID0gMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLnBhcmVudC5yaWdodCA+IHRoaXMucGFyZW50LndvcmxkV2lkdGgpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC54ID0gLXRoaXMucGFyZW50LndvcmxkV2lkdGggKiB0aGlzLnBhcmVudC5zY2FsZS54ICsgdGhpcy5wYXJlbnQuc2NyZWVuV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgZGVjZWxlcmF0ZS54ID0gMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jbGFtcFdoZWVsICE9PSAneCcpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZEhlaWdodCA8IHRoaXMucGFyZW50LnNjcmVlbkhlaWdodClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRoaXMudW5kZXJmbG93WSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgLTE6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC55ID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueSA9ICh0aGlzLnBhcmVudC5zY3JlZW5IZWlnaHQgLSB0aGlzLnBhcmVudC5zY3JlZW5Xb3JsZEhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC55ID0gKHRoaXMucGFyZW50LnNjcmVlbkhlaWdodCAtIHRoaXMucGFyZW50LnNjcmVlbldvcmxkSGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50LnRvcCA8IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC55ID0gMFxuICAgICAgICAgICAgICAgICAgICBkZWNlbGVyYXRlLnkgPSAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5ib3R0b20gPiB0aGlzLnBhcmVudC53b3JsZEhlaWdodClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnkgPSAtdGhpcy5wYXJlbnQud29ybGRIZWlnaHQgKiB0aGlzLnBhcmVudC5zY2FsZS55ICsgdGhpcy5wYXJlbnQuc2NyZWVuSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIGRlY2VsZXJhdGUueSA9IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=