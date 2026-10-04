// Match the serializer's priority: a date and both times identify a rest.
// Its hours belong to compensated_hours; hours describes additional work.
export const calendarCompensatoryEligibility = [
  "and(compensated_hours_day.not.is.null,t_time_start.not.is.null,t_time_finish.not.is.null,compensated_hours.gte.0)",
  "and(hours.gte.0,or(compensated_hours_day.is.null,t_time_start.is.null,t_time_finish.is.null))",
].join(",");
