const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// We want to replace the duplicate block
const duplicateBlock = `                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}`;

if (content.includes(duplicateBlock)) {
  content = content.replace(duplicateBlock, '');
  console.log("Duplicate block found and removed successfully!");
  fs.writeFileSync(targetFile, content, 'utf8');
} else {
  console.log("Duplicate block not found exactly. Trying whitespace collapse.");
  const normalizedBlock = duplicateBlock.replace(/\s+/g, ' ');
  const normalizedContent = content.replace(/\s+/g, ' ');
  if (normalizedContent.includes(normalizedBlock)) {
    console.log("Whitespace-collapsed duplicate block found!");
    // Let's do a regex replace
    const escaped = duplicateBlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), '');
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("Successfully removed using regex.");
  } else {
    console.error("Could not find the duplicate block!");
  }
}
