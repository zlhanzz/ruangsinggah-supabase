import{c as f,a4 as $}from"./index-blX3UYIK.js";function P(r,e,s="bulanan",n=1){const i=new Date,o=e&&e!=="Sewa Berjalan"?new Date(e):r?new Date(r):new Date,m=new Date(o),a=new Date(m),t=(s||"bulanan").toLowerCase();t==="harian"?a.setDate(a.getDate()+n):t==="mingguan"?a.setDate(a.getDate()+n*7):t==="3bulanan"||t==="3_bulanan"||t==="triwulan"?a.setMonth(a.getMonth()+n*3):t==="6bulanan"||t==="6_bulanan"||t==="semester"?a.setMonth(a.getMonth()+n*6):t==="tahunan"||t==="tahunan (1 tahun)"?a.setFullYear(a.getFullYear()+n):a.setMonth(a.getMonth()+n);const d=new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),h=new Date(o.getFullYear(),o.getMonth(),o.getDate()).getTime(),l=d-h,u=l>0?Math.ceil(l/(1e3*60*60*24)):0,c=u>0,g={bulanan:"Bulanan (1 Bulan)","3bulanan":"3 Bulanan","6bulanan":"6 Bulanan",tahunan:"Tahunan (1 Tahun)",mingguan:"Mingguan (7 Hari)",harian:"Harian"};return{newStartDate:m.toISOString().split("T")[0],newEndDate:a.toISOString().split("T")[0],periodLabel:g[t]||"Bulanan",isLate:c,lateDays:u}}function M(r){try{const e=JSON.stringify(r);return btoa(unescape(encodeURIComponent(e))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(e){return console.error("Failed to create rent claim token:",e),""}}function j(r){try{if(!r)return null;let e=r.replace(/-/g,"+").replace(/_/g,"/");for(;e.length%4;)e+="=";const s=decodeURIComponent(escape(atob(e))),n=JSON.parse(s);return!n.phone||!n.propertyId||!n.roomNumber?null:n}catch(e){return console.error("Failed to decode rent claim token:",e),null}}async function F(r){try{const{phone:e,tenantName:s,propertyTitle:n,roomNumber:i,monthlyPrice:o,dueDate:m,propertyId:a,billingPeriod:t="Bulanan",previousPeriodStart:d,previousPeriodEnd:h,newPeriodStart:l,newPeriodEnd:u,extraFee:c=0,extraFeeName:g,daysRemaining:B}=r,D=M({phone:e.replace(/[^0-9]/g,""),tenantName:s,propertyId:a,propertyTitle:n,roomNumber:i,monthlyPrice:o,dueDate:m,billingPeriod:t,previousPeriodStart:d,previousPeriodEnd:h,newPeriodStart:l,newPeriodEnd:u,extraFee:c,extraFeeName:g,createdAt:Date.now()}),y=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/claim-kost?token=${D}`,w=b=>!b||b==="Sewa Berjalan"?"-":new Date(b).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),T=w(m),S=Number(o||0)+Number(c||0);let p=`Halo Kak *${s}*! 👋

Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai perpanjangan masa sewa kamar Anda:

🏠 *Properti:* ${n}
🚪 *Kamar:* No. ${i}
📋 *Jenis Sewa:* ${t}
`;l&&u&&(p+=`📅 *Periode Sewa Baru:* ${w(l)} s/d ${w(u)}
`),p+=`⚠️ *Jatuh Tempo:* ${T}
💵 *Tarif Pokok:* ${f(o)}
`,c>0&&g&&(p+=`➕ *${g}:* ${f(c)}
`),p+=`💰 *Total Pembayaran:* *${f(S)}*

_(Catatan: Sesuai aturan sewa, periode perpanjangan baru tetap dihitung bersambung dari akhir masa sewa sebelumnya)_

Untuk memantau kwitansi resmi, melihat kartu sewa, dan melakukan perpanjangan instan via QRIS / Transfer Bank, silakan klik tautan resmi berikut:

👉 *Akses Kost Saya & Bayar:* 
${y}

Terima kasih atas kerjasamanya! 🙏✨`;const k=await $(e,p);return{success:k.success,error:k.error}}catch(e){return console.error("Error sending rent billing reminder WhatsApp:",e),{success:!1,error:e.message}}}export{M as a,P as c,F as s,j as v};
