#!/bin/bash
cd "$(dirname "$0")/src"
source ../venv/bin/activate

# Load environment variables
export DATABASE_URL="postgresql://neondb_owner:npg_V2ALZjiI5qtr@ep-dark-hill-aiwdm4cf-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Start uvicorn
python -m uvicorn catchweight.api.main:app --reload --port 8000 --host 127.0.0.1
