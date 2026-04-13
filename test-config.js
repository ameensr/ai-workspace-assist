// test-config.js - Add this file to enable test mode

const TEST_MODE = true; // Set to false for production

// Mock responses for testing
const MOCK_RESPONSES = {
    requirementIntelligence: `{
        "corrected_spec": "User Authentication Feature: Users must be able to securely log in using email and password credentials. The system shall validate credentials against the database, implement rate limiting (5 attempts per 15 minutes), support password reset functionality, and maintain session security with JWT tokens.",
        "gaps": [
            "Missing specification for password complexity requirements (minimum length, special characters)",
            "No mention of multi-factor authentication (MFA) support",
            "Unclear session timeout duration and refresh token strategy",
            "Missing error handling for account lockout scenarios",
            "No specification for 'Remember Me' functionality",
            "Accessibility requirements not defined (screen reader support, keyboard navigation)"
        ],
        "test_scenarios": [
            "Verify successful login with valid email and password",
            "Verify login rejection with invalid email format",
            "Verify login rejection with incorrect password",
            "Verify account lockout after 5 failed login attempts",
            "Verify session expires after specified timeout period",
            "Verify password reset link generation and validation",
            "Verify JWT token refresh mechanism",
            "Verify login works across different browsers (Chrome, Firefox, Safari)",
            "Verify login from mobile devices (iOS, Android)",
            "Verify SQL injection prevention in login form",
            "Verify XSS attack prevention in input fields",
            "Verify rate limiting prevents brute force attacks",
            "Verify 'Remember Me' checkbox persists session correctly",
            "Verify logout clears session tokens properly",
            "Verify concurrent login sessions from different devices"
        ]
    }`,

    testSuite: `Test Case ID | Module | Sub Module | Pre-Condition | Test Case | Steps | Test Data | Expected Result | Actual Result | Date | Status | Bug Id | Retest Status | Remarks
TC_AUTH_001 | Authentication | Login | User account exists in database | Valid Login Test | 1. Navigate to login page 2. Enter valid email 3. Enter valid password 4. Click Login | Email: test@example.com, Password: Test@123 | User successfully logged in and redirected to dashboard | | | | | | 
TC_AUTH_002 | Authentication | Login | User account exists | Invalid Password Test | 1. Navigate to login page 2. Enter valid email 3. Enter wrong password 4. Click Login | Email: test@example.com, Password: Wrong123 | Error message displayed: "Invalid credentials" | | | | | | 
TC_AUTH_003 | Authentication | Login | User account exists | Invalid Email Format | 1. Enter invalid email format 2. Enter password 3. Click Login | Email: invalid-email, Password: Test@123 | Error message: "Please enter valid email format" | | | | | | 
TC_AUTH_004 | Authentication | Login | None | Empty Fields Test | 1. Leave email field empty 2. Leave password field empty 3. Click Login | Email: (empty), Password: (empty) | Error messages displayed for both fields | | | | | | 
TC_AUTH_005 | Authentication | Login | User account exists | SQL Injection Test | 1. Enter SQL injection in email field 2. Click Login | Email: admin'--, Password: anything | Login rejected, no database breach | | | | | | 
TC_AUTH_006 | Authentication | Login | User account exists | XSS Attack Test | 1. Enter XSS script in input fields 2. Submit form | Email: <script>alert('xss')</script> | Script not executed, input sanitized | | | | | | 
TC_AUTH_007 | Authentication | Rate Limiting | User account exists | Brute Force Prevention | 1. Attempt login 5 times with wrong password 2. Try 6th attempt | Various passwords | Account locked after 5 attempts | | | | | | 
TC_AUTH_008 | Authentication | Login | User account exists | Session Timeout | 1. Login successfully 2. Wait for timeout period 3. Try to access protected page | Valid credentials | Session expired, redirect to login | | | | | | 
TC_AUTH_009 | Authentication | Login | User account exists | Remember Me Feature | 1. Login with valid credentials 2. Check "Remember Me" 3. Close browser 4. Reopen | Valid credentials + checkbox | Session persists after browser restart | | | | | | 
TC_AUTH_010 | Authentication | Logout | User logged in | Logout Functionality | 1. Click logout button 2. Try to access dashboard URL directly | N/A | User logged out, redirected to login | | | | | | 
TC_AUTH_011 | Authentication | Login | User account exists | Mobile Login - iOS | 1. Open app on iPhone 2. Enter credentials 3. Login | Valid credentials | Successful login on iOS device | | | | | | 
TC_AUTH_012 | Authentication | Login | User account exists | Mobile Login - Android | 1. Open app on Android 2. Enter credentials 3. Login | Valid credentials | Successful login on Android device | | | | | | 
TC_AUTH_013 | Authentication | Login | User account exists | Browser Compatibility - Chrome | 1. Open in Chrome 2. Perform login | Valid credentials | Login works in Chrome browser | | | | | | 
TC_AUTH_014 | Authentication | Login | User account exists | Browser Compatibility - Firefox | 1. Open in Firefox 2. Perform login | Valid credentials | Login works in Firefox browser | | | | | | 
TC_AUTH_015 | Authentication | Login | User account exists | Browser Compatibility - Safari | 1. Open in Safari 2. Perform login | Valid credentials | Login works in Safari browser | | | | | | 
TC_AUTH_016 | Authentication | Password Reset | User account exists | Password Reset Request | 1. Click "Forgot Password" 2. Enter email 3. Submit | Email: test@example.com | Reset link sent to email | | | | | | 
TC_AUTH_017 | Authentication | Login | User account exists | Special Characters in Password | 1. Login with password containing special chars | Password: P@$$w0rd!#% | Login successful with special characters | | | | | | 
TC_AUTH_018 | Authentication | Login | None | Performance Test - Response Time | 1. Enter credentials 2. Measure login time | Valid credentials | Login completes within 2 seconds | | | | | | 
TC_AUTH_019 | Authentication | Login | User account exists | Concurrent Sessions | 1. Login from Device A 2. Login from Device B with same account | Valid credentials | Both sessions active or last login prevails | | | | | | 
TC_AUTH_020 | Authentication | Security | User account exists | JWT Token Validation | 1. Login successfully 2. Inspect JWT token 3. Verify expiration | Valid credentials | Token has proper expiration and signature | | | | | |`,

    bugReport: `<div class="space-y-6">
        <div>
            <h3 class="text-lg font-bold text-red-600 mb-2">🐛 BUG-2024-0412</h3>
            <h2 class="text-2xl font-bold mb-4">Login Page Fails to Validate Email Format</h2>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <strong class="text-slate-600">Severity:</strong>
                <span class="ml-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Medium</span>
            </div>
            <div>
                <strong class="text-slate-600">Priority:</strong>
                <span class="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">High</span>
            </div>
            <div>
                <strong class="text-slate-600">Environment:</strong>
                <span class="ml-2">Chrome 122.0, Windows 11, Production</span>
            </div>
            <div>
                <strong class="text-slate-600">Reporter:</strong>
                <span class="ml-2">QA Team</span>
            </div>
        </div>

        <div>
            <h4 class="font-bold mb-2">Description:</h4>
            <p class="text-slate-700 leading-relaxed">
                The login form accepts invalid email formats (e.g., "user@domain" without TLD, "user.domain.com" without @) and submits them to the backend. This causes unnecessary API calls and poor user experience as validation should occur on the client-side before submission.
            </p>
        </div>

        <div>
            <h4 class="font-bold mb-2">Steps to Reproduce:</h4>
            <ol class="list-decimal list-inside space-y-1 text-slate-700">
                <li>Navigate to login page (https://app.example.com/login)</li>
                <li>Enter invalid email: "testuser@domain" (missing .com/.org)</li>
                <li>Enter any password</li>
                <li>Click "Login" button</li>
                <li>Observe that form submits without client-side validation</li>
            </ol>
        </div>

        <div>
            <h4 class="font-bold mb-2">Expected Result:</h4>
            <p class="text-green-700 bg-green-50 p-3 rounded-lg">
                Email field should display inline error: "Please enter a valid email address (e.g., user@example.com)" and prevent form submission until corrected.
            </p>
        </div>

        <div>
            <h4 class="font-bold mb-2">Actual Result:</h4>
            <p class="text-red-700 bg-red-50 p-3 rounded-lg">
                Form submits with invalid email, backend returns 400 error, no user-friendly message displayed, wasted API call.
            </p>
        </div>

        <div>
            <h4 class="font-bold mb-2">Attachments:</h4>
            <ul class="text-sm text-blue-600">
                <li>• Screenshot: login-validation-bug.png</li>
                <li>• Network logs: login-api-call.har</li>
            </ul>
        </div>

        <div>
            <h4 class="font-bold mb-2">Suggested Fix:</h4>
            <p class="text-slate-700">
                Add HTML5 email validation: <code class="bg-slate-100 px-2 py-1 rounded">type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"</code> and JavaScript validation before form submission.
            </p>
        </div>
    </div>`,

    sentenceCorrection: `{
        "corrected": "The login functionality should validate user credentials and provide appropriate error messages for invalid inputs.",
        "casual": "The login should check if users entered the right stuff and tell them when something's wrong.",
        "formal": "The authentication module shall validate user credentials against stored records and present contextually appropriate error notifications in the event of invalid input submissions."
    }`,

    professionalCase: `<div class="space-y-6">
        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <h3 class="font-bold text-blue-900 mb-2">Test Objective</h3>
            <p class="text-slate-700">
                Verify that the user authentication system correctly validates credentials, handles invalid inputs gracefully, and maintains security best practices including rate limiting and session management.
            </p>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
            <h3 class="font-bold text-purple-900 mb-2">Preconditions</h3>
            <ul class="list-disc list-inside text-slate-700 space-y-1">
                <li>Test user account exists in database with email: testuser@example.com</li>
                <li>Password for test account: Test@12345</li>
                <li>Application is deployed and accessible</li>
                <li>Database is in clean state with no previous failed login attempts</li>
            </ul>
        </div>

        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
            <h3 class="font-bold text-green-900 mb-3">Test Steps</h3>
            <ol class="space-y-3">
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <div>
                        <p class="font-medium text-slate-900">Navigate to Login Page</p>
                        <p class="text-sm text-slate-600">Open browser and go to https://app.example.com/login</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <div>
                        <p class="font-medium text-slate-900">Enter Valid Credentials</p>
                        <p class="text-sm text-slate-600">Email: testuser@example.com | Password: Test@12345</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <div>
                        <p class="font-medium text-slate-900">Submit Login Form</p>
                        <p class="text-sm text-slate-600">Click "Login" button and observe response</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                    <div>
                        <p class="font-medium text-slate-900">Verify Dashboard Access</p>
                        <p class="text-sm text-slate-600">Check URL changes to /dashboard and user data loads</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                    <div>
                        <p class="font-medium text-slate-900">Test Invalid Password</p>
                        <p class="text-sm text-slate-600">Logout, then login with wrong password: WrongPass123</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">6</span>
                    <div>
                        <p class="font-medium text-slate-900">Verify Error Handling</p>
                        <p class="text-sm text-slate-600">Confirm error message displays: "Invalid credentials"</p>
                    </div>
                </li>
            </ol>
        </div>

        <div class="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600">
            <h3 class="font-bold text-amber-900 mb-2">Expected Result</h3>
            <ul class="list-disc list-inside text-slate-700 space-y-1">
                <li>Valid credentials grant immediate access to dashboard within 2 seconds</li>
                <li>Invalid credentials display clear error message without revealing whether email exists</li>
                <li>No sensitive information exposed in error messages or network responses</li>
                <li>Session token generated and stored securely (HttpOnly cookie or localStorage)</li>
                <li>Login attempts logged for security monitoring</li>
            </ul>
        </div>
    </div>`
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TEST_MODE, MOCK_RESPONSES };
}