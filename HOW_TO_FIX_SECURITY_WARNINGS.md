# How to Fix Security Warnings in Supabase

## The Problem

Supabase is showing security warnings about functions having a "role mutable search_path". This is a security vulnerability that could allow attackers to manipulate which database schemas are searched.

## The Solution

Run the SQL script to fix all three functions by setting a secure `search_path`.

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your Dorothy Tarot project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy and Paste the Fix

1. Open the file: `FIX_SECURITY_WARNINGS.sql`
2. Copy all the SQL code
3. Paste it into the Supabase SQL Editor

### Step 3: Run the Query

1. Click the **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
2. Wait for it to complete
3. You should see: "Success. No rows returned"

### Step 4: Verify the Fix

1. Go to **Settings** → **Database** → **Advisors**
2. Check the **Security** section
3. The warnings should be gone! ✅

## What This Does

The fix adds `SET search_path = public` to each function, which:
- ✅ Locks the function to only use the `public` schema
- ✅ Prevents attackers from manipulating schema search order
- ✅ Makes the functions secure according to Supabase standards

## Functions Fixed

1. ✅ `cleanup_expired_readings()` - Cleans up expired readings
2. ✅ `get_reading_stats()` - Returns reading statistics
3. ✅ `get_email_stats()` - Returns email statistics
4. ✅ `increment_reading_view_count()` - Increments view count
5. ✅ `increment_reading_share_count()` - Increments share count

## Alternative: Quick Fix via Supabase Dashboard

If you prefer, you can also:

1. Go to **Database** → **Functions**
2. Click on each function
3. Click **"Edit"**
4. Add `SET search_path = public` after `LANGUAGE plpgsql`
5. Click **"Save"**

But using the SQL script is faster and fixes all functions at once!

## After Running the Fix

- ✅ Security warnings will disappear
- ✅ Functions will continue to work exactly the same
- ✅ Your application won't be affected
- ✅ Security will be improved

## Need Help?

If you see any errors when running the script:
1. Check that you're in the correct Supabase project
2. Make sure you have the right permissions
3. Check the error message - it will tell you what's wrong

