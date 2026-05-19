
import fs from 'fs';
const filePath = 'c:\\Users\\ZHULL\\Desktop\\Firebase to Supabase\\functions\\public\\components\\admin\\SurveyManagement.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The problematic block:
const problematicBlock = `                                                      {categoryChecklists[field.id] && (
                                                         {categoryChecklists[field.id].map(item => {
                                                                   const isChecked = ((surveyForm.evaluation_summary as any)?.[field.id + '_checklist'] || []).includes(item);
                                                                   const isDekat = item.toLowerCase().startsWith('dekat');
                                                                   return (
                                                                       <div key={item} className="flex flex-col gap-1.5">
                                                                          <label className={\`flex items-center gap-2 p-2 rounded-lg border text-[10px] sm:text-xs transition-colors \${isChecked ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} \${isAdmin && !isAgent ? 'opacity-80 cursor-default hover:bg-gray-50' : 'cursor-pointer'}\`}>
                                                                              <input
                                                                                  type="checkbox"
                                                                                  className="w-3.5 h-3.5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer disabled:cursor-default"
                                                                                  checked={isChecked}
                                                                                  onChange={(e) => {
                                                                                      if (isAdmin && !isAgent) return;
                                                                                      const currentList = (surveyForm.evaluation_summary as any)?.[field.id + '_checklist'] || [];
                                                                                      const newList = e.target.checked 
                                                                                          ? [...currentList, item] 
                                                                                          : currentList.filter((i: string) => i !== item);
                                                                                      
                                                                                      setSurveyForm({ 
                                                                                          ...surveyForm, 
                                                                                          evaluation_summary: { 
                                                                                              ...(surveyForm.evaluation_summary || {}), 
                                                                                              [field.id + '_checklist']: newList 
                                                                                          } 
                                                                                      });
                                                                                  }}
                                                                                  disabled={isAdmin && !isAgent}
                                                                              />
                                                                              <span className="truncate" title={item}>{item}</span>
                                                                          </label>
                                                                          
                                                                          {isDekat && isChecked && (
                                                                              <div className="flex flex-col gap-1 px-1">
                                                                                  <div className="flex items-center gap-1">
                                                                                     {isAdmin && !isAgent ? (
                                                                                         <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                                                             Jarak: {(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_dist'] || '-'} {(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_unit'] || ''}
                                                                                         </span>
                                                                                     ) : (
                                                                                         <>
                                                                                             <input 
                                                                                                 type="number"
                                                                                                 className="w-16 bg-white border border-gray-200 rounded-md px-1.5 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                                 placeholder="Angka"
                                                                                                 value={(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_dist'] || ''}
                                                                                                 onChange={e => setSurveyForm({
                                                                                                     ...surveyForm,
                                                                                                     evaluation_summary: {
                                                                                                         ...(surveyForm.evaluation_summary || {}),
                                                                                                         [field.id + '_' + item + '_dist']: e.target.value
                                                                                                     }
                                                                                                 })}
                                                                                             />
                                                                                             <select 
                                                                                                 className="bg-white border border-gray-200 rounded-md px-1 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                                                                                 value={(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_unit'] || 'm'}
                                                                                                 onChange={e => setSurveyForm({
                                                                                                     ...surveyForm,
                                                                                                     evaluation_summary: {
                                                                                                         ...(surveyForm.evaluation_summary || {}),
                                                                                                         [field.id + '_' + item + '_unit']: e.target.value
                                                                                                     }
                                                                                                 })}
                                                                                             >
                                                                                                 <option value="m">m</option>
                                                                                                 <option value="km">km</option>
                                                                                             </select>
                                                                                         </>
                                                                                     )}
                                                                                  </div>
 
                                                                                  {item === 'Dekat Kampus/Kantor' && (
                                                                                     <div className="mt-0.5">
                                                                                         {isAdmin && !isAgent ? (
                                                                                             <span className="text-[10px] font-bold text-gray-500 italic block">
                                                                                                 Nama: {(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_name'] || '-'}
                                                                                             </span>
                                                                                         ) : (
                                                                                             <input 
                                                                                                 type="text"
                                                                                                 className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                                 placeholder="Nama Kampus/Kantor..."
                                                                                                 value={(surveyForm.evaluation_summary as any)?.[field.id + '_' + item + '_name'] || ''}
                                                                                                 onChange={e => setSurveyForm({
                                                                                                     ...surveyForm,
                                                                                                     evaluation_summary: {
                                                                                                         ...(surveyForm.evaluation_summary || {}),
                                                                                                         [field.id + '_' + item + '_name']: e.target.value
                                                                                                     }
                                                                                                 })}
                                                                                             />
                                                                                         )}
                                                                                     </div>
                                                                                  )}
                                                                              </div>
                                                                          )}
                                                                       </div>
                                                                  );
                                                               })}                                );
                                                              })}`;

