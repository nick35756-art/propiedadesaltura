const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { reference, amountInCents, currency } = JSON.parse(event.body);

  // Your TEST secret (2025 sandbox format)
  const integritySecret = 'test_integrity_MwApPTzFs1oiqhDasUSYl1VI1EkpEmmj';

  // EXACT order Wompi expects → reference + amountInCents + currency + secret
  const stringToSign = `${reference}${amountInCents}${currency}${integritySecret}`;

  const signature = crypto
    .createHmac('sha256', integritySecret)
    .update(stringToSign)
    .digest('hex');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature }),
  };
};
