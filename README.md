# CiviConnect
CivicConnect is a web-based prototype that helps citizens submit grievances easily and discover relevant Government of India schemes and services based on their issue.
The project focuses on:
- Simple and guided user experience
- Support for multiple Indian languages
- Smart understanding of citizen grievances
- Direct redirection to official government platforms

# Proposed Solution
CivicConnect provides a step-by-step grievance submission system that:
- Guides users clearly from start to finish
- Supports English, Hindi, and Tamil
- Analyzes grievance text on the frontend
- Suggests relevant government scheme categories
- Provides access to important government contacts

# Step-by-Step Process

1. Language Selection
Users first select their preferred language:
     -English
     -हिन्दी (Hindi)
     -தமிழ் (Tamil)
Helper text appears in the selected language to improve understanding.

2. Basic User Information
The user provides minimal details:
-Gender
-Age (using a slider)
-State (all Indian states supported)
This step keeps data collection simple and non-intrusive.

3. Grievance Input
Users can submit their grievance by:
-Typing in a large, readable text box
-Using voice input (speech-to-text) in their chosen language
This improves accessibility for users who are not comfortable typing.

4. Grievance Analysis (Frontend NLP – Rule Based)
The system analyzes the grievance text directly in the browser using predefined rules.
Grievance Category Detection
The system identifies the type of issue, such as:
-Water
-Electricity
-Food/ Ration
-Health
-Education
-Agriculture
-Pension
-Employment
-Housing
-Women & Child Welfare
-Transport
-Sports & Culture
The analysis supports English, Hindi, and Tamil, including informal language.

5. Urgency Detection
Each grievance is classified as:
-High – emergency or critical issues
-Medium – default
-Low – non-urgent or polite requests
Urgency is visually highlighted for clarity.

6. Population Affected
The system determines whether the issue affects:
-An individual
-A local area
-A large group / public
This helps indicate the scale of the problem.

7. Result & Recommendation
After analysis, the user sees:
-Detected grievance category
-Urgency level
-Population affected
-Suggested government action

8. Automatic Scheme Redirection
-The user is automatically redirected to the relevant category on myscheme.gov.in
-Redirection happens after a short countdown
-The most relevant scheme category is highlighted

# Government Schemes Module

Features:
-Displays major Government of India scheme categories
-Highlights schemes related to the user’s grievance
-Provides direct links to official government websites
-This helps citizens quickly find applicable schemes.

# Government Contacts Directory

Features:
-List of important government offices and helplines
-Department-wise filtering
-Search functionality
-One-click options to:
  Call
  Open WhatsApp
  View location on Maps
This serves as an immediate support option for citizens.

# Tech Stack

Frontend:
-HTML5
-CSS3
-JavaScript (Vanilla)

Backend:
-Server-side application (used for data handling, future scalability, and integration)
-Designed to support:
-Grievance storage
-User tracking
-Department dashboards (future)

 Note: Current implementation demonstrates frontend NLP logic, while the backend is structured for future enhancements and persistence.

 # Project Sturcture

CivicConnect/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── schemes.html
│   ├── schemes.css
│   ├── gov-contacts.html
│   └── images/
│
├── backend/
│   ├── (server files – API, database, configs)
│
├── README.md


# How to Run the Project

FRONTEND - C:\Users\Desktop\CiviConnect\frontend> python -m http.server 5500

BACKEND - C:\Users\Desktop\CiviConnect\backend> npm install
BACKEND - C:\Users\Desktop\CiviConnect\backend> node server.js

OPEN ANY WEB BROWSER AND RUN localhost:5500

/*NOTE- THE PROJECT WORKS PERFECTLY USING THE FRONTEND , BACKEND IS USED FOR FUTURE ENHANCEMENTS AND IS ALREADY CONNECTED TO THE FRONTEND*/

-Clone the repository
-Start the backend server (as per backend setup instructions)
-Open index.html or run via local server
-Access the application in your browser

# Future Enhancements

-Full grievance database and tracking system
-Authentication for citizens and officials
-Admin dashboards for departments
-Advanced AI/ML-based grievance analysis
-SMS / Email status notifications

# DISCLAMER

-This is a prototype developed for educational and hackathon purposes
-All government links and logos belong to their respective authorities
-No official government affiliation is claimed

