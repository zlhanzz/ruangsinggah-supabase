export async function notifyAdminTransaction(type: string, details: Record<string, any>) {
  try {
    const adminEmail = 'sulhan77777@gmail.com';
    const formSubmitUrl = `https://formsubmit.co/ajax/${adminEmail}`;
    
    // Create professional formatted object
    const payload: any = {
      _subject: `Transaksi Baru - ${type}!`,
      "Tipe Transaksi": type,
      ...details,
      "Waktu": new Date().toLocaleString('id-ID')
    };

    const response = await fetch(formSubmitUrl, {
      method: "POST",
      headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn("Email notification returned:", await response.text());
    } else {
      console.log("Admin notification sent successfully via FormSubmit.");
    }
  } catch (err) {
    console.error("Failed to notify admin:", err);
  }
}

export async function notifyAdminStatusUpdate(type: string, targetId: string, newStatus: string, details: Record<string, any> = {}) {
  return notifyAdminTransaction(`UPDATE STATUS: ${type} -> ${newStatus}`, {
    "ID Transaksi": targetId,
    "Status Baru": newStatus,
    ...details
  });
}
