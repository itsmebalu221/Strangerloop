# Matchmaking and chat review

Reviewed and fixed locally on November 10, 2026. No production deployment or
production traffic was inspected. Existing SQLite files were left untouched;
integration tests and benchmarks use isolated, in-memory databases.

## Confirmed failures and fixes

| Area | Failure | Result after the change |
| --- | --- | --- |
| Profile upload | Onboarding/profile edits only updated browser storage; live queue rejected users for having no interests. | Each search uploads the current public profile before joining. Only the age bracket is sent. |
| Socket initialization | Concurrent callers could create several sockets for one account, disconnecting one another. The app also attempted to connect before sign-in. | Authenticated callers share one pending connection and wait for connection success. Closing invalidates pending attempts; reconnects refresh auth. |
| Searching | Connection failures could leave the search screen waiting; reconnects did not restore the queue. | Errors return to Home with feedback; reconnects rejoin while searching; cancellation removes listeners and pending joins. |
| Fallback matching | An old waiter could immediately relax a new arrival's preferences. Language/mood settings were partly ignored. | Each person's own wait controls relaxation; current language/mood preferences affect matching. Level 4 requires a shared language. |
| Next | The fourth search within a minute was rejected during ordinary usage. | Allow up to 30 joins per minute; duplicate queue joins preserve the existing wait. |
| Leave/disconnect | Leave only hid the UI, leaving a server session active. A departed peer still appeared writable. | Leave ends the session and notifies the peer. Ended/disconnected chats disable sending and connecting, while Next remains available. |
| Message delivery | Optimistic bubbles appeared even for rejected, throttled, or undelivered messages. | Server acknowledgments confirm accepted text, timestamp, and ID. Rejections retain the draft and show feedback. |
| Mutual Connect | Accept only updated local state; live success scheduled a fake stranger reply and created a duplicate local connection. | Accept submits the second consent to the server. Live connections come from the server and generate no simulated replies. |
| Connection persistence | Client expected an array while the endpoint returns `{ connections }`; removals were local only. | Decode the response, refresh saved peers, reconcile IDs, and persist removals. |
| Block/report | Unblock did not reach the server. Reporting silently blocked even when Block was unchecked. | Unblock updates the server; reporting honors the Block choice. |
| Account switching | Old account state could be persisted under the newly selected account before hydration completed. | Persistence waits for that account's hydration. |
| Long chats | Every message rendered indefinitely; new messages pulled readers away from older messages. | Render the latest 100 messages initially, reveal earlier messages on demand, and preserve reading position. |
| Live activity | Demo activity timers still ran in live mode and fake counts appeared before server stats. | Disable demo activity in live mode and send initial real stats at connection time. |
| Moderation | All-uppercase checks could downgrade a severe rule to a spam warning. | Content rules run before the uppercase spam check. |

## Performance measurements

Synthetic queues of 500 incompatible users, five pairing passes per scenario.
Numbers below are median local wall times. The baseline uses the original
matching implementation from Git HEAD, with the same local database module.

| Queue | Original pass | Updated pass |
| --- | ---: | ---: |
| Incompatible gender preferences | 381.70 ms | 4.30 ms |
| Disjoint interests | 723.19 ms | 46.61 ms |

Pairing now loads block sets once per user instead of querying SQLite for every
candidate pair, performs cheap preference checks before scoring, computes a
candidate score once, and creates match payloads only for the selected pair.
Session lookup uses a user-to-session map instead of scanning every active chat.

These numbers measure CPU work with in-memory SQLite. They do not establish
production capacity, network latency, or time to find another person. The
remaining full queue scan is quadratic in the worst case. Queue/session state is
still process-local, so horizontal scaling requires shared state and coordination.

## Verification

- `npm test`: 11 React component/store regression checks.
- `npm --prefix server test`: 10 real Socket.IO/REST integration and matching checks.
- Frontend and backend TypeScript checks and production builds.
- `npm --prefix server run benchmark`: reproducible local queue benchmark.

The embedded browser loaded the test Home screen, but its local connection reset
after the fixture server restarted. A complete browser journey was not verified;
the React behavior checks and real transport integration checks passed separately.

Direct messaging between saved connections was never implemented by this project.
Live mode now labels that action as coming soon instead of claiming an icebreaker
was sent. Deploy the client and server together: the updated chat UI depends on
the server's message acknowledgments and Leave event.
