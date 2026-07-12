# HR Data Migration - Quick Start Guide

## 🎯 One-Page HR Onboarding Checklist

### Phase 1: Prepare Data (Your HR Team)
- [ ] **Gather Records** - Collect physical books, Excel, or Word documents with employee data
- [ ] **Organize in Spreadsheet** - Enter data into Excel with required fields (see Field Reference below)
- [ ] **Validate Data** - Check all phone numbers, names, and categories are correct
- [ ] **Export as CSV** - Save file as `.csv` format (File > Save As > CSV format)

### Phase 2: Upload to System (Admin)
- [ ] **Access Traamand** - Log in with admin account
- [ ] **Go to Workers** - Admin Dashboard > Worker Management
- [ ] **Click Import** - Click "Bulk Import CSV" button
- [ ] **Download Template** (optional) - Use the system template as reference
- [ ] **Select Your File** - Choose your CSV file
- [ ] **Review Results** - Check success count and any errors

### Phase 3: Complete Setup
- [ ] **Review Profiles** - Check that all imported employees appear in Worker Management
- [ ] **Upload Documents** - Add national ID and police clearance photos (if available)
- [ ] **Update Verification** - Mark employees as verified based on your records
- [ ] **Activate Workers** - Enable profiles for job matching
- [ ] **Test Matching** - Create a test job inquiry to verify workers appear

---

## 📊 Required Data Fields

Copy these column headers into Excel row 1:

```
firstName,lastName,phone,age,email,category,yearsOfExperience,skills,previousEmployers,workType,preferredLocations,monthlySalaryMin,monthlySalaryMax,placementFee,idVerified,policeClearance,referenceChecks,education,languages,nextOfKinContact,status,notes
```

### Field Details:

| Field | Format | Example | Required |
|-------|--------|---------|----------|
| firstName | Text | Maria | ✓ |
| lastName | Text | Dube | ✓ |
| phone | 0XXXXXXXXX | 0715325922 | ✓ |
| age | Number | 32 | ✓ |
| category | One of: Maid, Nanny, Chef, Gardener, Nurse Aide, Driver, Sales Lady, Bar Lady | Maid | ✓ |
| yearsOfExperience | Number | 8 | ✓ |
| skills | Comma-separated | "cleaning,laundry,cooking" | ✓ |
| placementFee | Number | 50 | ✓ |
| idVerified | yes/no | yes | ✓ |
| policeClearance | yes/no | yes | ✓ |
| education | Primary / Secondary (O-Level) / Advanced (A-Level) / Certificate / Diploma / Degree | Secondary (O-Level) | ✓ |
| languages | Comma-separated | "Shona,English" | ✓ |
| previousEmployers | Number | 5 | - |
| email | Email | maria@email.com | - |
| workType | live-in/daily/part-time/temporary | daily | - |
| preferredLocations | Comma-separated suburbs | "Borrowdale,Chisipite" | - |
| monthlySalaryMin | Number | 2000 | - |
| monthlySalaryMax | Number | 3000 | - |
| referenceChecks | yes/no | yes | - |
| nextOfKinContact | Phone | 0776123456 | - |
| status | available/booked/off | available | - |
| notes | Any text | "Previously with family" | - |

---

## ✅ Data Validation Checklist Before Upload

- [ ] **Phone Numbers**: All exactly 10 digits, starting with 0 (e.g., 0715325922)
- [ ] **Age**: All values 18-80
- [ ] **Category**: Only uses official categories (Maid, Nanny, Chef, etc.)
- [ ] **Skills**: Separated by commas with NO spaces (e.g., "cleaning,laundry")
- [ ] **Yes/No Fields**: ONLY "yes" or "no" (lowercase)
- [ ] **No Empty Rows**: No blank rows in the middle of data
- [ ] **CSV Format**: File saved as .csv, not .xlsx or .xls
- [ ] **Column Count**: All columns present (can be empty for optional fields)

---

## 📋 Example Data

Paste this into row 2+ of your Excel to test:

```
Maria,Dube,0715325922,32,maria@email.com,Maid,8,"cleaning,laundry,cooking",5,daily,"Borrowdale,Chisipite",2000,3000,50,yes,yes,yes,Secondary (O-Level),Shona,0776123456,available,"Previously worked for family"
John,Smith,0782329308,45,john@email.com,Driver,12,"driving,maintenance",8,daily,"Harare East",4000,5000,60,yes,yes,yes,Certificate / Diploma,English,0712456789,available,"Has PSV license"
Linda,Ndlovu,0777566584,28,linda@email.com,Nanny,6,"childcare,newborn,infant",3,live-in,"Glen Lorne,Chisipite",3000,4000,55,yes,no,yes,Certificate / Diploma,Shona,0712789456,available,"CPR certified"
```

---

## 🔧 Common Issues

| Error | Fix |
|-------|-----|
| "Invalid phone number" | Phone must be 0715325922 (10 digits, no spaces or dashes) |
| "Must be 18+" | Change age to 18 or higher |
| "Invalid category" | Use exact spelling: Maid, Nanny, Chef, Gardener, Nurse Aide, Driver, Sales Lady, Bar Lady |
| "Required" on any field | Fill in all required fields (marked with ✓) |
| "Must be yes/no" | Use lowercase: yes or no (not Yes, No, y, n, true, false) |
| "No valid rows" | Check that first row is headers and all data rows have required fields filled |
| "File not found" | Ensure .csv file is in the location you selected |

---

## 📞 Support

**Email:** tmandovha@gmail.com  
**Phone:** +263 715 325 922  
**WhatsApp:** +263 715 325 922

---

## 🌍 Harare Suburbs Reference

Use these exact names for preferredLocations:

- **North:** Borrowdale, Chisipite, Glen Lorne, Gunhill
- **East:** Greendale, Highlands, Newlands, Meyrick Park
- **West:** Mabelreign, Marlborough, Mt Pleasant, Avondale
- **South:** Hatfield, Kensington
- **Central:** Belgravia, Eastlea

---

## 📁 File Preparation Steps

### In Excel:
1. Create columns with headers from the Field Reference above
2. Fill in employee data from your physical records
3. File → Save As
4. Choose format: CSV (Comma delimited)
5. Save as "employee-records.csv"

### In Google Sheets:
1. Create spreadsheet with same headers
2. Enter data
3. File → Download → CSV (.csv)
4. Save to your computer

### In Word/Manual Data:
1. Copy data to Excel first
2. Organize into columns
3. Follow Excel export steps above

---

## ✨ After Successful Import

1. **Review in System** - Go to Worker Management to see all imported employees
2. **Update Photos** - Add professional photos to each profile
3. **Complete Verification** - Upload national IDs and police clearance documents
4. **Write Descriptions** - Add bio and key skills for each worker
5. **Set Availability** - Mark who's available vs booked
6. **Test Matching** - Create sample job inquiry to test matching system

