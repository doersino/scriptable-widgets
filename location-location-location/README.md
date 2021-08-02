# location-location-location

*Scriptable widget that shows your current location using satellite imagery from Google Maps.*

**Why?**
Before discovering [Scriptable](https://scriptable.app), I [had been using](https://twitter.com/doersino/status/1419752656273281037) the Apple Maps widget on my homescreen – but once I acquired a commute, its ML circuitry activated and cluttered the widget with incorrect and mistimed route estimates. What's more, I much prefer aerial imagery over a standard map view, which has led me to [develop](https://github.com/doersino/scriptable-widgets/tree/main/aerialbot-lite) a [number](https://github.com/doersino/aerialbot) of [projects](https://github.com/doersino/gomati) that [utilize](https://github.com/doersino/google-maps-at-88-mph) this [imagery](https://github.com/doersino/earthacrosstime) in various ways.


**Show me!**
Sure thing – here's a doctored image showing many differently-configured and differently-sized instances of this widget (mostly with faked locations – I haven't traveled around the world to gather these).

![](demo.jpg)


**Any setup required?**
Not more than for any other Scriptable widget! Download `location-location-location.js` and place it in the "Scriptable" directory in your iCloud Drive (or copy the source code into a new Scriptable script). Optionally, take a look at the options near the top of the source code. Then, back on your homescreen, [go into jiggle mode](https://www.youtube.com/watch?v=pAOjDXdiUzM) and create a new Scriptable widget of your preferred size. Tap it to assign the relevant script to it, then wait a few seconds for it to complete its first update.


**How's it work?**
The best way of giving you a comprehensive overview of how this widget functions might be to guide you, at a high level, through what the code does, from top to bottom.

1. At the top of `location-location-location.js`, you can configure **various options**. Take a look (although the defaults are fairly reasonable)!
2. Skipping over the various class definitions; next, the widget size is determined. For small widgets, 2×2 map tiles (each map tile is a ~15 kilobyte, 256×256 pixel JPEG sourced from Google Maps) will be displayed, for medium widgets it's 4×2, and large widgets feature 4×4 map tiles. This distinction is required to provide **adequate image resolution for all widget kinds** while keeping data usage low. (iPhones come in different sizes, of course: For large iPhones, the resulting resolution is a tad low, and for small phones, it's a little high. It's a compromise.)
3. The **cache** is primed for operation: It'll keep map tiles around for a month in order to **minimize data usage**. It'll also be caching the most recently fetched location, just in case the operating system decides to not provide it the next time the widget it updated.
4. Since Google Maps regularly updates its imagery and [versions the map tiles](https://github.com/doersino/google-maps-at-88-mph), the script determines the *current* version and caches it for a week. If that doesn't work, it falls back to a default value.
5. If not already present in the cache, a low-resolution world map is downloaded. This will be used as a last resort if your connection is too spotty to download map tiles at any point in the future (although if you're offline, more times than not, your device will be unable to determine its location, so that's really an edge case).
6. Your **current location** is determined using the built-in facilities. If that fails for some reason (spotty connection, phone on low-power mode, etc.), a recent location from the cache is used instead. *(There's a visual difference in the end: If the location has been read from cache, the location indicator of the widget is shown in grayscale.)*
7. Based on how accurate the location estimate is, the appropriate **zoom level is determined**. (You can also configure a minimum height (in meters) of the area shown, which set to 100 meters by default.)
8. With all the relevant information known, it's time to determine which map tiles will be needed. This is a little more complicated:
    1. The script determines the coordinates of the map tile into whose area the location falls.
    2. Depending on *where within that tile* the location is, a 2×2 grid of map tiles is set up such that the location ends up as close as possible to the center. For example, if the location is in the top left of the tile, that tile will end up in the bottom right of the grid.
    3. For medium and large widgets, the grid is then padded to yield the required resolution. This is more complicated than it might seem, so I'll spare you the details.
9. If not already cached, the **map tiles are downloaded** (finally!). If the download fails, the script retries at a lower zoom level (since it's possible that high-resolution satellite imagery is not available at your location) – if it keeps failing, the previously described world map will be shown instead.
9. Using a draw context, the map tiles are composited to form a single image. The **location indicator** is drawn on top of it (usually blue, but gray if the location had to be read from the cache).
10. We're almost done! Now, the widget is put together, with the map-plus-location-indicator as the background image, the pretty-printed location and altitude as text (dynamically positioned at the top or bottom, opposite of the location indicator (you can choose to hide either one)), and the relevant Google Maps URL as the tap action.
11. The widget's **update interval** is set (this is configurable), although that's more of a guideline – the operating system has final say and may update the widget more or less frequently than is configured. Note that frequent updates (low update intervals) may consume more battery power (and more data if you're on the move in a not-yet-cached area).
12. Finally, the finished widget is displayed.


**How much data does it use?**
Assuming you're using the large widget (which features `tiles = 4×4 = 16` map tiles which weigh about `size = 15` kilobytes each), have configured it to update every `interval = 10` minutes and are moving around `active = 16` hours a day in areas for which imagery has not yet been cached, then your data usage each day is about

> `tiles` × `size` × (60 × `active`) / `interval`  
> = `16` × `15` × (60 × `18`) / `10`  
> ≈ 25.9 megabytes

which is significant if you're data-limited – but that's really an extreme case. If, instead, you mostly stay at home (`active = 3` hours), are using the small widget (`tiles = 2×2 = 4`) and have stuck with the default update schedule (`interval = 30` minutes), things look much more insignificant:

> `tiles` × `size` × (60 × `active`) / `interval`  
> = `4` × `15` × (60 × `3`) / `30`  
> ≈ 360 *kilo*bytes

Play with these variables to see which options seem appropriate for your use case. At any rate, don't hold me responsible for your cellular bill – refer to the "AS IS" bit of the [MIT License](../LICENSE).


**Also!**
Here's a few more points I'd like to mention.

* If you have **multiple instances** of this widget on your homescreen for whatever reason (mine: testing!), they’ll likely be out of sync, showing different locations if you've been moving around lately. Since the operating system determines when widgets are updated, there's nothing that can realistically be done about this.
* Regarding **privacy**: This script doesn't "phone home": It determines your current location through Scriptable's built-in `Location` API, which is a thin wrapper around the functionality provided by iOS. The map tiles are fetched directly from Google Maps without any sort of authentication – there's no way to tell whether Google will link these requests to you and construct a movement profile. There's no analytics or crash reporting built into the script (the Scriptable app itself likely does collect crash reports, I wouldn't know).
* Your operating system will **empty the cache** occasionally (that's on top of the removal of everything older than a month by the script itself) – ostensibly only when your device is running low on space, but I've had it happen during reboots, as well. As a result, actual data usage for a given month might be higher than what you'd get by multiplying the formula from above by 30ish.
* Much like my other projects built around Google Maps imagery, this widget **may or may not violate Google's terms of use**. I haven't checked. But they haven't banned my IP for downloading hundreds of map tiles during development and testing, so you're probably good as long as you don't, say, deploy this widget on thousands of company phones on your corporate network, or translate it into a native app that you sell on the App Store. What's more, I can't think of a way in which this tool competes with or keeps revenue from any of Google's products – quite the opposite, in fact, since tapping on the widget *takes you* to Google Maps.
