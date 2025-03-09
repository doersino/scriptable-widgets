// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: compass;
//
// Location, location, location!
// https://github.com/doersino/scriptable-widgets/tree/main/location-location-location
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays your current location using satellite imagery from Google Maps.
//   Tapping on the widget will open Google Maps (either in-browser or the app
//   if installed) at the location shown in the widget.
// - Imagery is cached for 30 days to conserve bandwidth. For more details, see
//   the README.md at the link above.
// - Note that this script directly accesses map tiles that are supposed to be
//   accessed through an API, so it could break at any point.
// - Based on ærialbot, see https://github.com/doersino/aerialbot.
// - Licensed under the MIT License.

// whether to indicate your position with a dot (note that this dot will be
// colored blue if the operating system has provided a location during the most
// recent execution of this code, or gray if a previously cached location needed
// be used)
const indicatePosition = true;

// whether to display latitude and longitude as part of the widget
const showCoordinates = true;

// whether to display the altitude as well
const showAltitude = true;

// minimum height of the area shown in the widget, in meters (assumed to be at
// least 50ish, depending on latitude, so tiny values won't work (and there
// wouldn't be sufficiently-high-resolution imagery, anyway)), also note that
// this will be effectively increased depending on how uncertain the location is
const minimumHeightShown = 100;  // meters

// where to cache map tiles, location, and version (choose "local" for usage
// and "iCloud" for development – the former can't be viewed with external
// tools, the latter incurs networking overhead but is handy for development)
const cacheLocation = "local";

// after how many days of not being recalled should tiles in the cache be
// removed? (you can set this to 0 to clear the cache, which is recommended
// before discontinuing your use of this widget)
const cacheDuration = 30;  // days

// every how-many-minutes should the widget be updated? lower values obviously
// make it more-up-to-date, but incur more data transfer if you're moving around
// (note that this is really just a guideline, the operating system may decide
// to update it less frequently or - in my experience, when traveling - more
// frequently)
const updateInterval = 30;  // minutes

// fallback map tile version
const fallbackVersion = 995;

////////////////////////////////////////////////////////////////////////////////

const radians = d => d * (Math.PI / 180);
const degrees = r => r * (180 / Math.PI);

class TileCoords {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// a latitude-longitude pair
class GeoPoint {
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }

    // compute tile coordinates for the point
    webMercatorProjectAt(zoom) {
        const factor = (1 / (2 * Math.PI)) * 2 ** zoom;
        const x = factor * (radians(this.lon) + Math.PI);
        const y = factor * (Math.PI - Math.log(Math.tan((Math.PI / 4) + (radians(this.lat) / 2))));
        return {
            tileCoords: new TileCoords(Math.floor(x), Math.floor(y), zoom),
            xRemainder: x - Math.floor(x),
            yRemainder: y - Math.floor(y)
        };
    }

    // how many meters correspond to a pixel at this location for a zoom level?
    metersPerPixelAt(zoom) {
        const earthCircumference = 40075.016686 * 1000;  // in meters, at the equator
        const metersPerPixelsAtZoom0 = ((earthCircumference / 256) * Math.cos(radians(this.lat)))
        return metersPerPixelsAtZoom0 / (2 ** zoom);
    }

    // pretty-print it
    pretty(separator="\n") {
        const fancyCoord = (coord, pos, neg) => {
            const coord_dir = (coord > 0) ? pos : neg;
            let coord_tmp = Math.abs(coord);
            const coord_deg = Math.floor(coord_tmp);
            coord_tmp = (coord_tmp - Math.floor(coord_tmp)) * 60;
            const coord_min = Math.floor(coord_tmp);
            const coord_sec = Math.round((coord_tmp - Math.floor(coord_tmp)) * 600) / 10;
            return `${coord_deg}°${coord_min}'${coord_sec}\"${coord_dir}`;
        };

        const fancyLat = fancyCoord(this.lat, "N", "S");
        const fancyLon = fancyCoord(this.lon, "E", "W");

        return `${fancyLat}${separator}${fancyLon}`;
    }

    googleMapsUrlAt(zoom) {
        return `https://www.google.com/maps/@${geoPoint.lat},${geoPoint.lon},${zoom}z`;
    }
}

