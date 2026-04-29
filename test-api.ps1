# QA AI Assistant - API Test Script
# Run this in PowerShell to test your API endpoints

Write-Host "🚀 Testing QA AI Assistant API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    
    Write-Host "✅ Server Status: OK" -ForegroundColor Green
    Write-Host "   - AI Service: $($healthData.aiServiceEnabled)" -ForegroundColor White
    Write-Host "   - Hybrid Mode: $($healthData.hybridMode)" -ForegroundColor White
    Write-Host "   - System AI: $($healthData.systemAIConfigured)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Server is not running!" -ForegroundColor Red
    Write-Host "   Run: node server-hybrid.js" -ForegroundColor Yellow
    exit
}

# Test 2: Check if user is logged in
Write-Host "2️⃣  Testing Authentication..." -ForegroundColor Yellow

# Get token from user
$token = Read-Host "Enter your JWT token (or press Enter to skip authenticated tests)"

if ($token) {
    # Test Credits Endpoint
    Write-Host ""
    Write-Host "3️⃣  Testing Credits Endpoint..." -ForegroundColor Yellow
    try {
        $credits = Invoke-WebRequest -Uri "http://localhost:8000/api/credits" `
            -Headers @{Authorization="Bearer $token"} `
            -UseBasicParsing
        
        $creditsData = $credits.Content | ConvertFrom-Json
        
        Write-Host "✅ Credits Retrieved" -ForegroundColor Green
        Write-Host "   - Credits: $($creditsData.credits)" -ForegroundColor White
        Write-Host "   - Plan: $($creditsData.plan)" -ForegroundColor White
        Write-Host "   - Has API Key: $($creditsData.hasApiKey)" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to get credits" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Test AI Check Endpoint
    Write-Host "4️⃣  Testing AI Availability..." -ForegroundColor Yellow
    try {
        $aiCheck = Invoke-WebRequest -Uri "http://localhost:8000/api/ai/check?module=test-case-architect" `
            -Headers @{Authorization="Bearer $token"} `
            -UseBasicParsing
        
        $aiCheckData = $aiCheck.Content | ConvertFrom-Json
        
        Write-Host "✅ AI Check Complete" -ForegroundColor Green
        Write-Host "   - Can Use AI: $($aiCheckData.canUseAI)" -ForegroundColor White
        Write-Host "   - Mode: $($aiCheckData.mode)" -ForegroundColor White
        Write-Host "   - Credits: $($aiCheckData.credits)" -ForegroundColor White
        Write-Host "   - Required: $($aiCheckData.requiredCredits)" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to check AI availability" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Test AI Generation
    Write-Host "5️⃣  Testing AI Generation..." -ForegroundColor Yellow
    $testAI = Read-Host "Do you want to test AI generation? (y/n)"
    
    if ($testAI -eq "y") {
        try {
            $body = @{
                prompt = "Generate 3 test cases for user login functionality"
                module = "test-case-architect"
            } | ConvertTo-Json

            $aiGen = Invoke-WebRequest -Uri "http://localhost:8000/api/ai/generate" `
                -Method POST `
                -Headers @{
                    Authorization="Bearer $token"
                    "Content-Type"="application/json"
                } `
                -Body $body `
                -UseBasicParsing
            
            $aiGenData = $aiGen.Content | ConvertFrom-Json
            
            Write-Host "✅ AI Generation Successful" -ForegroundColor Green
            Write-Host "   - Mode: $($aiGenData.mode)" -ForegroundColor White
            Write-Host "   - Provider: $($aiGenData.provider)" -ForegroundColor White
            Write-Host "   - Credits Used: $($aiGenData.creditsUsed)" -ForegroundColor White
            if ($aiGenData.creditsRemaining) {
                Write-Host "   - Credits Remaining: $($aiGenData.creditsRemaining)" -ForegroundColor White
            }
            Write-Host ""
            Write-Host "📝 Generated Content:" -ForegroundColor Cyan
            Write-Host $aiGenData.content.Substring(0, [Math]::Min(200, $aiGenData.content.Length)) -ForegroundColor White
            Write-Host "..." -ForegroundColor White
            Write-Host ""
        } catch {
            Write-Host "❌ Failed to generate AI response" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host ""
        }
    }
} else {
    Write-Host "⏭️  Skipping authenticated tests" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get a JWT token:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:8000 in browser" -ForegroundColor White
    Write-Host "2. Login to your account" -ForegroundColor White
    Write-Host "3. Open browser console (F12)" -ForegroundColor White
    Write-Host "4. Run: localStorage.getItem('supabase.auth.token')" -ForegroundColor White
    Write-Host ""
}

Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - API Docs: API-DOCUMENTATION.md" -ForegroundColor White
Write-Host "   - Setup Guide: ENV-SETUP-GUIDE.md" -ForegroundColor White
Write-Host "   - Quick Start: QUICK-START.md" -ForegroundColor White
Write-Host ""
