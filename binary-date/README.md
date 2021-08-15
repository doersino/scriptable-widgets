# binary-date

*Scriptable widget that displays the current date in binary.*

**Why?**
I thought something like this would be neat.

**Explain!** There are four pieces of data shown: In the first row, an indicator whether it's a weekday (bright) or weekend (dim), along with the day (which just about fits into 5 bits) and the month (4 bits). The second row contains the year as a 12-bit binary number, which I'm well aware is going to break at the end of 4095, but I doubt anyone's going to be using iOS widgets then. In the background, some stars.

![](demo.jpg)
<sup>Come to think of it, the widget should really just display the [stardate](https://en.wikipedia.org/wiki/Stardate) instead of [these binary shenanigans](https://memory-alpha.fandom.com/wiki/11001001_(episode)).</sup>

**Any setup required?**
Not more than for any other Scriptable widget! Download `binary-date.js` and place it in the "Scriptable" directory in your iCloud Drive (or copy the source code into a new Scriptable script). Then, back on your homescreen, [go into jiggle mode](https://www.youtube.com/watch?v=pAOjDXdiUzM) and create a new Scriptable widget of your preferred size. Tap it to assign the relevant script to it, then wait a second for it to draw itself for the first time.
