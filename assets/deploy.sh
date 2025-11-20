#!/bin/bash

# Ask Sian Deployment Script
# This script helps prepare your files for deployment

echo "🔮 Ask Sian Deployment Preparation"
echo "=================================="

# Create deployment directory
mkdir -p deployment
echo "✅ Created deployment directory"

# Copy all necessary files
cp index.html deployment/
cp styles.css deployment/
cp script.js deployment/
cp tarot-data.js deployment/
cp zodiac-data.js deployment/
cp chatgpt-integration.js deployment/
cp setup-api.js deployment/
cp google-ads-config.js deployment/
cp robots.txt deployment/
cp sitemap.xml deployment/
cp .htaccess deployment/
cp 404.html deployment/
cp 500.html deployment/

echo "✅ Copied all files to deployment directory"

# Create a simple favicon (you can replace this with a real one)
echo "Creating basic favicon..."
# This would create a simple favicon - you should replace with a proper one

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Upload all files from the 'deployment' folder to your web hosting"
echo "2. Point your domain asksian.com to your hosting"
echo "3. Set up Google AdSense ad units"
echo "4. Test your site at https://asksian.com"
echo ""
echo "Files ready in: ./deployment/"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
