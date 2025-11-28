const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { reference, amountInCents, currency } = JSON.parse(event.body);
  const integritySecret = 'test_integrity_MwApPTzFs1oiqhDasUSYl1VI1EkpEmmj';  // Your test secret

  // OFFICIAL Wompi concat: reference + amountInCents + currency + secret (NO spaces or pipes!)
  const concatString = reference + amountInCents + currency + integritySecret;
  const signature = crypto.createHmac('sha256', integritySecret).update(concatString).digest('hex');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature })
  };
};