// tile, location, version and world map caching class – based on work by Evan
// Coleman (see https://github.com/evandcoleman/scriptable and
// https://github.com/yaylinda/scriptable/blob/main/Cache.js)
class Cache {
    constructor(cacheLocation, name) {
        if (cacheLocation == "iCloud") {
            this.fm = FileManager.iCloud();
            this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), name);
        } else if (cacheLocation == "local") {
            this.fm = FileManager.local();
            this.cachePath = this.fm.joinPath(this.fm.cacheDirectory(), name);
        } else {
            throw "cache location must either be 'iCloud' or 'local'";
        }

        if (!this.fm.fileExists(this.cachePath)) {
            this.fm.createDirectory(this.cachePath);
        }
    }

    // deletes everything from the cache
    async nukeCache() {
        const filenames = this.fm.listContents(this.cachePath);

        for (const filename of filenames) {
            const path = this.fm.joinPath(this.cachePath, filename);
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            this.fm.remove(path);
        }

        throw "removed everything from the cache (this exception is just to stop the program, things actually succeeded)"
    }

    // for debugging
    async consoleLogCacheStats() {
        const filenames = this.fm.listContents(this.cachePath);

        let count = 0;
        let size = 0;
        let oldestCreationDate = null;
        for (const filename of filenames) {
            const path = this.fm.joinPath(this.cachePath, filename);
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            count++;
            size += this.fm.fileSize(path);
            const creationDate = this.fm.creationDate(path);
            if (!oldestCreationDate || creationDate < oldestCreationDate) {
                oldestCreationDate = creationDate;
            }
        }

        console.log(`cache contains ${count} files weighing ${size / 1000} megabytes, the oldest of which was created on ${oldestCreationDate}`);
    }

    async purgeTilesOlderThanDays(expirationDays) {

        // special case for deleting everything older than "now": also delete
        // the world maps, the version file, and the location file
        if (expirationDays == 0) {
            await this.nukeCache();
            return;
        }

        const allFilenames = this.fm.listContents(this.cachePath);
        const tileFilenames = allFilenames.filter(n => n.endsWith(".jpg"));

        for (const filename of tileFilenames) {
            const path = this.fm.joinPath(this.cachePath, filename);
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);
            const modifiedAt = this.fm.modificationDate(path);

            if ((new Date()) - modifiedAt > (1000 * 60 * 60 * 24 * expirationDays)) {
                this.fm.remove(path);
            }
        }
    }

    tileFilename(tileCoords, version) {
        return `v${version}x${tileCoords.x}y${tileCoords.y}z${tileCoords.z}.jpg`;
    }

    async readTile(tileCoords, version) {
        try {
            const filename = this.tileFilename(tileCoords, version);
            const path = this.fm.joinPath(this.cachePath, filename);
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            // immediately exit if the file isn't found
            if (!this.fm.fileExists(path)) {
                throw "file does not exist";
            }

            // refresh modification date (note that this causes unnecessary
            // traffic when keeping the cache in icloud) - this is the closest
            // we can get to "touch"
            const tileData = this.fm.read(path);
            this.fm.write(path, tileData);

            // return image
            const tile = this.fm.readImage(path);
            return tile;
        } catch (error) {  // not found
            return null;
        }
    }

    writeTile(tileCoords, version, tileData) {
        const filename = this.tileFilename(tileCoords, version);
        const path = this.fm.joinPath(this.cachePath, filename);
        this.fm.write(path, tileData);
    }

    async readLocation() {
        try {
            const path = this.fm.joinPath(this.cachePath, "location.json");
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            // immediately exit if the file isn't found
            if (!this.fm.fileExists(path)) {
                throw "file does not exist";
            }

            const location = JSON.parse(this.fm.readString(path));
            return location;
        } catch (error) {
            return null;
        }
    }

    writeLocation(location) {
        const path = this.fm.joinPath(this.cachePath, "location.json");
        this.fm.writeString(path, JSON.stringify(location));
    }

    async readVersion() {
        try {
            const path = this.fm.joinPath(this.cachePath, "version.txt");
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            // immediately exit if the file isn't found
            if (!this.fm.fileExists(path)) {
                throw "file does not exist";
            }

            const version = parseInt(this.fm.readString(path));
            return version;
        } catch (error) {
            return null;
        }
    }

    writeVersion(version) {
        const path = this.fm.joinPath(this.cachePath, "version.txt");
        this.fm.writeString(path, version.toString());
    }

    async daysSinceVersionDetermined() {
        try {
            const path = this.fm.joinPath(this.cachePath, "version.txt");
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            if (!this.fm.fileExists(path)) {
                throw "file does not exist";
            }

            const modifiedAt = this.fm.modificationDate(path);
            return (new Date() - modifiedAt) / (1000 * 60 * 60 * 24);
        } catch (error) {

            // on errors, return a ridiculous number of days to indicate that
            // the caller should probably check for a new version
            return 9999;
        }
        return false;
    }

    worldMapFilename(widgetType) {
        return `worldmap-${widgetType}.png`;
    }

    async readWorldMap(widgetType) {
        try {
            const path = this.fm.joinPath(this.cachePath, this.worldMapFilename(widgetType));
            if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);

            // immediately exit if the file isn't found
            if (!this.fm.fileExists(path)) {
                throw "file does not exist";
            }

            const worldMap = this.fm.readImage(path);
            return worldMap;
        } catch (error) {
            return null;
        }
    }

    writeWorldMap(widgetType, worldMap) {
        const path = this.fm.joinPath(this.cachePath, this.worldMapFilename(widgetType));
        this.fm.writeImage(path, worldMap);
    }

    async worldMapAlreadyCached(widgetType) {
        const path = this.fm.joinPath(this.cachePath, this.worldMapFilename(widgetType));
        if (this.fm.isFileStoredIniCloud(path)) await this.fm.downloadFileFromiCloud(path);
        return this.fm.fileExists(path);
    }
}

