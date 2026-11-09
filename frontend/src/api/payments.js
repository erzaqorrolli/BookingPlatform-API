import api from './client';

export const createStripeCheckout = async (bookingId) => {
  const response = await api.post('/payments/checkout', {
    booking_id: bookingId
  });
  return response.data;
};