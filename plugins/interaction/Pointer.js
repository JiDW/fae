// @ifdef DEBUG
import { debug } from '@fae/core';
// @endif

/**
 * @class
 */
export default class Pointer
{
    /**
     * @param {number} id - The id of the pointer.
     * @param {InteractionSystem} system - The interaction system this pointer belongs to.
     */
    constructor(id, system)
    {
        /**
         * The ID of this pointer.
         *
         * @readonly
         * @member {number}
         */
        this.id = id;

        /**
         * The interaction system this pointer belongs to.
         *
         * @readonly
         * @member {InteractionSystem}
         */
        this.manager = system;

        /**
         * The type of this pointer.
         *
         * @readonly
         * @member {Pointer.TYPE}
         */
        this.type = Pointer.TYPE.UNKNOWN;

        /**
         * The target of this pointer when it was pressed down.
         *
         * @readonly
         * @member {InteractableObject}
         */
        this.target = null;

        /**
         * The target of this pointer when it hovered over an object.
         *
         * @readonly
         * @member {InteractableObject}
         */
        this.hoverTarget = null;

        /**
         * The target of this pointer when scroll events happened.
         *
         * @readonly
         * @member {InteractableObject}
         */
        this.scrollTarget = null;

        /**
         * The width of the interaction of the pointer with the screen.
         * For touch interactions, this is how much finger is on the screen.
         *
         * @readonly
         * @member {number}
         */
        this.width = 1;

        /**
         * The height of the interaction of the pointer with the screen.
         * For touch interactions, this is how much finger is on the screen.
         *
         * @readonly
         * @member {number}
         */
        this.height = 1;

        /**
         * The pressure or force of the interaction of the pointer with the screen.
         * This value is a normalized value between 0.0 and 1.0
         *
         * @readonly
         * @member {number}
         */
        this.pressure = 1.0;

        /**
         * How much the pointer has moved since last time it was updated.
         *
         * @readonly
         * @member {number}
         */
        this.deltaX = 0;

        /**
         * How much the pointer has moved since last time it was updated.
         *
         * @readonly
         * @member {number}
         */
        this.deltaY = 0;

        /**
         * The client-space coord of the pointer interaction.
         *
         * @readonly
         * @member {number}
         */
        this.clientX = 0;

        /**
         * The client-space coord of the pointer interaction.
         *
         * @readonly
         * @member {number}
         */
        this.clientY = 0;

        /**
         * The world-space coord of the pointer interaction.
         *
         * @readonly
         * @member {number}
         */
        this.worldX = 0;

        /**
         * The world-space coord of the pointer interaction.
         *
         * @readonly
         * @member {number}
         */
        this.worldY = 0;

        /**
         * The delta X of the scroll when doing a scroll event.
         *
         * @readonly
         * @member {number}
         */
        this.scrollDeltaX = 0;

        /**
         * The delta Y of the scroll when doing a scroll event.
         *
         * @readonly
         * @member {number}
         */
        this.scrollDeltaY = 0;

        /**
         * The delta Z of the scroll when doing a scroll event.
         *
         * @readonly
         * @member {number}
         */
        this.scrollDeltaZ = 0;

        /**
         * Is this pointer down pressed down?
         *
         * @readonly
         * @member {boolean}
         */
        this.isDown = false;

        /**
         * Is this pointer hovering over the target?
         *
         * @readonly
         * @member {boolean}
         */
        this.isHovering = false;
    }

    /**
     * Called on a start event.
     *
     * @param {MouseEvent|PointerEvent|Touch} data - The contact data.
     * @param {InteractableObject} target - The object this interaction hits.
     * @param {number} worldX - The world X coord of the interaction.
     * @param {number} worldY - The world Y coord of the interaction.
     */
    start(data, target, worldX, worldY)
    {
        // @ifdef DEBUG
        debug.ASSERT(!this.isDown, 'Start called for pointer without ending first.');
        // @endif

        this.isDown = true;
        this.target = target;

        this._set(data, worldX, worldY);

        if (this.target)
        {
            this.manager.onDown.dispatch(this.target, this);
        }
    }

    /**
     * Called on an end event.
     *
     * @param {MouseEvent|PointerEvent|Touch} data - The contact data.
     * @param {InteractableObject} target - The object this interaction hits.
     * @param {number} worldX - The world X coord of the interaction.
     * @param {number} worldY - The world Y coord of the interaction.
     */
    end(data, target, worldX, worldY)
    {
        // ignore end events when we haven't even started yet
        if (!this.isDown) return;

        this.isDown = false;

        this._set(data, worldX, worldY);

        // click!
        if (this.target)
        {
            if (this.target === target)
            {
                this.manager.onClick.dispatch(this.target, this);
            }

            if (!target)
            {
                this.manager.onUpOutside.dispatch(this.target, this);
            }
        }

        this.target = target;

        if (this.target)
        {
            this.manager.onUp.dispatch(this.target, this);
        }
    }