// cached tile loading and version determination
class TileLoader {
    constructor(cache) {
        this.cache = cache;

        // determine server (there are four to choose from, let's evenly pull
        // from 'em all)
        this.server = Math.floor(Math.random() * 4);

        // current version at the time of implementation (would love to
        // determine the now-current version here, but async calls in a
        // constructor are fraught)
        this.version = fallbackVersion;
    }

    // determine current version either from cache, or from web, or use default
    async determineCurrentVersion() {

        // try to read it from cache first
        const cachedVersion = await cache.readVersion();
        const daysSinceVersionDetermined = await cache.daysSinceVersionDetermined();
        if (cachedVersion && daysSinceVersionDetermined < 7) {
            this.version = cachedVersion;
        } else {

            // if it's not in there (or older than a week), try extracting it
            // from the Google Maps API
            try {
                const req = await new Request("https://maps.googleapis.com/maps/api/js");
                const code = await req.loadString();
                const found = code.match(/khms0\.googleapis\.com\/kh\?v=([0-9]+)/);
                const version = parseInt(found[1]);
                if (version && version > 900) {
                    this.version = version;
                    this.cache.writeVersion(version);
                }
            } catch (error) {
                // if everything else has failed, use the default (or the old
                // cached version if we came here because that was older than a
                // week but the update didn't work)
            }
        }
    }

    url(tileCoords) {
        return `https://khms${this.server}.google.com/kh/v=${this.version}?x=${tileCoords.x}&y=${tileCoords.y}&z=${tileCoords.z}`;
    }

    // download map tile for the given coordinates at the associated zoom level
    // and, if successful, write to cache
    async download(tileCoords) {
        const req = await new Request(this.url(tileCoords));

        // load image, throwing an error on anything but success and "not found"
        const tileData = await req.load();
        const status = req.response.statusCode;
        if (status != 200 && status != 404) {
            const response = tileData.toRawString();
            throw `unexpected status code ${status}, response: ${response}`;
        }

        // cache original jpeg data (if the image object was cached instead,
        // it'd be roughly 10x larger since it'd be stored as a png (or
        // alternatively, lossily reencoded))
        this.cache.writeTile(tileCoords, this.version, tileData);

        // return tile as image object
        const tile = Image.fromData(tileData);
        return tile;
    }

