const { google } = require('googleapis');

async function test() {
  console.log("Testing Google Drive API Connection (Fixed Key Format)...");
  
  // Use a simple string with literal \n characters as provided in JSON
  const rawKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDMsqgUBecKcFy0\nwH3kYZflHFDGIBMX8sta9TLjZ4tp5zd3tlRS2YQKdpsKjlS3Eww4CQ1C4jiJIzST\nCQZO7s8xSWJhGeCAhLp84hij/GwINWj56pOnHq9Kkz32bae3s043IFvrAUzFbQ3E\nSZB9/vrhGVPa1C2/OFHddxdftCmUATWSctSsCunKKsnvoFIbX65q07fbPPRr1ffc\n3oTwobS2jB4jCxAOBXuRZhHDkXVZKH0wyniKFCZlKczzbQLiYJOLtHqKHJQIvLmF\ntXetWQWf+uWopPER2HzpiLxxUcna81nfFOTU4oeCC6m4OyeI8kmIRqudEQrpBlJt\n6YVS17MBAgMBAAECggEAAQ+6GbnQHA3qGnvXC0dK8NgH6THDDOroOAqxHrHA7NB9\n8/kg5c8VRV1JFNxuabFHwnCgPiULKFbjj7xKaUAJbgF/PkP9QIgE/t8d7pfBUvzn\n6Z0tnSkREqDB1P8g5q3KLYoAQASL392JZpJVFU+BqzIk7QEQUv9ZQ/3j7qNHWz+b\nUJGMlNAAEHTrd4vZGSWyL9l+i6xtYJT/BAmWTf4U/ItWjqswHPHz43h6GUUJgsQV\nVdPbv7XdbUS0BLBb2auXGvSmtIsfduxeYrBic+HD06R1Xr5TEyXnCPZ/T5NVx6um\nGZToIoQTSIY/n61Elv/2c/krLJKMZQKorOiltJ/qYQKBgQDsxisZea9Yu5ldyYbg\n3SGGDTac95mEALILeFkcpSo4D8Cfe71zLu/R91ZlJXecAUKPsCfREhbXjpqjdhWm\niULZvcsy3AaGhJ5SM8fi4TFWV7dL7tAh56Dv+CDttBqY5Ghi0UmUVS6TIY3Z39pr\ncER7aiyuvpx4CW6RRFhOxtLbmQKBgQDdUbf8tqC2gPUrA1XZdGKRKsEXf5gZ6Ai7\nBofpbXN8LgVMLTUrRbyFP+QOPJIKtTzb3eZlAAB4C1GNIihf95tyVK+n9Qba4khb\nOT30BBzbC0g8ijnjxqvstv/lSJf5ly1Z0KU8F5Z5w2b5tc6kisQQNLwW7XrAJz4Y\ nnvdTeFdzqQKBgAk1h/WcswI7gbKRJQrX7vbcyrP+OV1V/ZbOnoCrt+GoUzCgynSR\ nbch320dh1q4dqm4WRuYt0u+dX0xeSmdIzW3UoPOgdSyEOfguhWbApX+bN8jfR/8Z\nmDvdJcK5D5PExn6Zb0gyq/YTBwZjW4Z0PmWicox1Y3aTv1YtF1YxC4B5AoGAPeu/\nLlVqYaVy8rXcLxsA+NydaZWpWJYy2yDYpdaZmQTHNqjvV0wLkrxtcg5ATf6nKFzN\nOTTm7K8+Ad6srSz5sONAwh0r7dGhrOQ3ES6VZDOj4kxKJhBPycrpjZzh6FMDvT1C\n/a0bzLV++h6D0kWA1Yfrl/6ZeWmBViIj0Ja64QECgYEA4YDDE7E8rRep2AhsNQcP\nUhPvWrn+rXMidnJ5H89ceMfZ2QJnNEesVwRE+R92mf9p7vW4fd3MDkPB9BL7quju\n2sm8YI/IZeUwrZqOnFg4l1qqQYCol1xZ3W721JQpLvUZD0QYoffBn0oq6euHZGkJ\n/2TISo9C4+cCDG+qh4+F65I=\n-----END PRIVATE KEY-----";
  
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
    await drive.files.list({ pageSize: 1 });
    console.log("Auth Successful!");
    
    const folderMetadata = {
      name: 'Test Folder Final Fix',
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
