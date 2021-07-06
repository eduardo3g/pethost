require('dotenv').config();
const { handler } = require('../../functions/confirm-user-signup');

const we_invoke_confirmUserSignUp = async (
  cognitoUsername,
  name,
  email,
  address,
  phone_number,
  role,
) => {
  const context = {};

  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    userName: cognitoUsername,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: cognitoUsername,
        'cognito:email_alias': email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'false',
        name,
        email,
        address,
        phone_number,
        'custom:role': role,
      },
    },
    response: {},
  };

  await handler(event, context);
};

module.exports = {
  we_invoke_confirmUserSignUp,
};
