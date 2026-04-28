# RTM Generator - Sample Excel Data

## 📊 Sample Excel Templates

Use these templates to test the Excel upload feature.

---

## Template 1: Basic Format

### File: rtm-test-cases-basic.xlsx

**Sheet: Test Cases**

| Test Case ID | Test Case Description |
|--------------|----------------------|
| TC-001 | Verify login with valid credentials |
| TC-002 | Verify login with invalid email format |
| TC-003 | Verify password minimum length validation |
| TC-004 | Verify account lockout after failed attempts |
| TC-005 | Verify password reset email delivery |
| TC-006 | Verify password reset link expiration |
| TC-007 | Verify login with SQL injection attempt |
| TC-008 | Verify concurrent login sessions |

**Expected Output**: 8 test cases extracted

---

## Template 2: Detailed Format

### File: rtm-test-cases-detailed.xlsx

**Sheet: Test Cases**

| Test Case ID | Test Case | Pre-Conditions | Steps | Expected Result |
|--------------|-----------|----------------|-------|-----------------|
| TC-001 | Verify login | User account exists | 1. Open login page<br>2. Enter valid email<br>3. Enter valid password<br>4. Click Login | User redirected to dashboard |
| TC-002 | Verify invalid email | None | 1. Open login page<br>2. Enter invalid email<br>3. Enter password<br>4. Click Login | Error message displayed |
| TC-003 | Verify password length | None | 1. Open login page<br>2. Enter email<br>3. Enter password < 8 chars<br>4. Click Login | Validation error shown |
| TC-004 | Verify account lockout | User account exists | 1. Attempt login 5 times with wrong password<br>2. Try 6th attempt | Account locked message |
| TC-005 | Verify password reset | User account exists | 1. Click Forgot Password<br>2. Enter email<br>3. Submit | Reset email sent |

**Expected Output**: 5 test cases extracted

---

## Template 3: Full Format

### File: rtm-test-cases-full.xlsx

**Sheet: Test Cases**

| ID | Module | Sub-Module | Test Case | Pre-Conditions | Steps | Test Data | Expected Result | Actual Result | Status |
|----|--------|------------|-----------|----------------|-------|-----------|-----------------|---------------|--------|
| 1 | Authentication | Login | Verify valid login | User exists | 1. Open page<br>2. Enter creds<br>3. Submit | email: test@example.com<br>pass: Test@123 | Dashboard displayed | | Ready |
| 2 | Authentication | Login | Verify invalid email | None | 1. Open page<br>2. Enter invalid email<br>3. Submit | email: invalid<br>pass: Test@123 | Error shown | | Ready |
| 3 | Authentication | Security | Verify SQL injection | None | 1. Enter SQL in email<br>2. Submit | email: ' OR 1=1 -- | Login rejected | | Ready |
| 4 | Authentication | Password | Verify min length | None | 1. Enter short password<br>2. Submit | pass: 123 | Validation error | | Ready |
| 5 | Authentication | Lockout | Verify account lock | User exists | 1. Fail login 5 times<br>2. Try again | N/A | Account locked | | Ready |

**Expected Output**: 5 test cases extracted

---

## Template 4: Custom Column Names

### File: rtm-test-cases-custom.xlsx

**Sheet: Test Cases**

| Case ID | Name | Description | Procedure | Expected Outcome |
|---------|------|-------------|-----------|------------------|
| 001 | Login Test | Verify user can login | Enter credentials and submit | Success |
| 002 | Logout Test | Verify user can logout | Click logout button | Logged out |
| 003 | Email Validation | Verify email format check | Enter invalid email | Error shown |
| 004 | Password Strength | Verify password rules | Enter weak password | Rejected |
| 005 | Session Timeout | Verify session expires | Wait 15 minutes | Auto logout |

**Expected Output**: 5 test cases extracted

---

## Template 5: Minimal Format

### File: rtm-test-cases-minimal.xlsx

**Sheet: Test Cases**

| Description |
|-------------|
| Verify login with valid credentials |
| Verify login with invalid credentials |
| Verify password reset functionality |
| Verify account lockout mechanism |
| Verify session timeout handling |

**Expected Output**: 5 test cases with auto-generated IDs (TC-001, TC-002, ...)

---

## 🧪 Test Scenarios

### Scenario 1: Standard Upload
**File**: Template 1 (Basic Format)
**Steps**:
1. Navigate to RTM Generator
2. Click Upload under Test Cases
3. Select rtm-test-cases-basic.xlsx
4. Wait for extraction

