Record a 5-second "after" demo showing the updated app behavior.

## Steps

1. Check the dev server is running:
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   ```
   If it does not return 200, stop and tell the user: "Start the dev server first with `npm run dev`, then run /demo-after again."

2. Check that a before demo exists at `.claude/demos/before.gif` or `.claude/demos/before.webm`. If neither exists, warn the user: "No before demo found — consider running /demo-before first next time."

3. Tell the user:
   > A browser window is about to open. You have **5 seconds** to demonstrate the new behavior. Get ready!

4. Run the recording script:
   ```
   node scripts/record-demo.mjs after
   ```

5. After the script finishes, confirm the file was saved.

6. Tell the user:
   > ✓ After demo recorded. Run `/pr <your description>` to push your changes and open the PR — the demos will be attached automatically.
