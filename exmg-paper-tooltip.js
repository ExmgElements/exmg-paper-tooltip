import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

/**
* @namespace Exmg
*/
window.Exmg = window.Exmg || {};

/**
 * The `<exmg-paper-tooltip>` Is a simplified version of the paper-tooltip. The
 * animations have been stripped and replaced by a simply css animation + we
 * have rewritten it to Polymer 2 syntax.
 * This tooltip is a label that appears on hover and focus when the user
 * hovers over an element with the cursor or with the keyboard. It will be centered
 * to an anchor element specified in the `for` attribute, or, if that doesn't exist,
 * centered to the parent node containing it. Note that this is a stripped version of
 * the paper-toolbar withoud neon animations which were resulting in warnings. So in
 * the fure this element can possibly be replaced by paper-tooltip.
 *
 * See demo page for more detailed examples on how to use
 *
 * ```html
 * <div style="display:inline-block">
 *    <button>Click me!</button>
 *   <exmg-paper-tooltip>Tooltip text</exmg-paper-tooltip>
 * </div>
 *
 *  <div>
 *    <button id="btn">Click me!</button>
 *    <exmg-paper-tooltip for="btn">Tooltip text</exmg-paper-tooltip>
 * </div>
 * ```
 * The tooltip can be positioned on the top|bottom|left|right of the anchor using
 * the `position` attribute. The default position is bottom.
 *
 * ```html
 * <exmg-paper-tooltip for="btn" position="left">Tooltip text</exmg-paper-tooltip>
 * <exmg-paper-tooltip for="btn" position="top">Tooltip text</exmg-paper-tooltip>
 * ```
 *
 * ### Styling
 *
 * The following custom properties and mixins are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--exmg-paper-tooltip-background` | The background color of the tooltip | `#616161`
 * `--exmg-paper-tooltip-opacity` | The opacity of the tooltip | `0.9`
 * `--exmg-paper-tooltip-text-color` | The text color of the tooltip | `white`
 * `--exmg-paper-tooltip` | Mixin applied to the tooltip | `{}`
 *
 * @customElement
 * @polymer
 * @memberof Exmg
 * @group Exmg Paper Elements
 * @element exmg-paper-tooltip
 * @demo demo/index.html
 */
class TooltipElement extends PolymerElement {
  static get is() {
    return 'exmg-paper-tooltip';
  }
  static get properties() {
    return {
      /**
       * The id of the element that the tooltip is anchored to. This element
       * must be a sibling of the tooltip.
       */
      for: {
        type: String,
        observer: '_findTarget'
      },

      /**
       * Positions the tooltip to the top, right, bottom, left of its content.
       */
      position: {
        type: String,
        value: 'bottom'
      },

      /**
       * If true, no parts of the tooltip will ever be shown offscreen.
       */
      fitToVisibleBounds: {
        type: Boolean,
        value: false
      },

      /**
       * The spacing between the top of the tooltip and the element it is
       * anchored to.
       */
      offset: {
        type: Number,
        value: 14
      },

      _showing: {
        type: Boolean,
        value: false
      }
    };
  }

  static get template() {
    return html`
      <style>
        :host {
          display: block;
          position: absolute;
          outline: none;
          z-index: 1002;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-user-select: none;
          user-select: none;
          cursor: default;
        }

        #tooltip {
          display: block;
          outline: none;
          @apply --paper-font-common-base;
          font-size: 10px;
          line-height: 1;

          background-color: var(--exmg-paper-tooltip-background, #616161);
          opacity: var(--exmg-paper-tooltip-opacity, 0.9);
          color: var(--exmg-paper-tooltip-text-color, white);

          padding: 8px;
          border-radius: 2px;

          @apply --exmg-paper-tooltip;
        }

        /* Thanks IE 10. */
        .hidden {
          display: none !important;
        }
      </style>
      <div id="tooltip" class="hidden">
        <slot></slot>
      </div>
    `;
  }

  /**
   * Returns the target element that this tooltip is anchored to. It is
   * either the element given by the `for` attribute, or the immediate parent
   * of the tooltip.
   */
  get target() {
    var parentNode = this.parentNode;
    // If the parentNode is a document fragment, then we need to use the host.
    var ownerRoot = parentNode.getRootNode();

    var target;
    if (this.for) {
      target = ownerRoot.querySelector('#' + this.for);
    } else {
      target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ?
        ownerRoot.host : parentNode;
    }

    return target;
  }

  constructor() {
    super();
    this._ensureAttribute('role', 'tooltip');
    this._ensureAttribute('tabindex', -1);
  }

