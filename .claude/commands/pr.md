Push all current changes and open a pull request on GitHub. The user's description is: "$ARGUMENTS"

## 1. Check what's changing

Run `git status` and `git diff --stat HEAD` to see all changes. Show a brief summary.

## 2. Stage everything

```
git add -A
```

## 3. Commit

```
git commit -m "$ARGUMENTS"
```

If the working tree is already clean, skip this step.

## 4. Push

```
git push
```

If push fails due to no upstream, run:
```
git push -u origin HEAD
```

## 5. Build the PR body

Check whether demo files exist:
- `.claude/demos/before.gif` or `.claude/demos/before.webm`
- `.claude/demos/after.gif` or `.claude/demos/after.webm`

**If GIFs exist**, build this body:
```
$ARGUMENTS

## Before
![Before](.claude/demos/before.gif)

## After
![After](.claude/demos/after.gif)

> Attach the GIF files from `.claude/demos/` by dragging them into this PR description after it opens.
```

**If only .webm files exist**, build this body:
```
$ARGUMENTS

## Demo
Video demos saved at:
- Before: `.claude/demos/before.webm`
- After:  `.claude/demos/after.webm`

> Drag these files into this PR description to attach them.
```

**If no demos exist**, body is just:
```
$ARGUMENTS
```

## 6. Open the PR

```
gh pr create --base main --title "$ARGUMENTS" --body "<body from step 5>" --web
```

## 7. Confirm

Tell the user:
- What was committed
- The branch that was pushed
- If demos exist: remind them to drag `.claude/demos/before.gif` and `.claude/demos/after.gif` into the PR form that just opened in the browser
