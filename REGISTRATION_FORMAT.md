# Registration Number Format

## Format Structure
The registration number follows this pattern: **MEA22CS051**

### Breakdown:
- **MEA** (3 letters) - College Code
- **22** (2 digits) - Year Joined (20**22**)
- **CS** (2 letters) - Branch Code
- **051** (digits) - Roll Number

## Parsed Information:
From registration number **MEA22CS051**, the system extracts:
- **College**: MEA
- **Year Joined**: 2022
- **Year Ending**: 2026 (Year Joined + 4)
- **Branch**: CS (Computer Science)
- **Roll Number**: 051

## Common Branch Codes:
- **CS** - Computer Science
- **EC** - Electronics & Communication
- **EE** - Electrical & Electronics
- **ME** - Mechanical Engineering
- **CE** - Civil Engineering
- **IT** - Information Technology

## College Codes Examples:
- **MEA** - Mar Athanasius College of Engineering
- **TKM** - TKM College of Engineering
- **CET** - College of Engineering Trivandrum
- **GEC** - Government Engineering College

## Validation:
The system validates that:
1. Registration number has exactly 3 letters, followed by 2 digits, followed by 2 letters, followed by digits
2. All required fields are present
3. Year is valid (20XX format)

## Storage:
User data is stored in Firestore with the following fields:
- `name` - Full name
- `email` - Email address
- `registrationNumber` - Original registration number (uppercase)
- `college` - Extracted college code
- `branch` - Extracted branch code
- `yearJoined` - Calculated year joined
- `yearEnding` - Calculated year ending (yearJoined + 4)
- `rollNumber` - Extracted roll number
- `createdAt` - Account creation timestamp
