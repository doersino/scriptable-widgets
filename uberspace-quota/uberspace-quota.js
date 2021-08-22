// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: rocket;
//
// Uberspace Quota
// https://github.com/doersino/scriptable-widgets/tree/main/uberspace-quota
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays basic disk usage statistics for your account on Uberspace,
//   retrieving the relevant data via a PHP script that must be located within
//   your Uberspace's web root. Run this script from within the Scriptable app
//   to configure the URL.
// - The background image "uberspace-quota-background.png" must be located next
//   to this script.
// - Licensed under the MIT License.

// set up configuration reading and writing
let fm = FileManager.local();
let configurationPath = fm.joinPath(fm.libraryDirectory(), "uberspace-quota-config.json");
let configuration = {url: null};

// if running in the app, show configuration dialog
if (!config.runsInWidget) {

    // load previous configuration for prefilling
    if (fm.fileExists(configurationPath)) {
        configuration = JSON.parse(fm.readString(configurationPath));
    }

    let alert = new Alert();
    alert.title = "Configure Uberspace Quota";
    alert.message = "To use this widget, enter the URL of the continually-regenerated 'uberspace-quota.json' on your Uberspace."
    alert.addTextField("URL of 'uberspace-quota.php'", configuration.url);
    alert.addAction((!configuration.url) ? "Save" : "Update");
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
            if (!alert.textFieldValue(0)) {
                throw "The URL field may not be blank – it's required.";
            }
            configuration = {url: alert.textFieldValue(0)};
            fm.writeString(configurationPath, JSON.stringify(configuration));
        }
    }
}

// read configuration
try {
    configuration = JSON.parse(fm.readString(configurationPath));
    if (!configuration.url) {
        throw "couldn't read URL.";
    }
} catch (error) {
    throw "Something went wrong when reading the configuration: " + error;
}

// retrieve and validate stats
let data = null;
try {
    const req = await new Request(configuration.url);
    data = await req.loadJSON();

    if (!data.user) throw "user not set.";
    if (!data.server) throw "server not set.";
    if (!data.used) throw "space used not set.";
    if (!data.total) throw "total space available not set.";
    if (!data.files) throw "number of files not set.";
} catch (error) {
    throw "Error during loading and reading quota JSON file: " + error;
}

// compute data that we'll show
const usedGigabytes = `${(Math.round(1000 * (data.used / 1024 / 1024)) / 1000).toString().substring(0,5)}\u2002GB`;
const freePercent = `${Math.round(1000 * (1 - data.used / data.total)) / 10}%`;
const fileCount = data.files;

// get background image
const fileManager = FileManager.iCloud();
const backgroundImagePath = fileManager.joinPath(fileManager.documentsDirectory(), "uberspace-quota-background.png");
await fileManager.downloadFileFromiCloud(backgroundImagePath);
const backgroundImage = Image.fromFile(backgroundImagePath);

// define widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#3a3a3a");
widget.backgroundImage = backgroundImage;
widget.setPadding(8, 8, 8, 8);

// leave space for the logo
widget.addSpacer(38);

// display user@server
let userServer = widget.addText(`${data.user}@${data.server}`.toUpperCase());
userServer.centerAlignText();
userServer.textColor = new Color("#ddd");
userServer.shadowRadius = 10;
userServer.shadowColor = new Color("#333");
userServer.font = new Font("AvenirNextCondensed-Medium", 13);

// display used space
let used = widget.addText(`${usedGigabytes}`);
used.centerAlignText();
used.textColor = new Color("#fff");
used.shadowRadius = 10;
used.shadowColor = new Color("#333");
used.font = new Font("AvenirNextCondensed-DemiBold", 24);

widget.addSpacer();

// display free space percentage and file count
let details = widget.addText(`${freePercent} FREE — ${fileCount} FILES`);
details.centerAlignText();
details.textColor = new Color("#444");
details.shadowRadius = 10;
details.shadowColor = new Color("#999");
details.font = new Font("AvenirNextCondensed-Medium", 10);

// set or preview widget
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall();
}

Script.complete();
