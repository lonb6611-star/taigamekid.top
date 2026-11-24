# Security Specification — taigamekid Firestore Rules (Phase 0)

## 1. Data Invariants
1. **Default-Deny Gate**: Every path not explicitly matched defaults to `allow read, write: if false;`.
2. **Verified Google Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Bootstrap & Separation**: Admin actions (`games` CRUD, `earnLinks` CRUD, `earnLinkSecrets` read/write, `siteMeta` updates) require `isAdmin()`, verified via `request.auth.token.email_verified == true && request.auth.token.email == 'lonb6611@gmail.com'` or membership in `/admins/{uid}`. Standard users can never self-assign `role == 'admin'`.
4. **Secret Code Isolation**: Earn-link `passCode` values live exclusively in `/earnLinkSecrets/{linkId}`, readable only by admins. Regular users cannot read `passCode` and can only claim rewards when `submittedCode` matches `earnLinkSecrets/{linkId}.passCode` server-side inside Firestore rules.
5. **Atomic Reward Claiming**: Creating `/users/{userId}/transactions/{txId}`, incrementing `/users/{userId}.balance`, updating `/users/{userId}.earnPasses`, updating `/leaderboard/{userId}`, and incrementing `/earnLinks/{linkId}.completedCount` are bound together via `existsAfter`/`getAfter` atomicity guarantees so no user can forge balances, exceed `maxPasses`, or alter `amount`.
6. **PII Isolation**: User email addresses reside exclusively inside private `/users/{userId}` (readable only by owner or admin). Public `/leaderboard/{userId}` contains zero PII (`uid`, `displayName`, `balance`, `completedTasks`, `updatedAt`) and strictly mirrors the user's verified balance.
7. **Temporal & Key Integrity**: All `createdAt`/`updatedAt` timestamps are enforced against `request.time`. Strict `keys().hasAll(...) && keys().hasOnly(...)` and `affectedKeys().hasOnly(...)` block shadow fields.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: Creating `/users/{uid}` with `role: "admin"` as a non-admin user -> `PERMISSION_DENIED`.
2. **Initial Balance Forgery**: Creating `/users/{uid}` with `balance: 999999` -> `PERMISSION_DENIED`.
3. **Direct Balance Tampering**: Updating `/users/{uid}` `balance` without a matching atomic transaction (`lastClaimTxId`) -> `PERMISSION_DENIED`.
4. **Wrong Earn PassCode**: Creating `/users/{uid}/transactions/{txId}` with `submittedCode: "WRONG"` -> `PERMISSION_DENIED`.
5. **Reward Amount Forgery**: Creating `/users/{uid}/transactions/{txId}` with `amount: 500000` when `earnLinks/{id}.rewardPerPass == 500` -> `PERMISSION_DENIED`.
6. **Exceeding Max Passes**: Claiming `/earnLinks/{id}` when `earnPasses[id] >= maxPasses` -> `PERMISSION_DENIED`.
7. **Reading Admin Secrets**: Calling `getDoc` or `getDocs` on `/earnLinkSecrets` as a non-admin -> `PERMISSION_DENIED`.
8. **Shadow Field Injection**: Updating `/games/{id}` or `/users/{uid}` with an extra undocumented field `isVerified: true` -> `PERMISSION_DENIED`.
9. **Path ID Poisoning**: Creating a document with an invalid or >128-char ID like `../evil` -> `PERMISSION_DENIED`.
10. **PII Scraping**: Listing `/users` as a non-admin authenticated user -> `PERMISSION_DENIED`.
11. **Leaderboard Desync / Inflation**: Updating `/leaderboard/{uid}` with `balance: 1000000` mismatched from `/users/{uid}.balance` -> `PERMISSION_DENIED`.
12. **Unverified Email Spoofing**: Writing while `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
