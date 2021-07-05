require('dotenv').config();
const AWS = require('aws-sdk');

const chance = require('chance').Chance();
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util');

const a_random_user = async role => {
  const cognito = new AWS.CognitoIdentityServiceProvider();
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID;

  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.first({ nationality: 'en' });
  const suffix = chance.string({
    length: 4,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  const name = `${firstName} ${lastName} ${suffix}`;
  const password = chance.string({ length: 8 });
  const email = `${firstName}-${lastName}-${suffix}@pethost.com`;

  const signUpResponse = await cognito
    .signUp({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'name', Value: name },
        { Name: 'email', Value: email },
        { Name: 'custom:role', Value: role },
      ],
    })
    .promise();

  return {
    name,
    password,
    email,
    role,
    cognitoUsername: signUpResponse.UserSub,
  };
};

const an_appsync_context = (identity, args, result, source, info, prev) => {
  const util = velocityUtil.create([], new Date(), Object());
  const context = {
    identity,
    args,
    arguments: args,
    result,
    source,
    info,
    prev,
  };

  return {
    context,
    ctx: context,
    util,
    utils: util,
  };
};

const an_authenticated_user = async userRole => {
  try {
    const { name, email, password, cognitoUsername } = await a_random_user(
      userRole,
    );

    const cognito = new AWS.CognitoIdentityServiceProvider();

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID;

    await cognito
      .adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: cognitoUsername,
      })
      .promise();

    const auth = await cognito
      .initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: cognitoUsername,
          PASSWORD: password,
        },
      })
      .promise();

    return {
      username: cognitoUsername,
      name,
      email,
      idToken: auth.AuthenticationResult.IdToken,
      accessToken: auth.AuthenticationResult.AccessToken,
    };
  } catch (e) {
    console.log(e);
    return false;
  }
};

module.exports = {
  a_random_user,
  an_appsync_context,
  an_authenticated_user,
};
