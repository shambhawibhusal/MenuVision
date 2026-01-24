require('dotenv').config();

async function testDirectAPI() {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.log("❌ CRITICAL ERROR: No API Key found in .env file.");
        return;
    }

    console.log(`🔑 Testing API Key ending in: ...${key.slice(-4)}`);

    // We hit the standard Google API endpoint directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);

        if (response.status === 400) {
            console.log("❌ INVALID KEY: Google says this API Key is invalid.");
            console.log("👉 Please generate a new key at https://aistudio.google.com/app/apikey");
            return;
        }

        if (!response.ok) {
            console.log(`❌ ERROR ${response.status}:`);
            const errText = await response.text();
            console.log(errText);
            return;
        }

        const data = await response.json();
        console.log("\n✅ SUCCESS! Your API Key is working.");
        console.log("Here are the EXACT model names you can use in server.js:\n");

        // Filter and print only Gemini models
        const availableModels = data.models
            .filter(m => m.name.includes("gemini"))
            .map(m => m.name.replace("models/", ""));

        availableModels.forEach(name => console.log(`   "${name}"`));

    } catch (e) {
        console.log("❌ NETWORK ERROR: Could not connect to Google.");
        console.log("Check your internet connection or VPN.");
        console.log(e.message);
    }
}

testDirectAPI();