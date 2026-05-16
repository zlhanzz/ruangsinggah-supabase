require('ts-node/register');
const { createSurveyFolder } = require('../src/googleDriveUtils.ts');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log("Testing Google Drive Folder Creation...");
  const folderName = "Test Folder - " + new Date().toISOString();
  const ROOT_FOLDER_ID = '1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk';

  try {
    const link = await createSurveyFolder(folderName, ROOT_FOLDER_ID, {
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    });
    console.log("Success! Folder Link:", link);
  } catch (error) {
    console.error("Test Failed:", error);
  }
}

test();
