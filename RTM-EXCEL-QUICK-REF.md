# RTM Generator - Excel Upload Quick Reference

## 🚀 Quick Start

### Upload Excel File (3 Steps)

1. **Prepare Excel**
   ```
   Test Case ID | Test Case Description
   TC-001       | Verify login
   TC-002       | Verify logout
   ```

2. **Upload**
   - Click "Upload" under Test Cases
   - Select .xls or .xlsx file

3. **Generate RTM**
   - Review extracted test cases
   - Click "Generate RTM"

---

## 📊 Supported Formats

| Format | Columns | Example |
|--------|---------|---------|
| **Basic** | ID, Description | TC-001 \| Verify login |
| **Detailed** | ID, Description, Steps, Expected | TC-001 \| Login \| ... \| Success |
| **Custom** | Any recognized names | Case ID \| Name \| ... |
| **Minimal** | Description only | Verify login |

---

## 🎯 Recognized Column Names

| Type | Names |
|------|-------|
| **ID** | test case id, tc id, id, test id, case id |
| **Description** | test case, description, test case description, test, case, name |
| **Steps** | steps, test steps, procedure, actions |
| **Expected** | expected result, expected, result, outcome |

---

## ✅ Features

- ✅ Auto-detect columns
- ✅ Generate IDs if missing
- ✅ Skip empty rows
- ✅ Handle custom names
- ✅ Fast parsing (< 3s for 100 rows)

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| No test cases found | Add header row with column names |
| Wrong data extracted | Use standard column names |
| IDs not preserved | Name column "Test Case ID" or "ID" |
| Parse error | Save as .xlsx, remove formulas |

---

## 📝 Sample Excel

```
| Test Case ID | Test Case Description |
|--------------|----------------------|
| TC-001       | Verify login         |
| TC-002       | Verify logout        |
| TC-003       | Verify password      |
```

**Result**: 3 test cases extracted

---

## 🔧 File Types Supported

- ✅ Excel (.xls, .xlsx) - **NEW**
- ✅ PDF (.pdf)
- ✅ Word (.doc, .docx)
- ✅ Text (.txt, .md)

---

## 📊 Performance

| Rows | Time |
|------|------|
| 10 | < 500ms |
| 100 | < 2s |
| 1000 | < 8s |

---

## 🎓 Best Practices

1. ✅ Use clear column headers
2. ✅ One test case per row
3. ✅ Avoid merged cells
4. ✅ Remove empty rows
5. ✅ Save as .xlsx

---

## 📚 Documentation

- **Complete Guide**: RTM-EXCEL-UPLOAD-GUIDE.md
- **Sample Templates**: RTM-EXCEL-SAMPLES.md
- **Summary**: RTM-EXCEL-ENHANCEMENT-SUMMARY.md

---

**🎉 Excel upload is ready to use!**
