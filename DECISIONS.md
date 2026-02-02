# Technical Decisions & Rationale

Why I built things the way I did, and what I'd do differently next time.

---

## Architecture

### Django + Vanilla TypeScript

I went with Django backend and plain TypeScript frontend - no React, no Vue, nothing fancy.

**Why:**
- Django gives me models, migrations, and an admin panel out of the box
- Didn't want to deal with React boilerplate for a simple chat app
- Vanilla TS means tiny bundle size and no framework weirdness
- Easier to debug when something breaks at 2am

Honestly, if this was production and needed to scale, I'd probably use React. But for getting something working quickly? Vanilla TS was the right call.

### Polling instead of WebSockets

Yeah, I'm polling the server for new messages. I know, I know - WebSockets are "the right way". But here's the thing:

- Django doesn't have WebSockets built in - I'd need Django Channels
- That's a whole extra layer of complexity
- Polling works fine for this use case
- I can always swap it out later

WebSockets would be cleaner, but this is an MVP. Ship first, optimize later.

---

## API Changes

### Moving to the new Google SDK

Google deprecated `google.generativeai` and pushed everyone to `google.genai`. Annoying timing, but had to do it.

The migration was mostly straightforward - just import changes and how you construct the message parts. The new SDK has better types though, so that's nice.

### Why Gemini 2.5 Flash

I could've used Gemini Pro or other models, but Flash is:
- Fast (users don't like waiting)
- Cheap (this is running on my dollar)
- Good enough for chat

Unless I was building something that needed deep reasoning, Flash is the sweet spot for a chat app.

---

## Fighting with Message Display

### The duplicate message nightmare

This one drove me crazy for a while. Messages would show up twice after the AI responded. Refresh the page and suddenly it's fine - classic state management bug.

The problem was my polling logic kept fetching the same messages and my deduplication wasn't working right. Fixed it by:
- Tracking the last message sequence number
- Stopping polling while sending a message
- Being smarter about when to re-render

Took way longer to debug than I'd like to admit.

### Making messages show up instantly

After fixing duplicates, I broke optimistic updates. Your message wouldn't show until the server responded - made the chat feel super laggy.

Solution: show the message immediately, add it to the UI with a temporary ID, then replace it when the server confirms. Standard pattern, but had to be careful not to reintroduce the duplicate bug.

### Scroll position is a pain

Every time something updated, the chat would jump around. Rename a conversation? Scroll to top. Click feedback? Scroll to top. Switch conversations? Random scroll position.

I ended up manually managing scroll in a bunch of places:
- Always scroll to bottom after sending a message
- Save scroll position before re-rendering
- Restore it after feedback interactions
- Force scroll to bottom when switching conversations

Not elegant, but it works. Vanilla JS means you have to handle this stuff yourself.

---

## Backend Design

### Feedback system

Added a separate `Feedback` model linked to messages via ForeignKey. Could've just added a `rating` field to the Message model, but I wanted to keep things separated.

This way I can track who gave feedback, when they gave it, and potentially allow people to change their rating later.

### Upsert instead of creating duplicates

Initially, clicking thumbs up multiple times would create multiple feedback records. That's dumb.

Changed it to update existing feedback if it exists, create new if it doesn't. Django makes this easy with `update_or_create()`.

### Using Django aggregations for insights

For the insights page, I needed to calculate:
- Total feedback count
- Positive vs negative breakdown
- Per-message statistics

Could've done this with raw SQL or in Python, but Django's ORM aggregations (`Count`, `Sum`, etc.) are clean and prevent N+1 queries. Plus they're database-agnostic.

---

## Code Organization

### Splitting up main.ts

At some point `main.ts` hit 500+ lines and I couldn't find anything anymore. Split it into:
- `chat/` folder for chat logic
- `insights/` folder for insights page
- `main.ts` just handles routing

Should've done this sooner. Much easier to work with now.

### TypeScript over JavaScript

I went with TypeScript from the start because:
- Autocomplete is way better
- Catches stupid bugs before runtime
- Acts as documentation (you can see what functions expect)

The extra compilation step is worth it. Saved me several times during refactoring.

---

## Rendering AI Responses

### Markdown rendering

Gemini sends back Markdown, but I was displaying it as plain text. That means stuff like `**bold**` just showed up as literal asterisks.

Added `marked` to parse the Markdown and `DOMPurify` to sanitize the HTML. Now AI responses look properly formatted.

Only doing this for AI messages though - user messages stay as plain text. Don't want to deal with users trying to inject HTML.

### XSS protection

I don't trust AI-generated content. Even though it's coming from Google's API, I'm running everything through DOMPurify before putting it in the DOM.

Probably overkill, but better safe than getting XSS'd by a clever prompt injection.

---

## Conversation Management

### Inline editing for rename

Wanted to let users rename conversations. Could've done a modal, but those are annoying. Went with inline editing instead - click the title, it becomes an input, press Enter to save.

Had to handle:
- Preventing conversation selection while editing
- Allowing spaces in the name (was accidentally trimming them)
- Saving on Enter, canceling on Escape

More fiddly than expected, but feels way better than a modal.

### Delete with confirmation

Didn't want users accidentally deleting conversations, so added a confirmation dialog. It's just a browser `confirm()` - nothing fancy, but it works.

Could make it prettier later, but functional beats pretty for an MVP.

---

## What I'd Do Differently

Looking back, here's what I'd change:

**Use WebSockets from the start** - Polling works but feels hacky. WebSockets would be cleaner.

**Write tests** - I moved fast and broke things. Tests would've caught the duplicate message bug way earlier.

**Better error handling** - Right now most errors just `console.log()`. Need proper error states in the UI.

**More loading indicators** - The app feels unresponsive sometimes because there's no feedback that something's happening.

**Plan scroll management earlier** - Fighting with scroll position took up way too much time. Should've had a strategy from the beginning.

---

## Things That Worked Well

**Starting simple** - Vanilla TS instead of a framework was the right call for MVP speed.

**Separating concerns early** - Breaking out chat and insights into separate files made everything easier.

**TypeScript** - Caught so many bugs during refactoring. Worth the setup.

**Django ORM** - Clean, readable, and fast enough. No need for raw SQL.

**Markdown rendering** - Makes AI responses look professional. Users notice this stuff.

---

## Final Thoughts

This was built fast, so there are rough edges. But it works, it's maintainable, and I can iterate on it.

The biggest lesson: don't over-engineer early. Get something working, see where the pain points are, then fix those. I wasted time worrying about things that didn't matter and not enough on things that did (like scroll management).

Next time I'll probably use WebSockets and write tests from day one. But for an MVP? This was the right approach.