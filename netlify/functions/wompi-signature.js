exports.handler = async (event) => {
  const { reference, amountInCents, currency } = JSON.parse(event.body);

  const integritySecret = 'test_integrity_MwApPTzFs1oiqhDasUSYl1VI1EkpEmmj';

  const stringToSign = reference + amountInCents + currency + integritySecret;

  const signature = require('crypto')
    .createHmac('sha256', integritySecret)
    .update(stringToSign)
    .digest('hex');

  return {
    statusCode: 200,
    body: JSON.stringify({ signature })
  };
};
