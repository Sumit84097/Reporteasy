// // backend/check_models.js
// const axios = require('axios');
// require('dotenv').config();

// const API_KEY = process.env.GOOGLE_API_KEY;

// async function checkAvailableModels() {
//   console.log("🔍 Checking available models for your API Key...");

//   try {
//     // We hit the API directly to see the list
//     const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
//     const response = await axios.get(url);
    
//     console.log("✅ CONNECTION SUCCESSFUL!");
//     console.log("------------------------------------------------");
//     console.log("You can use these model names in your server.js:");
//     console.log("------------------------------------------------");
    
//     const models = response.data.models;
//     let foundFlash = false;

//     models.forEach(m => {
//         // We only care about models that can generate text (generateContent)
//         if (m.supportedGenerationMethods.includes("generateContent")) {
//             const cleanName = m.name.replace('models/', '');
//             console.log(`Model Name: "${cleanName}"`);
//             if (cleanName.includes('flash')) foundFlash = true;
//         }
//     });
//     console.log("------------------------------------------------");

//     if (!foundFlash) {
//       console.log("⚠️ WARNING: 'flash' model was not found in your list.");
//       console.log("👉 Try using 'gemini-pro' instead.");
//     }

//   } catch (error) {
//     console.error("❌ CRITICAL ERROR:");
//     if (error.response) {
//         console.error(`Status: ${error.response.status}`);
//         console.error("Reason:", JSON.stringify(error.response.data, null, 2));
        
//         if (error.response.status === 400 && error.response.data.error.message.includes("API key not valid")) {
//              console.log("\n👉 DIAGNOSIS: Your API Key is still invalid/deleted. Please generate a new one at aistudio.google.com");
//         }
//     } else {
//         console.error(error.message);
//     }
//   }
// }

// checkAvailableModels();



// run this query to check the model
// node check_models.js