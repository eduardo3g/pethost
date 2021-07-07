const DynamoDB = require('aws-sdk/clients/dynamodb');
const CognitoServiceProvider = require('aws-sdk/clients/cognitoidentityserviceprovider');

const DocumentClient = new DynamoDB.DocumentClient();
const CognitoClient = new CognitoServiceProvider();

const { USERS_TABLE } = process.env;

module.exports.handler = async event => {
  const {
    name,
    email,
    address,
    birthdate,
    phone_number,
    'custom:role': role,
    'custom:lat': lat,
    'custom:lon': lon,
  } = event.request.userAttributes;

  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const timestamp = new Date().toJSON();

    const user = {
      id: event.userName,
      name,
      email,
      bio: null,
      birthdate,
      address,
      latitude: lat,
      longitude: lon,
      phone_number,
      role,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    await CognitoClient.adminAddUserToGroup({
      GroupName: role,
      UserPoolId: event.userPoolId,
      Username: event.userName,
    }).promise();

    await DocumentClient.put({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)',
    }).promise();

    return event;
  }

  return event;
};
