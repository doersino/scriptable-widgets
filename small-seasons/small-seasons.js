// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: calendar-alt;
//
// Small Seasons
// https://github.com/doersino/scriptable-widgets/tree/main/small-seasons
// - This is the code for a Scriptable widget, see https://scriptable.app.
// - It displays the name of the current small season, along with a short
//   description. This data is sourced from https://smallseasons.guide or rather
//   https://github.com/rosszurowski/small-seasons/blob/master/data/content.json
//   and is licensed under the MIT License, © 2018 Ross Zurowski.
// - The background image "small-seasons-background.png" must be located next to
//   this script and was taken from a woodblock print included in volume 10,
//   issue 5 of "Bungei Kurabu", published in Meiji 37 (1904) and downloaded
//   from the Mokuhankan Collection (& licensed under the CC BY-NC License):
//   https://mokuhankan.com/collection/index.php?id_for_display=00038-004
// - Licensed under the MIT License.

// data, source see above
const data = {
  "sekki": [
    {
      "id": "risshun",
      "kanji": "立春",
      "romanji": "Risshun",
      "title": "Start of spring",
      "startDate": "02-04",
      "notes": "Ground thaws, fish appear under ice.",
      "description": "First hints of an approaching spring. The ground begins to thaw, fish appear in their icy ponds and the bush warblers start singing in the mountains.",
      "season": "spring"
    },
    {
      "id": "usui",
      "kanji": "雨水",
      "romanji": "Usui",
      "title": "Rain waters",
      "startDate": "02-18",
      "notes": "Snow recedes, mist lingers in the air.",
      "description": "Snow recedes, mist lingers in the air, and the grasses begin to sprout. Trees release their first buds as the ground soaks up meltwater.",
      "season": "spring"
    },
    {
      "id": "keichitsu",
      "kanji": "啓蟄",
      "romanji": "Keichitsu",
      "title": "Going-out of the worms",
      "startDate": "03-06",
      "notes": "Bugs surface from hibernation.",
      "description": "That time of year when the first bugs surface from their hibernation. Caterpillars start their transformation to butterflies.",
      "season": "spring"
    },
    {
      "id": "shunbun",
      "kanji": "春分",
      "romanji": "Shunbun",
      "title": "Vernal equinox",
      "startDate": "03-21",
      "notes": "Sparrows start to nest, cherry blossoms bloom.",
      "description": "When winter is gone and spring starts. Sparrows begin to nest in the trees. Cherry blossoms start to bloom. Heavy rains bring distant thunder.",
      "season": "spring"
    },
    {
      "id": "seimei",
      "kanji": "清明",
      "romanji": "Seimei",
      "title": "Clear and bright",
      "startDate": "04-04",
      "notes": "Geese fly north, the first rainbows of the year appear.",
      "description": "Shortly after the equinox, when the swallows return home and the geese fly north. The first rainbows of the season appear.",
      "season": "spring"
    },
    {
      "id": "koku",
      "kanji": "穀雨",
      "romanji": "Kokū",
      "title": "Rain for harvests",
      "startDate": "04-21",
      "notes": "Reeds sprout by rivers, rice seedlings grow.",
      "description": "Reeds sprout by the rivers and rice seedlings grow in the fields after the last frost has passed. Peonies bloom in the wilderness.",
      "season": "spring"
    },
    {
      "id": "rikka",
      "kanji": "立夏",
      "romanji": "Rikka",
      "title": "Start of summer",
      "startDate": "05-06",
      "notes": "Birds and frogs start the songs of summer.",
      "description": "The songs of summer begin. Frogs start their singing, and birds chirp in the forests. Worms surface from underground, bamboo shoots begin to sprout.",
      "season": "summer"
    },
    {
      "id": "shoman",
      "kanji": "小満",
      "romanji": "Shōman",
      "title": "Small blooming",
      "startDate": "05-21",
      "notes": "Flowers and plants bloom, wheat ripens.",
      "description": "When flowers and plants start to come out. Silkworms start feasting on mulberry leaves, and the safflower workers start their picking. Wheat begins to ripen.",
      "season": "summer"
    },
    {
      "id": "boshu",
      "kanji": "芒種",
      "romanji": "Bōshu",
      "title": "Seeds and cereals",
      "startDate": "06-05",
      "notes": "Praying mantises hatch, fireflies come out. Time to seed the soil.",
      "description": "The time of year when people start to seed the soil. Praying mantises hatch. Rotten grass become home to fireflies. The plums become more yellow.",
      "season": "summer"
    },
    {
      "id": "geshi",
      "kanji": "夏至",
      "romanji": "Geshi",
      "title": "Reaching summer",
      "startDate": "06-21",
      "notes": "Longest days of the year, irises bloom.",
      "description": "The longest days of the year. The sun reaches its highest point, accompanied by mist and rains. A sweet woodsy dryness hangs in the air. Irises bloom and crow-dippers start to sprout.",
      "season": "summer"
    },
    {
      "id": "shousho",
      "kanji": "小暑",
      "romanji": "Shōsho",
      "title": "Small heat",
      "startDate": "07-07",
      "notes": "Warm winds blow, young hawks learn to fly.",
      "description": "The summer heat begins. Warm winds blow, lotus' blossom, and young hawks are learning to fly.",
      "season": "summer"
    },
    {
      "id": "taisho",
      "kanji": "大暑",
      "romanji": "Taisho",
      "title": "Big heat",
      "startDate": "07-23",
      "notes": "Summer heat at its strongest, accompanied by great rains.",
      "description": "Summer heat is at its strongest, followed by great rains. The air is thick and humid and the trees are busy making seeds.",
      "season": "summer"
    },
    {
      "id": "risshu",
      "kanji": "立秋",
      "romanji": "Risshu",
      "title": "Start of autumn",
      "startDate": "08-08",
      "notes": "Cooler winds blow, thick fogs roll through hills.",
      "description": "The first signs of autumn can be seen. Cooler winds blow, and thick fogs roll through the hills in the morning.",
      "season": "autumn"
    },
    {
      "id": "shosho",
      "kanji": "処暑",
      "romanji": "Shosho",
      "title": "Lessening heat",
      "startDate": "08-23",
      "notes": "Rice has ripened, the heat of summer, forgotten.",
      "description": "The heat of summer has been forgotten. The rice has ripened and cotton flowers are in bloom.",
      "season": "autumn"
    },
    {
      "id": "hakuro",
      "kanji": "白露",
      "romanji": "Hakuro",
      "title": "White dew",
      "startDate": "09-07",
      "notes": "Drops of dew on grass.",
      "description": "When drops of dew can be seen on the grass. Swallows leave for the year, and the wagtails sing.",
      "season": "autumn"
    },
    {
      "id": "shubun",
      "kanji": "秋分",
      "romanji": "Shubun",
      "title": "Autumnal equinox",
      "startDate": "09-23",
      "notes": "Day and night are of equal length.",
      "description": "Day and night are of equal length. Farmers drain their fields and insects hide underground.",
      "season": "autumn"
    },
    {
      "id": "kanro",
      "kanji": "寒露",
      "romanji": "Kanro",
      "title": "Cold dew",
      "startDate": "10-08",
      "notes": "Temperatures begin to drop, crickets stop chirping.",
      "description": "Temperatures begin dropping. The geese return for the winter. Crickets chirp for the last time in the year.",
      "season": "autumn"
    },
    {
      "id": "soko",
      "kanji": "霜降",
      "romanji": "Sōkō",
      "title": "Frosting",
      "startDate": "10-23",
      "notes": "The first frosts, maple leaves turn yellow.",
      "description": "The first frosts. Rains disappear as the maple leaves and ivy turn yellow.",
      "season": "autumn"
    },
    {
      "id": "ritto",
      "kanji": "立冬",
      "romanji": "Ritto",
      "title": "Start of winter",
      "startDate": "11-08",
      "notes": "The ground starts to freeze.",
      "description": "When the winter season starts. Land begins to freeze, rivers and streams shortly to follow.",
      "season": "winter"
    },
    {
      "id": "shosetsu",
      "kanji": "小雪",
      "romanji": "Shōsetsu",
      "title": "Small snow",
      "startDate": "11-23",
      "notes": "Light snow, the last leaves have fallen from trees.",
      "description": "Light snowfall appears. Northern winds have blown the last leaves from the trees.",
      "season": "winter"
    },
    {
      "id": "taisetsu",
      "kanji": "大雪",
      "romanji": "Taisetsu",
      "title": "Big snow",
      "startDate": "12-08",
      "notes": "Cold sets in, bears hibernate.",
      "description": "The cold sets in. Bears are hibernating in their dens, and the salmon have swam upstream. Nature is quiet.",
      "season": "winter"
    },
    {
      "id": "toji",
      "kanji": "冬至",
      "romanji": "Tōji",
      "title": "Winter solstice",
      "startDate": "12-22",
      "notes": "Shortest days of the year.",
      "description": "When days are the shortest in the whole year. Deer in the mountains shed their antlers, and wheat sprouts rest underneath the snow.",
      "season": "winter"
    },
    {
      "id": "shokan",
      "kanji": "小寒",
      "romanji": "Shōkan",
      "title": "Small cold",
      "startDate": "01-06",
      "notes": "Temperatures quickly drop.",
      "description": "Winter chills start as the temperature quickly drops. Pheasant calls can be heard in the forest",
      "season": "winter"
    },
    {
      "id": "daikan",
      "kanji": "大寒",
      "romanji": "Daikan",
      "title": "Big cold",
      "startDate": "01-20",
      "notes": "Ice thickens on the streams, hens huddle together.",
      "description": "Temperatures drop low and the chill deepens. Ice thickens on the streams. Hens huddle together and begin laying eggs.",
      "season": "winter"
    }
  ]
};

