const fs = require('fs');
const path = require('path');

const jsonFile = 'functions/scratch/extracted_stepper.json';
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

console.log("Keys in JSON:", Object.keys(data));
if (data.tool_calls) {
  data.tool_calls.forEach((tc, idx) => {
    console.log(`Tool call ${idx}: ${tc.name}`);
    if (tc.name === 'replace_file_content' || tc.name === 'write_to_file') {
      const args = tc.args || {};
      // Write the content to a file to examine
      fs.writeFileSync(`functions/scratch/extracted_content_${idx}.txt`, args.ReplacementContent || args.CodeContent || '');
      console.log(`Wrote arguments to functions/scratch/extracted_content_${idx}.txt, length: ${(args.ReplacementContent || args.CodeContent || '').length}`);
    }
  });
}
