# Hostinger DNS Configuration for GitHub Pages

## Step-by-Step: Configure DNS in Hostinger

### Step 1: Access DNS Management

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **"Domains"** in the left sidebar
3. Find **`dorothytarot.com`** in your domains list
4. Click on the domain name
5. Click **"DNS / Name Servers"** tab

### Step 2: Remove Existing A Records (if any)

1. Look for any existing **A records** for:
   - `@` (root domain)
   - `dorothytarot.com`
   - (blank name)
2. **Delete** any A records that point to Hostinger IPs or other servers
3. **Keep** other records like:
   - MX records (for email)
   - TXT records (for verification)
   - CNAME records (unless they conflict)

### Step 3: Add GitHub Pages A Records

Add **4 new A records**:

**Record 1:**
- **Type**: A
- **Name**: `@` (or leave blank, or `dorothytarot.com`)
- **Value**: `185.199.108.153`
- **TTL**: `3600` (or default)

**Record 2:**
- **Type**: A
- **Name**: `@`
- **Value**: `185.199.109.153`
- **TTL**: `3600`

**Record 3:**
- **Type**: A
- **Name**: `@`
- **Value**: `185.199.110.153`
- **TTL**: `3600`

**Record 4:**
- **Type**: A
- **Name**: `@`
- **Value**: `185.199.111.153`
- **TTL**: `3600`

### Step 4: Add CNAME for www (Optional but Recommended)

Add a CNAME record for the www subdomain:

- **Type**: CNAME
- **Name**: `www`
- **Value**: `petermarkdavid.github.io`
- **TTL**: `3600`

### Step 5: Save Changes

1. Click **"Save"** or **"Add Record"** for each record
2. Wait for confirmation that records are saved

## Visual Guide

In Hostinger DNS interface, you should see something like:

```
Type    Name    Value                      TTL
A       @       185.199.108.153           3600
A       @       185.199.109.153           3600
A       @       185.199.110.153           3600
A       @       185.199.111.153           3600
CNAME   www     petermarkdavid.github.io   3600
```

## Important Notes

### ⚠️ Don't Change Name Servers

- **DO NOT** change the name servers in Hostinger
- Keep using Hostinger's name servers
- Only modify DNS records (A, CNAME, etc.)

### ⚠️ Email Configuration

If you're using email with `dorothytarot.com`:
- **Keep** your MX records
- **Keep** any TXT records for email verification
- Only modify A records for the website

### ⚠️ Wait for Propagation

- DNS changes can take **1-24 hours** to propagate
- Usually works within **1-4 hours**
- GitHub Pages will automatically detect when DNS is correct

## Verify DNS Configuration

After adding records, verify they're working:

### Option 1: Use Online Tools

1. Go to [dnschecker.org](https://dnschecker.org)
2. Enter: `dorothytarot.com`
3. Select: **A record**
4. Click **Search**
5. Should show the 4 GitHub Pages IPs globally

### Option 2: Use Terminal

```bash
dig dorothytarot.com +short
```

Should return:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

## In GitHub Pages

1. Go to: https://github.com/petermarkdavid/Dorothy-Tarot/settings/pages
2. Under **"Custom domain"**, you should see `dorothytarot.com`
3. GitHub will show:
   - ✅ Green checkmark when DNS is correct
   - ⚠️ Warning while DNS is propagating
   - ❌ Error if DNS is wrong

## After DNS Propagates

1. **GitHub will automatically detect** correct DNS
2. The error message will disappear
3. **Enable HTTPS**:
   - Check **"Enforce HTTPS"** in GitHub Pages settings
   - Wait a few minutes for SSL certificate
4. Your site will be live at: `https://dorothytarot.com`

## Troubleshooting

### "Domain does not resolve" Error Persists

- Wait longer (can take up to 24 hours)
- Verify A records are exactly: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Check for typos in DNS records
- Clear browser cache

### Can't Add A Records in Hostinger

- Make sure you're in **"DNS / Name Servers"** tab
- Not in **"Name Servers"** tab (that's different)
- Try refreshing the page
- Contact Hostinger support if needed

### HTTPS Not Working

- Wait for DNS to fully propagate (24 hours)
- Then enable "Enforce HTTPS" in GitHub Pages
- SSL certificate generation can take a few minutes

## Quick Checklist

- [ ] Logged into Hostinger hPanel
- [ ] Found dorothytarot.com domain
- [ ] Opened DNS / Name Servers tab
- [ ] Removed old A records (if any)
- [ ] Added 4 new A records with GitHub Pages IPs
- [ ] Added CNAME for www (optional)
- [ ] Saved all changes
- [ ] Waiting for DNS propagation (1-24 hours)
- [ ] GitHub Pages will auto-detect when ready

## Need Help?

If you get stuck:
1. Take a screenshot of your DNS records in Hostinger
2. Check the exact error message in GitHub Pages settings
3. Verify the A records match exactly (no typos)

Once DNS propagates, your site will be live at `https://dorothytarot.com`! 🎉

