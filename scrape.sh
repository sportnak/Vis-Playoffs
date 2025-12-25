#!/bin/bash

while true; do
  curl --request POST 'http://localhost:8000/functions/v1/scrape' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXd1bG9lY2VjZ3F6d3pyZXBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjAzMjM0MSwiZXhwIjoyMDUxNjA4MzQxfQ.Y5Rf4p2VIeb5YopejBAkVO_farepfrZ3V0rO9Cuu9UM' \
  
  echo "Current time: $(date)"
  # Wait for 5 minutes plus a random 30 seconds
  sleep $((300 + RANDOM % 30))
done
