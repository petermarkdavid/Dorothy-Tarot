# Enable GitHub Pages - Step by Step

## The Issue

You're seeing "404 - There isn't a GitHub Pages site here" because GitHub Pages needs to be enabled in repository settings.

## Solution: Enable GitHub Pages

### Step 1: Go to Settings

1. Open: https://github.com/petermarkdavid/Dorothy-Tarot
2. Click **"Settings"** tab (top menu, next to "Insights")
3. Scroll down in the left sidebar
4. Click **"Pages"** (under "Code and automation")

### Step 2: Configure Source

In the Pages settings, you'll see:

**"Source"** section:
1. Click the dropdown that says **"None"** (or "Deploy from a branch")
2. Select: **"Deploy from a branch"**
3. **Branch** dropdown: Select **`main`**
4. **Folder** dropdown: Select **`/ (root)`**
5. Click **"Save"** button

### Step 3: Wait for Deployment

1. After clicking Save, you'll see a message: "Your site is ready to be published at..."
2. Wait 1-2 minutes
3. Refresh the page - you should see your site URL
4. Click the URL to visit your site

### Step 4: Verify

1. Go to **"Actions"** tab in your repository
2. You should see a workflow called **"pages build and deployment"**
3. Wait for it to complete (shows a yellow dot while building, green checkmark when done)
4. Visit: `https://petermarkdavid.github.io/Dorothy-Tarot/`

## Troubleshooting

### "Source" dropdown is grayed out or shows "None"

- Make sure you're on the repository Settings page
- Verify you have admin access to the repository
- Check that the repository is **Public** (required for free GitHub Pages)

### Still shows 404 after enabling

- Wait 2-3 minutes (first deployment takes longer)
- Check the **Actions** tab for any errors
- Verify `index.html` exists in the root (it does ✅)
- Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Repository is Private

If your repository is private:
- Go to Settings → General → Danger Zone
- Click "Change visibility" → "Make public"
- Free GitHub Pages requires public repositories

## What Should Happen

After enabling:
1. ✅ GitHub will build your site
2. ✅ Site will be available at: `https://petermarkdavid.github.io/Dorothy-Tarot/`
3. ✅ Custom domain `dorothytarot.com` will work once DNS is configured

## Quick Checklist

- [ ] Repository is **Public**
- [ ] Went to **Settings** → **Pages**
- [ ] Selected **"Deploy from a branch"**
- [ ] Branch: **`main`**
- [ ] Folder: **`/ (root)`**
- [ ] Clicked **"Save"**
- [ ] Waited 1-2 minutes
- [ ] Checked **Actions** tab for deployment status

## Direct Link

Go directly to Pages settings:
**https://github.com/petermarkdavid/Dorothy-Tarot/settings/pages**

Once you enable it there, your site will be live in 1-2 minutes! 🚀

