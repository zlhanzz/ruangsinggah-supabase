const fs = require('fs');

const rootPublicHtml = 'public/index.html';
const functionsPublicDistHtml = 'functions/public/dist/index.html';

console.log("Root public/index.html exists:", fs.existsSync(rootPublicHtml));
console.log("functions/public/dist/index.html exists:", fs.existsSync(functionsPublicDistHtml));

if (fs.existsSync(rootPublicHtml) && fs.existsSync(functionsPublicDistHtml)) {
  const rootSize = fs.statSync(rootPublicHtml).size;
  const distSize = fs.statSync(functionsPublicDistHtml).size;
  console.log(`Sizes: Root=${rootSize} bytes, Dist=${distSize} bytes`);
  
  const rootMtime = fs.statSync(rootPublicHtml).mtime;
  const distMtime = fs.statSync(functionsPublicDistHtml).mtime;
  console.log(`Modified times: Root=${rootMtime.toLocaleString()}, Dist=${distMtime.toLocaleString()}`);
  
  if (rootSize !== distSize) {
    console.log("WARNING: The build target (root public) does not match the compiled output (functions/public/dist)!");
  } else {
    console.log("SUCCESS: The sizes match!");
  }
}
