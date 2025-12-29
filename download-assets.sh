#!/bin/bash

# Script to download Goalie Gen logo and favicon assets
# Run this script from the repository root directory

set -e

echo "Downloading Goalie Gen logo and favicon assets..."
echo

# Create directories if they don't exist
mkdir -p static/images
mkdir -p static/favicons

# Download logos
echo "Downloading logos..."
curl -L "https://github.com/user-attachments/assets/f726d0dd-3f09-41c7-83eb-f0168dcd956e" -o static/images/logo-dark.png
echo "✓ Dark mode logo downloaded"

curl -L "https://github.com/user-attachments/assets/bc61a67e-ccf2-43e0-aee0-d5937b8cc60e" -o static/images/logo-light.png
echo "✓ Light mode logo downloaded"

curl -L "https://github.com/user-attachments/assets/e80a3a04-7b54-467c-94fb-e7d546e15cae" -o static/images/logo-alt-dark.png
echo "✓ Dark mode alternate logo downloaded"

curl -L "https://github.com/user-attachments/assets/a1d98209-857a-4e62-9d92-bef18268c297" -o static/images/logo-alt-light.png
echo "✓ Light mode alternate logo downloaded"

# Download favicon zips
echo
echo "Downloading favicon archives..."
curl -L "https://github.com/user-attachments/files/24362453/gg-favicon.zip" -o /tmp/gg-favicon.zip
echo "✓ Light mode favicon archive downloaded"

curl -L "https://github.com/user-attachments/files/24362454/gg-favicon-darkmode.zip" -o /tmp/gg-favicon-darkmode.zip
echo "✓ Dark mode favicon archive downloaded"

# Extract favicons
echo
echo "Extracting favicons..."
if command -v unzip &> /dev/null; then
    unzip -q /tmp/gg-favicon.zip -d /tmp/gg-favicon-light
    cp /tmp/gg-favicon-light/favicon.ico static/favicon.ico
    echo "✓ Light mode favicon extracted and installed"
    
    unzip -q /tmp/gg-favicon-darkmode.zip -d /tmp/gg-favicon-dark
    echo "✓ Dark mode favicon extracted (in /tmp/gg-favicon-dark)"
else
    echo "⚠ unzip command not found. Please manually extract the zip files:"
    echo "  - /tmp/gg-favicon.zip"
    echo "  - /tmp/gg-favicon-darkmode.zip"
fi

echo
echo "✅ Download complete!"
echo
echo "Next steps:"
echo "1. Run 'npm run clean' to clear the Gatsby cache"
echo "2. Run 'npm run develop' to test the changes"
echo "3. Verify logos and favicons display correctly"
