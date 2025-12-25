#!/bin/bash

curl --request POST 'http://localhost:8000/functions/v1/scrape-schedule' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXd1bG9lY2VjZ3F6d3pyZXBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjAzMjM0MSwiZXhwIjoyMDUxNjA4MzQxfQ.Y5Rf4p2VIeb5YopejBAkVO_farepfrZ3V0rO9Cuu9UM'

echo ""
echo "Schedule scrape complete at $(date)"
