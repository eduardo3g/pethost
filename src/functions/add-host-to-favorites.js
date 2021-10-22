const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();

const { USERS_TABLE, FAVORITES_TABLE } = process.env;

module.exports.handler = async event => {
  try {
    const { hostId } = event.arguments;
    const ownerId = event.identity.username;
    const timestamp = new Date().toJSON();

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

    const favorite = {
      ownerId,
      hostId,
      createdAt: timestamp,
      updatedAt: null,
      deletedAt: null,
    };

    await DocumentClient.put({
      TableName: FAVORITES_TABLE,
      Item: favorite,
      Key: {
        ownerId,
        hostId,
      },
      ConditionExpression: 'attribute_not_exists(hostId)',
    }).promise();

    return true;
  } catch (e) {
    return false;
  }
};
