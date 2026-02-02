
# Chat Application - Development Prompts

A collection of prompts used during the development of this chat application, organized by category for easy reference and reuse.

---

## Architecture & Planning

### 1. Repository Architecture Overview
```
Provide a high-level architectural overview of this repository, covering:
- Backend structure and key components
- Frontend organization and framework
- Communication layer between frontend and backend (APIs, protocols, data flow)
- Any notable architectural patterns or design decisions
```

### 2. Assignment Breakdown & Task Prioritization
```
Provide a structured breakdown of this assignment:

**Goal & Scope**
- What is the primary objective?
- What problem does this solve or demonstrate?

**Deliverables**
- Functional requirements (what it must do)
- Technical requirements (technologies, architecture, quality standards)
- Product requirements (UX, edge cases, polish)

**Task Prioritization (60-minute timeframe)**
- Must-have (core functionality to demonstrate competency)
- Nice-to-have (enhancements if time permits)
- Out-of-scope (explicitly what NOT to attempt)
```

---

## SDK Migration & API Integration

### 3. Migrate to New Google GenAI SDK
```
I'm getting a deprecation warning for `google.generativeai`. Help me migrate to the new `google.genai` SDK:

- What are the key breaking changes between the old and new SDK?
- How do I update my imports and initialization code?
- What API method names or patterns have changed?
- Are there any new best practices or features I should adopt?
- Provide migration examples for common operations (text generation, streaming, etc.)
```

### 4. Switch to Gemini 2.5 Flash Model
```
I want to switch my code to use Gemini 2.5 Flash. Can you help me update it?

Currently using: [your current setup]
What I need: Use the Gemini 2.5 Flash model

Could you show me:
- How to specify the model in my code
- Any import or setup changes I need to make
- If there are any quirks or limitations with Flash I should know about
```

---

## Backend Issues & Debugging

### 5. 502 Bad Gateway Error on Message Send
```
Getting 502 Bad Gateway errors whenever I try to send messages. 

A few things that might help:
- It happens when [describe the specific action]
- Started around [when you first noticed it]
- Seems to happen [always/sometimes/only with certain messages]

Any idea what could be causing this? I'm not sure if it's something on my end or a server issue.
```

---

## UI Bugs & State Management

### 6. Duplicate Message Rendering
```
There's a UI bug where duplicate messages are showing up when I get a response back. For example, when the bot sends "BYE", it appears twice on screen.

Refreshing the page fixes it, so it's not a database issue - seems like a state management or rendering problem.

Any idea what could cause messages to render twice like that?
```

### 7. Persistent Duplicate Message Issue
```
Still seeing the same duplicate message issue even after [what you tried].

Quick recap of the problem:
- Messages appear twice when received
- Page refresh fixes it temporarily
- Happens consistently with every response

What I've tried so far:
- [list any fixes you attempted]

The bug is still there. What else should I check? Could it be related to how the WebSocket/API response is being handled, or maybe an event listener firing twice?
```

### 8. Message Display Delay (Optimistic UI)
```
New issue: messages aren't showing up immediately when I send them. They only appear after the API response comes back from "api/conversations/1/messages/".

Expected behavior: message should display instantly (optimistic UI), then update when the server confirms

Current behavior: user sends message → nothing happens → API responds → message appears

This makes the chat feel really slow and unresponsive. How can I implement optimistic message rendering so it shows right away?
```

### 9. Feedback Button Scroll Issue
```
Bug: when I click a feedback emoji, the chat scrolls up unexpectedly. How do I prevent this?
```

### 10. Rename Causes Scroll to Top
```
Bug: after saving a conversation rename, the chat scrolls to the top instead of staying at the bottom.

Fix: keep the chat scrolled to the bottom (or maintain current scroll position) after renaming.
```

### 11. Conversation Switch Should Scroll to Bottom
```
Re-enable clicking on conversation items (I blocked it earlier for the rename bug), but ensure the chat scrolls to the bottom whenever I switch conversations.
```

### 12. Block Conversation Item Click During Rename
```
Prevent the conversation item from being clickable while renaming. The click handler shouldn't fire when the input is active.
```

---

## Backend Development - Feedback System

