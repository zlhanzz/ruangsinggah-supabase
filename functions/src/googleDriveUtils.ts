// functions/src/googleDriveUtils.ts

/**
 * Creates a Google Drive folder and returns its web view link.
 * @param folderName The name of the folder to be created
 * @param parentFolderId Optional parent folder ID
 */
export async function createSurveyFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const { google } = require('googleapis');
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL is missing');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file']
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

    // Make the folder accessible (anyone with the link can view)
    // ONLY change this to 'reader' so Users can only view.
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return webViewLink || `https://drive.google.com/drive/folders/${fileId}`;
  } catch (error) {
    console.error('GOOGLE_DRIVE_ERROR:', error);
    throw error;
  }
}
