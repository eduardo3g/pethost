const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();

const { USERS_TABLE } = process.env;

module.exports.handler = async event => {
  const { name, email } = event.request.userAttributes;

  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const timestamp = new Date().toJSON();

    const user = {
      id: event.userName,
      name,
      email,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    await DocumentClient.put({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)',
    }).promise();

    return event;
  }

  return event;
};
