const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log("Testing Google Drive API Connection (via sa.json)...");
  
  const sa = JSON.parse(fs.readFileSync(path.join(__dirname, 'sa.json'), 'utf8'));
  
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log("Attempting to list files...");
    await drive.files.list({ pageSize: 1 });
    console.log("Auth Successful!");
    
    const folderMetadata = {
      name: 'Test Folder via SA JSON',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk']
    };
    
    console.log("Attempting to create folder...");
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, webViewLink',
    });
    
    console.log("Success! Folder ID:", folder.data.id);
    
  } catch (error) {
    console.error("Test Failed:", error.message);
    if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
  }
}

test();
