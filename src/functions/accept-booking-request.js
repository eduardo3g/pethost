const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();
const moment = require('moment');
const { BookingStatus } = require('../lib/constants');

const { BOOKINGS_TABLE } = process.env;

module.exports.handler = async event => {
  const { bookingId } = event.arguments;

  const getBookingResponse = await DocumentClient.get({
    TableName: BOOKINGS_TABLE,
    Key: {
      id: bookingId,
    },
  }).promise();

  const booking = getBookingResponse.Item;

  if (!booking) {
    throw new Error(`The booking ID ${bookingId} does not exist`);
  }

  const isBeforeCurrentDate = moment(booking.fromDate).isBefore(moment());

  if (isBeforeCurrentDate) {
    throw new Error(
      `The booking that occurs at ${moment(booking.fromDate).format(
        'YYYY-MM-DDTHH:mm:ss',
      )} is before the current date ${moment().format('YYYY-MM-DDTHH:mm:ss')}`,
    );
  }

  if (booking.host !== event.identity.username) {
    throw new Error(
      `You are not allowed to accept a booking requested to another host`,
    );
  }

  await DocumentClient.update({
    TableName: process.env.BOOKINGS_TABLE,
    Key: {
      id: bookingId,
    },
    UpdateExpression: 'SET #status = :accepted',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':accepted': BookingStatus.ACCEPTED,
    },
  }).promise();

  return true;
};