// Replace with correct implementation
const correctBlock = \`                                                      {categoryChecklists[field.id] && (
                                                          <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                              {categoryChecklists[field.id].map(item => {
                                                                  const isChecked = ((surveyForm.evaluation_summary as any)?.[\`\${field.id}_checklist\`] || []).includes(item);
                                                                  const isDekat = item.toLowerCase().startsWith('dekat');
                                                                  return (
                                                                      <div key={item} className="flex flex-col gap-1.5">
                                                                         <label className={\`flex items-center gap-2 p-2 rounded-lg border text-[10px] sm:text-xs transition-colors \${isChecked ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} \${isAdmin && !isAgent ? 'opacity-80 cursor-default hover:bg-gray-50' : 'cursor-pointer'}\`}>
                                                                             <input
                                                                                 type="checkbox"
                                                                                 className="w-3.5 h-3.5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer disabled:cursor-default"
                                                                                 checked={isChecked}
                                                                                 onChange={(e) => {
                                                                                     if (isAdmin && !isAgent) return;
                                                                                     const currentList = (surveyForm.evaluation_summary as any)?.[\`\${field.id}_checklist\`] || [];
                                                                                     const newList = e.target.checked 
                                                                                         ? [...currentList, item] 
                                                                                         : currentList.filter((i: string) => i !== item);
                                                                                     
                                                                                     setSurveyForm({ 
                                                                                         ...surveyForm, 
                                                                                         evaluation_summary: { 
                                                                                             ...(surveyForm.evaluation_summary || {}), 
                                                                                             [\`\${field.id}_checklist\`]: newList 
                                                                                         } 
                                                                                     });
                                                                                 }}
                                                                                 disabled={isAdmin && !isAgent}
                                                                             />
                                                                             <span className="truncate" title={item}>{item}</span>
                                                                         </label>
                                                                         
                                                                         {isDekat && isChecked && (
                                                                             <div className="flex flex-col gap-1 px-1">
                                                                                 <div className="flex items-center gap-1">
                                                                                    {isAdmin && !isAgent ? (
                                                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                                                            Jarak: {(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_dist\`] || '-'} {(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_unit\`] || ''}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <>
                                                                                            <input 
                                                                                                type="number"
                                                                                                className="w-16 bg-white border border-gray-200 rounded-md px-1.5 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                                placeholder="Angka"
                                                                                                value={(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_dist\`] || ''}
                                                                                                onChange={e => setSurveyForm({
                                                                                                    ...surveyForm,
                                                                                                    evaluation_summary: {
                                                                                                        ...(surveyForm.evaluation_summary || {}),
                                                                                                        [\`\${field.id}_\${item}_dist\`]: e.target.value
                                                                                                    }
                                                                                                })}
                                                                                            />
                                                                                            <select 
                                                                                                className="bg-white border border-gray-200 rounded-md px-1 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                                                                                value={(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_unit\`] || 'm'}
                                                                                                onChange={e => setSurveyForm({
                                                                                                    ...surveyForm,
                                                                                                    evaluation_summary: {
                                                                                                        ...(surveyForm.evaluation_summary || {}),
                                                                                                        [\`\${field.id}_\${item}_unit\`]: e.target.value
                                                                                                    }
                                                                                                })}
                                                                                            >
                                                                                                <option value="m">m</option>
                                                                                                <option value="km">km</option>
                                                                                            </select>
                                                                                        </>
                                                                                    )}
                                                                                 </div>

                                                                                 {item === 'Dekat Kampus/Kantor' && (
                                                                                    <div className="mt-0.5">
                                                                                        {isAdmin && !isAgent ? (
                                                                                            <span className="text-[10px] font-bold text-gray-500 italic block">
                                                                                                Nama: {(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_name\`] || '-'}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <input 
                                                                                                type="text"
                                                                                                className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                                placeholder="Nama Kampus/Kantor..."
                                                                                                value={(surveyForm.evaluation_summary as any)?.[\`\${field.id}_\${item}_name\`] || ''}
                                                                                                onChange={e => setSurveyForm({
                                                                                                    ...surveyForm,
                                                                                                    evaluation_summary: {
                                                                                                        ...(surveyForm.evaluation_summary || {}),
                                                                                                        [\`\${field.id}_\${item}_name\`]: e.target.value
                                                                                                    }
                                                                                                })}
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                 )}
                                                                             </div>
                                                                         )}
                                                                      </div>
                                                                  );
                                                              })}
                                                          </div>\` + ')';

// Note: I added ) at the end because correctBlock is missing it in my string literal logic.
// Actually, I'll use a regex to find the block starting from {categoryChecklists[field.id] && (
// and ending before {field.id === 'wifi_check' && (

const startTag = "{categoryChecklists[field.id] && (";
const endTag = "{field.id === 'wifi_check' && (";

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + correctBlock + "\n\n                                                      " + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log("File updated successfully!");
} else {
    console.log("Could not find tags:", startIndex, endIndex);
}
