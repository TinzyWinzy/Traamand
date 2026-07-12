# Traamand HR Data Migration Guide

## How to Migrate Employee Records from Physical Books, Excel, or Word Documents

This guide helps your HR team transition existing employee records into the Traamand digital system. The system supports bulk import via CSV files, making it easy to upload many records at once.

---

## 📋 Step 1: Prepare Your Data

### From Physical Record Books:
1. Manually transcribe employee information into Excel or Google Sheets
2. Organize into columns matching the template below
3. Export as CSV file

### From Excel/Word Documents:
1. Copy employee data into Excel
2. Arrange columns to match the template
3. Export as CSV file

### Data Fields You'll Need:

| Field | Format | Examples | Required? |
|-------|--------|----------|-----------|
| **firstName** | Text | Maria, John, Linda | ✓ Yes |
| **lastName** | Text | Dube, Smith, Ndlovu | ✓ Yes |
| **phone** | 0XXXXXXXXX (10 digits) | 0715325922, 0782329308 | ✓ Yes |
| **age** | Number (18+) | 32, 45, 28 | ✓ Yes |
| **email** | Email address | maria@email.com | Optional |
| **category** | Maid, Nanny, Chef, Gardener, Nurse Aide, Driver, Sales Lady, Bar Lady | Maid | ✓ Yes |
| **yearsOfExperience** | Number | 8, 12, 6 | ✓ Yes |
| **skills** | Comma-separated | "cleaning,laundry,cooking" | ✓ Yes |
| **previousEmployers** | Number | 5, 3, 1 | Optional |
| **workType** | live-in, daily, part-time, temporary | daily | Optional |
| **preferredLocations** | Comma-separated suburbs | "Borrowdale,Chisipite" | Optional |
| **monthlySalaryMin** | Number (ZWL) | 2000 | Optional |
| **monthlySalaryMax** | Number (ZWL) | 3000 | Optional |
| **placementFee** | Number (ZWL) | 50, 60 | ✓ Yes |
| **idVerified** | yes / no | yes | ✓ Yes |
| **policeClearance** | yes / no | yes | ✓ Yes |
| **referenceChecks** | yes / no | yes | Optional |
| **education** | Primary, Secondary (O-Level), Advanced (A-Level), Certificate / Diploma, Degree | Secondary (O-Level) | ✓ Yes |
| **languages** | Comma-separated | "Shona,English" | ✓ Yes |
| **nextOfKinContact** | Phone number | 0776123456 | Optional |
| **status** | available, booked, off | available | Optional |
| **notes** | Any text | "Previously with family in Borrowdale" | Optional |

---

## 📥 Step 2: Download & Fill Template

### Option A: Download from System
1. Go to **Admin Dashboard** → **Worker Management**
2. Click **"Bulk Import CSV"** button
3. Click **"Download Template"** button
4. Save the file to your computer
5. Open in Excel and fill in your employee data

### Option B: Create Manually in Excel
1. Create headers in row 1:
```
firstName,lastName,phone,age,email,category,yearsOfExperience,skills,previousEmployers,workType,preferredLocations,monthlySalaryMin,monthlySalaryMax,placementFee,idVerified,policeClearance,referenceChecks,education,languages,nextOfKinContact,status,notes
```

2. Add employee data starting from row 2

### Example Spreadsheet:

| firstName | lastName | phone | age | category | yearsOfExperience | skills | placementFee | idVerified | policeClearance | education | languages | status |
|-----------|----------|-------|-----|----------|-------------------|--------|--------------|-----------|-----------------|-----------|-----------|--------|
| Maria | Dube | 0715325922 | 32 | Maid | 8 | cleaning,laundry | 50 | yes | yes | Secondary (O-Level) | Shona | available |
| John | Smith | 0782329308 | 45 | Driver | 12 | driving,maintenance | 60 | yes | yes | Certificate / Diploma | English | available |
| Linda | Ndlovu | 0777566584 | 28 | Nanny | 6 | childcare,newborn | 55 | yes | no | Certificate / Diploma | Shona,English | available |

---

## ✅ Step 3: Validate Your Data

Before uploading, ensure:
- ✓ Phone numbers are exactly 10 digits starting with 0 (Zimbabwe format)
- ✓ Age is between 18-80
- ✓ Category matches one of the 8 supported roles
- ✓ Skills are separated by commas (no extra spaces)
- ✓ Locations are spelled correctly and separated by commas
- ✓ idVerified and policeClearance are either "yes" or "no"
- ✓ Salary values are numbers without currency symbols
- ✓ No empty rows in the middle of data
- ✓ File is saved as `.csv` (not .xlsx or .xls)

