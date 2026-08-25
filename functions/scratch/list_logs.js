const fs = require('fs');
const path = require('path');

const logDir = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\';
if (fs.existsSync(logDir)) {
  console.log("Files:", fs.readdirSync(logDir));
} else {
  console.log("Directory does not exist:", logDir);
}
