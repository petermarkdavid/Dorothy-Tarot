#!/bin/bash

# Supabase CLI Setup Script for Ask Sian
# This script automates the Supabase setup process

set -e  # Exit on any error

echo "🚀 Setting up Supabase for Ask Sian..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    
    # Install Supabase CLI (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install supabase/tap/supabase
    # Install Supabase CLI (Linux)
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://supabase.com/install.sh | sh
    # Install Supabase CLI (Windows - requires WSL or Git Bash)
    else
        echo "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
        exit 1
    fi
fi

echo "✅ Supabase CLI installed"

# Login to Supabase
echo "🔐 Logging into Supabase..."
supabase login

# Link to your project
echo "🔗 Linking to your Supabase project..."
supabase link --project-ref eydmgvneewccqfylcsdh

# Create the database schema
echo "📊 Creating database schema..."
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.eydmgvneewccqfylcsdh.supabase.co:5432/postgres" < supabase-schema.sql

# Deploy the Edge Function
echo "⚡ Deploying Edge Function..."
supabase functions deploy send-email

# Set up environment variables
echo "🔧 Setting up environment variables..."
echo "Please set the following environment variables in your Supabase dashboard:"
echo "1. Go to: https://supabase.com/dashboard/project/eydmgvneewccqfylcsdh/settings/functions"
echo "2. Add these environment variables:"
echo "   - EMAIL_SERVICE=resend (or sendgrid/mailgun)"
echo "   - EMAIL_API_KEY=your_api_key_here"
echo "   - MAILGUN_DOMAIN=your_domain (if using Mailgun)"

echo ""
echo "🎉 Setup complete!"
echo "Next steps:"
echo "1. Set up your email service environment variables"
echo "2. Test the setup by running 'setupCheck()' in your browser console"
echo "3. Start using your application!"
