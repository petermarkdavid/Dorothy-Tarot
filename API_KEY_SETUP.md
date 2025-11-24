# 🔐 OpenAI API Key Setup for Dorothy Tarot

## Quick Setup

To enable AI-powered tarot interpretations on Dorothy Tarot, you need to add your OpenAI API key.

### Option 1: Add to brand-config.js (Recommended)

1. Open `deployment/dorothy-tarot/js/brand-config.js`
2. Find the `openai` section (around line 139)
3. Replace `null` with your API key:

```javascript
openai: {
    defaultApiKey: 'sk-proj-your-actual-key-here'  // Add your OpenAI API key here
}
```

4. Save and deploy the changes

### Option 2: Enter in UI (User-facing)

Users can enter their own API key in the browser:
1. Scroll to the "Enhanced AI Interpretations" section
2. Enter API key in the input field
3. Click "Save Key"
4. Key is stored locally in their browser

## Getting Your API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-`)
5. Add it to `brand-config.js` as shown above

## Using the Same Key as Ask Sian

If you want to use the same API key for both sites:

1. Get the API key from Ask Sian's `js/brand-config.js` (or wherever it's stored)
2. Add the same key to Dorothy's `deployment/dorothy-tarot/js/brand-config.js`
3. Both sites will use the same key

## Security Notes

- ✅ API keys in `brand-config.js` are safe for client-side use
- ✅ Keys are never exposed in the UI (if set as default)
- ✅ Users can override with their own key if needed
- ⚠️ Don't commit API keys to public repositories (use .gitignore)

## Troubleshooting

### "No API key found" error
- Check browser console for detailed error messages
- Verify the key is in `brand-config.js` with correct format
- Make sure the key starts with `sk-proj-`
- Check that `brand-config.js` is loaded before `script.js`

### API calls failing
- Verify your API key is valid at https://platform.openai.com/api-keys
- Check you have credits in your OpenAI account
- Check browser console for specific error messages
- Verify network requests aren't being blocked

### Testing
1. Open browser console (F12)
2. Look for: `✅ Using default API key from config for AI readings`
3. Try creating a reading with a question
4. Should see: `🤖 Starting AI interpretation...`
5. If errors, check console for details

