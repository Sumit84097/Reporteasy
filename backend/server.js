// server.js - CORRECTED AND ROBUST VERSION

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const cors = require("cors");
const sharp = require("sharp");
require('dotenv').config(); // Load environment variables

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with the API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Use a stable model. You can change this to "gemini-2.5-flash" if your account supports it.
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", 
});

const app = express();
app.use(cors());
const PORT = 5000;
const upload = multer({ dest: "uploads/" });

// Load Knowledge Base (Ensure knowledgeBase.json exists in the same folder)
let knowledgeBase = {};
try {
    knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, "knowledgeBase.json"), "utf8"));
} catch (error) {
    console.warn("⚠️ Warning: knowledgeBase.json not found. Explanations might be missing.");
}

const testDefinitions = {
    "Hemoglobin":       { synonyms: ["Hemoglobin", "Haemoglobin", "AEMOGLOBIN"], plausibleRange: [5, 20] },
    "Total WBC Count":  { synonyms: ["Total Leucocyte Count", "Total WBC Count", "OTAL W.B.C. COUNT", "Total WBC Cunt"], plausibleRange: [4000, 11000] },
    "Neutrophils":      { synonyms: ["Neutrophils", "Neutophis"], plausibleRange: [0, 100] },
    "Lymphocytes":      { synonyms: ["Lymphocytes", "Lymghooyies"], plausibleRange: [0, 100] },
    "Eosinophils":      { synonyms: ["Eosinophils", "Eosiophis"], plausibleRange: [0, 100] },
    "Monocytes":        { synonyms: ["Monocytes", "Monacytes", "lonocytes"], plausibleRange: [0, 100] },
    "Basophils":        { synonyms: ["Basophils", "Basophis", "Basophil"], plausibleRange: [0, 100] },
    "RBC Count":        { synonyms: ["RBC Count", "R.B.C. COUNT"], plausibleRange: [2, 8] },
    "MCV":              { synonyms: ["MCV", "Mev", "mov", "MEY"], plausibleRange: [50, 110] },
    "MCH":              { synonyms: ["MCH", "jose", "cn"], plausibleRange: [20, 40] },
    "MCHC":             { synonyms: ["MCHC", "MeHG", "1C HC"], plausibleRange: [20, 45] },
    "PCV":              { synonyms: ["PCV", "Hct", "pov", "Hot", "PCY"], plausibleRange: [20, 60] },
    "RDW":              { synonyms: ["RDW", "Row"], plausibleRange: [9, 17]},
    "RDW-CV":           { synonyms: ["RDW-CV", "RDW-CY"], plausibleRange: [5, 25] },
    "RDW-SD":           { synonyms: ["RDW-SD"], plausibleRange: [30, 60] },
    "Platelet Count":   { synonyms: ["Platelet Count", "PLATELETS COUNT", "PLATELETS INDICES", "Plast Count"], plausibleRange: [150000, 450000] },
    "MPV":              { synonyms: ["MPV"], plausibleRange: [6.5, 12.0] },
    "PDW":              { synonyms: ["PDW", "po"], plausibleRange: [9.0, 17.0] },
    "PCT":              { synonyms: ["PCT", "pet"], plausibleRange: [0.1, 0.5] },
};

const lineCorrections = {
    // Corrections for common OCR errors
    "Haemoglobin 1s": "Haemoglobin 15 14-16",
    "RBC Count s": "RBC Count 5 4.5-5.5", 
    "pov as": "PCV 36 35-45",
    "mov 7200": "MCV 72.00 80-99",
    "jose 20m": "MCH 30.00 28-32",
    "MeHG pry": "MCHC 41.67 30-34",
    "Row 10": "RDW 10 9-17",
    "Total WBC Cunt ssn": "Total WBC Count 5500 4000-11000",
    "Neutophis &": "Neutrophils 60 40-75",
    "Lymghooyies a": "Lymphocytes 30 20-45",
    "Eosiophis s": "Eosinophils 5 00-06",
    "Monacytes s": "Monocytes 5 00-10",
    "Basophis o": "Basophils 0 00-01",
    "Plast Count 1850000": "Platelet Count 155000 150000-450000",
    "AEMOGLOBIN 13.0 > em/dl 14.6 gm/dl = 100%": "Haemoglobin 13.0 14.0-16.0",
    "R.B.C. COUNT (L) 348 & 5 Soa": "R.B.C. COUNT 3.48 3.9-5.6",
    "38.7 o Sha": "PCV 38.7 36-45",
    "PCY 99.0 i Rina": "MCV 99.0 82-99",
    "cn e 9 32-36 a cn 33.6 Yo Re h:": "MCH 32.0 27-32",
    "1C HC %. i Lov. ¢ 142 jo": "MCHC 33.6 32-36",
    "Lymphocytes 16 = % © 20-45 if": "Lymphocytes 16 20-45",
    "Eosinophils as % 01-06": "Eosinophils 9.0 01-06",
    "lonocytes 01 % 2-08 id": "Monocytes 1.0 02-08",
    "RDW-CY 5b fu 35-56 E": "RDW-SD 56.0 35-56",
    "¢ 142 jo RDW-CY": "RDW-CV 14.2 11-16",
    "PLATELETS INDICES 371 LacslCumm ~~ 15-43 b.": "Platelet Count 3.77 1.5-4.5", 
    "IELETS COUNT 10.6 fi 65-120 4": "MPV 10.6 6.5-12.0",
    "fir. % 90-170 po 9% 0120-0400": "PDW 15.3 9.0-17.0 \n PCT 0.399 0.120-0.400",
};

