const chance = require('chance').Chance();
const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');

describe('When confirmUserSignUp runs', () => {
  it('The user profile should be saved in DynamoDB', async () => {
    const { name, email } = given.a_random_user();

    const username = chance.guid();

    await when.we_invoke_confirmUserSignUp(username, name, email);

    const ddbUser = await then.user_exists_in_UsersTable(username);

    expect(ddbUser).toMatchObject({
      id: username,
      name,
      email,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g,
      ),
      updatedAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g,
      ),
      deletedAt: null,
    });
  });
});
