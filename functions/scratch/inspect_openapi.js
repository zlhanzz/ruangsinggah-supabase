const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://sgcmnsnokrztocnhxnqm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY21uc25va3J6dG9jbmh4bnFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0MzEyNSwiZXhwIjoyMDg2NjE5MTI1fQ.O_ODxNalxjqAb92-Y2a-C_LqMohLb-n4_03UA-pK5zM";

async function inspectOpenApi() {
    try {
        const response = await fetch(SUPABASE_URL + "/rest/v1/", {
            headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY
            }
        });
        const schema = await response.json();
        
        console.log("Tables found in schema:", Object.keys(schema.definitions));
        
        const tables = ['users', 'mitra', 'agents'];
        for (const t of tables) {
            console.log(`\n--- Table: ${t} ---`);
            const properties = schema.definitions[t].properties;
            const required = schema.definitions[t].required || [];
            
            for (const col in properties) {
                const isRequired = required.includes(col);
                const desc = properties[col].description || "";
                const defaultValue = desc.includes("default") ? desc : "none";
                console.log(`Column: ${col.padEnd(20)} | Type: ${properties[col].type.padEnd(10)} | Required (NOT NULL): ${isRequired.toString().padEnd(5)} | Default: ${defaultValue}`);
            }
        }
    } catch (error) {
        console.error("Error fetching schema:", error);
    }
}

inspectOpenApi();
