// Gmail API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
console.log('Email service using backend URL:', BACKEND_URL);

interface RentalRequestEmailData {
  ownerName: string;
  ownerEmail: string;
  renterName: string;
  renterEmail: string;
  itemName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  message?: string;
}

export const emailService = {
  /**
   * Send email to owner when they receive a new rental request
   */
  sendRentalRequestToOwner: async (data: RentalRequestEmailData) => {
    try {
      console.log('Sending email to owner:', data.ownerEmail);
      const response = await fetch(`${BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.ownerEmail,
          subject: `New Rental Request for ${data.itemName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">New Rental Request</h2>
              <p>Hi ${data.ownerName},</p>
              <p>You have a new rental request from <strong>${data.renterName}</strong> (${data.renterEmail}) for your item: <strong>${data.itemName}</strong>.</p>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Rental Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Start Date:</strong> ${data.startDate}</li>
                  <li><strong>End Date:</strong> ${data.endDate}</li>
                  <li><strong>Total Cost:</strong> $${data.totalCost}</li>
                  <li><strong>Message:</strong> ${data.message || 'No message provided'}</li>
                </ul>
              </div>

              <p>Log in to <strong>HomeBase</strong> to approve or decline this request.</p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Best regards,<br>
                HomeBase Team
              </p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      console.log('Email sent to owner:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('Failed to send email to owner:', error);
      return { success: false, error };
    }
  },

  /**
   * Send confirmation email to renter when they submit a request
   */
  sendRentalRequestConfirmationToRenter: async (data: RentalRequestEmailData) => {
    try {
      console.log('Sending confirmation email to renter:', data.renterEmail);
      const response = await fetch(`${BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.renterEmail,
          subject: `Your Rental Request for ${data.itemName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Rental Request Submitted</h2>
              <p>Hi ${data.renterName},</p>
              <p>Your rental request has been submitted successfully!</p>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Item:</strong> ${data.itemName}</li>
                  <li><strong>Owner:</strong> ${data.ownerName}</li>
                  <li><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</li>
                  <li><strong>Total:</strong> $${data.totalCost}</li>
                </ul>
              </div>

              <p>You'll receive an email once the owner responds to your request.</p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Best regards,<br>
                HomeBase Team
              </p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      console.log('Confirmation email sent to renter:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('Failed to send confirmation email to renter:', error);
      return { success: false, error };
    }
  },

  /**
   * Send email to renter when their request is accepted
   */
  sendRentalAcceptedEmail: async (data: RentalRequestEmailData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.renterEmail,
          subject: `Your Rental Request Was Accepted!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Request Accepted! 🎉</h2>
              <p>Hi ${data.renterName},</p>
              <p>Great news! <strong>${data.ownerName}</strong> has accepted your rental request.</p>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Rental Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Item:</strong> ${data.itemName}</li>
                  <li><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</li>
                  <li><strong>Total:</strong> $${data.totalCost}</li>
                  <li><strong>Owner Contact:</strong> ${data.ownerEmail}</li>
                </ul>
              </div>

              <p>Please log in to <strong>HomeBase</strong> to coordinate pickup details with the owner.</p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Best regards,<br>
                HomeBase Team
              </p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      console.log('Acceptance email sent to renter:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('Failed to send acceptance email to renter:', error);
      return { success: false, error };
    }
  },

  /**
   * Send email to renter when their request is declined
   */
  sendRentalDeclinedEmail: async (data: Omit<RentalRequestEmailData, 'totalCost'>) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.renterEmail,
          subject: `Update on Your Rental Request`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">Request Update</h2>
              <p>Hi ${data.renterName},</p>
              <p>Unfortunately, <strong>${data.ownerName}</strong> has declined your rental request for <strong>${data.itemName}</strong>.</p>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Item:</strong> ${data.itemName}</li>
                  <li><strong>Requested Dates:</strong> ${data.startDate} to ${data.endDate}</li>
                </ul>
              </div>

              <p>Browse other similar items on <strong>HomeBase</strong> – we have many great options available!</p>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Best regards,<br>
                HomeBase Team
              </p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      console.log('Decline email sent to renter:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('Failed to send decline email to renter:', error);
      return { success: false, error };
    }
  },
};
