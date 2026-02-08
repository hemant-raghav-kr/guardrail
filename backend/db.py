from supabase import create_client
import os

# Render uses environment variables, not .env files
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
