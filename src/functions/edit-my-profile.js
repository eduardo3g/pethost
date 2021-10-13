/* eslint-disable no-nested-ternary */
const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();

const { USERS_TABLE } = process.env;

module.exports.handler = async event => {
  try {
    const currentUserId = event.identity.username;
    const {
      name,
      imageUrl,
      bio,
      address,
      birthdate,
      houseImageUrls,
      houseName,
    } = event.arguments.newProfile;

    const getUserResponse = await DocumentClient.get({
      TableName: USERS_TABLE,
      Key: {
        id: currentUserId,
      },
    }).promise();

    const user = getUserResponse.Item;

    if (!user) {
      throw new Error(`User was not found`);
    }

    if (currentUserId !== user.id) {
      throw new Error("You're not allowed to edit someone else's profile");
    }

    if (user.role !== 'host' && typeof houseImageUrls !== 'undefined') {
      throw new Error(
        `Only hosts can upload house pictures, but this user is a ${user.role}`,
      );
    }

    const params = {
      TableName: USERS_TABLE,
      Key: {
        id: currentUserId,
      },
      UpdateExpression:
        'set #name = :name, imageUrl = :imageUrl, bio = :bio, address = :address, birthdate = :birthdate, houseImageUrls = :houseImageUrls, houseName = :houseName',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':imageUrl': imageUrl || (user.imageUrl ? user.imageUrl : null),
        ':bio': bio || (user.bio ? user.bio : null),
        ':address': address || (user.address ? user.address : null),
        ':birthdate': birthdate || (user.birthdate ? user.birthdate : null),
        ':houseImageUrls':
          houseImageUrls && houseImageUrls.length > 0
            ? houseImageUrls
            : typeof user.houseImageUrls !== 'undefined' &&
              Array.isArray(user.houseImageUrls) &&
              user.houseImageUrls.length > 0
            ? user.houseImageUrls
            : [],
        ':houseName':
          houseName || (user.houseName ? user.houseName : 'My comfy house'),
      },
      ConditionExpression: 'attribute_exists(id)',
    };

    await DocumentClient.update(params).promise();

    return true;
  } catch (e) {
    console.error({
      errorType: 'UpdateUserError',
      errorMessage: e.message,
      errorDetails: e.stack,
      error: e,
    });

    return false;
  }
};
