Record a 5-second "before" demo of the app at its current state.

## Steps

1. Check the dev server is running by running:
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   ```
   If it does not return 200, stop and tell the user: "Start the dev server first with `npm run dev`, then run /demo-before again."

2. Tell the user:
   > A browser window is about to open showing the app. You have **5 seconds** to interact and show the current state of whatever you're about to change. Get ready!

3. Run the recording script:
   ```
   node scripts/record-demo.mjs before
   ```

4. After the script finishes, confirm that `.claude/demos/before.gif` or `.claude/demos/before.webm` was saved.

5. Tell the user:
   > ✓ Before demo recorded. Now make your changes to the code — when you're done and the app reflects the new behavior, run `/demo-after`.
