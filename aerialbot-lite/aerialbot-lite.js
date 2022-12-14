// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: space-shuttle;
//
// ærialbot lite
// https://github.com/doersino/scriptable-widgets/tree/main/aerialbot-lite
// https://twitter.com/doersino/status/1418647087449784330
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays a random map tile (at a random zoom level and from a random CDN
//   server) from Google Maps. Tapping on the widget will open Google Maps
//   (either in-browser or the app if installed) at the presented location.
// - The "version" variable below needs to be updated every year or two – just
//   increase it by 20 or so and see if things work again.
// - Note that this script directly accesses map tiles that are supposed to be
//   accessed through an API, so it could break at any point.
// - Based on ærialbot, see https://github.com/doersino/aerialbot, and this
//   gist: https://gist.github.com/jacopocolo/0e28c4af2e28c9de058480da0c5d4582.
// - Licensed under the MIT License.

// whether to display latitude and longitude as part of the widget
const showCoordinates = true;

// update this occasionally
const version = 934;

////////////////////////////////////////////////////////////////////////////////

const radians = d => d * (Math.PI / 180);
const degrees = r => r * (180 / Math.PI);

// correctly generate a random latitude-longitude pair (random with regard to
// surface area, not the latitude-longitude "grid", hence the trig functions)
function randomGeoPoint() {

    // latitude (max 85 because values beyond that don't work with the web
    // mercator projection, and there'd be nothin interesting there anyway)
    const north = radians(85);
    const south = radians(-85);
    const lat = degrees(Math.asin(Math.random() * (Math.sin(north) - Math.sin(south)) + Math.sin(south)));

    // longitude (this is really simple)
    const lon = -180 + 360 * Math.random();

    return {lat: lat, lon: lon};
}

// compute tile coordinates for a given latitude-longitude pair
function webMercatorProject(geoPoint, zoom) {
    const factor = (1 / (2 * Math.PI)) * 2 ** zoom;
    const x = Math.floor(factor * (radians(geoPoint.lon) + Math.PI));
    const y = Math.floor(factor * (Math.PI - Math.log(Math.tan((Math.PI / 4) + (radians(geoPoint.lat) / 2)))));
    return {x: x, y: y, z: zoom};
}

// pretty-print a latitude-longitude pair
function prettyGeoPoint(geoPoint) {
    const fancyCoord = (coord, pos, neg) => {
        const coord_dir = (coord > 0) ? pos : neg;
        let coord_tmp = Math.abs(coord);
        const coord_deg = Math.floor(coord_tmp);
        coord_tmp = (coord_tmp - Math.floor(coord_tmp)) * 60;
        const coord_min = Math.floor(coord_tmp);
        const coord_sec = Math.round((coord_tmp - Math.floor(coord_tmp)) * 600) / 10;
        return `${coord_deg}°${coord_min}'${coord_sec}\"${coord_dir}`;
    };

    const fancyLat = fancyCoord(geoPoint.lat, "N", "S");
    const fancyLon = fancyCoord(geoPoint.lon, "E", "W");

    return `${fancyLat}\n${fancyLon}`;
}

// set up retrying (since we might drop into, say, a spot in the ocean without
// high-resolution imagery at the selected zoom level)
let tries = 12;
let geoPoint = tileCoords = tile = null;
while (tries-- > 0) {

    // determine server (there are four to choose from, let's evenly pull from
    // 'em all)
    const server = Math.floor(Math.random() * 4);

    // generate random latitude and longitude
    geoPoint = randomGeoPoint();

    // semi-randomly determine zoom level - try tighter ones first, then coarser
    // ones if we've had many retries: this starts at a value between 16 and 20;
    // this range moves a step towards zero for each retry
    const zoom = Math.floor(4 + tries + Math.random() * 5);

    // convert latitude and longitude to map tile coordinates
    tileCoords = webMercatorProject(geoPoint, zoom);

    // try loading the map tile
    const url = `https://khms${server}.google.com/kh/v=${version}?x=${tileCoords.x}&y=${tileCoords.y}&z=${tileCoords.z}`;
    try {
        const req = await new Request(url);
        tile = await req.loadImage();
        break;
    } catch (e) {
        // retry!
    }
}

// just show the whole world if we've kept dropping into the ocean (use server 2
// for good measure)
if (tries == 0) {
    const url = `https://khms2.google.com/kh/v=${version}?x=0&y=0&z=0`;
    const req = await new Request(url);
    tile = await req.loadImage();
}

// render map tile as part of a widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#000");
widget.backgroundImage = tile;
widget.url = `https://www.google.com/maps/@${geoPoint.lat},${geoPoint.lon},${tileCoords.z}z`;

if (showCoordinates) {
    let text = widget.addText(prettyGeoPoint(geoPoint)/* + "\n" + tries*/);
    text.textColor = new Color("#eee");
    text.shadowRadius = 10;
    text.font = new Font("DINAlternate-Bold", 12);

    widget.addSpacer();
}

// don't refresh for the next three hours (mainly to go easy on the Google Maps
// servers, but it's also just not necessary)
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 60 * 3);

// set or preview widget
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall();
}

Script.complete();
