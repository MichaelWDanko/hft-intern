const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(utc);

const SEASON_01 = "season01";
const SEASON_02 = "season02";
const SEASON_WU = "seasonWU";
const SEASON_03 = "season03";

const getCurrentSeason = () => {
  const now = dayjs();

  if (
    now.isBetween(
      dayjs.tz("2023-03-07 11:00:00", "America/Denver"),
      dayjs.tz("2023-06-27 11:00:00", "America/Denver")
    )
  ) {
    return SEASON_03;
  } else if (
    now.isBetween(
      dayjs.tz("2022-11-08 11:00:00", "America/Denver"),
      dayjs.tz("2023-03-07 11:00:00", "America/Denver")
    )
  ) {
    return SEASON_WU;
  } else if (
    now.isBetween(
      dayjs.tz("2022-05-03 11:00:00", "America/Denver"),
      dayjs.tz("2022-11-08 11:00:00", "America/Denver")
    )
  ) {
    return SEASON_02;
  } else if (
    now.isBetween(
      dayjs.tz("2021-11-15 11:00:00", "America/Denver"),
      dayjs.tz("2022-05-03 11:00:00", "America/Denver")
    )
  ) {
    return SEASON_01;
  }
};

module.exports = {
  getCurrentSeason: getCurrentSeason,
  SEASON_01,
  SEASON_02,
  SEASON_WU,
  SEASON_03,
};
