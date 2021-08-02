// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: book-open;
//
// ReAD Statistics
// https://github.com/doersino/scriptable-widgets/tree/main/read-statistics
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays statistics for your instance of ReAD – which is a web-based
//   read-it-later application of the author's own construction. Say hi if you
//   actually use it!
// - Licensed under the MIT License.

// set up configuration reading and writing
let fm = FileManager.local();
let configurationPath = fm.joinPath(fm.libraryDirectory(), "read-statistics-config.json");
let configuration = {url: null, api_key: null};

// if running in the app, show configuration dialog
if (!config.runsInWidget) {

    // load previous configuration for prefilling
    if (fm.fileExists(configurationPath)) {
        configuration = JSON.parse(fm.readString(configurationPath));
    }

    let alert = new Alert();
    alert.title = "Configure ReAD Statistics";
    alert.message = "To use this widget, enter the URL of your ReAD instance (without protocol or trailing slash) and the API key you've configured in ReAD's settings."
    alert.addTextField("URL of ReAD Instance", configuration.url);
    alert.addTextField("API Key", configuration.api_key);
    alert.addAction((!configuration.url && !configuration.api_key) ? "Save" : "Update");
    alert.addCancelAction("Discard Changes");
    alert.addDestructiveAction("Delete From Device");

    let alertReturn = await alert.present();
    if (alertReturn != -1) {
        if (alertReturn == 1) {

            // delete configuration from device
            if (fm.fileExists(configurationPath)) {
                fm.remove(configurationPath);
                if (fm.fileExists(configurationPath)) {
                    throw "Couldn't delete configuration file from device."
                }
            }
            throw "Successfully deleted configuration file from device (this exception is just to stop the script).";
        } else {

            // update configuration
            if (!alert.textFieldValue(0) || !alert.textFieldValue(1)) {
                throw "Neither text field may be blank – both are required.";
            }
            configuration = {url: alert.textFieldValue(0), api_key: alert.textFieldValue(1)};
            fm.writeString(configurationPath, JSON.stringify(configuration));
        }
    }
}

// read configuration
try {
    configuration = JSON.parse(fm.readString(configurationPath));
    if (!configuration.url || !configuration.api_key) {
        throw "Couldn't read one or both values.";
    }
} catch (error) {
    throw "Something went wrong when reading the configuration: " + error;
}

// retrieve stats
const url = `https://${configuration.url}/api.php?key=${configuration.api_key}&action=stats_for_widget`;
const req = await new Request(url);
const resp = await req.loadJSON();
const data = resp.data;

// draw background color
let ctx = new DrawContext();
ctx.size = new Size(500, 500);
ctx.setFillColor(new Color("#e8f0fc"));
ctx.fillRect(new Rect(0, 0, 500, 500));

// draw sparkline on top of background color
let line = new Path();
const scale = 10;  // could also scale everything to some maximum height, but this is more fun
const sparklineData = data.sparkline_data;
for (let i = 0; i < sparklineData.length; i++) {
    const x = (i / sparklineData.length) * 500;
    const y = 500 - scale * sparklineData[i];
    let leftPoint = new Point(x, y);
    let rightPoint = new Point(x + (1 / sparklineData.length) * 500, y);
    if (i == 0) {
        line.move(leftPoint);
    } else {
        line.addLine(leftPoint);
    }
    line.addLine(rightPoint);
}
ctx.addPath(line);
ctx.setStrokeColor(new Color("#bcb", 0.75));  // the blue channel comes second for some reason
ctx.setLineWidth(3);
ctx.strokePath();

// fill area below sparkline
line.addLine(new Point(500, 500));
line.addLine(new Point(0, 500));
ctx.addPath(line);
ctx.setFillColor(new Color("#fff", 0.5));
ctx.fillPath();

// render out background image
const backgroundImage = ctx.getImage();

// render it all as a widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#ddd");
widget.backgroundImage = backgroundImage;
widget.url = `https://${configuration.url}`;

const unreadPlural = data.unread == 1 ? "" : "s";

let headline = widget.addText(`ReAD holds ${data.unread} unread article${unreadPlural}.`);
headline.textColor = new Color("#000");
headline.font = Font.mediumSystemFont(14);

widget.addSpacer();

const minutes = Math.round(data.reading_time_today/60);
const minutesPlural = minutes == 1 ? "" : "s";
const archivedTodayPlural = data.archived_today == 1 ? "" : "s";
const addedTodayPlural = data.added_today == 1 ? "" : "s";

let details = widget.addText(`Today, you've spent ${Math.round(data.reading_time_today/60)} minute${minutesPlural} reading ${data.archived_today} article${archivedTodayPlural} and added ${data.added_today} fresh one${addedTodayPlural}. ${Math.round(data.reading_time_today/60) >= 60 ? "💮" : "📚"}`);
details.textColor = new Color("#555");
details.shadowRadius = 5;
details.shadowColor = new Color("#eee");
details.font = Font.mediumSystemFont(12);

// set or preview widget
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall();
}

Script.complete();
