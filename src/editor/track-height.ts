/**
 * How tall the timeline's track rows are drawn: the height they start at, the bounds of the editor
 * bar's slider (its vertical zoom), and the height a row needs for its fader. Knows nothing of the page.
 */

/** How tall a track's row is until the slider moves it, in pixels. */
export const TRACK_HEIGHT = 78;
/** The lowest and tallest a track's row is drawn, in pixels. */
export const LEAST_TRACK_HEIGHT = 48;
export const MOST_TRACK_HEIGHT = 240;
/** The lowest a track's row is drawn with its fader in it, in pixels; lower, the row has no room. */
export const FADER_LEAST_TRACK_HEIGHT = 72;
