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
  "aria.chooseSite": "Choose a site",
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
  "mine.deleteTitle": "Delete my account & data",
  "mine.deleteBody":
    "Removes your account, your airdrop history and any proof screenshots. This can't be undone.",
  "mine.deleteButton": "Delete everything",
  "mine.deleteConfirm": "Tap again to confirm — this is permanent",
  "mine.deleting": "Deleting…",
  "mine.deleteError": "Could not delete. Please try again.",

  "status.pending": "Awaiting check",
  "status.verified": "Verified",
  "status.rejected": "Not accepted",
  "status.disputed": "Problem flagged",

  "contribute.sending": "You are sending",
  "contribute.close": "Close",
  "contribute.howMany": "How many? ({count} still needed)",
  "contribute.whereToSend": "Where to send",
  "contribute.fieldDropPoint": "Drop point",
  "contribute.fieldAddress": "Address",
  "contribute.fieldRecipient": "Recipient",
  "contribute.fieldPhone": "Phone",
  "contribute.dropHidden": "Drop point hidden",
  "contribute.noDropYet": "No drop point yet",
  "contribute.hiddenBody":
    "The address and volunteer contact are only shown to signed-in supporters. This keeps volunteers safe.",
  "contribute.noDropBody":
    "A volunteer hasn't published a drop point for this site yet.",
  "contribute.revealing": "Revealing…",
  "contribute.revealCta": "Reveal drop point",
  "contribute.revealHint": "One tap, no personal details needed.",
  "contribute.howItWorks": "How it works",
  "contribute.step1": "Copy the drop address",
  "contribute.step2": "Order it in your delivery app",
  "contribute.step3": "Come back and confirm",
  "contribute.moneyNote":
    "Delivery apps cannot be handed an address by us, so you paste it in yourself. We never take your money — you pay the app directly.",
  "contribute.alreadyCounted": "Already counted — thank you",
  "contribute.counted": "Airdrop counted — thank you",
  "contribute.countedBody":
    "{count} of {item} still needed. A volunteer verifies proof before it is final.",
  "contribute.done": "Done",
  "contribute.confirmSent": "Confirm you've sent it",
  "contribute.whichApp": "Which app did you order through?",
  "contribute.otherAppAria": "Other app or shop name",
  "contribute.otherAppPlaceholder": "Other — type the app or shop (e.g. Dunzo)",
  "contribute.showName": "Show my name on the supporters wall",
  "contribute.sendingBtn": "Sending…",
  "contribute.markSent": "Mark {count} sent",
  "contribute.pendingNote":
    "This counts as pending until a volunteer verifies it.",

  "copy.copy": "Copy",
  "copy.copied": "Copied",
  "copy.copyAria": "Copy {label}",

  "qty.decrease": "Decrease quantity by {step}",
  "qty.increase": "Increase quantity by {step}",
  "qty.srLabel": "Quantity to send",
  "qty.all": "All {count}",

  "proof.hint":
    "Optional: add a screenshot of your order as proof. You'll blur any personal details before it uploads.",
  "proof.uploading": "Uploading…",
  "proof.added": "✓ Proof added — tap to replace",
  "proof.addProof": "Add proof screenshot",
  "proof.uploadFailed": "Upload failed",

  "blur.title": "Blur private details",
  "blur.aria": "Blur private details on your screenshot",
  "blur.body":
    "Drag over your name, phone and address to blur them. This happens on your phone — the clear version is never uploaded.",
  "blur.cancel": "Cancel",
  "blur.useBlurred": "Use blurred image",
  "blur.looksClean": "Looks clean — use it",

  "request.notOnList": "Not on the list?",
  "request.title": "Request an item",
  "request.sentTitle": "Sent for review",
  "request.sentBody":
    "A volunteer at the site will check this and add it to the board. New items are reviewed before they appear publicly.",
  "request.whatNeeded": "What is needed?",
  "request.namePlaceholder": "e.g. Gumboots",
  "request.alreadyBoard": "Already on the board",
  "request.viewAria": "View {item}, {count} still needed",
  "request.short": "{count} short →",
  "request.sendInstead":
    "Send one of these instead of adding a duplicate — it keeps the counts accurate.",
  "request.category": "Category",
  "request.howMany": "How many?",
  "request.unit": "Unit",
  "request.whyNeeded": "Why is it needed? (optional)",
  "request.notePlaceholder": "Helps the volunteer decide quickly",
  "request.send": "Send request",
  "request.error": "Could not send. It will retry — check your connection.",
  "request.footer":
    "Goes to a volunteer for review before it appears on the board. Never post personal details here.",
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
  "aria.chooseSite": "साइट चुनें",
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
  "mine.deleteTitle": "मेरा खाता और डेटा हटाएँ",
  "mine.deleteBody":
    "आपका खाता, एयरड्रॉप इतिहास और कोई भी प्रूफ़ स्क्रीनशॉट हटा देता है। इसे पूर्ववत नहीं किया जा सकता।",
  "mine.deleteButton": "सब कुछ हटाएँ",
  "mine.deleteConfirm": "पुष्टि के लिए फिर टैप करें — यह स्थायी है",
  "mine.deleting": "हटाया जा रहा है…",
  "mine.deleteError": "हटाया नहीं जा सका। कृपया फिर कोशिश करें।",

  "status.pending": "जाँच बाकी",
  "status.verified": "सत्यापित",
  "status.rejected": "स्वीकार नहीं हुआ",
  "status.disputed": "समस्या दर्ज हुई",

  "contribute.sending": "आप भेज रहे हैं",
  "contribute.close": "बंद करें",
  "contribute.howMany": "कितने? ({count} अभी भी चाहिए)",
  "contribute.whereToSend": "कहाँ भेजें",
  "contribute.fieldDropPoint": "ड्रॉप पॉइंट",
  "contribute.fieldAddress": "पता",
  "contribute.fieldRecipient": "पाने वाला",
  "contribute.fieldPhone": "फ़ोन",
  "contribute.dropHidden": "ड्रॉप पॉइंट छिपा है",
  "contribute.noDropYet": "अभी कोई ड्रॉप पॉइंट नहीं",
  "contribute.hiddenBody":
    "पता और वॉलंटियर का संपर्क सिर्फ़ साइन-इन समर्थकों को दिखते हैं। इससे वॉलंटियर सुरक्षित रहते हैं।",
  "contribute.noDropBody":
    "किसी वॉलंटियर ने अभी इस साइट के लिए ड्रॉप पॉइंट प्रकाशित नहीं किया है।",
  "contribute.revealing": "दिखा रहे हैं…",
  "contribute.revealCta": "ड्रॉप पॉइंट देखें",
  "contribute.revealHint": "एक टैप, कोई निजी जानकारी ज़रूरी नहीं।",
  "contribute.howItWorks": "यह कैसे काम करता है",
  "contribute.step1": "ड्रॉप का पता कॉपी करें",
  "contribute.step2": "अपने डिलीवरी ऐप में ऑर्डर करें",
  "contribute.step3": "वापस आकर पुष्टि करें",
  "contribute.moneyNote":
    "डिलीवरी ऐप को हम पता नहीं दे सकते, इसलिए आप उसे खुद पेस्ट करते हैं। हम कभी आपके पैसे नहीं लेते — आप सीधे ऐप को भुगतान करते हैं।",
  "contribute.alreadyCounted": "पहले ही गिना गया — धन्यवाद",
  "contribute.counted": "एयरड्रॉप गिना गया — धन्यवाद",
  "contribute.countedBody":
    "{item} के {count} अभी भी चाहिए। अंतिम होने से पहले एक वॉलंटियर प्रूफ़ जाँचता है।",
  "contribute.done": "हो गया",
  "contribute.confirmSent": "पुष्टि करें कि आपने भेज दिया",
  "contribute.whichApp": "आपने किस ऐप से ऑर्डर किया?",
  "contribute.otherAppAria": "अन्य ऐप या दुकान का नाम",
  "contribute.otherAppPlaceholder": "अन्य — ऐप या दुकान लिखें (जैसे Dunzo)",
  "contribute.showName": "समर्थकों की दीवार पर मेरा नाम दिखाएँ",
  "contribute.sendingBtn": "भेज रहे हैं…",
  "contribute.markSent": "{count} भेजा — दर्ज करें",
  "contribute.pendingNote":
    "जब तक कोई वॉलंटियर सत्यापित नहीं करता, यह लंबित गिना जाता है।",

  "copy.copy": "कॉपी",
  "copy.copied": "कॉपी हुआ",
  "copy.copyAria": "{label} कॉपी करें",

  "qty.decrease": "मात्रा {step} घटाएँ",
  "qty.increase": "मात्रा {step} बढ़ाएँ",
  "qty.srLabel": "भेजने की मात्रा",
  "qty.all": "सभी {count}",

  "proof.hint":
    "वैकल्पिक: प्रूफ़ के तौर पर अपने ऑर्डर का स्क्रीनशॉट जोड़ें। अपलोड से पहले आप कोई भी निजी जानकारी धुंधली करेंगे।",
  "proof.uploading": "अपलोड हो रहा है…",
  "proof.added": "✓ प्रूफ़ जोड़ा गया — बदलने के लिए टैप करें",
  "proof.addProof": "प्रूफ़ स्क्रीनशॉट जोड़ें",
  "proof.uploadFailed": "अपलोड विफल",

  "blur.title": "निजी जानकारी धुंधली करें",
  "blur.aria": "अपने स्क्रीनशॉट में निजी जानकारी धुंधली करें",
  "blur.body":
    "अपना नाम, फ़ोन और पता धुंधला करने के लिए उन पर ड्रैग करें। यह आपके फ़ोन पर होता है — साफ़ वर्शन कभी अपलोड नहीं होता।",
  "blur.cancel": "रद्द करें",
  "blur.useBlurred": "धुंधली इमेज इस्तेमाल करें",
  "blur.looksClean": "साफ़ दिख रहा है — इसे इस्तेमाल करें",

  "request.notOnList": "सूची में नहीं है?",
  "request.title": "आइटम का अनुरोध करें",
  "request.sentTitle": "समीक्षा के लिए भेजा गया",
  "request.sentBody":
    "साइट पर एक वॉलंटियर इसे जाँचकर बोर्ड में जोड़ेगा। नए आइटम सार्वजनिक होने से पहले समीक्षा किए जाते हैं।",
  "request.whatNeeded": "क्या चाहिए?",
  "request.namePlaceholder": "जैसे गमबूट",
  "request.alreadyBoard": "पहले से बोर्ड पर है",
  "request.viewAria": "{item} देखें, {count} अभी भी चाहिए",
  "request.short": "{count} कम →",
  "request.sendInstead":
    "डुप्लिकेट जोड़ने के बजाय इनमें से एक भेजें — इससे गिनती सही रहती है।",
  "request.category": "श्रेणी",
  "request.howMany": "कितने?",
  "request.unit": "इकाई",
  "request.whyNeeded": "यह क्यों चाहिए? (वैकल्पिक)",
  "request.notePlaceholder": "वॉलंटियर को जल्दी फ़ैसला लेने में मदद करता है",
  "request.send": "अनुरोध भेजें",
  "request.error": "भेज नहीं सका। यह फिर कोशिश करेगा — अपना कनेक्शन जाँचें।",
  "request.footer":
    "बोर्ड पर दिखने से पहले यह समीक्षा के लिए वॉलंटियर के पास जाता है। यहाँ कभी निजी जानकारी न डालें।",
};

export const messages: Readonly<Record<Locale, Record<MessageKey, string>>> = {
  en,
  hi,
};
