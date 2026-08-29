import{c as d,a4 as g}from"./index--xSNG4zW.js";function k(n){try{const e=JSON.stringify(n);return btoa(unescape(encodeURIComponent(e))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(e){return console.error("Failed to create rent claim token:",e),""}}function w(n){try{if(!n)return null;let e=n.replace(/-/g,"+").replace(/_/g,"/");for(;e.length%4;)e+="=";const r=decodeURIComponent(escape(atob(e))),a=JSON.parse(r);return!a.phone||!a.propertyId||!a.roomNumber?null:a}catch(e){return console.error("Failed to decode rent claim token:",e),null}}async function R(n){try{const{phone:e,tenantName:r,propertyTitle:a,roomNumber:t,monthlyPrice:o,dueDate:s,propertyId:c,daysRemaining:h}=n,m=k({phone:e.replace(/[^0-9]/g,""),tenantName:r,propertyId:c,propertyTitle:a,roomNumber:t,monthlyPrice:o,dueDate:s,createdAt:Date.now()}),l=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/claim-kost?token=${m}`,u=new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}),p=`Halo Kak *${r}*! 👋

Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai masa sewa kamar Anda:

🏠 *Properti:* ${a}
🚪 *Kamar:* No. ${t}
📅 *Jatuh Tempo:* ${u}
💵 *Tarif Sewa:* ${d(o)} / bulan

Untuk memantau sisa masa sewa, mengunduh kwitansi resmi, dan melakukan perpanjangan sewa dengan mudah via QRIS / Transfer Bank, silakan klik tautan resmi berikut:

👉 *Akses Kost Saya & Bayar:* 
${l}

_(Tautan ini akan langsung membuka halaman Kost Anda secara otomatis)_

Terima kasih atas kerjasamanya! 🙏✨`,i=await g(e,p);return{success:i.success,error:i.error}}catch(e){return console.error("Error sending rent billing reminder WhatsApp:",e),{success:!1,error:e.message}}}export{k as c,R as s,w as v};