**Expected**:
- ✅ Toast: "Imported 8 test cases from Excel!"
- ✅ Textarea populated with 8 test case descriptions
- ✅ Ready for RTM generation

---

### Scenario 2: Detailed Upload
**File**: Template 2 (Detailed Format)
**Steps**:
1. Upload rtm-test-cases-detailed.xlsx
2. Review extracted data

**Expected**:
- ✅ 5 test cases extracted
- ✅ Descriptions include test case names
- ✅ Steps and expected results ignored (only description used)

---

### Scenario 3: Custom Columns
**File**: Template 4 (Custom Column Names)
**Steps**:
1. Upload rtm-test-cases-custom.xlsx
2. Verify parser detects custom columns

**Expected**:
- ✅ Parser detects "Name" as description column
- ✅ 5 test cases extracted
- ✅ IDs preserved from "Case ID" column

---

### Scenario 4: Minimal Format
**File**: Template 5 (Minimal Format)
**Steps**:
1. Upload rtm-test-cases-minimal.xlsx
2. Check auto-generated IDs

**Expected**:
- ✅ IDs auto-generated (TC-001, TC-002, ...)
- ✅ 5 test cases extracted
- ✅ Descriptions from single column

---

### Scenario 5: Large File
**File**: Excel with 100+ test cases
**Steps**:
1. Create Excel with 100 rows
2. Upload file
3. Measure extraction time

**Expected**:
- ✅ All 100 test cases extracted
- ✅ Extraction time < 3 seconds
- ✅ No browser lag

---

## 📝 Creating Test Excel Files

### Using Microsoft Excel

1. Open Excel
2. Create new workbook
3. Add header row:
   ```
   Test Case ID | Test Case Description
   ```
4. Add data rows:
   ```
   TC-001 | Verify login with valid credentials
   TC-002 | Verify login with invalid credentials
   ...
   ```
5. Save as `.xlsx`

### Using Google Sheets

1. Open Google Sheets
2. Create new sheet
3. Add headers and data
4. File → Download → Microsoft Excel (.xlsx)

### Using LibreOffice Calc

1. Open LibreOffice Calc
2. Create new spreadsheet
3. Add headers and data
4. File → Save As → Excel 2007-365 (.xlsx)

---

## 🎯 Validation Checklist

After uploading Excel file:

- [ ] Correct number of test cases extracted
- [ ] Test case IDs preserved (if present)
- [ ] Descriptions accurate
- [ ] No empty test cases
- [ ] No duplicate IDs
- [ ] Special characters handled correctly
- [ ] Ready for RTM generation

---

## 🔍 Common Issues & Solutions

### Issue: "No test cases found"
**Cause**: Header row not recognized
**Solution**: Use standard column names (Test Case ID, Description)

### Issue: Wrong data extracted
**Cause**: Parser selected wrong column
**Solution**: Rename columns to match recognized patterns

### Issue: IDs not preserved
**Cause**: ID column not detected
**Solution**: Name column "Test Case ID" or "ID"

### Issue: Empty descriptions
**Cause**: Description column empty
**Solution**: Add data to description column or use other columns

---

## 📊 Sample Data for Copy-Paste

### Authentication Test Cases
```
Verify login with valid email and password
Verify login with invalid email format
Verify login with incorrect password
Verify account lockout after 5 failed attempts
Verify password reset email delivery
Verify password reset link expiration
Verify session timeout after 15 minutes
Verify logout functionality
Verify remember me checkbox
Verify multi-factor authentication
```

### E-commerce Test Cases
```
Verify product search functionality
Verify add to cart functionality
Verify remove from cart functionality
Verify checkout process
Verify payment gateway integration
Verify order confirmation email
Verify order history display
Verify product filtering
Verify product sorting
Verify wishlist functionality
```

### API Test Cases
```
Verify GET request returns 200 status
Verify POST request creates resource
Verify PUT request updates resource
Verify DELETE request removes resource
Verify authentication token validation
Verify rate limiting enforcement
Verify error handling for invalid input
Verify response time under 2 seconds
Verify pagination functionality
Verify API versioning support
```

---

## ✅ Quick Test

### 1-Minute Test

1. Create Excel file with:
   ```
   Test Case ID | Test Case Description
   TC-001       | Test case 1
   TC-002       | Test case 2
   TC-003       | Test case 3
   ```

2. Upload to RTM Generator

3. Verify:
   - ✅ 3 test cases extracted
   - ✅ IDs: TC-001, TC-002, TC-003
   - ✅ Descriptions: Test case 1, Test case 2, Test case 3

---

**🎉 Use these templates to test the Excel upload feature!**
