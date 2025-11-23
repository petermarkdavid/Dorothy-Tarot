# Cleanup Plan for Dorothy Tarot

## Files to Remove (Not Needed in Production)

### Documentation Files (Consolidate)
- `DEPLOYMENT_STATUS.md` - Can be removed, info in README
- `ENABLE_PAGES.md` - One-time setup, not needed after deployment
- `DNS_SETUP.md` - Generic, keep HOSTINGER_DNS_SETUP.md if needed
- Keep: `README.md` (main documentation)

### Unused Scripts
- `assets/deploy.sh` - Old deployment script, not needed for GitHub Pages
- `assets/setup-supabase-cli.sh` - Setup script, not needed in production

### Keep These
- `CNAME` - Needed for custom domain
- `README.md` - Main documentation
- `HOSTINGER_DNS_SETUP.md` - Useful reference for DNS
- All code files (js/, css/, images/, assets/)
- `index.html` - Main file

## Cleanup Actions

1. Remove redundant documentation
2. Remove unused scripts
3. Update .gitignore if needed
4. Clean up any temporary files
5. Consolidate documentation into README

