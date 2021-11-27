// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: clock;
//
// Binary Date
// https://github.com/doersino/scriptable-widgets/tree/main/binary-date
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays the current date in binary as unsigned integers, with 1 bit for
//   an indication whether it's a weekday or -end, 5 bits for the day number, 4
//   bits for the month number, and 12 bits for the year number. (Which is going
//   to break at the end of 4095, but I doubt anyone's going to be using iOS
//   widgets then. (If you are: Hi, I've probably died just about 2000 years
//   ago, nice to meet you!))
// - Licensed under the MIT License.

// width, height, and star count
const w = 1024;
let h = w;
let stars = 628;  // 100 × τ

// on medium widgets, only the "middle half" of the generated image would be
// shown, so generate a shorter image here
if (config.widgetFamily == "medium") {
    h /= 2;
    stars /= 2;
}

const s = 64;  // size of blocks
const d = 12;  // distance/spacing between blocks

const backgroundColor = "#3a4a5a";
const colorOff = new Color("#9aaaba");
const colorOn = new Color("#daeafa");

////////////////////////////////////////////////////////////////////////////////

let ctx = new DrawContext();
ctx.size = new Size(w, h);

// draw background
ctx.setFillColor(new Color(backgroundColor));
ctx.fillRect(new Rect(0, 0, w, h));

// draw stars, slightly biased towards the edges
for (let i = 0; i < stars; i++) {
    ctx.setFillColor(new Color("#fff", 0.6 + Math.random() / 4));
    let x = Math.round(Math.sin(Math.random() * Math.PI) ** 2 * w);
    let y = Math.round(Math.sin(Math.random() * Math.PI) ** 2 * h);
    let size = Math.round(2 + Math.random() * 5);
    ctx.fillEllipse(new Rect(x, y, size, size));
}

// convert date into required bit strings
const date = new Date();
const weekday = date.getDay() != 0 && date.getDay() != 6;  // because sunday is at the start of the week, obviously
const day = date.getDate().toString(2).padStart(5, "0");
const month = (date.getMonth() + 1).toString(2).padStart(4, "0");  // `+ 1` because unlike `.getDate()` (day of month), which starts at 1 as you'd expect, `.getMonth()` (month of year) starts at 0 as you wouldn't expect
const year = date.getFullYear().toString(2).padStart(12, "0");

// figure out coordinates of the top-left-most block
const x0 = (w - (12 * s + 11 * d)) / 2;  // 12 blocks per row, 11 spacers inbetween them
const y0 = (h - (2 * s + d)) / 2;

// draw blocks: weekday indicator...
ctx.setFillColor(weekday ? colorOn : colorOff);
ctx.fillRect(new Rect(x0, y0, s, s));

// ...spacer...
ctx.setFillColor(colorOff);
ctx.fillEllipse(new Rect(x0 + s + d + s/4, y0 + s/4, s/2, s/2));

// ...day...
for (let i = 0; i < 5; i++) {
    ctx.setFillColor((day.charAt(i) == "0") ? colorOff : colorOn);
    ctx.fillRect(new Rect(x0 + (i + 2) * (s + d), y0, s, s));
}

// ...spacer...
ctx.setFillColor(colorOff);
ctx.fillEllipse(new Rect(x0 + 7 * (s + d) + s/4, y0 + s/4, s/2, s/2));

// ...month...
for (let i = 0; i < 4; i++) {
    ctx.setFillColor((month.charAt(i) == "0") ? colorOff : colorOn);
    ctx.fillRect(new Rect(x0 + (i + 8) * (s + d), y0, s, s));
}

// ...and, on the second row, the year
for (let i = 0; i < 12; i++) {
    ctx.setFillColor((year.charAt(i) == "0") ? colorOff : colorOn);
    ctx.fillRect(new Rect(x0 + i * (s + d), y0 + s + d, s, s));
}

// render out image
const backgroundImage = ctx.getImage();

// set it as the background image of a widget
let widget = new ListWidget();
widget.backgroundColor = new Color(backgroundColor);
widget.backgroundImage = backgroundImage;

// request widget to be refreshed tomorrow, one minute after midnight
let justAfterMidnight = new Date();
justAfterMidnight.setHours(24, 1, 0, 0);
widget.refreshAfterDate = justAfterMidnight;

// set or preview widget
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall();
}

Script.complete();
