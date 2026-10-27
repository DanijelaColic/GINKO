export {
  MYRENT_OBJECT_IDS,
  MYRENT_DEFAULT_API_BASE_URL,
  MYRENT_DEFAULT_AUTH_URL,
  getMyRentConfig,
  getMyRentObjectId,
  getRoomSlugsForObjectId,
  isMyRentConfigured,
  resolveMyRentObjectId,
} from './myrent.config';

export {
  clearMyRentTokenCache,
  getMyRentToken,
  probeMyRentAuth,
  MyRentAuthError,
} from './myrent.auth';

export { myrentRequest, MyRentApiError } from './myrent.client';

export {
  fetchMyRentCalendar,
  fetchMyRentOccupiedDates,
  isMyRentDayOccupied,
  getOccupiedReason,
} from './myrent.calendar';

export {
  addIsoDays,
  occupiedDatesToBookedRanges,
  myRentDaysToBookedRanges,
  bookedRangesToOccupiedNights,
  subtractOccupiedRanges,
} from './myrent.ranges';

export {
  MYRENT_TIMELINE_UNITS,
  getTimelineUnitForRoomSlug,
} from './myrent.units';
export type { MyRentTimelineUnit } from './myrent.units';

export type {
  MyRentCalendarDay,
  MyRentCalendarResult,
  MyRentOccupiedDay,
} from './myrent.types';
