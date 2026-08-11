const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `        return () => {
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.remove();
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
        };
    }, [isEditingKostManager, kmStep, !!kmLandmarkMapRef.current]);`;

const replacementStr = `        return () => {
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.remove();
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
        };
    }, [isEditingKostManager, kmStep, showAddLandmarkForm, !!kmLandmarkMapRef.current]);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced via regex!");
  } else {
    console.error("Could not find the target useEffect dependency array block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
