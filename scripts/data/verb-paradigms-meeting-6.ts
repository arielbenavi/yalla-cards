// Paradigms for the six verbs of מפגש 6's blank "המשך תרגול הטיות" table, plus
// צַ'רַבּ and שַרַח, which Ariel asked to have fully inflected (NOTES_INFLECT in
// meeting-6.ts). From chatifai, 2026-10-20, two batches of four.
//
// What was sent back and corrected by chatifai itself: past אנא/אנת of the
// second batch came back with a doubled ת (חַלַקְתֵת), and a resend returned
// the same table; a targeted follow-up gave חַלַקֵת, לְעִבֵּת, צַ'רַבֵּת,
// שַרַחֵת.
//
// One mechanical repair, not a linguistic one: in four Arabic cells chatifai's
// output had Hebrew look-alike letters in place of Arabic ones (لعبת, بتلعבي,
// إלעבي, بتحلقו). Those were mapped back letter for letter (ל→ل ע→ع ב→ب ת→ت
// ו→و). The script's validator rejects any Hebrew in an Arabic cell, so a cell
// that slipped through would fail loudly rather than reach a drill.
//
// The pointing marks U+05AB that chatifai put on בִּי֫לְעַבּ etc. were stripped.

import type { Verb } from "./verb-paradigms";

