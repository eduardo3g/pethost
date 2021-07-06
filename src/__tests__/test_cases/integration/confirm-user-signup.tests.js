require('dotenv').config();
const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');

describe('When confirmUserSignUp runs', () => {
  it('Should save the user profile in DynamoDB', async () => {
    const { cognitoUsername, name, email, role, address, phone_number } =
      await given.a_random_user('owner');

    await when.we_invoke_confirmUserSignUp(
      cognitoUsername,
      name,
      email,
      address,
      phone_number,
      role,
    );

    const ddbUser = await then.user_exists_in_UsersTable(cognitoUsername);

    expect(ddbUser).toMatchObject({
      id: cognitoUsername,
      name,
      email,
      role,
      address,
      phone_number,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g,
      ),
      updatedAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g,
      ),
      deletedAt: null,
    });
  });

  it('Should add the user in the Cognito User Pool Group based on his/her role', async () => {
    const { cognitoUsername, name, email, address, phone_number, role } =
      await given.a_random_user('host');

    await when.we_invoke_confirmUserSignUp(
      cognitoUsername,
      name,
      email,
      address,
      phone_number,
      role,
    );

    const cognitoUserGroups = await then.user_exists_in_CognitoGroup(
      cognitoUsername,
    );

    expect(cognitoUserGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          GroupName: 'host',
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
        }),
      ]),
    );
  });
});
