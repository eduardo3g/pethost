require('dotenv').config();

const AWS = require('aws-sdk');

const user_exists_in_UsersTable = async id => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();

  const response = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(response.Item).toBeTruthy();

  return response.Item;
};

const user_exists_in_CognitoGroup = async username => {
  const cognito = new AWS.CognitoIdentityServiceProvider();
  const clientId = process.env.COGNITO_USER_POOL_ID;

  const response = await cognito
    .adminListGroupsForUser({
      Limit: 60,
      NextToken: null,
      Username: username,
      UserPoolId: clientId,
    })
    .promise();

  expect(response.Groups).toHaveLength(1);

  return response.Groups;
};

module.exports = {
  user_exists_in_UsersTable,
  user_exists_in_CognitoGroup,
};
