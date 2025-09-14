# Test the Dental Care API
Write-Host "Testing Dental Care Management System API" -ForegroundColor Green

# Test 1: Basic connectivity
Write-Host "`n1. Testing basic connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    Write-Host "✅ Basic connectivity: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login as Super Admin
Write-Host "`n2. Testing Super Admin login..." -ForegroundColor Yellow
$loginBody = @{
    email = "superadmin@dentalcare.com"
    password = "SuperAdmin123!"
    role = "super_admin"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "✅ Super Admin login successful" -ForegroundColor Green
    Write-Host "   User: $($loginData.user.firstName) $($loginData.user.lastName)" -ForegroundColor Cyan
    Write-Host "   Role: $($loginData.user.role)" -ForegroundColor Cyan
    Write-Host "   Token: $($loginData.access_token.Substring(0, 20))..." -ForegroundColor Cyan
    
    # Store token for next tests
    $global:authToken = $loginData.access_token
} catch {
    Write-Host "❌ Super Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error details: $errorContent" -ForegroundColor Red
    }
}

# Test 3: Create Organization (if login was successful)
if ($global:authToken) {
    Write-Host "`n3. Testing organization creation..." -ForegroundColor Yellow
    $orgBody = @{
        name = "Test Dental Practice"
        description = "A test dental practice for API testing"
        address = "123 Test Street"
        city = "Test City"
        state = "Test State"
        country = "Test Country"
        postalCode = "12345"
        phone = "1234567890"
        email = "test@dentalpractice.com"
    } | ConvertTo-Json

    try {
        $headers = @{
            "Authorization" = "Bearer $global:authToken"
            "Content-Type" = "application/json"
        }
        $orgResponse = Invoke-WebRequest -Uri "http://localhost:3000/organizations" -Method POST -Body $orgBody -Headers $headers -UseBasicParsing
        $orgData = $orgResponse.Content | ConvertFrom-Json
        Write-Host "✅ Organization created successfully" -ForegroundColor Green
        Write-Host "   Organization ID: $($orgData._id)" -ForegroundColor Cyan
        Write-Host "   Organization Name: $($orgData.name)" -ForegroundColor Cyan
        
        # Store org ID for next tests
        $global:orgId = $orgData._id
    } catch {
        Write-Host "❌ Organization creation failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "   Error details: $errorContent" -ForegroundColor Red
        }
    }
}

# Test 4: Get Organizations
if ($global:authToken) {
    Write-Host "`n4. Testing get organizations..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $global:authToken"
        }
        $orgsResponse = Invoke-WebRequest -Uri "http://localhost:3000/organizations" -Method GET -Headers $headers -UseBasicParsing
        $orgsData = $orgsResponse.Content | ConvertFrom-Json
        Write-Host "✅ Organizations retrieved successfully" -ForegroundColor Green
        Write-Host "   Total organizations: $($orgsData.Count)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Get organizations failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
