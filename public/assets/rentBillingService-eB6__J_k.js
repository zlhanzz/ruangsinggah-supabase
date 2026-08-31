import{aa as y,c as u}from"./index-Cv4A6c2c.js";function B(e,a,n="bulanan",t=1){const s=new Date,i=a&&a!=="Sewa Berjalan"?new Date(a):e?new Date(e):new Date,l=new Date(i),r=new Date(l),o=(n||"bulanan").toLowerCase();o==="harian"?r.setDate(r.getDate()+t):o==="mingguan"?r.setDate(r.getDate()+t*7):o==="3bulanan"||o==="3_bulanan"||o==="triwulan"?r.setMonth(r.getMonth()+t*3):o==="6bulanan"||o==="6_bulanan"||o==="semester"?r.setMonth(r.getMonth()+t*6):o==="tahunan"||o==="tahunan (1 tahun)"?r.setFullYear(r.getFullYear()+t):r.setMonth(r.getMonth()+t);const p=new Date(s.getFullYear(),s.getMonth(),s.getDate()).getTime(),w=new Date(i.getFullYear(),i.getMonth(),i.getDate()).getTime(),c=p-w,g=c>0?Math.ceil(c/(1e3*60*60*24)):0,d=g>0,m={bulanan:"Bulanan (1 Bulan)","3bulanan":"3 Bulanan","6bulanan":"6 Bulanan",tahunan:"Tahunan (1 Tahun)",mingguan:"Mingguan (7 Hari)",harian:"Harian"};return{newStartDate:l.toISOString().split("T")[0],newEndDate:r.toISOString().split("T")[0],periodLabel:m[o]||"Bulanan",isLate:d,lateDays:g}}function P(e){try{const a=JSON.stringify(e);return btoa(unescape(encodeURIComponent(a))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}catch(a){return console.error("Failed to create rent claim token:",a),""}}function F(e){try{if(!e)return null;let a=e.replace(/-/g,"+").replace(/_/g,"/");for(;a.length%4;)a+="=";const n=decodeURIComponent(escape(atob(a))),t=JSON.parse(n);return!t.phone||!t.propertyId||!t.roomNumber?null:t}catch(a){return console.error("Failed to decode rent claim token:",a),null}}async function K(e){try{const{phone:a,tenantName:n,propertyTitle:t,roomNumber:s,monthlyPrice:i,dueDate:l,propertyId:r,billingPeriod:o="Bulanan",previousPeriodStart:p,previousPeriodEnd:w,newPeriodStart:c,newPeriodEnd:g,extraFee:d=0,extraFeeName:m,daysRemaining:M}=e,S=P({phone:a.replace(/[^0-9]/g,""),tenantName:n,propertyId:r,propertyTitle:t,roomNumber:s,monthlyPrice:i,dueDate:l,billingPeriod:o,previousPeriodStart:p,previousPeriodEnd:w,newPeriodStart:c,newPeriodEnd:g,extraFee:d,extraFeeName:m,createdAt:Date.now()}),$=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/claim-kost?token=${S}`,k=b=>!b||b==="Sewa Berjalan"?"-":new Date(b).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),D=k(l),T=Number(i||0)+Number(d||0);let h=`Halo Kak *${n}*! 👋

Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai perpanjangan masa sewa kamar Anda:

🏠 *Properti:* ${t}
🚪 *Kamar:* No. ${s}
📋 *Jenis Sewa:* ${o}
`;c&&g&&(h+=`📅 *Periode Sewa Baru:* ${k(c)} s/d ${k(g)}
`),h+=`⚠️ *Jatuh Tempo:* ${D}
💵 *Tarif Pokok:* ${u(i)}
`,d>0&&m&&(h+=`➕ *${m}:* ${u(d)}
`),h+=`💰 *Total Pembayaran:* *${u(T)}*

_(Catatan: Sesuai aturan sewa, periode perpanjangan baru tetap dihitung bersambung dari akhir masa sewa sebelumnya)_

Untuk memantau kwitansi resmi, melihat kartu sewa, dan melakukan perpanjangan instan via QRIS / Transfer Bank, silakan klik tautan resmi berikut:

👉 *Akses Kost Saya & Bayar:* 
${$}

Terima kasih atas kerjasamanya! 🙏✨`;const f=await y(a,h);return{success:f.success,error:f.error}}catch(a){return console.error("Error sending rent billing reminder WhatsApp:",a),{success:!1,error:a.message}}}function A(e){var l;const n=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/receipt/${e.orderId}`,t=r=>!r||r==="Sewa Berjalan"?"-":new Date(r).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}),s=e.paidAt?new Date(e.paidAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});let i=`Halo Kak *${e.tenantName}*! 🎉✨

Pembayaran perpanjangan sewa kamar Anda telah kami terima dan diverifikasi *LUNAS*:

🧾 *No. Kwitansi:* #${((l=(e.orderId||"").split("-").pop())==null?void 0:l.toUpperCase())||e.orderId}
🏠 *Properti:* ${e.propertyTitle}
🚪 *Kamar:* No. ${e.roomNumber}
📌 *Skema Sewa:* ${e.billingPeriod||"Bulanan"}
`;return e.newPeriodStart&&e.newPeriodEnd&&(i+=`🔄 *Masa Sewa Baru:* ${t(e.newPeriodStart)} s/d ${t(e.newPeriodEnd)}
`),e.basePrice&&(i+=`💵 *Sewa Pokok:* ${u(e.basePrice)}
`),e.extraFee&&e.extraFee>0&&(i+=`➕ *${e.extraFeeName||"Biaya Tambahan"}:* ${u(e.extraFee)}
`),i+=`💰 *Total Dibayar:* *${u(e.amount)}* (LUNAS)
💳 *Metode:* ${e.paymentMethod||"Payment Gateway / QRIS"}
📅 *Waktu Transaksi:* ${s}

Lembar dokumen *Kwitansi Resmi Digital* berstempel sah *PT RUANG SINGGAH NUSANTARA* dapat Anda akses dan unduh (PDF/Cetak) melalui tautan resmi berikut:

👉 *Buka Kwitansi Resmi Lunas:* 
${n}

Terima kasih telah mempercayakan hunian Anda bersama RuangSinggah! 🙏✨
_Manajemen KostManager - PT Ruang Singgah Nusantara_`,{message:i,receiptUrl:n}}async function j(e){try{const{message:a}=A(e),n=await y(e.phone,a);return{success:n.success,error:n.error}}catch(a){return console.error("Error sending rent receipt WhatsApp:",a),{success:!1,error:a.message}}}function R(e){const n=`${typeof window<"u"?window.location.origin:"https://ruangsinggah.id"}/my-kost?orderId=${e.orderId}&tab=payment`,t=i=>!i||i==="Sewa Berjalan"?"-":new Date(i).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});return{message:`Halo Kak *${e.tenantName}*! 👋🎉

Kabar baik! Pengajuan sewa kamar Anda di *${e.propertyTitle}* telah *DISETUJUI (ACC)* oleh Manajemen KostManager RuangSinggah.

📋 *Rincian Pengajuan Sewa:*
🏠 *Properti:* ${e.propertyTitle}
🚪 *Kamar:* ${e.roomName}
📌 *Skema Sewa:* ${e.periodLabel}
📅 *Rencana Masuk:* ${t(e.startDate)}
`+(e.occupants&&e.occupants>1?`👥 *Jumlah Penghuni:* ${e.occupants} Orang
`:"")+(e.basePrice?`💵 *Harga Sewa Dasar:* ${u(e.basePrice)}
`:"")+(e.extraFee&&e.extraFee>0?`➕ *${e.extraFeeName||"Biaya Tambahan"}:* ${u(e.extraFee)}
`:"")+`💰 *Total Tagihan Pertama:* *${u(e.totalAmount)}*

Untuk mengonfirmasi pesanan Anda dan mengamankan kamar, silakan selesaikan pembayaran melalui tautan resmi Kost Saya di bawah ini:

👉 *Selesaikan Pembayaran Sekarang:* 
${n}

_(Pembayaran dapat dilakukan melalui QRIS, Transfer Virtual Account, atau E-Wallet)_

Jika ada pertanyaan atau butuh bantuan, Anda dapat membalas pesan ini atau menghubungi CS KostManager. Terima kasih! 🙏✨
_Manajemen KostManager - RuangSinggah_`,paymentUrl:n}}async function U(e){try{const{message:a}=R(e),n=await y(e.phone,a);return{success:n.success,error:n.error}}catch(a){return console.error("Error sending booking approval WhatsApp:",a),{success:!1,error:a.message}}}export{j as a,P as b,B as c,K as d,A as g,U as s,F as v};
