const { google } = require('googleapis');

async function test() {
  console.log("Testing Google Drive API Connection (Hardcoded NEW KEY)...");
  
  const rawKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDE13V3+2aGxB3H\nroIwStW0jSW7m9IaezqGZ9y6AF6LZfwY+VLC6zl0zuq0Eed9eYofQ+G70Gs8cKwI\n/cSJNkfxeNVa9Ps0Ys1afnnTwOEhRiGm8z7dlSMmgJZ3iOEm0AetBCMQmdL3/Lje\nxG2F/QDNE/0MLyZp6xwO15mIhizy32KgFPwRdPICgnJiUbShkELrUIvB6yKWudaT\nTV5fUtZhM4/beiPo4C7/Q8PQ7ARzx8hCbGP8Eceyj5VZMGmwwOyTRndTJTWY70yC\n1KpfXAG1iSA/fJqxwKM/AaRfL5u1BhR/KAbtRmZudM+wZ4VctTLZSoKPNKaFeUNq\n6RUwI/rnAgMBAAECggEAQalTxJXGoh7qhjEWuZBFEGjjFN2KLQ49PBeKYDt+TkbT\nXOtSabX4oRfi3/V3AHqaEgrdUn7YPr2hDZDFTjYespSpqyE8aMGqmczFy9az4psX\n366Vomm843uSdcZhwMY1QUg3gDKn1tRlQN5KYJ9AdKh9yWIzELL+VY8i5pFHji5T\nXJ8VIsiFXEK0y3MQa6s59s2eS9doQKSU1chAnVm9kTyXY1Jzp4XdVRNLGNKjkKOU\n8ntwDelZakgw7K7tWAytufojYBmpAfOB+Lbq+LFGA66gRrpONOB2dMQNDYmIUn2i\ PWp8PfLK1v9TAEhdFFBzPdni9GangPO5PNLASnisfQKBgQDi3CAk4xtXTVPWmYLj\nof7EQIXR6Fiy3hT9xzZSfOFQqdJEt7Y4OvvaHrDq1tVcv5MI/LCst3Mnc/b0njYr\nWVebpwmjKxg7eUVUNnXu4r1n5KCAOMM2p6n2Y5KTh7aBvIEbffO++9NeHduEN5zm\ Rvpw2JNo/cb5NNry3w4b5+iy+wKBgQDeID0GO9aUGZbi3N/wJPf32r5k40n8KmLL\n4HJtYanaylS6JX6S40oohShKJcyqjtTjLL1L2+vAJyg/5rLnxmG5iHOjtwNJItxR\nfc4yz66hKKaUqdC/T7/4SPVLdJqTjOp9lHA2HYaUPzgYZCXwMtQoBfu3pp3V+hiG\nUwbGJEC0BQKBgQCMmfVqJz+IyipN9PLEdmBZ7cuCn0hqA25rIw6t7SwQPFBPurS7\nAQOa2i64PdIbG7jbdxFg2ooKR7slPPFByKudktdMQ6dPJQgs+1v4ZJsTSwWWspd6\nxkt2o5vyx8f7fINgMJ3jHlyQFl05AubBafhJ/FDQX4j0ZyfUIx6xePgmBQKBgQDN\nFL7C7qRjAG1K79riAX/gGtoGk8NPSmMFESkUzELiekRXyR5fx/JEDwzvyI56On1b\ncYckbtvvATgsJ3eufn7jqZP655HlCIaZxqmGSDFXIg0K3O6ac6suNU4kaHf/Gu+1\nGkOv8vq6DNRh0LUmXAd9HGkXWoIHeW0DN8zdS8NhcQKBgGx90eZr1Q6Giza8gQ/g\n4NDs6gV2Wd1wnGDmB2C6UVM3wdxt/6PvXjSSTpISGKcqakJycJ41D6BlMADS0EBo\nH7Q1OY0wr+DA1bny4HgDR2ReaZyJoTkyIe4fdpE4LjFvTh0yhzUsaET7Zif/FPtq\nrpQnResbwH+FQDddgIFwnV/K\n-----END PRIVATE KEY-----\n";
  
  const privateKey = rawKey.split('\\n').join('\n');
  const clientEmail = "survey-drive-bot-311@ruangsinggahid-3afb2.iam.gserviceaccount.com";

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log("Attempting to list files...");
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });
    console.log("Auth Successful!");
    
    // Test creating a folder
    console.log("Attempting to create a test folder...");
    const folderMetadata = {
      name: 'Test Folder - NEW KEY - ' + new Date().toLocaleTimeString(),
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk']
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
        console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
