const algoliasearch = require('algoliasearch');

let usersIndex;

const initUsersIndex = async (appId, apiKey, stage) => {
  if (!usersIndex) {
    const client = algoliasearch(appId, apiKey);
    usersIndex = client.initIndex(`pethost_users_${stage}`);

    await usersIndex.setSettings({
      searchableAttributes: ['name', 'address', 'email'],
    });
  }

  return usersIndex;
};

module.exports = {
  initUsersIndex,
};
