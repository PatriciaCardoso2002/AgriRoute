import { ReadBooking } from '../src/bookings/bookings.interface';

export function isISODateString(dateString) {
  const isoDatePattern =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-]\d{2}:\d{2}))$/;
  return isoDatePattern.test(dateString);
}

// Check if there is overlapping with another booking
export function isOverlapping(
  existingBooking: ReadBooking,
  newBooking: ReadBooking,
): boolean {
  console.log('\nChecking overlapping');
  console.log('existingBooking');
  console.log(existingBooking);
  console.log('newBooking');
  console.log(newBooking);

  // Ensure datetime properties are Date objects
  const existingDatetime = new Date(existingBooking.datetime);
  const newDatetime = new Date(newBooking.datetime);

  const existingEnd = new Date(
    existingDatetime.getTime() + existingBooking.duration * 1000,
  );

  console.log('existingEnd');
  console.log(existingEnd);

  const newEnd = new Date(newDatetime.getTime() + newBooking.duration * 1000);

  console.log('newEnd');
  console.log(newEnd);

  // Ensure correct comparison logic
  const isOverlapping = existingDatetime < newEnd && existingEnd > newDatetime;

  console.log('Is overlapping:', isOverlapping);

  return isOverlapping;
}
