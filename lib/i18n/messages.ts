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
  "nav.board": "← Board",

  "wall.title": "Wall of supporters",
  "wall.subtitle": "Verified airdrops, ranked. Thank you.",
  "wall.loading": "Loading the wall…",
  "wall.error": "Could not load the wall.",
  "wall.emptyTitle": "No verified airdrops yet",
  "wall.emptyBody": "Once airdrops are verified, top supporters show up here.",
  "wall.sent": "sent",
  "wall.anonOne": "+ 1 anonymous supporter sent {qty} more.",
  "wall.anonMany": "+ {count} anonymous supporters sent {qty} more.",

  "mine.title": "My airdrops",
  "mine.subtitle": "What you've sent and where it stands.",
  "mine.deviceOnly": "These are saved on this device only.",
  "mine.deviceOnlyBody":
    "Sign in with Google to keep your airdrops across devices. No personal details are shown publicly unless you choose to appear on the wall.",
  "mine.signIn": "Sign in with Google",
  "mine.redirecting": "Redirecting…",
  "mine.loading": "Loading your airdrops…",
  "mine.error": "Could not load your airdrops.",
  "mine.emptyTitle": "No airdrops yet",
  "mine.emptyBody": "When you send supplies, they'll show up here with their status.",
  "mine.via": "via {platform}",
  "mine.confirmed": "confirmed {time}",
  "mine.shareCard": "Share card 🪂",
  "mine.preparing": "Preparing…",

  "status.pending": "Awaiting check",
  "status.verified": "Verified",
  "status.rejected": "Not accepted",
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
  "nav.board": "← बोर्ड",

  "wall.title": "समर्थकों की दीवार",
  "wall.subtitle": "सत्यापित एयरड्रॉप, क्रम में। धन्यवाद।",
  "wall.loading": "दीवार लोड हो रही है…",
  "wall.error": "दीवार लोड नहीं हो सकी।",
  "wall.emptyTitle": "अभी तक कोई सत्यापित एयरड्रॉप नहीं",
  "wall.emptyBody": "एयरड्रॉप सत्यापित होते ही, शीर्ष समर्थक यहाँ दिखेंगे।",
  "wall.sent": "भेजा",
  "wall.anonOne": "+ 1 गुमनाम समर्थक ने {qty} और भेजा।",
  "wall.anonMany": "+ {count} गुमनाम समर्थकों ने {qty} और भेजा।",

  "mine.title": "मेरे एयरड्रॉप",
  "mine.subtitle": "आपने क्या भेजा और उसकी स्थिति क्या है।",
  "mine.deviceOnly": "ये सिर्फ़ इसी डिवाइस पर सहेजे गए हैं।",
  "mine.deviceOnlyBody":
    "अपने एयरड्रॉप सभी डिवाइस पर रखने के लिए Google से साइन इन करें। जब तक आप दीवार पर दिखना न चुनें, कोई निजी जानकारी सार्वजनिक नहीं दिखाई जाती।",
  "mine.signIn": "Google से साइन इन करें",
  "mine.redirecting": "रीडायरेक्ट कर रहे हैं…",
  "mine.loading": "आपके एयरड्रॉप लोड हो रहे हैं…",
  "mine.error": "आपके एयरड्रॉप लोड नहीं हो सके।",
  "mine.emptyTitle": "अभी तक कोई एयरड्रॉप नहीं",
  "mine.emptyBody": "जब आप सामान भेजेंगे, वे यहाँ उनकी स्थिति के साथ दिखेंगे।",
  "mine.via": "{platform} के ज़रिए",
  "mine.confirmed": "{time} पुष्टि हुई",
  "mine.shareCard": "कार्ड शेयर करें 🪂",
  "mine.preparing": "तैयार हो रहा है…",

  "status.pending": "जाँच बाकी",
  "status.verified": "सत्यापित",
  "status.rejected": "स्वीकार नहीं हुआ",
};

export const messages: Readonly<Record<Locale, Record<MessageKey, string>>> = {
  en,
  hi,
};
