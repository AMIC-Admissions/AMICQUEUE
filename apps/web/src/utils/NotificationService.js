
export const NotificationService = {
  sendWhatsApp: async (phone, ticketNumber, branch, service, trackingLink) => {
    // In a real app, this would call a backend endpoint that interfaces with WhatsApp API
    console.log(`[WhatsApp Mock] Sending to ${phone}: Ticket ${ticketNumber} for ${service} at ${branch}. Track here: ${trackingLink}`);
  },
  
  playAlertSound: () => {
    try {
      const audio = new Audio('/alert.mp3'); // Assuming alert.mp3 exists in public folder
      audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  }
};
