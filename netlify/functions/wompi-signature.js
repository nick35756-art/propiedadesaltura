// netlify/functions/wompi-signature.js
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { reference, amountInCents, currency } = JSON.parse(event.body);

    // YOUR TEST INTEGRITY SECRET (keep this exact)
    const integritySecret = 'test_integrity_MwApPTzFs1oiqhDasUSYl1VI1EkpEmmj';

    // THIS IS THE ONLY CORRECT STRING FORMAT (with pipes)
    const stringToSign = `${reference}|${amountInCents}|${currency}`;

    const signature = crypto
      .createHmac('sha256', integritySecret)
      .update(stringToSign)
      .digest('hex');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Invalid payload' }) };
  }
};
