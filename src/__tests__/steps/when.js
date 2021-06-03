/* eslint-disable global-require */
require('dotenv').config();

const we_invoke_confirmUserSignUp = async (username, name, email) => {
  const { handler } = require('../../functions/confirm-user-signup');

  const context = {};

  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    userName: username,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'false',
        name,
        email,
      },
    },
    response: {},
  };

  await handler(event, context);
};

module.exports = {
  we_invoke_confirmUserSignUp,
};