    // load map tile for the given coordinates at the associated zoom level from
    // cache or, on a cache miss, from the web
    async load(tileCoords) {
        const tile = await cache.readTile(tileCoords, this.version);
        if (!tile) {
            return this.download(tileCoords);
        }
        return tile;
    }
}

// x and y offset of the point to be rendered in the widget, normalized to [0,1]
class PointOffset {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

////////////////////////////////////////////////////////////////////////////////

// depending on the widget family, set width and height as the number of tiles
// shown in each dimension (defaults are for small widget or preview in app)
let widgetType = "small";
let horizontalTiles = 2;
let verticalTiles = 2;
if (config.widgetFamily == "medium") {
    widgetType = config.widgetFamily;
    horizontalTiles = 4;
} else if (config.widgetFamily == "large") {
    widgetType = config.widgetFamily;
    horizontalTiles = 4;
    verticalTiles = 4;
}

// set up caching and tile loading machinery
let cache = new Cache(cacheLocation, "location-location-location-cache");
await cache.purgeTilesOlderThanDays(cacheDuration);

//await cache.consoleLogCacheStats();

let tileLoader = new TileLoader(cache);
await tileLoader.determineCurrentVersion();

// download low-resolution world map if not already cached
let worldMapAlreadyCached = await cache.worldMapAlreadyCached(widgetType);
if (!worldMapAlreadyCached) {
    try {
        let ctx = new DrawContext();
        ctx.size = new Size(horizontalTiles * 256, verticalTiles * 256);
        const xCoords = Array.from({length: horizontalTiles}, (_, i) => i);
        const yCoords = Array.from({length: verticalTiles}, (_, i) => i);
        for (x of xCoords) {
            for (y of yCoords) {
                let tileCoordsX = x;
                if (widgetType == "medium") {

                    // for the wide widget, the world map is shown twice next to
                    // each other – it's prettier if the main one is centered
                    // and the second one is half-on-the-left, half-on-the-right
                    tileCoordsX = (x + 1) % 2;
                }

                const tileCoords = new TileCoords(tileCoordsX, y, verticalTiles / 2);
                const tileImage = await tileLoader.download(tileCoords);
                ctx.drawImageInRect(tileImage, new Rect(x * 256, y * 256, 256, 256));
            }
        }
        const worldMap = ctx.getImage();
        cache.writeWorldMap(widgetType, worldMap);
    } catch (error) {
        throw "couldn't download low-resolution world map (it's indended to be shown when offline)"
    }
}

// determine location, read it from cache if the os doesn't provide it for some
// reason (which happens semi-frequently on my phone - it either throws an
// exception or returns an empty object, hence the code "manually" converting an
// empty object into an exception so it can handle both cases at once)
let location = null;
let locationFromCache = false;
try {
    location = await Location.current();
    if (!location || Object.keys(location).length == 0) {
        throw "couldn't retrieve location or location is an empty object";
    }
} catch (error) {
    location = await cache.readLocation();
    locationFromCache = true;
}
if (!location || Object.keys(location).length == 0) {
    throw "could not retrieve location, neither from the operating system nor from the cache";
}
if (!locationFromCache) {
    cache.writeLocation(location);
}

// extract relevant bits from location
const geoPoint = new GeoPoint(location.latitude, location.longitude);
const accuracy = location.horizontalAccuracy;
const altitude = location.altitude;

// could reverse geocode, but eh (docs: https://developer.apple.com/documentation/corelocation/clplacemark)
//const locationInfos = await Location.reverseGeocode(geoPoint.lat, geoPoint.lon);

// determine ideal initial zoom level such that the "inaccuracy circle" doesn't
// cover more than half the 512-or-1024-pixel-height picture (i.e. its radius is
// no more than a quarter) or the minimum-height-shown option is satisfied
let zoom = 20;
while (accuracy / geoPoint.metersPerPixelAt(zoom) > verticalTiles * 256 / 4 || minimumHeightShown > geoPoint.metersPerPixelAt(zoom) * verticalTiles * 256) {
    zoom--;
}

// set up retrying (since imagery might not be available at the tightest zoom
// levels)
let tiles = pointOffset = null;
let mapLoadingSuccessful = false;
while (zoom > 8) {

    // convert latitude and longitude to map tile coordinates
    const projected = geoPoint.webMercatorProjectAt(zoom);
    const tileCoords = projected.tileCoords;

    // determine ideal position of tile that contains the point in a 2x2 grid
    // such that the point ends up closest to the center, like this:
    // 0 1
    // 2 3
    // (e.g. if the point is at [20%, 20%], the tile should end up in the
    // bottom right position, i.e. position 3)
    let tilePosition = [1 - Math.round(projected.xRemainder), 1 - Math.round(projected.yRemainder)];

    // adjust that for the actual grid size (which is guaranteed to be even)
    tilePosition[0] += (horizontalTiles - 2) / 2;
    tilePosition[1] += (verticalTiles - 2) / 2;

    // generate list of possible (i.e. fits into widget) x and y coordinates
    // relative to the point-containing tile's position, i.e.
    // -(horizontalTiles-1)..0..horizontalTiles-1 (and analogous vertically)
    const relativeXCoords = Array.from({length: 2 * (horizontalTiles - 1) + 1}, (_, i) => i - (horizontalTiles - 1));
    const relativeYCoords = Array.from({length: 2 * (verticalTiles - 1) + 1}, (_, i) => i - (verticalTiles - 1));
    const potentiallyVisibleRelativeTileCoords = relativeYCoords.map(y => relativeXCoords.map(x => [x, y])).flat();

    // constrain this list to the tiles that are actually going to be visible in
    // the widget, i.e. the ones where adding the point-containing tile position
    // yields a value in 0..horizontalTiles-1 (or 0..verticalTiles-1
    // respectively)
    const visibleRelativeTileCoords = potentiallyVisibleRelativeTileCoords.filter(c => c[0] + tilePosition[0] >= 0 && c[0] + tilePosition[0] < horizontalTiles && c[1] + tilePosition[1] >= 0 && c[1] + tilePosition[1] < verticalTiles);

    // turn these "relative" tile coordinates into absolute ones – this'll be
    // the grid of tiles we'll need to load and render
    let gridTileCoords = visibleRelativeTileCoords.map(c => new TileCoords(tileCoords.x + c[0], tileCoords.y + c[1], zoom));

    // determine the relative position of the point on the canvas
    pointOffset = new PointOffset((projected.xRemainder + tilePosition[0]) / horizontalTiles, (projected.yRemainder + tilePosition[1]) / verticalTiles);

    // finally, before actually loading 'em, reset the list of tiles
    tiles = [];

    // try loading the map tiles (can make this faster with promise.all, but eh)
    try {
        for (coords of gridTileCoords) {
            let tile = await tileLoader.load(coords);
            tiles.push(tile);
        }

        // break out of the loop if all tiles have loaded successfully
        mapLoadingSuccessful = true;
        break;
    } catch (error) {

        // retry!
        zoom--;
        //throw error;
    }
}

// initialize canvas
let ctx = new DrawContext();
ctx.size = new Size(horizontalTiles * 256, verticalTiles * 256);

if (mapLoadingSuccessful) {

    // draw map tiles in the correct arrangement
    tiles.forEach((tileImage, i) => {

        // important for both "divisors" to be horizontalTiles here
        let x = i % horizontalTiles;
        let y = Math.floor(i / horizontalTiles);

        ctx.drawImageInRect(tileImage, new Rect(x * 256, y * 256, 256, 256));
        //ctx.drawImageAtPoint(tileImage, new Point(x * 256, y * 256));
    });
} else {

    // try to draw previously cached world map as a last resort (which should
    // occur very rarely – when completely offline, the operating system likely
    // won't return a location, so a cached location & map would be shown in
    // most cases) or, failing that, give up
    try {
        const worldMap = await cache.readWorldMap(widgetType);
        ctx.drawImageInRect(worldMap, new Rect(0, 0, horizontalTiles * 256, verticalTiles * 256));

        const remainders = geoPoint.webMercatorProjectAt(0);
        if (widgetType == "medium") {

            // here, the world map is drawn in the middle of the 2:1 aspect
            // ratio widget, so need to move the location accordingly
            pointOffset = new PointOffset(0.25 + remainders.xRemainder / 2, remainders.yRemainder);
        } else {
            pointOffset = new PointOffset(remainders.xRemainder, remainders.yRemainder);
        }
    } catch (error) {
        throw "couldn't retrieve any imagery at anything close to the ideal zoom levels, maybe you're offline; also couldn't load low-resolution world map from cache. i tried.";
    }
}

// draw correctly-sized position indicator, potentially in grayscale to
// indicate a cached location
if (indicatePosition) {
    const uncertaintyAreaRadius = accuracy / geoPoint.metersPerPixelAt(zoom);
    const positionIndicatorRadius = 14;

    // only draw the uncertainty area if it's significantly larger than the
    // position indicator (and don't draw it if showing a world map because
    // that'd require recomputation and it'd be smaller than the position
    // indicator anyway)
    if (uncertaintyAreaRadius > 1.5 * positionIndicatorRadius && mapLoadingSuccessful) {
        const uncertaintyAreaBounds = new Rect(pointOffset.x * (horizontalTiles * 256) - uncertaintyAreaRadius, pointOffset.y * (verticalTiles * 256) - uncertaintyAreaRadius, 2 * uncertaintyAreaRadius, 2 * uncertaintyAreaRadius);
        ctx.setStrokeColor(new Color(locationFromCache ? "#ddd" : "#aabbff", 0.5));
        ctx.setLineWidth(2);
        ctx.strokeEllipse(uncertaintyAreaBounds);
        ctx.setFillColor(new Color(locationFromCache ? "#bbb" : "#8899ff", 0.3));
        ctx.fillEllipse(uncertaintyAreaBounds);
    }

    const positionIndicatorBounds = new Rect(pointOffset.x * (horizontalTiles * 256) - positionIndicatorRadius, pointOffset.y * (verticalTiles * 256) - positionIndicatorRadius, 2 * positionIndicatorRadius, 2 * positionIndicatorRadius);
    ctx.setStrokeColor(new Color(locationFromCache ? "#eee" : "#eeeeff", 1));
    ctx.setLineWidth(8);
    ctx.strokeEllipse(positionIndicatorBounds);
    ctx.setFillColor(new Color(locationFromCache ? "#555" : "#5566cc", 1));
    ctx.fillEllipse(positionIndicatorBounds);
}

// "export" image
const backgroundImage = ctx.getImage();

// render it as part of a widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#111");
widget.backgroundImage = backgroundImage;
widget.url = geoPoint.googleMapsUrlAt(widgetType == "large" ? (zoom - 2) : (zoom - 1));

// if the location is in the upper half of the widget, show text at the bottom
if (pointOffset.y < 0.5) {
    widget.addSpacer();
}

let stack = widget.addStack();

// fix text shadow (if this wasn't done, it would be cut off at the edges of the
// stack)
widget.setPadding(0, 0, 0, 0);
stack.setPadding(12, 14, 12, 14);

// render text
let fontSize = widgetType == "large" ? 16 : 12;
if (showCoordinates) {
    let text = stack.addText(geoPoint.pretty());
    text.textColor = new Color("#eee");
    text.shadowRadius = 10;
    text.font = new Font("DINAlternate-Bold", fontSize);
}
stack.addSpacer();
if (showAltitude) {
    let text = stack.addText(` ${Math.round(altitude)}m`);
    text.textColor = new Color("#eee");
    text.shadowRadius = 10;
    text.font = new Font("DINAlternate-Bold", fontSize);
}

// if the location is in the lower half of the widget, show text at the top
if (pointOffset.y > 0.5) {
    widget.addSpacer();
} else {
    stack.bottomAlignContent();
}

// don't refresh for the next n minutes (mainly to go easy on the Google Maps
// servers and the user's cellular plan, but it's also just not necessary) –
// halve this interval if the location was from the cache or the world map has
// been shown (since in either case, nothing was loaded from google's servers
// and the result isn't very useful)
let adjustedUpdateInterval = updateInterval;
if (locationFromCache || !mapLoadingSuccessful) {
    adjustedUpdateInterval /= 2;
}
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * adjustedUpdateInterval);

// set or preview widget
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentSmall();
}

Script.complete();
