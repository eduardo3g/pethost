const DynamoDB = require('aws-sdk/clients/dynamodb');

const DocumentClient = new DynamoDB.DocumentClient();
const ulid = require('ulid');
const moment = require('moment');
const { BookingStatus } = require('../lib/constants');

const { BOOKINGS_TABLE } = process.env;

module.exports.handler = async event => {
  const {
    hostId,
    petId,
    fromDate: from,
    toDate: to,
  } = event.arguments.bookingRequestInput;

  const fromDate = moment(from);
  const toDate = moment(to);
  const isBeforeCurrentDate = moment(fromDate).isBefore(moment());

  if (isBeforeCurrentDate) {
    throw new Error(
      `The booking requested for ${moment(fromDate).format(
        'YYYY-MM-DDTHH:mm:ss',
      )} is before the current date ${moment().format('YYYY-MM-DDTHH:mm:ss')}`,
    );
  }

  const isToDateBeforeFromDate = moment(toDate).isBefore(fromDate);

  if (isToDateBeforeFromDate) {
    throw new Error(
      `The 'to' date ${moment(toDate).format(
        'YYYY-MM-DDTHH:mm:ss',
      )} is before the 'from' date ${moment(fromDate).format(
        'YYYY-MM-DDTHH:mm:ss',
      )}`,
    );
  }

  const diffInDays = Math.round(
    moment.duration(toDate.diff(fromDate)).asDays(),
  );

  const totalNights = diffInDays <= 0 ? 1 : diffInDays;
  const pricePerNight = 50; // TODO - Get from the host profile in DynamoDB
  const totalPrice = totalNights * pricePerNight;

  const newBookingRequest = {
    id: ulid.ulid(),
    owner: event.identity.username,
    host: hostId,
    pet: petId,
    fromDate: `${moment(fromDate).format('YYYY-MM-DDTHH:mm:ss')}.000Z`,
    toDate: `${moment(toDate).format('YYYY-MM-DDTHH:mm:ss')}.000Z`,
    totalNights,
    pricePerNight,
    totalPrice,
    status: BookingStatus.PENDING,
    createdAt: new Date().toJSON(),
    updatedAt: null,
    deletedAt: null,
  };

  await DocumentClient.put({
    TableName: BOOKINGS_TABLE,
    Item: newBookingRequest,
  }).promise();

  return newBookingRequest;
};
