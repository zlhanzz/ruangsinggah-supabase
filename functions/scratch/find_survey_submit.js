const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('handleSubmitSurvey') || line.includes('handleSaveDraft') || line.includes('handleSubmitKostManager') || line.includes('saveSurveyDraft') || line.includes('survey_data')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
