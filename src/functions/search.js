/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-object-spread */
const chance = require('chance').Chance();
const middy = require('@middy/core');
const ssm = require('@middy/ssm');
const { initUsersIndex } = require('../lib/algolia');
const { SearchModes } = require('../lib/constants');

const { STAGE } = process.env;

function parseNextToken(nextToken) {
  if (!nextToken) {
    return undefined;
  }

  const token = Buffer.from(nextToken, 'base64').toString();
  const searchParams = JSON.parse(token);
  delete searchParams.random;

  return searchParams;
}

function genNextToken(searchParams) {
  if (!searchParams) {
    return null;
  }

  const payload = Object.assign({}, searchParams, {
    random: chance.string({ length: 16 }),
  });

  const token = JSON.stringify(payload);

  return Buffer.from(token).toString('base64');
}

async function searchPeople(context, userId, query, limit, nextToken) {
  const index = await initUsersIndex(
    context.ALGOLIA_APP_ID,
    context.ALGOLIA_WRITE_KEY,
    STAGE,
  );

  const searchParams = parseNextToken(nextToken) || {
    hitsPerPage: limit,
    page: 0,
  };

  const { hits, page, nbPages } = await index.search(query, searchParams);

  hits.forEach(x => {
    x.__typename = 'PetOwnerProfile';
  });

  let nextSearchParams;
  if (page + 1 >= nbPages) {
    nextSearchParams = null;
  } else {
    nextSearchParams = Object.assign({}, searchParams, { page: page + 1 });
  }

  return {
    results: hits,
    nextToken: genNextToken(nextSearchParams),
  };
}

module.exports.handler = middy(async (event, context) => {
  const userId = event.identity.username;
  const { query, mode, limit, nextToken } = event.arguments;

  switch (mode) {
    case SearchModes.PEOPLE:
      return await searchPeople(context, userId, query, limit, nextToken);
    default:
      throw new Error('Only "People" search mode is supported right now');
  }
}).use(
  ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000, // 5 minutes
    names: {
      ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
      ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`,
    },
    setToContext: true,
    throwOnFailedCall: true,
  }),
);