### 13. Create Feedback Model
```
Add a Feedback model to the chat app that tracks user feedback on messages.

Requirements:
- Link to Message model via ForeignKey (related_name='feedbacks')
- Store feedback value (boolean for thumbs up/down or integer for ratings)
- Include created_at timestamp
- Add database indexes for performance
- Generate a clean, reversible migration

Once you show me the model, I'll run makemigrations and migrate.
```

### 14. Implement Feedback API Endpoints
```
Now I need to wire up the API endpoints for the Feedback model.

**What I need:**
1. Serializer for creating and reading feedback
2. POST endpoint: /api/messages/{id}/feedback/ to submit feedback
3. GET endpoint: /api/insights/ to view aggregated feedback stats

**Requirements:**
- Use Django ORM aggregations (Count, Avg, etc.) for the insights
- Avoid N+1 queries
- Set up proper URL routing

Can you show me the serializer, views, and URL config?
```

### 15. Implement Feedback Upsert Logic
```
Update the feedback logic: if feedback already exists for a message, update the rating. If not, create new feedback.

Basically, prevent duplicate feedback entries - just update the existing one.
```

---

## Frontend Development - Feedback & Insights

### 16. Add Feedback Functionality to Frontend
```
Time to add feedback functionality to the frontend.

**What I need:**
1. TypeScript types for Feedback
2. API functions to submit feedback and fetch insights
3. Thumbs up/down buttons on AI messages
4. Insights page to view feedback stats
5. Navigation between chat and insights

Make sure everything compiles and builds properly for production.
```

### 17. Add Load Feedback API and Integration
```
Add a loadFeedback API function to fetch feedback for messages, and show me how to use it in the component.
```

### 18. Remove Average Rating from Insights
```
Remove the average rating metric from the Insights page. Just keep the other feedback stats.
```

---

## Code Organization & Refactoring

### 19. Split Chat and Insights into Separate Files
```
The component is getting too large. Help me refactor by splitting the chat and insights code into separate files.

**What I want:**
- Chat functionality in its own component/file
- Insights functionality in its own component/file
- Clean imports and proper component structure

Keep everything working the same, just better organized.
```

### 20. Reorganize Project Structure with Folders
```
Refactor the project structure - move Chat and Insights components into their own folders with proper organization.

**Current:** Everything in main.ts
**Target:** 
- src/components/Chat/ (Chat component + related files)
- src/components/Insights/ (Insights component + related files)

Clean up main.ts to just handle routing/app setup.
```

---

## Conversation Management Features

### 21. Add Rename and Delete Conversation
```
Add conversation management features:
- Allow users to rename conversations
- Allow users to delete conversations

Show me the UI changes and API endpoints needed for both actions.
```

### 22. Improve Rename Input (Spaces & Enter Key)
```
Fix the conversation rename input:
- Allow spaces in the name
- Save on Enter key press (not just on blur)

Currently it seems restricted - make it work like a normal text input.
```

---

## Markdown Rendering & Content Display

### 23. Investigate Gemini Response Format
```
Figure out how Gemini responses are formatted and help me render them properly in the UI.

**What I need:**
- Check if responses are plain text, Markdown, or HTML
- Render formatting like bold, lists, paragraphs correctly
- Sanitize to prevent XSS
- Avoid the duplication/layout issues I had before

Show me the safe way to display rich AI responses.
```

### 24. Implement Markdown Rendering for AI Messages
```
AI responses come back as Markdown. Help me render them properly in the chat.

**Requirements:**
- Use a Markdown renderer to display formatting (headings, bold, lists, etc.)
- Keep it secure (XSS-safe)
- Match existing chat UI styles
- Don't change how messages are stored, just how they're displayed
- Keep it lightweight

What's a good Markdown library for this, and how do I integrate it?
```

---

## UI/UX Polish

### 25. Polish Insights Page UI
```
Polish the UI, especially the Insights page. Make it cleaner and easier to understand.

**What needs improvement:**
- Better visual hierarchy and spacing
- More detailed/clear breakdown of feedback stats
- Consistent styling with the rest of the app

Keep it simple and MVP-appropriate - just make it look intentional and professional.
```

---
