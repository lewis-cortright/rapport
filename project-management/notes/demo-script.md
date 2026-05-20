# Demo Script

Target duration: under five minutes.

## Demo Flow

1. **Open the deployed app**
   - Briefly frame it as a Discord-inspired real-time team chat PWA built in the MERN stack.

2. **Register or log in**
   - Mention JWT authentication and protected routes.

3. **Create a workspace**
   - Point out that the creator becomes the workspace owner.

4. **Show the default `general` channel**
   - Explain that every workspace starts with a usable default channel.

5. **Create a second channel**
   - Mention that channel creation is owner-only in the MVP.

6. **Open a second browser or session**
   - Use this to simulate another teammate.

7. **Join the workspace by invite code**
   - Demonstrate the membership model and invite flow.

8. **Send a message from one session**
   - Keep the message short so the real-time effect is easy to see.

9. **Show real-time message delivery in the other session**
   - Mention that messages are persisted before broadcast.

10. **Refresh the page and show persisted messages**
    - Reinforce that MongoDB is the source of truth, not only in-memory socket state.

11. **Mention PWA installability**
    - Point out the manifest, install path, and basic offline fallback.

12. **Mention documented future work**
    - Close by naming a few intentionally deferred items such as presence, typing indicators, and richer permissions.

## Optional Narration Cues

- "I scoped this as a polished vertical slice rather than trying to clone all of Discord."
- "Authorization is enforced on the backend, not just by hiding controls in the UI."
- "I used Socket.IO because it gave me reconnection behavior and rooms without spending the whole timeline on raw WebSocket plumbing."
- "The product is only considered done once it is deployed and demoable from a clean account."

