#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Interview Assistant Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Error: Git repository not initialized${NC}"
    echo "Run: git init"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Warning: You have uncommitted changes${NC}"
    read -p "Commit changes now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
    else
        echo "Please commit or stash changes before deploying"
        exit 1
    fi
fi

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
else
    echo -e "${RED}✗ Failed to push to GitHub${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Deployment initiated!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Vercel will automatically deploy your frontend"
echo "2. Railway will automatically deploy your backend"
echo ""
echo -e "${BLUE}Check deployment status:${NC}"
echo "• Vercel: https://vercel.com/dashboard"
echo "• Railway: https://railway.app/dashboard"
echo ""
echo -e "${GREEN}Done!${NC}"

