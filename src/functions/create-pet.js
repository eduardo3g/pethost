const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();
const ulid = require('ulid');

const { PETS_TABLE } = process.env;

module.exports.handler = async event => {
  const { name, bio, birthDate, type } = event.arguments.petInput;

  const newPet = {
    id: ulid.ulid(),
    owner: event.identity.username,
    name,
    bio,
    birthDate,
    type,
    createdAt: new Date().toJSON(),
    updatedAt: null,
    deletedAt: null,
  };

  await DocumentClient.put({
    TableName: PETS_TABLE,
    Item: newPet,
  }).promise();

  return newPet;
};