// determine current sekki really inelegantly
const currentDate = new Date();
//currentDate = new Date("30 Dec 2021 15:00:00 GMT");  // test, should be 冬至
//currentDate = new Date("02 Jan 2022 15:00:00 GMT");  // test, should be 冬至
//currentDate = new Date("06 Jan 2022 15:00:00 GMT");  // test, should be 小寒
//currentDate = new Date("20 Jan 2022 15:00:00 GMT");  // test, should be 大寒
//currentDate = new Date("1 Feb 2022 15:00:00 GMT");   // test, should be 大寒
//currentDate = new Date("4 Feb 2022 15:00:00 GMT");   // test, should be 立春

let lookupMonth = currentDate.getMonth() + 1;  // 0-indexed, hence + 1
let lookupDay = currentDate.getDate();         // 1-indexed

let sekkiDay, sekkiMonth;
let sekki = null;

while (!sekki) {

  // check if the date matches any of the entries
  for (let i = 0; i < data["sekki"].length; i++) {
    [sekkiMonth, sekkiDay] = data["sekki"][i].startDate.split("-").map(n => parseInt(n));

    // if so, dial in the match and break out of the loop
    if (lookupDay == sekkiDay && lookupMonth == sekkiMonth) {
      sekki = data["sekki"][i];
      break;
    }
  }

  // if no match was found, decrement date (semi-correctly across month [there's
  // no 31st february, for example, but that won't impact the result; it'll just
  // burn cycles] and year boundaries) and retry
  lookupDay -= 1;
  if (lookupDay == 0) {
    lookupDay = 31;
    lookupMonth -= 1;
  }
  if (lookupMonth == 0) {
    lookupDay = 31;
    lookupMonth = 12;
  }
}

