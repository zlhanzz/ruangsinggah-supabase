const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';

if (!fs.existsSync(logPath)) {
  console.log("Log file not found at:", logPath);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let lastAgentDashboardWrite = null;

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    // Look for tool calls that wrote or modified AgentDashboard.tsx
    if (data.tool_calls) {
      data.tool_calls.forEach(tc => {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          if (JSON.stringify(tc.arguments).includes('AgentDashboard.tsx')) {
            lastAgentDashboardWrite = {
              step: data.step_index,
              tool: tc.name,
              args: tc.arguments,
              timestamp: data.timestamp
            };
          }
        }
      });
    }
  } catch (e) {
    // Ignore invalid JSON
  }
});

rl.on('close', () => {
  if (lastAgentDashboardWrite) {
    console.log("Found last write/edit on AgentDashboard.tsx at step:", lastAgentDashboardWrite.step);
    console.log("Tool:", lastAgentDashboardWrite.tool);
    console.log("Timestamp:", lastAgentDashboardWrite.timestamp);
    // Write the details to a file for analysis
    fs.writeFileSync('functions/scratch/last_dashboard_write.json', JSON.stringify(lastAgentDashboardWrite, null, 2));
  } else {
    console.log("No writes/edits found on AgentDashboard.tsx in transcript_full.jsonl");
  }
});
