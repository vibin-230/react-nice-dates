const moment = require("moment");

function completedBookingsCurrentMonth(data) {
  let weekday_stats = data.filter((key) => {
    let current_time = moment(key.start_time).parseZone().format("HH");
    if (
      ["saturday", "sunday"].indexOf(
        moment(key.start_time).parseZone().format("dddd").toLocaleLowerCase()
      ) == -1 &&
      current_time >= 16 &&
      current_time <= 23
    ) {
      return key;
    }
  });
  let weekendday_stats = data.filter((key) => {
    let current_time = moment(key.start_time).parseZone().format("HH");
    if (
      ["monday", "tuesday", "wednesday", "thursday", "friday"].indexOf(
        moment(key.start_time).parseZone().format("dddd").toLocaleLowerCase()
      ) == -1 &&
      current_time >= 6 &&
      current_time <= 23
    ) {
      return key;
    }
  });
  let total_week_days = getWeekDays();
  let total_weekends = getWeekDays1();
  let total_weekDayHrs = weekday_stats.map((b) => {
    if (
      Math.sign(
        parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH"))
      ) == -1
    ) {
      if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          24.5
        );
      } else {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          24
        );
      }
    } else {
      if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          0.5
        );
      } else {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH"))
        );
      }
    }
  });
  let total_weekendHrs = weekendday_stats.map((b) => {
    if (
      Math.sign(
        parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH"))
      ) == -1
    ) {
      if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          0.5 +
          24
        );
      } else if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        -30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) -
          0.5 +
          24
        );
      } else {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          24
        );
      }
    } else {
      if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) +
          0.5
        );
      } else if (
        parseFloat(moment(b.end_time).parseZone().format("mm")) -
          parseFloat(moment(b.start_time).parseZone().format("mm")) ==
        -30
      ) {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH")) -
          0.5
        );
      } else {
        return (
          parseFloat(moment(b.end_time).parseZone().format("HH")) -
          parseFloat(moment(b.start_time).parseZone().format("HH"))
        );
      }
    }
  });

  let result = Math.round(
    (total_weekDayHrs.reduce((a, b) => a + b, 0) / (total_week_days * 8)) * 100
  ); //weekdays
  let result1 = Math.round(
    (total_weekendHrs.reduce((a, b) => a + b, 0) / (total_weekends * 18)) * 100
  ); //weekends
  let finalData = {
    weekDay: result,
    weekEnd: result1,
  };
  return finalData;
}
getWeekDays = () => {
  let start_date = moment().startOf("month").format("YYYYMMDD");
  let end_date = moment().subtract(1, "day").format("YYYYMMDD");
  let result = [];
  for (
    var m = moment(start_date);
    m.diff(end_date, "days") <= 0;
    m.add(1, "days")
  ) {
    const day = m.format("dddd").toLocaleLowerCase();
    if (["saturday", "sunday"].indexOf(day) == -1) {
      result.push(day);
    }
  }

  return result.length;
};
getWeekDays1 = () => {
  let start_date = moment().startOf("month").format("YYYYMMDD");
  let end_date = moment().subtract(1, "day").format("YYYYMMDD");
  let result = [];
  for (
    var m = moment(start_date);
    m.diff(end_date, "days") <= 0;
    m.add(1, "days")
  ) {
    const day = m.format("dddd").toLocaleLowerCase();
    if (
      ["monday", "tuesday", "wednesday", "thursday", "friday"].indexOf(day) ==
      -1
    ) {
      result.push(day);
    }
  }
  return result.length;
};

module.exports = completedBookingsCurrentMonth;
