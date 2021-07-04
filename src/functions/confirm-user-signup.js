const DynamoDB = require('aws-sdk/clients/dynamodb');
const CognitoServiceProvider = require('aws-sdk/clients/cognitoidentityserviceprovider');

const DocumentClient = new DynamoDB.DocumentClient();
const CognitoClient = new CognitoServiceProvider();

const { USERS_TABLE } = process.env;

module.exports.handler = async event => {
  const { name, email, 'custom:role': role } = event.request.userAttributes;

  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const timestamp = new Date().toJSON();

    const user = {
      id: event.userName,
      name,
      email,
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
