const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { reference, amountInCents, currency } = JSON.parse(event.body);
  const integritySecret = 'prod_integrity_P4Vgb8efwHXdy5aYfie40oZdjCcfUVmd';  // From Wompi Dashboard > Settings > Developers > Integrity Secret

  // Generate signature: SHA256(reference + amountInCents + currency + secret)
  const concat = `${reference}${amountInCents}${currency}${integritySecret}`;
  const signature = crypto.createHmac('sha256', integritySecret).update(concat).digest('hex');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature })
  };
};