// load background image
const fileManager = FileManager.iCloud();
const backgroundImagePath = fileManager.joinPath(fileManager.documentsDirectory(), "small-seasons-background.png");
await fileManager.downloadFileFromiCloud(backgroundImagePath);
const backgroundImage = Image.fromFile(backgroundImagePath);

// define widget
let widget = new ListWidget();
widget.backgroundColor = new Color("#ddd3c4");
widget.backgroundImage = backgroundImage;
widget.url = "https://smallseasons.guide";

// account for the top and bottom padding that's part of the text
widget.setPadding(11, 16, 15, 16);

// add text
let kanji = widget.addText(sekki["kanji"]);
kanji.textColor = new Color("#000");
kanji.textOpacity = 0.4;
kanji.font = Font.thinSystemFont(37);
kanji.centerAlignText();

let meaning = widget.addText(sekki["title"].toUpperCase());
meaning.textColor = new Color("#000");
meaning.textOpacity = 0.5;
meaning.font = Font.mediumSystemFont(9);
meaning.centerAlignText();

widget.addSpacer();

let text = widget.addText(sekki["notes"]);
text.textColor = new Color("#000");
text.textOpacity = 0.9;
//text.font = new Font("Palatino-Roman", 12)
text.font = Font.mediumSystemFont(11);

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
