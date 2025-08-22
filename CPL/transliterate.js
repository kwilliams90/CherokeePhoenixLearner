// transliterate.js (classic script; no exports)
(function () {
  "use strict";

  // Cherokee ranges (including small letters in the Supplement block)
  const CHEROKEE_REGEX = /[\u13A0-\u13FF\uAB70-\uABBF]/;

  // Loose marker for translated pieces seen on CP (you mentioned “ᏓᎵᏆ”).
  const LOOSE_MARKER = /Ꮣ\s*Ꮅ\s*Ꮖ/; // allow optional stray spaces

  // Base transliteration map (broad/standard)
  const CH_MAP = {
    // vowels
    "Ꭰ":"a","Ꭱ":"e","Ꭲ":"i","Ꭳ":"o","Ꭴ":"u","Ꭵ":"v",
    // g/k
    "Ꭶ":"ga","Ꭷ":"ka","Ꭸ":"ge","Ꭹ":"gi","Ꭺ":"go","Ꭻ":"gu","Ꭼ":"gv",
    // h
    "Ꭽ":"ha","Ꭾ":"he","Ꭿ":"hi","Ꮀ":"ho","Ꮁ":"hu","Ꮂ":"hv",
    // l
    "Ꮃ":"la","Ꮄ":"le","Ꮅ":"li","Ꮆ":"lo","Ꮇ":"lu","Ꮈ":"lv",
    // m
    "Ꮉ":"ma","Ꮊ":"me","Ꮋ":"mi","Ꮌ":"mo","Ꮍ":"mu",
    // n
    "Ꮎ":"na","Ꮏ":"hna","Ꮐ":"nah","Ꮑ":"ne","Ꮒ":"ni","Ꮓ":"no","Ꮔ":"nu","Ꮕ":"nv",
    // qu-series
    "Ꮖ":"qua","Ꮗ":"que","Ꮘ":"qui","Ꮙ":"quo","Ꮚ":"quu","Ꮛ":"quv",
    // s
    "Ꮝ":"s","Ꮜ":"sa","Ꮞ":"se","Ꮟ":"si","Ꮠ":"so","Ꮡ":"su","Ꮢ":"sv",
    // d/t
    "Ꮣ":"da","Ꮤ":"ta","Ꮥ":"de","Ꮦ":"te","Ꮧ":"di","Ꮨ":"ti","Ꮩ":"do","Ꮪ":"du","Ꮫ":"dv",
    // tla/dla cluster
    "Ꮬ":"dla","Ꮭ":"tla","Ꮮ":"tle","Ꮯ":"tli","Ꮰ":"tlo","Ꮱ":"tlu","Ꮲ":"tlv",
    // ts
    "Ꮳ":"tsa","Ꮴ":"tse","Ꮵ":"tsi","Ꮶ":"tso","Ꮷ":"tsu","Ꮸ":"tsv",
    // w
    "Ꮹ":"wa","Ꮺ":"we","Ꮻ":"wi","Ꮼ":"wo","Ꮽ":"wu","Ꮾ":"wv",
    // y
    "Ꮿ":"ya","Ᏸ":"ye","Ᏹ":"yi","Ᏺ":"yo","Ᏻ":"yu","Ᏼ":"yv"
  };

  // Map small letters (AB70–ABBF) to uppercase equivalents
  const SMALL_EQUIV = {
    "\uAB70":"Ꭰ","\uAB71":"Ꭱ","\uAB72":"Ꭲ","\uAB73":"Ꭳ","\uAB74":"Ꭴ","\uAB75":"Ꭵ",
    "\uAB76":"Ꭶ","\uAB77":"Ꭷ","\uAB78":"Ꭸ","\uAB79":"Ꭹ","\uAB7A":"Ꭺ","\uAB7B":"Ꭻ","\uAB7C":"Ꭼ",
    "\uAB7D":"Ꭽ","\uAB7E":"Ꭾ","\uAB7F":"Ꭿ","\uAB80":"Ꮀ","\uAB81":"Ꮁ","\uAB82":"Ꮂ",
    "\uAB83":"Ꮃ","\uAB84":"Ꮄ","\uAB85":"Ꮅ","\uAB86":"Ꮆ","\uAB87":"Ꮇ","\uAB88":"Ꮈ",
    "\uAB89":"Ꮉ","\uAB8A":"Ꮊ","\uAB8B":"Ꮋ","\uAB8C":"Ꮌ","\uAB8D":"Ꮍ",
    "\uAB8E":"Ꮎ","\uAB8F":"Ꮏ","\uAB90":"Ꮐ","\uAB91":"Ꮑ","\uAB92":"Ꮒ","\uAB93":"Ꮓ","\uAB94":"Ꮔ","\uAB95":"Ꮕ",
    "\uAB96":"Ꮖ","\uAB97":"Ꮗ","\uAB98":"Ꮘ","\uAB99":"Ꮙ","\uAB9A":"Ꮚ","\uAB9B":"Ꮛ",
    "\uAB9C":"Ꮜ","\uAB9D":"Ꮝ","\uAB9E":"Ꮞ","\uAB9F":"Ꮟ","\uABA0":"Ꮠ","\uABA1":"Ꮡ","\uABA2":"Ꮢ",
    "\uABA3":"Ꮣ","\uABA4":"Ꮤ","\uABA5":"Ꮥ","\uABA6":"Ꮦ","\uABA7":"Ꮧ","\uABA8":"Ꮨ","\uABA9":"Ꮩ","\uABAA":"Ꮪ","\uABAB":"Ꮫ",
    "\uABAC":"Ꮬ","\uABAD":"Ꮭ","\uABAE":"Ꮮ","\uABAF":"Ꮯ","\uABB0":"Ꮰ","\uABB1":"Ꮱ","\uABB2":"Ꮲ",
    "\uABB3":"Ꮳ","\uABB4":"Ꮴ","\uABB5":"Ꮵ","\uABB6":"Ꮶ","\uABB7":"Ꮷ","\uABB8":"Ꮸ",
    "\uABB9":"Ꮹ","\uABBA":"Ꮺ","\uABBB":"Ꮻ","\uABBC":"Ꮼ","\uABBD":"Ꮽ","\uABBE":"Ꮾ",
    "\uABBF":"Ꮿ"
  };

  function normalizeSmallCherokee(str) {
    return str.replace(/[\uAB70-\uABBF]/g, ch => SMALL_EQUIV[ch] || ch);
  }

  function isCherokeeString(s) {
    return CHEROKEE_REGEX.test(s);
  }

  function pageLooksTranslated(rootEl) {
    const text = rootEl?.innerText || "";
    return LOOSE_MARKER.test(text) || CHEROKEE_REGEX.test(text);
  }

  function transliterateCherokee(input) {
    const s = normalizeSmallCherokee(input);
    let out = "";
    for (const ch of s) {
      out += CH_MAP[ch] || ch;
    }
    return out;
  }

  // Expose a single global namespace for the content script to use
  window.ckCherokee = {
    isCherokeeString,
    pageLooksTranslated,
    transliterateCherokee
  };
})();
