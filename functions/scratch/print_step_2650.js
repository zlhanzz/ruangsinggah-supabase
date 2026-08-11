const fs = require('fs');
const data = JSON.parse(fs.readFileSync('functions/scratch/extracted_stepper.json', 'utf8')); // Wait, extracted_stepper.json has the last step (Step 4554).
// Let's read the line at index 311 of transcript_full.jsonl which is Step 2650.
const lines = fs.readFileSync('C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl', 'utf8').split('\n');
const obj = JSON.parse(lines[311]);
const tc = obj.tool_calls.find(t => t.name === 'replace_file_content');
console.log("Target:");
console.log(tc.args.TargetContent);
console.log("Replacement:");
console.log(tc.args.ReplacementContent);
