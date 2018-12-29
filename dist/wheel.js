'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('./plugin');

module.exports = function (_Plugin) {
    _inherits(Wheel, _Plugin);

    /**
     * @private
     * @param {Viewport} parent
     * @param {object} [options]
     * @param {number} [options.percent=0.1] percent to scroll with each spin
     * @param {number} [options.smooth] smooth the zooming by providing the number of frames to zoom between wheel spins
     * @param {boolean} [options.interrupt=true] stop smoothing with any user input on the viewport
     * @param {boolean} [options.reverse] reverse the direction of the scroll
     * @param {canvas} [options.renderCanvas] extract the body->canvas offset to allow for canvas not being top:0 left:0
     * @param {PIXI.Point} [options.center] place this point at center during zoom instead of current mouse position
     *
     * @event wheel({wheel: {dx, dy, dz}, event, viewport})
     */
    function Wheel(parent, options) {
        _classCallCheck(this, Wheel);

        var _this = _possibleConstructorReturn(this, (Wheel.__proto__ || Object.getPrototypeOf(Wheel)).call(this, parent));

        options = options || {};
        _this.percent = options.percent || 0.1;
        _this.center = options.center;
        _this.reverse = options.reverse;
        _this.smooth = options.smooth;
        _this.renderCanvas = options.renderCanvas;
        _this.interrupt = typeof options.interrupt === 'undefined' ? true : options.interrupt;
        return _this;
    }

    _createClass(Wheel, [{
        key: 'down',
        value: function down() {
            if (this.interrupt) {
                this.smoothing = null;
            }
        }
    }, {
        key: 'update',
        value: function update() {
            if (this.smoothing) {
                var point = this.smoothingCenter;
                var change = this.smoothing;
                var oldPoint = void 0;
                if (!this.center) {
                    oldPoint = this.parent.toLocal(point);
                }
                this.parent.scale.x += change.x;
                this.parent.scale.y += change.y;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'wheel' });
                var clamp = this.parent.plugins['clamp-zoom'];
                if (clamp) {
                    clamp.clamp();
                }
                if (this.center) {
                    this.parent.moveCenter(this.center);
                } else {
                    var newPoint = this.parent.toGlobal(oldPoint);
                    this.parent.x += point.x - newPoint.x;
                    this.parent.y += point.y - newPoint.y;
                }
                this.smoothingCount++;
                if (this.smoothingCount >= this.smooth) {
                    this.smoothing = null;
                }
            }
        }
    }, {
        key: 'wheel',
        value: function wheel(e) {
            if (this.paused) {
                return;
            }

            var point = this.parent.getPointerPosition(e);
            if (this.renderCanvas) {
                var offset = this.renderCanvas.getBoundingClientRect();
                point.x -= offset.x;
                point.y -= offset.y;
            }

            var sign = void 0;
            if (this.reverse) {
                sign = e.deltaY > 0 ? 1 : -1;
            } else {
                sign = e.deltaY < 0 ? 1 : -1;
            }
            var change = 1 + this.percent * sign;
            if (this.smooth) {
                var original = {
                    x: this.smoothing ? this.smoothing.x * (this.smooth - this.smoothingCount) : 0,
                    y: this.smoothing ? this.smoothing.y * (this.smooth - this.smoothingCount) : 0
                };
                this.smoothing = {
                    x: ((this.parent.scale.x + original.x) * change - this.parent.scale.x) / this.smooth,
                    y: ((this.parent.scale.y + original.y) * change - this.parent.scale.y) / this.smooth
                };
                this.smoothingCount = 0;
                this.smoothingCenter = point;
            } else {
                var oldPoint = void 0;
                if (!this.center) {
                    oldPoint = this.parent.toLocal(point);
                }
                this.parent.scale.x *= change;
                this.parent.scale.y *= change;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'wheel' });
                var clamp = this.parent.plugins['clamp-zoom'];
                if (clamp) {
                    clamp.clamp();
                }
                if (this.center) {
                    this.parent.moveCenter(this.center);
                } else {
                    var newPoint = this.parent.toGlobal(oldPoint);
                    this.parent.x += point.x - newPoint.x;
                    this.parent.y += point.y - newPoint.y;
                }
            }
            this.parent.emit('moved', { viewport: this.parent, type: 'wheel' });
            this.parent.emit('wheel', { wheel: { dx: e.deltaX, dy: e.deltaY, dz: e.deltaZ }, event: e, viewport: this.parent });
            if (!this.parent.passiveWheel) {
                e.preventDefault();
            }
        }
    }]);

    return Wheel;
}(Plugin);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aGVlbC5qcyJdLCJuYW1lcyI6WyJQbHVnaW4iLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsInBhcmVudCIsIm9wdGlvbnMiLCJwZXJjZW50IiwiY2VudGVyIiwicmV2ZXJzZSIsInNtb290aCIsInJlbmRlckNhbnZhcyIsImludGVycnVwdCIsInNtb290aGluZyIsInBvaW50Iiwic21vb3RoaW5nQ2VudGVyIiwiY2hhbmdlIiwib2xkUG9pbnQiLCJ0b0xvY2FsIiwic2NhbGUiLCJ4IiwieSIsImVtaXQiLCJ2aWV3cG9ydCIsInR5cGUiLCJjbGFtcCIsInBsdWdpbnMiLCJtb3ZlQ2VudGVyIiwibmV3UG9pbnQiLCJ0b0dsb2JhbCIsInNtb290aGluZ0NvdW50IiwiZSIsInBhdXNlZCIsImdldFBvaW50ZXJQb3NpdGlvbiIsIm9mZnNldCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInNpZ24iLCJkZWx0YVkiLCJvcmlnaW5hbCIsIndoZWVsIiwiZHgiLCJkZWx0YVgiLCJkeSIsImR6IiwiZGVsdGFaIiwiZXZlbnQiLCJwYXNzaXZlV2hlZWwiLCJwcmV2ZW50RGVmYXVsdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsVUFBUixDQUFmOztBQUVBQyxPQUFPQyxPQUFQO0FBQUE7O0FBRUk7Ozs7Ozs7Ozs7Ozs7QUFhQSxtQkFBWUMsTUFBWixFQUFvQkMsT0FBcEIsRUFDQTtBQUFBOztBQUFBLGtIQUNVRCxNQURWOztBQUVJQyxrQkFBVUEsV0FBVyxFQUFyQjtBQUNBLGNBQUtDLE9BQUwsR0FBZUQsUUFBUUMsT0FBUixJQUFtQixHQUFsQztBQUNBLGNBQUtDLE1BQUwsR0FBY0YsUUFBUUUsTUFBdEI7QUFDQSxjQUFLQyxPQUFMLEdBQWVILFFBQVFHLE9BQXZCO0FBQ0EsY0FBS0MsTUFBTCxHQUFjSixRQUFRSSxNQUF0QjtBQUNOLGNBQUtDLFlBQUwsR0FBb0JMLFFBQVFLLFlBQTVCO0FBQ00sY0FBS0Ms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S0FBTjtBQUNIO0FBQ0Qsb0JBQUksS0FBS2pCLE1BQVQsRUFDQTtBQUNJLHlCQUFLSCxNQUFMLENBQVlzQixVQUFaLENBQXVCLEtBQUtuQixNQUE1QjtBQUNILGlCQUhELE1BS0E7QUFDSSx3QkFBTW9CLFdBQVcsS0FBS3ZCLE1BQUwsQ0FBWXdCLFFBQVosQ0FBcUJaLFFBQXJCLENBQWpCO0FBQ0EseUJBQUtaLE1BQUwsQ0FBWWUsQ0FBWixJQUFpQk4sTUFBTU0sQ0FBTixHQUFVUSxTQUFTUixDQUFwQztBQUNBLHlCQUFLZixNQUFMLENBQVlnQixDQUFaLElBQWlCUCxNQUFNTyxDQUFOLEdBQVVPLFNBQVNQLENBQXBDO0FBQ0g7QUFDSjtBQUNELGlCQUFLaEIsTUFBTCxDQUFZaUIsSUFBWixDQUFpQixPQUFqQixFQUEwQixFQUFFQyxVQUFVLEtBQUtsQixNQUFqQixFQUF5Qm1CLE1BQU0sT0FBL0IsRUFBMUI7QUFDQSxpQkFBS25CLE1BQUwsQ0FBWWlCLElBQVosQ0FBaUIsT0FBakIsRUFBMEIsRUFBRWlCLE9BQU8sRUFBRUMsSUFBSVQsRUFBRVUsTUFBUixFQUFnQkMsSUFBSVgsRUFBRU0sTUFBdEIsRUFBOEJNLElBQUlaLEVBQUVhLE1BQXBDLEVBQVQsRUFBdURDLE9BQU9kLENBQTlELEVBQWlFUixVQUFVLEtBQUtsQixNQUFoRixFQUExQjtBQUNBLGdCQUFJLENBQUMsS0FBS0EsTUFBTCxDQUFZeUMsWUFBakIsRUFDQTtBQUNJZixrQkFBRWdCLGNBQUY7QUFDSDtBQUNKO0FBOUlMOztBQUFBO0FBQUEsRUFBcUM5QyxNQUFyQyIsImZpbGUiOiJ3aGVlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IFBsdWdpbiA9IHJlcXVpcmUoJy4vcGx1Z2luJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBXaGVlbCBleHRlbmRzIFBsdWdpblxue1xuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtWaWV3cG9ydH0gcGFyZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5wZXJjZW50PTAuMV0gcGVyY2VudCB0byBzY3JvbGwgd2l0aCBlYWNoIHNwaW5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc21vb3RoXSBzbW9vdGggdGhlIHpvb21pbmcgYnkgcHJvdmlkaW5nIHRoZSBudW1iZXIgb2YgZnJhbWVzIHRvIHpvb20gYmV0d2VlbiB3aGVlbCBzcGluc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaW50ZXJydXB0PXRydWVdIHN0b3Agc21vb3RoaW5nIHdpdGggYW55IHVzZXIgaW5wdXQgb24gdGhlIHZpZXdwb3J0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZXZlcnNlXSByZXZlcnNlIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHNjcm9sbFxuICAgICAqIEBwYXJhbSB7Y2FudmFzfSBbb3B0aW9ucy5yZW5kZXJDYW52YXNdIGV4dHJhY3QgdGhlIGJvZHktPmNhbnZhcyBvZmZzZXQgdG8gYWxsb3cgZm9yIGNhbnZhcyBub3QgYmVpbmcgdG9wOjAgbGVmdDowXG4gICAgICogQHBhcmFtIHtQSVhJLlBvaW50fSBbb3B0aW9ucy5jZW50ZXJdIHBsYWNlIHRoaXMgcG9pbnQgYXQgY2VudGVyIGR1cmluZyB6b29tIGluc3RlYWQgb2YgY3VycmVudCBtb3VzZSBwb3NpdGlvblxuICAgICAqXG4gICAgICogQGV2ZW50IHdoZWVsKHt3aGVlbDoge2R4LCBkeSwgZHp9LCBldmVudCwgdmlld3BvcnR9KVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgb3B0aW9ucylcbiAgICB7XG4gICAgICAgIHN1cGVyKHBhcmVudClcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICAgICAgdGhpcy5wZXJjZW50ID0gb3B0aW9ucy5wZXJjZW50IHx8IDAuMVxuICAgICAgICB0aGlzLmNlbnRlciA9IG9wdGlvbnMuY2VudGVyXG4gICAgICAgIHRoaXMucmV2ZXJzZSA9IG9wdGlvbnMucmV2ZXJzZVxuICAgICAgICB0aGlzLnNtb290aCA9IG9wdGlvbnMuc21vb3RoXG5cdFx0dGhpcy5yZW5kZXJDYW52YXMgPSBvcHRpb25zLnJlbmRlckNhbnZhc1xuICAgICAgICB0aGlzLmludGVycnVwdCA9IHR5cGVvZiBvcHRpb25zLmludGVycnVwdCA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogb3B0aW9ucy5pbnRlcnJ1cHRcbiAgICB9XG5cbiAgICBkb3duKClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLmludGVycnVwdClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zbW9vdGhpbmcgPSBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGUoKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMuc21vb3RoaW5nKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBwb2ludCA9IHRoaXMuc21vb3RoaW5nQ2VudGVyXG4gICAgICAgICAgICBjb25zdCBjaGFuZ2UgPSB0aGlzLnNtb290aGluZ1xuICAgICAgICAgICAgbGV0IG9sZFBvaW50XG4gICAgICAgICAgICBpZiAoIXRoaXMuY2VudGVyKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9sZFBvaW50ID0gdGhpcy5wYXJlbnQudG9Mb2NhbChwb2ludClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucGFyZW50LnNjYWxlLnggKz0gY2hhbmdlLnhcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnNjYWxlLnkgKz0gY2hhbmdlLnlcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ3pvb21lZCcsIHsgdmlld3BvcnQ6IHRoaXMucGFyZW50LCB0eXBlOiAnd2hlZWwnIH0pXG4gICAgICAgICAgICBjb25zdCBjbGFtcCA9IHRoaXMucGFyZW50LnBsdWdpbnNbJ2NsYW1wLXpvb20nXVxuICAgICAgICAgICAgaWYgKGNsYW1wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNsYW1wLmNsYW1wKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmNlbnRlcilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5tb3ZlQ2VudGVyKHRoaXMuY2VudGVyKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BvaW50ID0gdGhpcy5wYXJlbnQudG9HbG9iYWwob2xkUG9pbnQpXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueCArPSBwb2ludC54IC0gbmV3UG9pbnQueFxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnkgKz0gcG9pbnQueSAtIG5ld1BvaW50LnlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc21vb3RoaW5nQ291bnQrK1xuICAgICAgICAgICAgaWYgKHRoaXMuc21vb3RoaW5nQ291bnQgPj0gdGhpcy5zbW9vdGgpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5zbW9vdGhpbmcgPSBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3aGVlbChlKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMucGF1c2VkKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwb2ludCA9IHRoaXMucGFyZW50LmdldFBvaW50ZXJQb3NpdGlvbihlKVxuXHRcdGlmICh0aGlzLnJlbmRlckNhbnZhcylcblx0XHR7XG5cdFx0XHR2YXIgb2Zmc2V0ID0gdGhpcy5yZW5kZXJDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHRwb2ludC54IC09IG9mZnNldC54O1xuXHRcdFx0cG9pbnQueSAtPSBvZmZzZXQueTtcblx0XHR9XG5cbiAgICAgICAgbGV0IHNpZ25cbiAgICAgICAgaWYgKHRoaXMucmV2ZXJzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgc2lnbiA9IGUuZGVsdGFZID4gMCA/IDEgOiAtMVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgc2lnbiA9IGUuZGVsdGFZIDwgMCA/IDEgOiAtMVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IDEgKyB0aGlzLnBlcmNlbnQgKiBzaWduXG4gICAgICAgIGlmICh0aGlzLnNtb290aClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWwgPSB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy5zbW9vdGhpbmcgPyB0aGlzLnNtb290aGluZy54ICogKHRoaXMuc21vb3RoIC0gdGhpcy5zbW9vdGhpbmdDb3VudCkgOiAwLFxuICAgICAgICAgICAgICAgIHk6IHRoaXMuc21vb3RoaW5nID8gdGhpcy5zbW9vdGhpbmcueSAqICh0aGlzLnNtb290aCAtIHRoaXMuc21vb3RoaW5nQ291bnQpIDogMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zbW9vdGhpbmcgPSB7XG4gICAgICAgICAgICAgICAgeDogKCh0aGlzLnBhcmVudC5zY2FsZS54ICsgb3JpZ2luYWwueCkgKiBjaGFuZ2UgLSB0aGlzLnBhcmVudC5zY2FsZS54KSAvIHRoaXMuc21vb3RoLFxuICAgICAgICAgICAgICAgIHk6ICgodGhpcy5wYXJlbnQuc2NhbGUueSArIG9yaWdpbmFsLnkpICogY2hhbmdlIC0gdGhpcy5wYXJlbnQuc2NhbGUueSkgLyB0aGlzLnNtb290aFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zbW9vdGhpbmdDb3VudCA9IDBcbiAgICAgICAgICAgIHRoaXMuc21vb3RoaW5nQ2VudGVyID0gcG9pbnRcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBvbGRQb2ludFxuICAgICAgICAgICAgaWYgKCF0aGlzLmNlbnRlcilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvbGRQb2ludCA9IHRoaXMucGFyZW50LnRvTG9jYWwocG9pbnQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBhcmVudC5zY2FsZS54ICo9IGNoYW5nZVxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuc2NhbGUueSAqPSBjaGFuZ2VcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ3pvb21lZCcsIHsgdmlld3BvcnQ6IHRoaXMucGFyZW50LCB0eXBlOiAnd2hlZWwnIH0pXG4gICAgICAgICAgICBjb25zdCBjbGFtcCA9IHRoaXMucGFyZW50LnBsdWdpbnNbJ2NsYW1wLXpvb20nXVxuICAgICAgICAgICAgaWYgKGNsYW1wKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNsYW1wLmNsYW1wKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmNlbnRlcilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5tb3ZlQ2VudGVyKHRoaXMuY2VudGVyKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BvaW50ID0gdGhpcy5wYXJlbnQudG9HbG9iYWwob2xkUG9pbnQpXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQueCArPSBwb2ludC54IC0gbmV3UG9pbnQueFxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnkgKz0gcG9pbnQueSAtIG5ld1BvaW50LnlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhcmVudC5lbWl0KCdtb3ZlZCcsIHsgdmlld3BvcnQ6IHRoaXMucGFyZW50LCB0eXBlOiAnd2hlZWwnIH0pXG4gICAgICAgIHRoaXMucGFyZW50LmVtaXQoJ3doZWVsJywgeyB3aGVlbDogeyBkeDogZS5kZWx0YVgsIGR5OiBlLmRlbHRhWSwgZHo6IGUuZGVsdGFaIH0sIGV2ZW50OiBlLCB2aWV3cG9ydDogdGhpcy5wYXJlbnR9KVxuICAgICAgICBpZiAoIXRoaXMucGFyZW50LnBhc3NpdmVXaGVlbClcbiAgICAgICAge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=