const moment = require("moment");

// Function to find available interviewer
function findAvailableInterviewer(requestedDateTime, duration, interviewers) {

  // Convert requestedDateTime to moment object
  const requestedStart = moment(requestedDateTime);
  const requestedEnd = moment(requestedStart).add(duration, "minutes");

  // Loop through each interviewer
  for (const interviewer of interviewers) {
    let availableDuration = 0;
    let sequenceStart = null;

    // Sort free slots by start time
    const sortedSlots = interviewer.freeSlots.sort((a, b) =>
      moment(a.start).isBefore(b.start) ? -1 : 1
    );

    for (const slot of sortedSlots) {
      const slotStart = moment(slot.start);
      const slotEnd = moment(slot.end);

      if (
        slotStart.isSameOrBefore(requestedStart) &&
        slotEnd.isAfter(requestedStart)
      ) {
        // This slot contains or starts at the requested time
        if (!sequenceStart) sequenceStart = slotStart;

        // Calculate overlap and available duration
        const overlap = Math.min(
          slotEnd.diff(requestedStart),
          requestedEnd.diff(requestedStart)
        );
        availableDuration += overlap;

        // Check if we have enough continuous time
        if (availableDuration >= duration * 60 * 1000) {
          return interviewer.scheduleId; // Found an available interviewer
        }

        // Move the requestedStart to the end of the current slot for the next iteration
        requestedStart.add(slotEnd.diff(slotStart), "milliseconds");
      } else if (sequenceStart) {
        // If the slot does not continue from the previous slot, break the sequence
        break;
      }
    }
  }

  // No interviewer available for the requested duration
  return null;
}

module.exports = {
  findAvailableInterviewer,
};