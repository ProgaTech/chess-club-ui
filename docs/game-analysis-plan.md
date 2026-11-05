# V1 implementation plan — download a game analysis

A member selects a finished club game or pastes its PGN, waits for Stockfish and downloads a Markdown report. The file contains the moves, engine evaluations, critical positions and a suggested prompt for use in the member's own LLM.

## 1. Submit a finished game

Add an authenticated analysis entry using the existing React/Vite routing and Clerk session. For a saved game, send its stable game ID after checking that a PGN is available. For pasted PGN, ask the member to confirm the game is finished. POST /analyses with either gameId or pgn plus finishedConfirmed. Preserve editable input on validation errors and disable repeated submission while the request is pending.

## 2. Show progress

Keep the returned job ID in the review route. Poll GET /analyses/:id with bounded backoff and restore status on reload. Show queued, running (completed/total plies), ready or failed. Stop polling on terminal status, navigation or sign-out. Offer reconnect after network loss. Explain invalid/unfinished PGN inline and respect Retry-After for rate limits.

## 3. Download the report

When ready, show **Download Markdown (.md)** with a short hint that members can attach the file to their preferred LLM. On click, fetch GET /analyses/:id/report.md using the same API base and Clerk bearer token as the existing client. Add a download helper beside src/lib/club-api.ts that reads the successful response as a Blob and handles HTTP errors before saving. Generate the safe filename chess-analysis-<id>.md from the job ID, save via an object URL and release the URL after the browser starts the download. Preserve the server bytes and character encoding. Keep the button available for repeat downloads.

Handle 401 by requesting sign-in, 404 by explaining that the review is unavailable and 409 by refreshing job status. Offer retry if the download is interrupted. The member controls where to upload the saved file.

## 4. Verify the user flow

Use the API team's queued/running/ready/failed JSON fixtures and golden UTF-8 Markdown file. Check keyboard access and small screens. Exercise reload during analysis, a failed download followed by retry, and a second download without submitting another job. Confirm an error response never becomes a saved .md file.

For acceptance, submit a finished game in staging and open the downloaded .md file in a text editor. Compare it with the API response and verify it contains the full move list, score perspective, evidence for critical moments and a prompt that can be copied into a personal LLM. Run the existing lint and production build checks when implementing.
