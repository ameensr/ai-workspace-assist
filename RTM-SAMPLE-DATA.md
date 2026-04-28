# RTM Generator - Sample Data & Test Cases

## 📋 Sample Input Data

### Sample Requirements (Authentication Module)

```
User must be able to login with email and password
System should validate email format before submission
Password must be at least 8 characters long
System should display error message for invalid credentials
User account should be locked after 5 consecutive failed login attempts
System should send password reset link to registered email
Password reset link should expire after 1 hour
User should be able to change password after successful login
System should enforce password complexity rules
Session should timeout after 15 minutes of inactivity
User should be able to logout from any page
System should clear all session data on logout
User should remain logged in if "Remember Me" is checked
System should support multi-factor authentication
User should receive email notification on successful login from new device
```

### Sample Test Cases (Authentication Module)

```
Verify login with valid email and password
Verify login fails with invalid email format
Verify login fails with password less than 8 characters
Verify error message displays for wrong credentials
Verify account locks after 5 failed login attempts
Verify password reset email is sent to registered email
Verify password reset link expires after 1 hour
Verify user can change password from profile settings
Verify password must contain uppercase, lowercase, number, and special character
Verify session expires after 15 minutes of inactivity
Verify logout button is accessible from all pages
Verify all session data is cleared after logout
Verify "Remember Me" keeps user logged in across sessions
Verify MFA code is sent to registered phone number
Verify email notification is sent for login from new device
Verify login with SQL injection attempt is blocked
Verify login with XSS payload is sanitized
Verify concurrent login sessions are handled correctly
```

---

## 📊 Expected Output

### Mappings (AI Generated)

```json
{
  "mappings": [
    {
      "requirementId": "REQ-001",
      "testCaseIds": ["TC-001", "TC-016", "TC-017"]
    },
    {
      "requirementId": "REQ-002",
      "testCaseIds": ["TC-002"]
    },
    {
      "requirementId": "REQ-003",
      "testCaseIds": ["TC-003"]
    },
    {
      "requirementId": "REQ-004",
      "testCaseIds": ["TC-004"]
    },
    {
      "requirementId": "REQ-005",
      "testCaseIds": ["TC-005"]
    },
    {
      "requirementId": "REQ-006",
      "testCaseIds": ["TC-006"]
    },
    {
      "requirementId": "REQ-007",
      "testCaseIds": ["TC-007"]
    },
    {
      "requirementId": "REQ-008",
      "testCaseIds": ["TC-008"]
    },
    {
      "requirementId": "REQ-009",
      "testCaseIds": ["TC-009"]
    },
    {
      "requirementId": "REQ-010",
      "testCaseIds": ["TC-010"]
    },
    {
      "requirementId": "REQ-011",
      "testCaseIds": ["TC-011"]
    },
    {
      "requirementId": "REQ-012",
      "testCaseIds": ["TC-012"]
    },
    {
      "requirementId": "REQ-013",
      "testCaseIds": ["TC-013"]
    },
    {
      "requirementId": "REQ-014",
      "testCaseIds": ["TC-014"]
    },
    {
      "requirementId": "REQ-015",
      "testCaseIds": ["TC-015"]
    }
  ]
}
```

### Expected Metrics

```
Coverage: 100%
Covered Requirements: 15
Uncovered Requirements: 0
Orphan Test Cases: 1 (TC-018: Verify concurrent login sessions)
```

---

## 🧪 Test Scenarios

### Test Case 1: Basic RTM Generation

**Input:**
- 5 requirements
- 8 test cases

**Expected:**
- Matrix generated with mappings
- Coverage metrics calculated
- Insights displayed

**Validation:**
- All requirements have at least one test case
- No orphan test cases
- Coverage = 100%

---

### Test Case 2: Uncovered Requirements

**Input:**
- 10 requirements
- 5 test cases (covering only 5 requirements)

**Expected:**
- 5 requirements marked as "Uncovered"
- Coverage = 50%
- Uncovered requirements listed in insights

**Validation:**
- Red highlighting on uncovered requirements
- Correct count in metrics

---

### Test Case 3: Orphan Test Cases