export const MEETING_6_PARADIGMS: Verb[] = [
  {
    root: "رفع", root_translit: "רַפַע", meaning_he: "הרים", binyan: "פַעַל",
    past: { ana: { translit: "רַפַעֵת", arabic: "رفعت" }, inta: { translit: "רַפַעֵת", arabic: "رفعت" }, inti: { translit: "רַפַעְתִי", arabic: "رفعتي" }, huwwe: { translit: "רַפַע", arabic: "رفع" }, hiyye: { translit: "רַפְעַת", arabic: "رفعت" }, ihna: { translit: "רַפַעְנַא", arabic: "رفعنا" }, intu: { translit: "רַפַעְתוּ", arabic: "رفعتوا" }, hum: { translit: "רַפַעוּ", arabic: "رفعوا" } },
    present: { ana: { translit: "בַּרְפַע", arabic: "برفع" }, inta: { translit: "בִּתְרְפַע", arabic: "بترفع" }, inti: { translit: "בִּתְרְפַעִי", arabic: "بترفعي" }, huwwe: { translit: "בִּרְפַע", arabic: "بيرفع" }, hiyye: { translit: "בִּתְרְפַע", arabic: "بترفع" }, ihna: { translit: "מִנְרְפַע", arabic: "منرفع" }, intu: { translit: "בִּתְרְפַעוּ", arabic: "بترفعوا" }, hum: { translit: "בִּרְפַעוּ", arabic: "بيرفعوا" } },
    imperative: { inta: { translit: "אִרְפַע", arabic: "ارفع" }, inti: { translit: "אִרְפַעִי", arabic: "ارفعي" }, intu: { translit: "אִרְפַעוּ", arabic: "ارفعوا" } },
    participle: { m: { translit: "רַאפֵע", arabic: "رافع" }, f: { translit: "רַאפְעַה", arabic: "رافعة" }, pl: { translit: "רַאפְעִין", arabic: "رافعين" } },
  },
  {
    root: "سمع", root_translit: "סִמֵע", meaning_he: "שמע", binyan: "פִעֵל",
    past: { ana: { translit: "סְמִעֵת", arabic: "سمعت" }, inta: { translit: "סְמִעֵת", arabic: "سمعت" }, inti: { translit: "סְמִעְתִי", arabic: "سمعتي" }, huwwe: { translit: "סִמֵע", arabic: "سمع" }, hiyye: { translit: "סִמְעַת", arabic: "سمعت" }, ihna: { translit: "סְמִעְנַא", arabic: "سمعنا" }, intu: { translit: "סְמִעְתוּ", arabic: "سمعتوا" }, hum: { translit: "סִמְעוּ", arabic: "سمعوا" } },
    present: { ana: { translit: "בַּסְמַע", arabic: "بسمع" }, inta: { translit: "בִּתְסְמַע", arabic: "بتسمع" }, inti: { translit: "בִּתְסְמַעִי", arabic: "بتسمعي" }, huwwe: { translit: "בִּסְמַע", arabic: "بيسمع" }, hiyye: { translit: "בִּתְסְמַע", arabic: "بتسمع" }, ihna: { translit: "מִנְסְמַע", arabic: "منسمع" }, intu: { translit: "בִּתְסְמַעוּ", arabic: "بتسمعوا" }, hum: { translit: "בִּסְמַעוּ", arabic: "بيسمعوا" } },
    imperative: { inta: { translit: "אִסְמַע", arabic: "اسمع" }, inti: { translit: "אִסְמַעִי", arabic: "اسمعي" }, intu: { translit: "אִסְמַעוּ", arabic: "اسمعوا" } },
    participle: { m: { translit: "סַאמֵע", arabic: "سامع" }, f: { translit: "סַאמְעַה", arabic: "سامعة" }, pl: { translit: "סַאמְעִין", arabic: "سامعين" } },
  },
  {
    root: "ضغط", root_translit: "צַ'עַ'ט", meaning_he: "לחץ", binyan: "פַעַל",
    past: { ana: { translit: "צַ'עַ'טֵת", arabic: "ضغطت" }, inta: { translit: "צַ'עַ'טֵת", arabic: "ضغطت" }, inti: { translit: "צַ'עַ'טְתִי", arabic: "ضغطتي" }, huwwe: { translit: "צַ'עַ'ט", arabic: "ضغط" }, hiyye: { translit: "צַ'עְ'טַת", arabic: "ضغطت" }, ihna: { translit: "צַ'עַ'טְנַא", arabic: "ضغطنا" }, intu: { translit: "צַ'עַ'טְתוּ", arabic: "ضغطتوا" }, hum: { translit: "צַ'עַ'טוּ", arabic: "ضغطوا" } },
    present: { ana: { translit: "בַּצְ'עַ'ט", arabic: "بضغط" }, inta: { translit: "בִּתְצְ'עַ'ט", arabic: "بتضغط" }, inti: { translit: "בִּתְצְ'עַ'טִי", arabic: "بتضغطي" }, huwwe: { translit: "בִּצְ'עַ'ט", arabic: "بيضغط" }, hiyye: { translit: "בִּתְצְ'עַ'ט", arabic: "بتضغط" }, ihna: { translit: "מִנְצְ'עַ'ט", arabic: "منضغط" }, intu: { translit: "בִּתְצְ'עַ'טוּ", arabic: "بتضغطوا" }, hum: { translit: "בִּצְ'עַ'טוּ", arabic: "بيضغطوا" } },
    imperative: { inta: { translit: "אִצְ'עַ'ט", arabic: "اضغط" }, inti: { translit: "אִצְ'עַ'טִי", arabic: "اضغطي" }, intu: { translit: "אִצְ'עַ'טוּ", arabic: "اضغطوا" } },
    participle: { m: { translit: "צַ'אעֵ'ט", arabic: "ضاغط" }, f: { translit: "צַ'אעְ'טַה", arabic: "ضاغطة" }, pl: { translit: "צַ'אעְ'טִין", arabic: "ضاغطين" } },
  },
  {
    root: "خلق", root_translit: "חִ'לֵק", meaning_he: "נולד", binyan: "פִעֵל",
    past: { ana: { translit: "חְ'לִקֵת", arabic: "خلقت" }, inta: { translit: "חְ'לִקֵת", arabic: "خلقت" }, inti: { translit: "חְ'לִקְתִי", arabic: "خلقتي" }, huwwe: { translit: "חִ'לֵק", arabic: "خلق" }, hiyye: { translit: "חִ'לְקַת", arabic: "خلقت" }, ihna: { translit: "חְ'לִקְנַא", arabic: "خلقنا" }, intu: { translit: "חְ'לִקְתוּ", arabic: "خلقتوا" }, hum: { translit: "חִ'לְקוּ", arabic: "خلقوا" } },
    present: { ana: { translit: "בַּחְ'לַק", arabic: "بخلق" }, inta: { translit: "בִּתְחְ'לַק", arabic: "بتخلق" }, inti: { translit: "בִּתְחְ'לַקִי", arabic: "بتخلقي" }, huwwe: { translit: "בִּחְ'לַק", arabic: "بيخلق" }, hiyye: { translit: "בִּתְחְ'לַק", arabic: "بتخلق" }, ihna: { translit: "מִנְחְ'לַק", arabic: "منخلق" }, intu: { translit: "בִּתְחְ'לַקוּ", arabic: "بتخلقوا" }, hum: { translit: "בִּחְ'לַקוּ", arabic: "بيخلقوا" } },
    imperative: { inta: { translit: "אִחְ'לַק", arabic: "اخلق" }, inti: { translit: "אִחְ'לַקִי", arabic: "اخلقي" }, intu: { translit: "אִחְ'לַקוּ", arabic: "اخلقوا" } },
    participle: { m: { translit: "חַ'אלֵק", arabic: "خالق" }, f: { translit: "חַ'אלְקַה", arabic: "خالقة" }, pl: { translit: "חַ'אלְקִין", arabic: "خالقين" } },
    // خالق is "creator", from the other sense of the root — not "one who was born".
    flags: ["בינוני: chatifai נתן חַ'אלֵק (خالق = בורא), שלא מתאים ל'נולד' — לשאול שוב"],
  },
  {
    root: "حلق", root_translit: "חַלַק", meaning_he: "התגלח", binyan: "פַעַל",
    past: { ana: { translit: "חַלַקֵת", arabic: "حلقت" }, inta: { translit: "חַלַקֵת", arabic: "حلقت" }, inti: { translit: "חַלַקְתִי", arabic: "حلقتي" }, huwwe: { translit: "חַלַק", arabic: "حلق" }, hiyye: { translit: "חַלְקַת", arabic: "حلقت" }, ihna: { translit: "חַלַקְנַא", arabic: "حلقنا" }, intu: { translit: "חַלַקְתוּ", arabic: "حلقتو" }, hum: { translit: "חַלַקוּ", arabic: "حلقو" } },
    present: { ana: { translit: "בַּחְלֵק", arabic: "بحلق" }, inta: { translit: "בִּתְחְלֵק", arabic: "بتحلق" }, inti: { translit: "בִּתְחְלְקִי", arabic: "بتحلقي" }, huwwe: { translit: "בִּיחְלֵק", arabic: "بيحلق" }, hiyye: { translit: "בִּתְחְלֵק", arabic: "بتحلق" }, ihna: { translit: "בִּנְחְלֵק", arabic: "بنحلق" }, intu: { translit: "בִּתְחְלְקוּ", arabic: "بتحلقو" }, hum: { translit: "בִּיחְלְקוּ", arabic: "بيحلقو" } },
    imperative: { inta: { translit: "אִחְלֵק", arabic: "إحلق" }, inti: { translit: "אִחְלְקִי", arabic: "إحلقي" }, intu: { translit: "אִחְלְקוּ", arabic: "إحلقو" } },
    participle: { m: { translit: "חַאלֵק", arabic: "حالق" }, f: { translit: "חַאלְקַה", arabic: "حالقة" }, pl: { translit: "חַאלְקִין", arabic: "حالقين" } },
  },
  {
    root: "لعب", root_translit: "לִעֵבּ", meaning_he: "שיחק", binyan: "פִעֵל",
    past: { ana: { translit: "לְעִבֵּת", arabic: "لعبت" }, inta: { translit: "לְעִבֵּת", arabic: "لعبت" }, inti: { translit: "לְעִבְּתִי", arabic: "لعبتي" }, huwwe: { translit: "לִעֵבּ", arabic: "لعب" }, hiyye: { translit: "לִעְבַּת", arabic: "لعبت" }, ihna: { translit: "לְעִבְּנַא", arabic: "لعبنا" }, intu: { translit: "לְעִבְּתוּ", arabic: "لعبتو" }, hum: { translit: "לִעְבּוּ", arabic: "لعبو" } },
    present: { ana: { translit: "בַּלְעַבּ", arabic: "بلعب" }, inta: { translit: "בִּתְלְעַבּ", arabic: "بتلعب" }, inti: { translit: "בִּתְלְעַבִּי", arabic: "بتلعبي" }, huwwe: { translit: "בִּילְעַבּ", arabic: "بيلعب" }, hiyye: { translit: "בִּתְלְעַבּ", arabic: "بتلعب" }, ihna: { translit: "בִּנְלְעַבּ", arabic: "بنلعب" }, intu: { translit: "בִּתְלְעַבּוּ", arabic: "بتلعبوا" }, hum: { translit: "בִּילְעַבּוּ", arabic: "بيلعبوا" } },
    imperative: { inta: { translit: "אִלְעַבּ", arabic: "إلعب" }, inti: { translit: "אִלְעַבִּי", arabic: "إلعبي" }, intu: { translit: "אִלְעַבּוּ", arabic: "إلعبوا" } },
    participle: { m: { translit: "לַאעֵבּ", arabic: "لاعب" }, f: { translit: "לַאעְבֵּה", arabic: "لاعبة" }, pl: { translit: "לַאעְבִּין", arabic: "لاعبين" } },
  },
  {
    root: "ضرب", root_translit: "צַ'רַבּ", meaning_he: "פגע, היכה", binyan: "פַעַל",
    past: { ana: { translit: "צַ'רַבֵּת", arabic: "ضربت" }, inta: { translit: "צַ'רַבֵּת", arabic: "ضربت" }, inti: { translit: "צַ'רַבְּתִי", arabic: "ضربتي" }, huwwe: { translit: "צַ'רַבּ", arabic: "ضرب" }, hiyye: { translit: "צַ'רְבַּת", arabic: "ضربت" }, ihna: { translit: "צַ'רַבְּנַא", arabic: "ضربنا" }, intu: { translit: "צַ'רַבְּתוּ", arabic: "ضربتو" }, hum: { translit: "צַ'רְבּוּ", arabic: "ضربو" } },
    present: { ana: { translit: "בַּצְ'רֹבּ", arabic: "بضرب" }, inta: { translit: "בִּתְצְ'רֹבּ", arabic: "بتضرب" }, inti: { translit: "בִּתְצְ'רְבִּי", arabic: "بتضربي" }, huwwe: { translit: "בִּיצְ'רֹבּ", arabic: "بيضرب" }, hiyye: { translit: "בִּתְצְ'רֹבּ", arabic: "بتضرب" }, ihna: { translit: "בִּנְצְ'רֹבּ", arabic: "بنضرب" }, intu: { translit: "בִּתְצְ'רְבּוּ", arabic: "بتضربو" }, hum: { translit: "בִּיצְ'רְבּוּ", arabic: "بيضربو" } },
    imperative: { inta: { translit: "אֻצְ'רֹבּ", arabic: "أضرب" }, inti: { translit: "אֻצְ'רְבִּי", arabic: "أضربي" }, intu: { translit: "אֻצְ'רְבּוּ", arabic: "أضربو" } },
    participle: { m: { translit: "צַ'ארֵבּ", arabic: "ضارب" }, f: { translit: "צַ'ארְבַּה", arabic: "ضاربة" }, pl: { translit: "צַ'ארְבִּין", arabic: "ضاربين" } },
    notes: "מפגש 6: צַ'רַבְתוֹ = היא פגעה בו",
  },
  {
    root: "شرح", root_translit: "שַרַח", meaning_he: "הסביר", binyan: "פַעַל",
    past: { ana: { translit: "שַרַחֵת", arabic: "شرحت" }, inta: { translit: "שַרַחֵת", arabic: "شرحت" }, inti: { translit: "שַרַחְתִי", arabic: "شرحتي" }, huwwe: { translit: "שַרַח", arabic: "شرح" }, hiyye: { translit: "שַרְחַת", arabic: "شرحت" }, ihna: { translit: "שַרַחְנַא", arabic: "شرحنا" }, intu: { translit: "שַרַחְתוּ", arabic: "شرحتو" }, hum: { translit: "שַרְחוּ", arabic: "شرحو" } },
    present: { ana: { translit: "בַּשְרַח", arabic: "بشرح" }, inta: { translit: "בִּתְשְרַח", arabic: "بتشرح" }, inti: { translit: "בִּתְשְרַחִי", arabic: "بتشرحي" }, huwwe: { translit: "בִּישְרַח", arabic: "بيشرح" }, hiyye: { translit: "בִּתְשְרַח", arabic: "بتشرح" }, ihna: { translit: "בִּנְשְרַח", arabic: "بنشرح" }, intu: { translit: "בִּתְשְרַחוּ", arabic: "بتشرحو" }, hum: { translit: "בִּישְרַחוּ", arabic: "بيشرحو" } },
    imperative: { inta: { translit: "אִשְרַח", arabic: "إشرح" }, inti: { translit: "אִשְרַחִי", arabic: "إشرحي" }, intu: { translit: "אִשְרַחוּ", arabic: "إشرحو" } },
    participle: { m: { translit: "שַארֵח", arabic: "شارح" }, f: { translit: "שַארְחַה", arabic: "شارحة" }, pl: { translit: "שַארְחִין", arabic: "شارحين" } },
  },
];
