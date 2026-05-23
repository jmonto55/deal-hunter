Create a new git branch from the phrase "$ARGUMENTS" and push it to GitHub.

Follow these steps exactly:

## 1. Derive the branch name

Convert "$ARGUMENTS" into a valid git branch name:
- Lowercase everything
- Replace spaces and any non-alphanumeric character (except `/`) with `-`
- Collapse multiple consecutive hyphens into one
- Strip leading and trailing hyphens
- Keep `/` if the phrase uses a `type/description` pattern (e.g. `feat/my-feature`)

Example: "Add user login page" → `add-user-login-page`

## 2. Check current state

Run `git status` to confirm the working tree is clean. If there are uncommitted changes, tell the user and stop — do not create the branch.

## 3. Make sure local main is up to date

Run `git fetch origin main` so the new branch starts from the latest commit on main.

## 4. Create the branch

Run:
```
git checkout -b <branch-name> origin/main
```

## 5. Push to GitHub and set upstream

Run:
```
git push -u origin <branch-name>
```

This sets the upstream tracking so future `git push` / `git pull` commands work without extra flags.

## 6. Confirm

Print a short summary:
- Branch name created
- GitHub URL: `https://github.com/jmonto55/deal-hunter/tree/<branch-name>`
- Remind the user they are now on the new branch and can start committing