**Input:**
- 5 requirements
- 10 test cases (5 don't map to any requirement)

**Expected:**
- 5 test cases marked as "Orphan"
- Orphan count = 5
- Orphan test cases listed in insights

**Validation:**
- Orphan test cases identified correctly
- Correct count in metrics

---

### Test Case 4: File Upload (PDF)

**Input:**
- Upload PDF with requirements
- Upload PDF with test cases

**Expected:**
- Text extracted from PDFs
- Requirements and test cases parsed
- RTM generated successfully

**Validation:**
- Text extraction accurate
- No parsing errors

---

### Test Case 5: Import from Test Case Builder

**Input:**
- Generate 10 test cases in Test Case Builder
- Click "Import from Builder" in RTM

**Expected:**
- 10 test cases imported
- Test case descriptions populated
- Ready for RTM generation

**Validation:**
- All test cases imported
- Descriptions match original

---

### Test Case 6: Excel Export

**Input:**
- Generated RTM with 15 requirements, 18 test cases

**Expected:**
- Excel file downloaded
- Sheet 1: RTM Matrix
- Sheet 2: Summary

**Validation:**
- Excel file opens correctly
- Data matches UI display
- Formatting applied (colors, bold headers)

---

## 🎯 Edge Cases

### Edge Case 1: Empty Requirements

**Input:**
- Requirements: (empty)
- Test Cases: 10 test cases

**Expected:**
- Error message: "Please enter requirements"
- No RTM generated

---

### Edge Case 2: Empty Test Cases

**Input:**
- Requirements: 10 requirements
- Test Cases: (empty)

**Expected:**
- Error message: "Please enter test cases"
- No RTM generated

---

### Edge Case 3: No Mappings Found

**Input:**
- Requirements: "Requirement A", "Requirement B"
- Test Cases: "Test X", "Test Y" (completely unrelated)

**Expected:**
- All requirements marked as "Uncovered"
- All test cases marked as "Orphan"
- Coverage = 0%

---

### Edge Case 4: Large Dataset

**Input:**
- 100 requirements
- 200 test cases

**Expected:**
- RTM generated within 10 seconds
- Table renders without lag
- Excel export completes successfully

**Validation:**
- Performance acceptable
- No browser freeze

---

## 📝 Mock AI Response (for Testing)

```javascript
// Add to test-config.js
MOCK_RESPONSES.rtmGenerator = JSON.stringify({
  "mappings": [
    {"requirementId": "REQ-001", "testCaseIds": ["TC-001", "TC-002"]},
    {"requirementId": "REQ-002", "testCaseIds": ["TC-003"]},
    {"requirementId": "REQ-003", "testCaseIds": ["TC-004", "TC-005"]},
    {"requirementId": "REQ-004", "testCaseIds": ["TC-006"]},
    {"requirementId": "REQ-005", "testCaseIds": ["TC-007", "TC-008"]}
  ]
});
```

---

## 🔍 Validation Checklist

- [ ] Requirements parsed correctly (one per line)
- [ ] Test cases parsed correctly (one per line)
- [ ] AI mappings are logical and accurate
- [ ] Coverage metrics calculated correctly
- [ ] Uncovered requirements identified
- [ ] Orphan test cases identified
- [ ] RTM table renders correctly
- [ ] Visual indicators (✓, colors) display correctly
- [ ] Excel export includes both sheets
- [ ] Excel formatting applied correctly
- [ ] File upload extracts text correctly
- [ ] Import from Builder works correctly
- [ ] Clear button resets all data
- [ ] Navigation persistence works
- [ ] Responsive design on mobile

---

## 🎨 Visual Validation

### RTM Table Colors

- ✅ **Green checkmark (✓)**: Requirement mapped to test case
- 🟢 **Green badge**: Requirement covered
- 🔴 **Red badge**: Requirement uncovered
- 🔴 **Red background**: Uncovered requirement row

### Metrics Cards

- 🔵 **Blue**: Coverage percentage
- 🟢 **Green**: Covered requirements count
- 🔴 **Red**: Uncovered requirements count
- 🟠 **Orange**: Orphan test cases count

---

## 📊 Sample Excel Output

### Sheet 1: RTM Matrix

| Requirement ID | Description | TC-001 | TC-002 | TC-003 | Status |
|----------------|-------------|--------|--------|--------|--------|
| REQ-001 | User must be able to login | ✓ | ✓ | | Covered |
| REQ-002 | System should validate email | | | ✓ | Covered |
| REQ-003 | Password must be 8+ chars | | ✓ | | Covered |

### Sheet 2: Summary

| Metric | Value |
|--------|-------|
| Total Requirements | 15 |
| Covered Requirements | 15 |
| Uncovered Requirements | 0 |
| Coverage % | 100% |
| Total Test Cases | 18 |
| Orphan Test Cases | 1 |

---

**✅ Use this sample data to test and validate the RTM Generator module!**