    /**
     * Called on a move event.
     *
     * @param {MouseEvent|PointerEvent|Touch} data - The contact data.
     * @param {InteractableObject} target - The object this interaction hits.
     * @param {number} worldX - The world X coord of the interaction.
     * @param {number} worldY - The world Y coord of the interaction.
     */
    move(data, target, worldX, worldY)
    {
        this._set(data, worldX, worldY, this.isDown || this.isHovering);

        // target has changed, so hover state has changed
        if (this.hoverTarget !== target)
        {
            if (this.isHovering && this.hoverTarget)
            {
                this.isHovering = false;
                this.manager.onHoverEnd.dispatch(this.hoverTarget, this);
                this.hoverTarget = null;
            }

            if (target)
            {
                this.isHovering = true;
                this.hoverTarget = target;
                this.manager.onHoverStart.dispatch(this.hoverTarget, this);
            }
        }

        // TODO: Drag-and-drop, if you move mouse fast enough target changes. May
        // cause issues when people try to do dragging.

        this.hoverTarget = target;

        if (this.hoverTarget)
        {
            this.manager.onMove.dispatch(this.hoverTarget, this);
        }
    }

    /**
     * Called on a cancel event.
     *
     * @param {MouseEvent|PointerEvent|Touch} data - The contact data.
     * @param {InteractableObject} target - The object this interaction hits.
     * @param {number} worldX - The world X coord of the interaction.
     * @param {number} worldY - The world Y coord of the interaction.
     */
    cancel(data, target, worldX, worldY)
    {
        const wasDown = this.isDown;
        const wasHovering = this.isHovering;

        this.isDown = false;
        this.isHovering = false;

        this._set(data, worldX, worldY);

        this.manager.onCancel.dispatch(this.target || this.hoverTarget, this);

        if (wasDown && this.target)
        {
            this.manager.onUpOutside.dispatch(this.target, this);
        }

        if (wasHovering && this.hoverTarget)
        {
            this.manager.onHoverEnd.dispatch(this.hoverTarget, this);
        }

        this.target = null;
        this.hoverTarget = null;
        this.scrollTarget = null;
    }

    /**
     * Called on a scroll event.
     *
     * @param {MouseEvent|PointerEvent|Touch} data - The contact data.
     * @param {InteractableObject} target - The object this interaction hits.
     * @param {number} worldX - The world X coord of the interaction.
     * @param {number} worldY - The world Y coord of the interaction.
     */
    scroll(data, target, worldX, worldY)
    {
        this._set(data, worldX, worldY);

        this.scrollDeltaX = data.deltaX;
        this.scrollDeltaY = data.deltaY;
        this.scrollDeltaZ = data.deltaZ;

        this.scrollTarget = target;

        if (target)
        {
            this.manager.onScroll.dispatch(this.scrollTarget, this);
        }
    }

    /**
     * Sets the members based on a DOM event.
     *
     * @param {PointerEvent|MouseEvent|Touch} data - The event data to set from.
     * @param {number} worldX - The world X coord of this event.
     * @param {number} worldY - The world Y coord of this event.
     * @param {boolean} calcDelta - Should we calculate the delta movement?
     */
    _set(data, worldX, worldY, calcDelta = false)
    {
        // set type
        if (data.pointerType)
        {
            this.type = data.pointerType;
        }
        else if (event.type && event.type[0] === 'm')
        {
            this.type = Pointer.TYPE.MOUSE;
        }
        else
        {
            this.type = Pointer.TYPE.TOUCH;
        }

        // set pressure
        if (typeof data.pressure === 'number')
        {
            this.pressure = data.pressure;
        }
        else if (typeof data.force === 'number')
        {
            this.pressure = data.force;
        }
        else
        {
            this.pressure = 1.0;
        }

        // set size
        this.width = data.width || (typeof data.radiusX === 'number' ? data.radiusX * 2 : 1);
        this.height = data.height || (typeof data.radiusY === 'number' ? data.radiusY * 2 : 1);

        // calculate delta (maybe)
        this.deltaX = calcDelta ? (worldX - this.worldX) : 0;
        this.deltaY = calcDelta ? (worldY - this.worldY) : 0;

        // set client x/y coords
        this.clientX = data.clientX;
        this.clientY = data.clientY;

        // set world x/y coords
        this.worldX = worldX;
        this.worldY = worldY;
    }
}

/**
 * The pointer type.
 *
 * @static
 * @readonly
 * @enum {string}
 */
Pointer.TYPE = {
    /** Unknown type */
    UNKNOWN: '',
    /** The pointer is a mouse */
    MOUSE: 'mouse',
    /** The pointer is a touch */
    TOUCH: 'touch',
    /** The pointer is a pen device */
    PEN: 'pen',
};

/**
 * Map of interaction events to the state they represent.
 *
 * @static
 * @readonly
 * @enum {string}
 */
Pointer.EVENT_CALL_MAP = {
    mousedown:      'start',
    touchstart:     'start',
    pointerdown:    'start',

    mouseup:        'end',
    touchend:       'end',
    pointerup:      'end',

    mousemove:      'move',
    touchmove:      'move',
    pointermove:    'move',

    mouseout:       'cancel',
    touchcancel:    'cancel',
    pointerout:     'cancel',

    wheel:          'scroll',
};