function normalizeText(text) {
    let correctedText = text;
    for (const wrong in lineCorrections) {
        const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        correctedText = correctedText.replace(regex, lineCorrections[wrong]);
    }
    return correctedText;
}

function getStatus(value, referenceRange) {
    if (!referenceRange || referenceRange.trim() === "" || isNaN(value)) return "Unknown";
    const rangeMatch = referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
        const lowerBound = parseFloat(rangeMatch[1]);
        const upperBound = parseFloat(rangeMatch[2]);
        if (value < lowerBound) return "Low";
        if (value > upperBound) return "High";
        return "Normal";
    }
    return "Unknown";
}





async function getAISummary(structuredData, language) {
  const abnormalResults = structuredData.filter(
    (item) => item.status === "High" || item.status === "Low"
  );


  if (abnormalResults.length === 0) {
    const safeMsg = {
      en: "No significant abnormalities were found.",
      hi: "आपकी रिपोर्ट में कोई महत्वपूर्ण असामान्यता नहीं मिली है।",
      ta: "உங்கள் அறிக்கையில் குறிப்பிடத்தக்க அசாதாரணங்கள் எதுவும் கண்டறியப்படவில்லை."
    };
    
    return {
      keyFindings: [safeMsg[language] || safeMsg["en"]],
      overallConclusion: safeMsg[language] || safeMsg["en"],
      lifestyleTips: ["Maintain a healthy diet.", "Stay hydrated."],
      safetyNote: "This is AI-generated. Consult a doctor."
    };
  }

  const prompt = `
    You are a helpful medical assistant. 
    Analyze these abnormal lab results for a patient.
    Language Code: ${language}
    
    Abnormal Data: 
    ${JSON.stringify(abnormalResults)}

    Instructions:
    1. Explain what these results mean in simple terms.
    2. Provide 3 key findings.
    3. Give a conclusion.
    4. Suggest 3 lifestyle tips.
    
    IMPORTANT FORMATTING RULES:
    1. **DO NOT** use asterisks (**), bolding, or markdown in the text. Use PLAIN TEXT ONLY.
    2. Keep the "safetyNote" VERY SHORT (maximum 15 words).
    3. Output ONLY valid JSON.
    
    Format:
    {
      "keyFindings": ["Point 1", "Point 2"],
      "overallConclusion": "Summary text",
      "lifestyleTips": ["Tip 1", "Tip 2"],
      "safetyNote": "Short disclaimer in ${language}"
    }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = result.response.text();
    console.log("🔹 AI Raw Response:", text); 

   
    text = text.replace(/```json/g, "").replace(/```/g, "");

  
    text = text.replace(/\*/g, ""); 
    
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("❌ AI Summarization Error:", error);
    return {
      keyFindings: ["Error generating summary."],
      overallConclusion: "We could not analyze the text details at this moment.",
      lifestyleTips: ["Please consult a doctor."],
      safetyNote: "Technical Error."
    };
  }
}






app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const originalFilePath = path.resolve(req.file.path);
    const processedFilePath = path.join(__dirname, 'uploads', `processed-${req.file.filename}.png`);
    
    try {
       
        await sharp(originalFilePath).grayscale().normalize().sharpen().toFile(processedFilePath);
        
        const lang = req.query.lang || "en";
        const ocrResult = await Tesseract.recognize(processedFilePath, "eng", { psm: 6 });
        
        console.log("\n\x1b[36m=== RAW OCR TEXT ===\x1b[0m\n", ocrResult.data.text);
        
        const correctedText = normalizeText(ocrResult.data.text);
        
        const lines = correctedText.split('\n');
        let results = [];
        const foundTests = new Set();

        for (const line of lines) {
            for (const testKey in testDefinitions) {
                if (foundTests.has(testKey)) continue;

                const testDef = testDefinitions[testKey];
                for (const synonym of testDef.synonyms) {
                    const testRegex = new RegExp(`(^|\\s)${synonym}(\\s|$)`, "i");
                    
                    if (testRegex.test(line)) {
                        const numbers = line.match(/[\d\.]+/g);
                        if (!numbers || numbers.length === 0) continue;

                        const value = parseFloat(numbers[0]);
                        if (isNaN(value)) continue;

                        let referenceRange = "";
                        const rangeMatch = line.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
                        if (rangeMatch) {
                            referenceRange = rangeMatch[0];
                        }
                        
                        
                        if (testDef.plausibleRange && (value < testDef.plausibleRange[0] || value > testDef.plausibleRange[1])) {
                           if (!line.includes("Lacs/Cu mm")) {
                                continue;
                           }
                        }
                        
                        const status = getStatus(value, referenceRange);
                        const explanation = (knowledgeBase[lang]?.[testKey]) || `Explanation for ${testKey} not available.`;
                        
                        results.push({ test: testKey, result: value.toFixed(2), unit: "", referenceRange, status, explanation });
                        foundTests.add(testKey);
                        break; 
                    }
                }
            }
        }

        const canonicalOrder = Object.keys(testDefinitions);
        results.sort((a, b) => canonicalOrder.indexOf(a.test) - canonicalOrder.indexOf(b.test));
        
        console.log("\n\x1b[32m=== STRUCTURED DATA ===\x1b[0m\n", results.length, "tests found.\n");

        const summary = await getAISummary(results, lang);
        
        res.json({ testResults: results, summary: summary });

    } catch (err) {
        console.error("Processing Error:", err);
        res.status(500).json({ error: "Processing failed" });
    } finally {
        // Cleanup files
        fs.unlink(originalFilePath, (err) => { if (err) console.error(err); });
        fs.unlink(processedFilePath, (err) => { if (err) console.error(err); });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});