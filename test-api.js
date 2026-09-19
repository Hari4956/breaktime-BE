/**
 * test-api.js
 * 
 * A simple script to test our Express server endpoints.
 * This script runs in Node.js and uses the built-in 'fetch' function (available in Node 18+).
 * 
 * To run this:
 * 1. Start the server (e.g. node server.js)
 * 2. In a separate terminal, run: node test-api.js
 */

const BASE_URL = 'http://localhost:5050/api/auth';
const ROOT_URL = 'http://localhost:5050';

// Generate a random email for each test run so registration doesn't fail due to duplicate email
const testEmail = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
const testPassword = 'securepassword123';
let jwtToken = ''; // Will store the token returned during login/registration

async function runTests() {
  console.log('=== STARTING API TESTS ===\n');

  // Test 1: Root endpoint check
  try {
    console.log('Testing Root API...');
    const res = await fetch(ROOT_URL);
    const data = await res.json();
    console.log(`Root Response [Status ${res.status}]:`, data);
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Error connecting to server. Is it running?', error.message);
    return;
  }

  // Test 2: Register a new user
  try {
    console.log(`Testing User Registration (Email: ${testEmail})...`);
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: testEmail,
        password: testPassword,
        phone: '+1234567890',
        role: 'customer' // customer role
      })
    });
    
    const data = await res.json();
    console.log(`Register Response [Status ${res.status}]:`, data);
    
    if (!data.success) {
      console.error('Registration failed! Stopping tests.');
      return;
    }
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Registration Error:', error.message);
    return;
  }

  // Test 3: Login User
  try {
    console.log(`Testing User Login...`);
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const data = await res.json();
    console.log(`Login Response [Status ${res.status}]:`, data);

    if (data.success && data.data.token) {
      jwtToken = data.data.token;
      console.log('JWT Token successfully acquired!');
    } else {
      console.error('Login failed! Stopping tests.');
      return;
    }
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Login Error:', error.message);
    return;
  }

  // Test 4: Get Profile (Without Token - Should Fail)
  try {
    console.log('Testing GET Profile (WITHOUT JWT Token - Expecting 401 Unauthorized)...');
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET'
    });
    const data = await res.json();
    console.log(`Response [Status ${res.status}]:`, data);
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Error fetching profile without token:', error.message);
  }

  // Test 5: Get Profile (With Token - Should Succeed)
  try {
    console.log('Testing GET Profile (WITH JWT Token)...');
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    const data = await res.json();
    console.log(`Response [Status ${res.status}]:`, data);
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Error fetching profile with token:', error.message);
  }

  // Test 6: Update Profile (Add delivery address and change phone)
  try {
    console.log('Testing UPDATE Profile (Adding delivery address)...');
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        phone: '+1987654321', // updated phone
        addresses: [
          {
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            isDefault: true
          },
          {
            street: '456 Business Road',
            city: 'Boston',
            state: 'MA',
            zipCode: '02108',
            isDefault: false
          }
        ]
      })
    });
    const data = await res.json();
    console.log(`Update Response [Status ${res.status}]:`, data);
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('Error updating profile:', error.message);
  }

  console.log('=== ALL TESTS COMPLETED ===');
}

// Run the test runner
runTests();
