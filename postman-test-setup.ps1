# Postman Test Setup Script for Dental Care Management System
# This script helps set up test data and tokens for Postman collection

Write-Host "🚀 Dental Care Management System - Postman Test Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:3000"
$superAdminEmail = "superadmin@dentalcare.com"
$superAdminPassword = "SuperAdmin123!"

# Test data
$testOrg = @{
    name = "Test Dental Practice"
    description = "A test dental practice for API testing"
    address = "123 Test Street"
    city = "Test City"
    state = "Test State"
    country = "Test Country"
    postalCode = "12345"
    phone = "1234567890"
    email = "test@dentalpractice.com"
}

$testBranch = @{
    name = "Test Branch"
    description = "Test branch for API testing"
    address = "456 Test Avenue"
    city = "Test City"
    state = "Test State"
    country = "Test Country"
    postalCode = "12346"
    phone = "1234567891"
    email = "testbranch@dentalpractice.com"
    branchAdminFirstName = "Test"
    branchAdminLastName = "Admin"
    branchAdminEmail = "testbranchadmin@example.com"
    branchAdminPassword = "password123"
    branchAdminPhone = "1234567892"
}

Write-Host "`n1. Testing server connectivity..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing
    Write-Host "✅ Server is running (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Please start the backend server first." -ForegroundColor Red
    Write-Host "   Run: npm run start:dev" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n2. Logging in as Super Admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $superAdminEmail
        password = $superAdminPassword
        role = "super_admin"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $superAdminToken = $loginData.access_token
    
    Write-Host "✅ Super Admin login successful" -ForegroundColor Green
    Write-Host "   Token: $($superAdminToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Super Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Creating test organization..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $superAdminToken"
        "Content-Type" = "application/json"
    }
    
    $orgResponse = Invoke-WebRequest -Uri "$baseUrl/organizations" -Method POST -Body ($testOrg | ConvertTo-Json) -Headers $headers -UseBasicParsing
    $orgData = $orgResponse.Content | ConvertFrom-Json
    $organizationId = $orgData._id
    
    Write-Host "✅ Organization created successfully" -ForegroundColor Green
    Write-Host "   Organization ID: $organizationId" -ForegroundColor Cyan
    Write-Host "   Organization Name: $($orgData.name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Organization creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Creating Organization Admin..." -ForegroundColor Yellow
try {
    $orgAdminData = @{
        firstName = "Test"
        lastName = "OrgAdmin"
        email = "testorgadmin@example.com"
        password = "password123"
        phone = "1234567890"
        organizationId = $organizationId
    }
    
    $orgAdminResponse = Invoke-WebRequest -Uri "$baseUrl/auth/organization-admin" -Method POST -Body ($orgAdminData | ConvertTo-Json) -Headers $headers -UseBasicParsing
    $orgAdminResult = $orgAdminResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Organization Admin created successfully" -ForegroundColor Green
    Write-Host "   Email: $($orgAdminData.email)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Organization Admin creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Logging in as Organization Admin..." -ForegroundColor Yellow
try {
    $orgAdminLoginBody = @{
        email = "testorgadmin@example.com"
        password = "password123"
        role = "organization_admin"
    } | ConvertTo-Json

    $orgAdminLoginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $orgAdminLoginBody -ContentType "application/json" -UseBasicParsing
    $orgAdminLoginData = $orgAdminLoginResponse.Content | ConvertFrom-Json
    $orgAdminToken = $orgAdminLoginData.access_token
    
    Write-Host "✅ Organization Admin login successful" -ForegroundColor Green
    Write-Host "   Token: $($orgAdminToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Organization Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n6. Creating test branch..." -ForegroundColor Yellow
try {
    $testBranch.organizationId = $organizationId
    $branchHeaders = @{
        "Authorization" = "Bearer $orgAdminToken"
        "Content-Type" = "application/json"
    }
    
    $branchResponse = Invoke-WebRequest -Uri "$baseUrl/branches" -Method POST -Body ($testBranch | ConvertTo-Json) -Headers $branchHeaders -UseBasicParsing
    $branchData = $branchResponse.Content | ConvertFrom-Json
    $branchId = $branchData._id
    
    Write-Host "✅ Branch created successfully" -ForegroundColor Green
    Write-Host "   Branch ID: $branchId" -ForegroundColor Cyan
    Write-Host "   Branch Name: $($branchData.name)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Branch creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n7. Creating test users..." -ForegroundColor Yellow

# Create Doctor
try {
    $doctorData = @{
        firstName = "Dr. Test"
        lastName = "Doctor"
        email = "testdoctor@example.com"
        password = "password123"
        phone = "1234567893"
        specialization = "General Dentistry"
        licenseNumber = "DENT123456"
        branchId = $branchId
        organizationId = $organizationId
    }
    
    $doctorResponse = Invoke-WebRequest -Uri "$baseUrl/auth/doctor" -Method POST -Body ($doctorData | ConvertTo-Json) -Headers $branchHeaders -UseBasicParsing
    Write-Host "✅ Doctor created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Doctor creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Create Receptionist
try {
    $receptionistData = @{
        firstName = "Test"
        lastName = "Receptionist"
        email = "testreceptionist@example.com"
        password = "password123"
        phone = "1234567894"
        branchId = $branchId
        organizationId = $organizationId
    }
    
    $receptionistResponse = Invoke-WebRequest -Uri "$baseUrl/auth/receptionist" -Method POST -Body ($receptionistData | ConvertTo-Json) -Headers $branchHeaders -UseBasicParsing
    Write-Host "✅ Receptionist created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Receptionist creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test Setup Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

Write-Host "`n📋 Postman Environment Variables to Set:" -ForegroundColor Cyan
Write-Host "base_url: $baseUrl" -ForegroundColor White
Write-Host "super_admin_token: $($superAdminToken.Substring(0, 20))..." -ForegroundColor White
Write-Host "organization_admin_token: $($orgAdminToken.Substring(0, 20))..." -ForegroundColor White
Write-Host "organization_id: $organizationId" -ForegroundColor White
Write-Host "branch_id: $branchId" -ForegroundColor White

Write-Host "`n👥 Test User Credentials:" -ForegroundColor Cyan
Write-Host "Super Admin: $superAdminEmail / $superAdminPassword" -ForegroundColor White
Write-Host "Org Admin: testorgadmin@example.com / password123" -ForegroundColor White
Write-Host "Doctor: testdoctor@example.com / password123" -ForegroundColor White
Write-Host "Receptionist: testreceptionist@example.com / password123" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Import the Postman collection and environment files" -ForegroundColor White
Write-Host "2. Set the environment variables shown above" -ForegroundColor White
Write-Host "3. Start testing the API endpoints!" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "- API Documentation: API_DOCUMENTATION.md" -ForegroundColor White
Write-Host "- Postman Collection README: POSTMAN_COLLECTION_README.md" -ForegroundColor White
Write-Host "- Cloudinary Setup: CLOUDINARY_SETUP.md" -ForegroundColor White
