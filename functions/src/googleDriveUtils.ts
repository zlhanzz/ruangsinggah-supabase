// functions/src/googleDriveUtils.ts

/**
 * Creates a Google Drive folder and returns its web view link.
 * @param folderName The name of the folder to be created
 * @param parentFolderId Optional parent folder ID
 * @param config Optional credentials object
 */
export async function createSurveyFolder(
  folderName: string, 
  parentFolderId?: string, 
  config?: { privateKey?: string, clientEmail?: string }
): Promise<string> {
  const { google } = require('googleapis');
  
  // Use passed config or environment variables
  let rawPrivateKey = config?.privateKey || process.env.GOOGLE_PRIVATE_KEY || '';
  
  // Robust parsing: Handle cases where the user might have pasted the entire JSON
  if (rawPrivateKey.trim().startsWith('{')) {
    try {
      const jsonKey = JSON.parse(rawPrivateKey);
      if (jsonKey.private_key) {
        rawPrivateKey = jsonKey.private_key;
      }
    } catch (e) {
      console.warn('GOOGLE_DRIVE_CONFIG: Attempted to parse private key as JSON but failed.');
    }
  }

  // Robust replacement for newlines and removal of extra quotes
  const privateKey = rawPrivateKey
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '\n')
    .replace(/"/g, '')
    .trim();
  const clientEmail = config?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    console.error('GOOGLE_DRIVE_CONFIG_ERROR: Missing credentials', { 
      hasKey: !!privateKey, 
      hasEmail: !!clientEmail 
    });
    throw new Error('GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL is missing');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    if (!fileId) throw new Error('Failed to create folder');

    // Make the folder accessible (anyone with the link can view & edit)
    // Change this to 'writer' so Agents can upload files.
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    return webViewLink || `https://drive.google.com/drive/folders/${fileId}`;
  } catch (error) {
    console.error('GOOGLE_DRIVE_ERROR:', error);
    throw error;
  }
}
