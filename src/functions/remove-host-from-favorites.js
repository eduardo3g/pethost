const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();

const { USERS_TABLE, FAVORITES_TABLE } = process.env;

module.exports.handler = async event => {
  try {
    const { hostId } = event.arguments;
    const ownerId = event.identity.username;

    const getHostResponse = await DocumentClient.get({
      TableName: USERS_TABLE,
      Key: {
        id: hostId,
      },
    }).promise();

    const host = getHostResponse.Item;

    if (!host) {
      throw new Error(`Host [${hostId}] was not found`);
    }

    await DocumentClient.delete({
      TableName: FAVORITES_TABLE,
      Key: {
        ownerId,
        hostId,
      },
      ConditionExpression: 'attribute_exists(hostId)',
    }).promise();

    return true;
  } catch (e) {
    console.log(`Failed to remove host from favorites`, {
      errorMessage: e.message,
      errorStack: e.stack,
    });

    return false;
  }
};
