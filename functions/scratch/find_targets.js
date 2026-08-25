const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../..');
const reapplyPath = path.join(rootDir, 'functions/scratch/reapply_all_changes_chronologically.js');
const code = fs.readFileSync(reapplyPath, 'utf8');

// Extract all scripts inside the scripts array
const matches = code.match(/'functions\/scratch\/[^']+'/g) || [];
const scripts = matches.map(m => m.replace(/'/g, ''));

const targetFiles = new Set();

for (const script of scripts) {
    const scriptPath = path.join(rootDir, script);
    if (fs.existsSync(scriptPath)) {
        const content = fs.readFileSync(scriptPath, 'utf8');
        // Find path.join or targetFile definitions
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.includes('targetFile') && line.includes('path.join') && line.includes('AgentDashboard.tsx')) {
                targetFiles.add('functions/public/pages/AgentDashboard.tsx');
            }
            if (line.includes('targetFile') && line.includes('path.join') && line.includes('KostManagerManagement.tsx')) {
                targetFiles.add('functions/public/components/admin/KostManagerManagement.tsx');
            }
            if (line.includes('targetFile') && line.includes('path.join') && line.includes('Dashboard.tsx')) {
                targetFiles.add('functions/public/pages/Dashboard.tsx');
            }
            if (line.includes('targetFile') && line.includes('path.join') && line.includes('PROGRESS.md')) {
                targetFiles.add('functions/PROGRESS.md');
            }
        }
    }
}

console.log('TARGET FILES DETECTED IN SCRIPTS:');
targetFiles.forEach(f => console.log('- ' + f));
