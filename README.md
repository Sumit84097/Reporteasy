🩺 Report Easy

Report Easy is a web application that allows users to upload medical lab reports (images or PDFs) and automatically analyzes them to provide structured test results, AI-generated summaries, and lifestyle suggestions in multiple languages (English, Hindi, Tamil). The platform is designed to help patients quickly understand their blood test results in a simple and actionable way.

🔹 Features

Upload Lab Reports: Supports image (PNG, JPEG) and PDF formats.

OCR Processing: Uses Tesseract.js to extract text from lab reports.

Data Correction: Automatic correction of common OCR errors for accuracy.

Structured Test Results: Extracts test values, reference ranges, and determines status (Normal/High/Low).

Multi-Language Support: Provides explanations in English, Hindi, and Tamil.

AI-Powered Summary: Uses Google Gemini AI to generate key findings, conclusions, and lifestyle tips.

Consult a Doctor: Quick WhatsApp link for professional consultation.

Clean UI: Drag-and-drop interface with modern design and responsive layout.

🔹 Tech Stack

Frontend: React, React Dropzone

Backend: Node.js, Express

OCR & Image Processing: Tesseract.js, Sharp

AI Summarization: Google Gemini AI

Other Tools: Multer for file uploads, CORS for cross-origin requests, dotenv for environment variables

🔹 Installation
1. Clone the Repository
git clone https://github.com/Sumit84097/report-easy.git
cd report-easy
2. Backend Setup
cd backend
npm install

Create a .env file and add your Google API key:

GOOGLE_API_KEY=your_google_generative_ai_key

Start the backend server:
node server.js
3. Frontend Setup
cd ../frontend
npm install
npm start


🔹 Usage

Open the app in your browser.

Select the language (English/Hindi/Tamil).

Drag-and-drop or click to upload your lab report (PNG, JPEG, PDF).

Click Analyze Report.

View structured test results and AI-generated summary.

Optionally, click Consult a Doctor to reach out via WhatsApp.

🔹 Supported Tests

Some of the blood tests supported:

Hemoglobin, RBC Count, PCV, MCV, MCH, MCHC

RDW, RDW-CV, RDW-SD

Total WBC Count, Neutrophils, Lymphocytes, Eosinophils, Monocytes, Basophils

Platelet Count, MPV, PDW, PCT

Test explanations are available in English, Hindi, and Tamil.

🔹 AI Summary

Highlights abnormal test results.

Generates 3 key findings in simple language.

Provides a conclusion.

Suggests 3 lifestyle or dietary tips.

Includes a short safety note.