---

## 📤 Step 4: Upload to Traamand

1. Log in to Traamand as **Admin**
2. Go to **Admin Dashboard** → **Worker Management**
3. Click **"Bulk Import CSV"** button
4. Click **"Select File"** and choose your CSV file
5. Review the file name to confirm it's correct
6. Click **"Import"** button

### What Happens During Import:
- ✓ System validates each row
- ✓ Shows progress and any errors
- ✓ Imports only valid rows
- ✓ Reports success count and failures
- ✓ Lists detailed error messages for failed rows

---

## 📊 Step 5: Review Import Results

After import, you'll see:
- **Success Count**: Number of employees successfully added
- **Failed Count**: Number of rows with errors
- **Error Details**: Specific issues for each failed row (if any)

### If Some Rows Failed:
1. Review the error messages
2. Fix the issues in your CSV file
3. Delete the failed employee records from Traamand (or keep them as-is)
4. Re-upload the corrected rows

### If All Rows Succeeded:
- Go to **Worker Management** to see all imported employees
- Review each profile to ensure data was captured correctly
- Upload national ID and police clearance documents if available
- Update verification status as needed

---

## 🔍 Supported Harare Suburbs

The system recognizes these Harare suburbs:

**Northern Suburbs:** Borrowdale, Chisipite, Glen Lorne, Gunhill

**Eastern Suburbs:** Greendale, Highlands, Newlands, Meyrick Park

**Western Suburbs:** Mabelreign, Marlborough, Mt Pleasant, Avondale

**Southern Suburbs:** Hatfield, Kensington

**Central:** Belgravia, Eastlea

---

## 💡 Tips for Successful Migration

### 1. Start with a Small Batch
- Test with 5-10 employees first
- Fix any issues with your template
- Once confident, do bulk imports

### 2. Phone Number Format
- Use only digits: `0715325922` (not `071 532 5922` or `+263715325922`)
- All must start with `0` and be exactly 10 digits

### 3. Multiple Values in One Field
- Use commas without spaces: `"cleaning,laundry,cooking"` ✓
- Not: `"cleaning, laundry, cooking"` (extra spaces may cause issues)

### 4. Spreadsheet to CSV Export
- **Google Sheets**: File → Download → CSV (.csv)
- **Excel**: File → Save As → Choose "CSV (Comma delimited)" format
- **LibreOffice**: File → Save As → Choose ODS Text CSV format

### 5. Handle Empty Cells
- Completely empty cells are OK for optional fields
- Required fields MUST have a value

### 6. Batch Dates
- Import records in batches by department or hiring date
- This helps with tracking and troubleshooting

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid phone number" | Ensure phone is exactly 10 digits starting with 0 |
| "Must be 18+" | Update age value to 18 or higher |
| "Invalid category" | Check spelling: Maid, Nanny, Chef, Gardener, Nurse Aide, Driver, Sales Lady, Bar Lady |
| "Field is required" | Fill in the required field (firstName, lastName, phone, age, category, etc.) |
| "No valid rows" | All rows have errors - check your template against the example |
| "File format" | Save as .csv file, not .xlsx or .xls |
| "Skills required" | Add at least one skill as comma-separated values |

---

## 📞 Support & Next Steps

### After Successful Import:

1. **Complete Verification**
   - Upload national ID photos
   - Confirm police clearance
   - Add training certificates if available

2. **Update Profiles**
   - Add professional photos
   - Write bio/description
   - Set availability preferences
   - Update salary expectations

3. **Start Matching**
   - Activate employee profiles
   - Begin matching with job seekers
   - Track placement performance

### Need Help?
- Contact: tmandovha@gmail.com
- Phone: +263 715 325 922
- WhatsApp: +263 715 325 922

---

## 🎯 Quick Reference Checklist

- [ ] Gathered all employee data from physical records
- [ ] Organized data in Excel or spreadsheet
- [ ] Downloaded CSV template from Traamand
- [ ] Filled in all required fields
- [ ] Verified phone numbers are correct format
- [ ] Converted file to .csv format
- [ ] Validated data before upload
- [ ] Successfully uploaded CSV file
- [ ] Reviewed import results
- [ ] Fixed any failed rows (if needed)
- [ ] Reviewed imported employee profiles
- [ ] Updated profiles with additional info
- [ ] Activated profiles for job matching

