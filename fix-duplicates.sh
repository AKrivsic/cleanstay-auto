#!/bin/bash

# Script to fix duplicate dynamic exports in API routes

API_ROUTES=(
  "src/app/api/admin/data/delete/route.ts"
  "src/app/api/admin/data/export/route.ts"
  "src/app/api/admin/events/route.ts"
  "src/app/api/admin/inventory/route.ts"
  "src/app/api/admin/metrics/aggregate/route.ts"
  "src/app/api/admin/notify/whatsapp/route.ts"
  "src/app/api/admin/recommend/route.ts"
  "src/app/api/admin/schedule/tomorrow/route.ts"
  "src/app/api/admin/supplies/route.ts"
  "src/app/api/ai/parse/route.ts"
  "src/app/api/confirm/cleaning/[id]/route.ts"
  "src/app/api/ingest/route.ts"
  "src/app/api/media/ingest/route.ts"
  "src/app/api/webhook/whatsapp/route.ts"
)

for route in "${API_ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "Fixing $route..."
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Keep only the first occurrence of dynamic exports and remove duplicates
    awk '
    BEGIN { found_dynamic = 0 }
    /^\/\/ Force dynamic rendering for API routes$/ && !found_dynamic {
      found_dynamic = 1
      print
      getline; print
      getline; print
      getline; print
      next
    }
    /^\/\/ Force dynamic rendering for API routes$/ && found_dynamic {
      # Skip the duplicate block
      getline; getline; getline; getline
      next
    }
    { print }
    ' "$route" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$route"
    echo "Fixed $route"
  else
    echo "File $route not found"
  fi
done

echo "Done fixing duplicate exports"
