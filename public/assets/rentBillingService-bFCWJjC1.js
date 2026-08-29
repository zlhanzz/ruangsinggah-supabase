import{a4 as y,c as d}from"./index-BNLElmJI.js";function B(e,a,o="bulanan",t=1){const s=new Date,r=a&&a!=="Sewa Berjalan"?new Date(a):e?new Date(e):new Date,u=new Date(r),n=new Date(u),i=(o||"bulanan").toLowerCase();i==="harian"?n.setDate(n.getDate()+t):i==="mingguan"?n.setDate(n.getDate()+t*7):i==="3bulanan"||i==="3_bulanan"||i==="triwulan"?n.setMonth(n.getMonth()+t*3):i==="6bulanan"||i==="6_bulanan"||i==="semester"?n.setMonth(n.getMonth()+t*6):i==="tahunan"||i==="tahunan (1 tahun)"?n.setFullYear(n.getFullYear()+t):n.setMonth(n.getMonth()+t);const p=new Date(s.getFullYear(),s.getMonth(),s.getDate()).getTime(),w=new Date(r.getFullYear(),r.getMonth(),r.getDate()).getTime(),l=p-w,c=l>0?Math.ceil(l/(1e3*60*60*24)):0,g=c>0,m={bulanan:"Bulanan (1 Bulan)","3bulanan":"3 Bulanan","6bulanan":"6 Bulanan",tahunan:"Tahunan (1 Tahun)",mingguan:"Mingguan (7 Hari)",harian:"Harian"};return{newStartDate:u.toISOString().split("T")[0],newEndDate:n.toISOString().split("T")[0],periodLabel:m[i]||"Bulanan",isLate:g,lateDays:c}}function P(e){try{const a=JSON.stringify(e);return btoa(unescape(encodeURIComponent(a))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(a){return console.error("Failed to create rent claim token:",a),""}}function I(e){try{if(!e)return null;let a=e.replace(/-/g,"+").replace(/_/g,"/");for(;a.length%4;)a+="=";const o=decodeURIComponent(escape(atob(a))),t=JSON.parse(o);return!t.phone||!t.propertyId||!t.roomNumber?null:t}catch(a){return console.error("Failed to decode rent claim token:",a),null}}async function F(e){try{const{phone:a,tenantName:o,propertyTitle:t,roomNumber:s,monthlyPrice:r,dueDate:u,propertyId:n,billingPeriod:i="Bulanan",previousPeriodStart:p,previousPeriodEnd:w,newPeriodStart:l,newPeriodEnd:c,extraFee:g=0,extraFeeName:m,daysRemaining:N}=e,D=P({phone:a.replace(/[^0-9]/g,""),tenantName:o,propertyId:n,propertyTitle:t,roomNumber:s,monthlyPrice:r,dueDate:u,billingPeriod:i,previousPeriodStart:p,previousPeriodEnd:w,newPeriodStart:l,newPeriodEnd:c,extraFee:g,extraFeeName:m,createdAt:Date.now()}),S=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/claim-kost?token=${D}`,k=b=>!b||b==="Sewa Berjalan"?"-":new Date(b).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),$=k(u),T=Number(r||0)+Number(g||0);let h=`Halo Kak *${o}*! 👋

Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai perpanjangan masa sewa kamar Anda:

🏠 *Properti:* ${t}
🚪 *Kamar:* No. ${s}
📋 *Jenis Sewa:* ${i}
`;l&&c&&(h+=`📅 *Periode Sewa Baru:* ${k(l)} s/d ${k(c)}
`),h+=`⚠️ *Jatuh Tempo:* ${$}
💵 *Tarif Pokok:* ${d(r)}
`,g>0&&m&&(h+=`➕ *${m}:* ${d(g)}
`),h+=`💰 *Total Pembayaran:* *${d(T)}*

_(Catatan: Sesuai aturan sewa, periode perpanjangan baru tetap dihitung bersambung dari akhir masa sewa sebelumnya)_

Untuk memantau kwitansi resmi, melihat kartu sewa, dan melakukan perpanjangan instan via QRIS / Transfer Bank, silakan klik tautan resmi berikut:

👉 *Akses Kost Saya & Bayar:* 
${S}

Terima kasih atas kerjasamanya! 🙏✨`;const f=await y(a,h);return{success:f.success,error:f.error}}catch(a){return console.error("Error sending rent billing reminder WhatsApp:",a),{success:!1,error:a.message}}}function A(e){var u;const o=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/receipt/${e.orderId}`,t=n=>!n||n==="Sewa Berjalan"?"-":new Date(n).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),s=e.paidAt?new Date(e.paidAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});let r=`Halo Kak *${e.tenantName}*! 🎉✨

Pembayaran perpanjangan sewa kamar Anda telah kami terima dan diverifikasi *LUNAS*:

🧾 *No. Kwitansi:* #${((u=(e.orderId||"").split("-").pop())==null?void 0:u.toUpperCase())||e.orderId}
🏠 *Properti:* ${e.propertyTitle}
🚪 *Kamar:* No. ${e.roomNumber}
📌 *Skema Sewa:* ${e.billingPeriod||"Bulanan"}
`;return e.newPeriodStart&&e.newPeriodEnd&&(r+=`🔄 *Masa Sewa Baru:* ${t(e.newPeriodStart)} s/d ${t(e.newPeriodEnd)}
`),e.basePrice&&(r+=`💵 *Sewa Pokok:* ${d(e.basePrice)}
`),e.extraFee&&e.extraFee>0&&(r+=`➕ *${e.extraFeeName||"Biaya Tambahan"}:* ${d(e.extraFee)}
`),r+=`💰 *Total Dibayar:* *${d(e.amount)}* (LUNAS)
💳 *Metode:* ${e.paymentMethod||"Payment Gateway / QRIS"}
📅 *Waktu Transaksi:* ${s}

Lembar dokumen *Kwitansi Resmi Digital* berstempel sah *PT RUANG SINGGAH NUSANTARA* dapat Anda akses dan unduh (PDF/Cetak) melalui tautan resmi berikut:

👉 *Buka Kwitansi Resmi Lunas:* 
${o}

Terima kasih telah mempercayakan hunian Anda bersama RuangSinggah! 🙏✨
_Manajemen KostManager - PT Ruang Singgah Nusantara_`,{message:r,receiptUrl:o}}async function j(e){try{const{message:a}=A(e),o=await y(e.phone,a);return{success:o.success,error:o.error}}catch(a){return console.error("Error sending rent receipt WhatsApp:",a),{success:!1,error:a.message}}}export{P as a,F as b,B as c,A as g,j as s,I as v};
