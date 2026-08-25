const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update filteredRequests filter
const filterTarget = `            if (agentTab === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED'].includes(req.status);
            if (agentTab === 'history') return ['SUBMITTED', 'COMPLETED', 'CANCELLED'].includes(req.status);`;

const filterReplacement = `            if (agentTab === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED', 'SUBMITTED'].includes(req.status);
            if (agentTab === 'history') return ['COMPLETED', 'CANCELLED'].includes(req.status);`;

// 2. Update badge counters filter
const badgeTarget = `                                if (t.id === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
                                if (t.id === 'history') return ['SUBMITTED', 'COMPLETED', 'CANCELLED'].includes(r.status);`;

const badgeReplacement = `                                if (t.id === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED', 'SUBMITTED'].includes(r.status);
                                if (t.id === 'history') return ['COMPLETED', 'CANCELLED'].includes(r.status);`;

if (content.includes(filterTarget) && content.includes(badgeTarget)) {
  content = content.replace(filterTarget, filterReplacement);
  content = content.replace(badgeTarget, badgeReplacement);
  console.log("Successfully moved SUBMITTED state to active tab in AgentDashboard.tsx");
} else {
  console.log("WARNING: Targets not found in AgentDashboard.tsx!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
