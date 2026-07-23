import type { Locale } from "@/lib/i18n/config";

/**
 * The message catalog.
 *
 * `en` is the source of truth; `hi` is typed as `Record<MessageKey, string>`, so
 * a missing Hindi translation is a compile error rather than a silent English
 * fallback at runtime. Interpolation uses `{name}` placeholders (see t()).
 *
 * SAFETY (plan Rev 4, rule 4): translations stay plain and unambiguous on the
 * terms someone under pressure must not have to decode — "drop point", medical,
 * quantities. The playful brand voice lives in the wordmark, not here.
 */
const en = {
  "board.tagline": "Save the Country",
  "board.shortSummary": "{count} items short",

  "badge.live": "Live",
  "badge.offline": "Offline",

  "search.placeholder": "Search airdrops…",
  "search.aria": "Search airdrops",
  "search.clear": "Clear search",
  "search.noMatch": "No matching airdrops",
  "search.matchCount": "{count} matching items",
  "search.matchCountOne": "1 matching item",

  "aria.filterByCategory": "Filter airdrops by category",
  "aria.share": "{item} — share",
  "aria.myAirdrops": "My airdrops",
  "aria.wall": "Wall of supporters",

  "cta.contribute": "Airdrop Some 📦",
  "cta.request": "Request an airdrop",
  "cta.loadMore": "Load more ({count} left)",
  "cta.share": "Share",

  "label.stillNeeded": "Still needed",
  "meter.beingOrdered": "{count} being ordered",
  "meter.received": "{item}: {done} of {total} {unit} received",
  "meter.reservedNow": ", {count} being ordered now",
  "card.fullyCovered": "Fully covered — please send something else",
  "card.orderingNow": "{count} ordering now",
  "card.orderingNowOne": "1 ordering now",

  "board.nothingCategory": "Nothing needed in this category right now",
  "board.nothingMatches": "Nothing matches “{query}”",
  "board.requestQuoted": "Request “{query}”",

  "footer.note":
    "Airdrops are ordered by you, through your own delivery app. This board never handles money and never shows who is at the site.",

  "pulse.delivered": "{count} items delivered",
  "pulse.last24h": "{count} in the last 24h",

  "freshness.savedOnline": "Showing saved list",
  "freshness.savedOffline": "Offline — showing saved list",
  "freshness.fromTime": "from {time}",
  "freshness.willRefresh": "Will refresh automatically.",

  "category.ALL": "All",
  "category.WATER": "Water",
  "category.FOOD": "Food",
  "category.MEDICAL": "Medical",
  "category.RAIN": "Rain",
  "category.COMFORT": "Comfort",
  "category.SAFETY": "Safety",

  "aria.locale": "Change language",
} as const;

export type MessageKey = keyof typeof en;

const hi: Record<MessageKey, string> = {
  "board.tagline": "देश बचाओ",
  "board.shortSummary": "{count} चीज़ें कम हैं",

  "badge.live": "लाइव",
  "badge.offline": "ऑफ़लाइन",

  "search.placeholder": "एयरड्रॉप खोजें…",
  "search.aria": "एयरड्रॉप खोजें",
  "search.clear": "खोज साफ़ करें",
  "search.noMatch": "कोई मेल खाता एयरड्रॉप नहीं",
  "search.matchCount": "{count} मेल खाते आइटम",
  "search.matchCountOne": "1 मेल खाता आइटम",

  "aria.filterByCategory": "श्रेणी के अनुसार एयरड्रॉप छाँटें",
  "aria.share": "{item} — शेयर करें",
  "aria.myAirdrops": "मेरे एयरड्रॉप",
  "aria.wall": "समर्थकों की दीवार",

  "cta.contribute": "कुछ एयरड्रॉप करें 📦",
  "cta.request": "एयरड्रॉप का अनुरोध करें",
  "cta.loadMore": "और दिखाएँ ({count} बाकी)",
  "cta.share": "शेयर",

  "label.stillNeeded": "अभी भी चाहिए",
  "meter.beingOrdered": "{count} ऑर्डर हो रहे हैं",
  "meter.received": "{item}: {total} में से {done} {unit} मिले",
  "meter.reservedNow": ", {count} अभी ऑर्डर हो रहे हैं",
  "card.fullyCovered": "पूरा हो गया — कृपया कुछ और भेजें",
  "card.orderingNow": "{count} लोग अभी ऑर्डर कर रहे हैं",
  "card.orderingNowOne": "1 व्यक्ति अभी ऑर्डर कर रहा है",

  "board.nothingCategory": "इस श्रेणी में अभी कुछ नहीं चाहिए",
  "board.nothingMatches": "“{query}” से कुछ मेल नहीं खाता",
  "board.requestQuoted": "“{query}” का अनुरोध करें",

  "footer.note":
    "एयरड्रॉप आप खुद, अपने डिलीवरी ऐप से ऑर्डर करते हैं। यह बोर्ड कभी पैसे नहीं लेता और यह कभी नहीं दिखाता कि साइट पर कौन है।",

  "pulse.delivered": "{count} चीज़ें पहुँचाई गईं",
  "pulse.last24h": "पिछले 24 घंटे में {count}",

  "freshness.savedOnline": "सहेजी गई सूची दिखा रहे हैं",
  "freshness.savedOffline": "ऑफ़लाइन — सहेजी गई सूची दिखा रहे हैं",
  "freshness.fromTime": "{time} की",
  "freshness.willRefresh": "यह अपने आप ताज़ा हो जाएगी।",

  "category.ALL": "सभी",
  "category.WATER": "पानी",
  "category.FOOD": "खाना",
  "category.MEDICAL": "मेडिकल",
  "category.RAIN": "बारिश",
  "category.COMFORT": "आराम",
  "category.SAFETY": "सुरक्षा",

  "aria.locale": "भाषा बदलें",
};

export const messages: Readonly<Record<Locale, Record<MessageKey, string>>> = {
  en,
  hi,
};
