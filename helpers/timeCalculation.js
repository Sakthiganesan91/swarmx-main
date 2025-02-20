const moment = require("moment-timezone");

function getFreeSlotsForAll(response, startTime, endTime, interval) {
  const freeSlotsForAll = [];

  // Convert startTime and endTime to UTC
  const startDate = moment
    .tz(startTime.dateTime, startTime.timeZone)
    .utc()
    .toDate();
  const endDate = moment.tz(endTime.dateTime, endTime.timeZone).utc().toDate();

  // Loop through each person's schedule in the response
  response.value.forEach((schedule) => {
    const availabilityView = schedule.availabilityView;
    const freeSlots = [];

    // Loop through the availabilityView string for this person
    for (let i = 0; i < availabilityView.length; i++) {
      const isFree = availabilityView[i] === "0";
      if (isFree) {
        // Calculate the start and end times for this interval in UTC
        const slotStart = new Date(startDate.getTime() + i * interval * 60000); // 60000 ms in 1 minute
        const slotEnd = new Date(slotStart.getTime() + interval * 60000);

        // Check if slotEnd is within the requested end time
        if (slotEnd <= endDate) {
          freeSlots.push({
            start: moment.utc(slotStart).tz(startTime.timeZone).format(), // Convert back to IST
            end: moment.utc(slotEnd).tz(startTime.timeZone).format(), // Convert back to IST
          });
        }
      }
    }

    // Push the result for this individual
    freeSlotsForAll.push({
      scheduleId: schedule.scheduleId,
      freeSlots: freeSlots,
    });
  });

  return freeSlotsForAll;
}

module.exports = {
  getFreeSlotsForAll,
};