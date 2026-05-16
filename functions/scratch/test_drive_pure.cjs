const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log("Testing Google Drive API Connection (Pure JS)...");
  
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    console.error("Missing credentials in .env");
    return;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log("Attempting to list files (to verify auth)...");
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });
    console.log("Auth Successful!");
    console.log("First file found (if any):", response.data.files[0] || "No files found (expected for new service account)");
    
    // Test creating a folder
    console.log("Attempting to create a test folder...");
    const folderMetadata = {
      name: 'Test Folder Pure JS',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk'] // Root Folder ID from index.ts
    };
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, webViewLink',
    });
    
    console.log("Folder Created Successfully!");
    console.log("Folder ID:", folder.data.id);
    console.log("Link:", folder.data.webViewLink);
    
  } catch (error) {
    console.error("Test Failed:", error.message);
    if (error.response) {
        console.error("Details:", error.response.data);
    }
  }
}

test();
