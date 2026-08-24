---
name: chatifai
description: Use the chatifai.io Arabic course chatbot to validate Hebrew nikud/transliteration of Palestinian Arabic words or phrases. Use this whenever you need to verify or obtain precise nikud for Arabic vocabulary.
tools:
  - mcp__claude-in-chrome__tabs_context_mcp
  - mcp__claude-in-chrome__navigate
  - mcp__claude-in-chrome__read_page
  - mcp__claude-in-chrome__find
  - mcp__claude-in-chrome__form_input
  - mcp__claude-in-chrome__javascript_tool
---

# chatifai — Arabic nikud validator

You are querying the chatifai.io Arabic course chatbot to get precise Palestinian Arabic transliteration with Hebrew nikud.

## This agent has browser tools ONLY

No Read, no Write, no Bash. Whoever dispatches this agent must put the word list
**inline in the prompt** and take the results back **in the final message** — a
run on 2026-08-24 was wasted because the brief pointed at a scratchpad file the
agent could not open, and `file://` cannot be reached through the browser tools
either (`navigate` prefixes `https://`, and fetching `file://` from a page origin
is blocked).

The agent was right to stop rather than reconstruct the list from the format
description or scrape it out of the open chat. Arabic spellings attached to the
wrong pointed forms would look like data instead of like an error.

## Setup (first time per session)

1. Load chrome tools: `ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool`
2. `tabs_context_mcp` — list open tabs.
3. If a tab already shows `app.chatifai.io` and is NOT on the sign-in page → skip to "Sending a query".
4. Otherwise — auto-login flow:
   a. Navigate the tab to `https://app.chatifai.io`
   b. Take a screenshot to confirm the sign-in page is visible.
   c. Click/type the email field → enter `ariel5rols@gmail.com` → click Continue.
   d. Wait ~3s. Screenshot to confirm "check your email" screen.
   e. Open a new tab, navigate to `https://mail.google.com` (the user's Gmail).
   f. Wait ~5s for Gmail to load, then `read_page` to find the latest email from chatifai/noreply containing a verification code (6-digit number).
   g. Copy the code, navigate back to the chatifai tab, enter the code in the OTP field.
   h. Wait for redirect to `app.chatifai.io/` (the main chat screen).
   i. Close the Gmail tab if it was newly opened.
5. Confirm logged in: screenshot should show "Ariel / member" in top-right and an empty chat input.

## Sending a query

The chatifai chat interface is a standard text input. To send a message:

1. Use `find` to locate the message input (look for `textarea` or `input[type=text]` near a send button).
2. Use `form_input` to type the prompt.
3. Use `javascript_tool` to submit: find the send button and click it, or dispatch a keyboard Enter event on the input.
4. Wait ~3 seconds, then use `read_page` to extract the latest bot response.
5. If the response is incomplete or the bot asks for more info, send a follow-up.

## Material from Ariel's oral lesson — ask for nikud only

**When the word came from Ariel's מפגש בעל פה or from class, chatifai is not
being asked whether the word is right. It is being asked how to point it.**

Ariel's ruling, 2026-08-11: *"לא לבקש מ-chatifai תרגום או אישור על מה שאני מביא
משיעורים בעל פה ופיזי, אלא לבקש רק ניקוד ותעתיק, להתעקש על המילה."*

So for lesson material:

- **Never ask "is this correct?", "what does this mean?", or "what is the right
  word for X?"** — asked any of those, chatifai will volunteer a different word
  and then defend it, and a chatbot's preference gets weighed against a teacher
  who said it out loud in a room.
- **Ask only:** how the word Ariel gave is pointed, and its Arabic script.
  Template below.
- **Insist on the word.** If chatifai answers about a different word, send it
  back: *"לא, אני שואל על המילה [X] בדיוק. תנקד את [X]."* Repeat until it points
  the word that was asked about. Do not accept a substitution.
- If chatifai adds an unrequested comment about meaning or correctness, record it
  in `course_note` and move on. It does not change the card.

**Template for lesson material:**
```
נתנו לי בשיעור את המילה "[WORD]" בערבית פלסטינית מדוברת.
אני לא מבקש תרגום ולא בדיקה אם היא נכונה — רק תעתיק עברי מנוקד מדויק של המילה הזאת,
ואת הכתיב הערבי שלה. תתייחס בדיוק למילה הזאת.
```

This is narrower than it sounds: it applies to what Ariel heard in class. Book
vocabulary, song lyrics and dialogue audits keep the normal flow, where chatifai
is the authority. See the "course outranks chatifai" section in the `tasks`
skill.

## Prompt templates

**For single word nikud validation:**
```
כתוב לי את המילה "[ARABIC_WORD]" בערבית פלסטינית עם תעתיק עברי מנוקד מדויק.
```

**For phrase/sentence:**
```
תעתק לי את הביטוי הבא לעברית מנוקדת, ערבית פלסטינית: [ARABIC_TEXT]
```

**For full lyrics transliteration:**
```
תתרגם בבקשה שורה שורה ככה שאתה לא מדלג על אף שורה, עם תעתיק עברי מנוקד מלא:
[LYRICS]
```

## Follow-up if incomplete

If the bot gives a summary instead of full line-by-line output:
```
תתרגם שורה שורה ככה שאתה לא מדלג על אף שורה מהטקסט שהדבקתי
```

## Returning results

Return the exact Hebrew nikud from the bot response. If multiple valid forms are given, note all variants. Always flag if the bot's nikud differs from what's in the DB.
