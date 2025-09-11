// Simple test script to verify registration endpoint
const fetch = require('node-fetch');

const testData = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
  phone: "+1234567890",
  organizationName: "Test Clinic",
  organizationAddress: "123 Test Street",
  organizationPhone: "+1234567890",
  organizationEmail: "info@testclinic.com"
};

async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    console.log('URL: http://localhost:1337/api/auth/register');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:1337/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const result = await response.text();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegistration();
