# read-statistics

*Scriptable widget that displays your ReAD statistics for the day.*

**Huh?**
Back in 2013, dissatisfied with existing read-it-later services, I've built [ReAD](https://github.com/doersino/ReAD) – having implemented a bunch of ancillary functionality over the years, I still use it every day. This widget uses ReAD's API to display basic statistics about the day's reading activities. As far as I'm aware, the only user of ReAD is yours truly, so this widget probably isn't for you.

![](demo.jpg)

<sup>(Yes, as of mid-2021, I still use an iPhone 7. Works just fine, although the battery's getting a bit weak.)</sup>


**Any setup required?**
Barely more than for any other Scriptable widget! Download `read-statistics.js` and place it in the "Scriptable" directory in your iCloud Drive (or copy the source code into a new Scriptable script). Run it once and enter your API credentials in the dialog that should've popped up. Then, back on your homescreen, [go into jiggle mode](https://www.youtube.com/watch?v=pAOjDXdiUzM) and create a new Scriptable widget of your preferred size (although I've designed this widget for the 2×2 size only). Tap it to assign the relevant script to it, then wait a second for it to complete its first update.

**Where's the configuration file?**
Scriptable [exposes](https://docs.scriptable.app/filemanager/#-librarydirectory) a library directory – it's not accessible via the Files app, nor is it synced in any way, I believe. That seemed like a sensible place to store the JSON object with the two configuration options. And that's also why there's an option to delete the configuration file though the script – there's seemingly no other way of getting to it.
