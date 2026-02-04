#!/bin/bash

# Vercel CI/CD Setup Helper
# This script helps you configure Vercel and GitHub integration

set -e

echo "🚀 Vercel CI/CD Setup Helper"
echo "=============================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo ""
    echo "Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

echo "Step 1: Login to Vercel"
echo "-------------------------"
echo "Opening browser for authentication..."
echo ""
vercel login
echo ""

echo "Step 2: Link Project to Vercel"
echo "--------------------------------"
echo "This will create/link your project to Vercel"
echo ""
vercel link
echo ""

echo "Step 3: Get Project Configuration"
echo "-----------------------------------"
echo "Reading Vercel project configuration..."
echo ""

if [ -f ".vercel/project.json" ]; then
    echo "✅ Found Vercel project configuration:"
    echo ""
    cat .vercel/project.json | grep -E '"orgId"|"projectId"' | sed 's/^[[:space:]]*/  /'
    echo ""

    # Extract values
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)

    echo ""
    echo "Step 4: Configure GitHub Secrets"
    echo "----------------------------------"
    echo ""
    echo "Add these secrets to your GitHub repository:"
    echo ""
    echo "  https://github.com/$(git config remote.get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions"
    echo ""
    echo "Required secrets:"
    echo ""
    echo "  Name              | Value"
    echo "  ------------------|--------------------------------------------------"
    echo "  VERCEL_TOKEN      | Get from: https://vercel.com/account/tokens"
    echo "  VERCEL_ORG_ID     | $ORG_ID"
    echo "  VERCEL_PROJECT_ID | $PROJECT_ID"
    echo ""

    echo "To get VERCEL_TOKEN:"
    echo "  1. Go to: https://vercel.com/account/tokens"
    echo "  2. Click 'Create Token'"
    echo "  3. Give it a name like 'GitHub Actions'"
    echo "  4. Copy the token and add as GitHub secret"
    echo ""

    echo "Optional secrets (for E2E testing):"
    echo ""
    echo "  Name              | Value"
    echo "  ------------------|----------------------------------------"
    echo "  E2E_ADMIN_EMAIL   | Your test admin email"
    echo "  E2E_ADMIN_PASSWORD | Your test admin password"
    echo ""

    echo "Step 5: Verify GitHub Actions Workflow"
    echo "----------------------------------------"
    echo ""
    if [ -f ".github/workflows/e2e-tests.yml" ]; then
        echo "✅ GitHub Actions workflow found!"
        echo ""
        echo "The workflow will run on:"
        echo "  - Pull requests to main branch"
        echo "  - Pushes to main branch"
        echo "  - Manual trigger from Actions tab"
        echo ""
    else
        echo "❌ GitHub Actions workflow not found!"
        echo "   Please create .github/workflows/e2e-tests.yml"
        echo ""
    fi

    echo "✅ Setup Complete!"
    echo ""
    echo "Next Steps:"
    echo "  1. Add the secrets to GitHub (see Step 4 above)"
    echo "  2. Commit and push your changes"
    echo "  3. Create a pull request to test the CI/CD pipeline"
    echo ""
    echo "For more information, see:"
    echo "  docs/VERCEL-CI-CD-GUIDE.md"
    echo ""

else
    echo "❌ Vercel project not found!"
    echo "   Make sure you ran 'vercel link' successfully"
    echo ""
    exit 1
fi
