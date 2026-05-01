Guide the user through the complete workflow for making a change to the deal-hunter app.

Walk through each step interactively — wait for the user to confirm each step before moving to the next.

---

## The Full Workflow

Present this as a checklist and go step by step:

### Step 1 — Get on main and pull latest

Tell the user to confirm they want to start fresh from main, then run:
```
git checkout main && git pull origin main
```

### Step 2 — Create a feature branch

Ask the user: "What are you working on? Give me a short description."
Then run the branch command with their answer:
```
/branch <their description>
```
This creates and pushes the branch automatically.

### Step 3 — Start the dev server

Tell the user to open a terminal and run:
```
npm run dev
```
Remind them to keep this running in a separate terminal throughout their work.
Wait for them to confirm the app is running at http://localhost:3000.

### Step 4 — Record the "before" demo

Tell the user:
> Before touching any code, let's capture how the app looks right now.

Run:
```
/demo-before
```
A browser window will open for 5 seconds. Tell the user to navigate to the part of the app they're about to change and interact with it naturally.

### Step 5 — Make the changes

Tell the user: "Go ahead and make your changes. Come back here when the app looks the way you want it."
Wait for them to say they're done.

### Step 6 — Record the "after" demo

Tell the user:
> Great! Now let's capture the new behavior.

Run:
```
/demo-after
```
Same deal — 5 seconds in the browser to demo the change.

### Step 7 — Push and open the PR

Ask the user for a one-line description of what changed, then run:
```
/pr <their description>
```
This commits everything, pushes, and opens the PR form in the browser.

Remind the user: drag the files `.claude/demos/before.gif` and `.claude/demos/after.gif` into the PR description box before submitting.

---

At the end, congratulate them and remind them the workflow next time is just:
1. `/start` to be guided, or
2. Do it manually: `/branch` → `npm run dev` → `/demo-before` → code → `/demo-after` → `/pr`