  connectedCallback() {
    super.connectedCallback();
    this._boundShow = this.show.bind(this);
    this._boundHide = this.hide.bind(this);
    this._findTarget();
  }

  disconnectCallback() {
    super.disconnectCallback();
    this._removeListeners();
  }

  show() {
    // If the tooltip is already showing, there's nothing to do.
    if (this._showing) {
      return;
    }
    if (this.textContent.trim() === '') {
      // Check if effective children are also empty
      var allChildrenEmpty = true;
      var effectiveChildren = this.getEffectiveChildNodes();
      for (var i = 0; i < effectiveChildren.length; i++) {
        if (effectiveChildren[i].textContent.trim() !== '') {
          allChildrenEmpty = false;
          break;
        }
      }
      if (allChildrenEmpty) {
        return;
      }
    }

    this._showing = true;
    this.toggleClass('hidden', false, this.$.tooltip);
    this.updatePosition();
  }

  /**
   * Toggles a CSS class on or off.
   *
   * @param {string} name CSS class name
   * @param {boolean=} bool Boolean to force the class on or off.
   *    When unspecified, the state of the class will be reversed.
   * @param {Element=} node Node to target.  Defaults to `this`.
   */
  toggleClass(name, bool, node) {
    node = /** @type {Element} */ (node || this);
    if (arguments.length == 1) {
      bool = !node.classList.contains(name);
    }
    if (bool) {
      node.classList.add(name);
    } else {
      node.classList.remove(name);
    }
  }

  hide() {
    // If the tooltip is already hidden, there's nothing to do.
    if (!this._showing) {
      return;
    }
    this._showing = false;
    this.toggleClass('hidden', true, this.$.tooltip);
  }

  updatePosition() {
    if (!this._target || !this.offsetParent) {
      return;
    }

    var offset = this.offset;
    var parentRect = this.offsetParent.getBoundingClientRect();
    var targetRect = this._target.getBoundingClientRect();
    var thisRect = this.getBoundingClientRect();

    var horizontalCenterOffset = (targetRect.width - thisRect.width) / 2;
    var verticalCenterOffset = (targetRect.height - thisRect.height) / 2;

    var targetLeft = targetRect.left - parentRect.left;
    var targetTop = targetRect.top - parentRect.top;

    var tooltipLeft, tooltipTop;

    switch (this.position) {
      case 'top':
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop - thisRect.height - offset;
        break;
      case 'bottom':
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop + targetRect.height + offset;
        break;
      case 'left':
        tooltipLeft = targetLeft - thisRect.width - offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;
      case 'right':
        tooltipLeft = targetLeft + targetRect.width + offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;
    }

    // TODO(noms): This should use IronFitBehavior if possible.
    if (this.fitToVisibleBounds) {
      // Clip the left/right side
      if (parentRect.left + tooltipLeft + thisRect.width > window.innerWidth) {
        this.style.right = '0px';
        this.style.left = 'auto';
      } else {
        this.style.left = Math.max(0, tooltipLeft) + 'px';
        this.style.right = 'auto';
      }

      // Clip the top/bottom side.
      if (parentRect.top + tooltipTop + thisRect.height > window.innerHeight) {
        this.style.bottom = parentRect.height + 'px';
        this.style.top = 'auto';
      } else {
        this.style.top = Math.max(-parentRect.top, tooltipTop) + 'px';
        this.style.bottom = 'auto';
      }
    } else {
      this.style.left = tooltipLeft + 'px';
      this.style.top = tooltipTop + 'px';
    }

  }

  _addListeners() {
    if (this._target) {
      this._target.addEventListener('mouseenter', this._boundShow);
      this._target.addEventListener('focus', this._boundShow);
      this._target.addEventListener('mouseleave', this._boundHide);
      this._target.addEventListener('blur', this._boundHide);
      this._target.addEventListener('tap', this._boundHide);
    }
    this.addEventListener('mouseenter', this._boundHide);
  }

  _findTarget() {
    this._removeListeners();

    this._target = this.target;
    this._addListeners();
  }

  _removeListeners() {
    if (this._target) {
      this._target.removeEventListener('mouseenter', this._boundShow);
      this._target.removeEventListener('focus', this._boundShow);
      this._target.removeEventListener('mouseleave', this._boundHide);
      this._target.removeEventListener('blur', this._boundHide);
      this._target.removeEventListener('tap', this._boundHide);
    }
    this.removeEventListener('mouseenter', this._boundHide);
  }
}

window.customElements.define(TooltipElement.is, TooltipElement);

Exmg.TooltipElement = TooltipElement;