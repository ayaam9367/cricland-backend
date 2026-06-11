const { getModel } = require("../storeData/storeMatchData");
var cron = require("node-cron");

const deletecompletedmatch = async () => {
  try {
    const todaymatch1 = getModel("match_today");
    const threeDaysAgo = moment().subtract(3, 'days').toDate();

    const completedMatches = await todaymatch1.find({
      $or: [{ status: 3 }, { status: 4 }, { status_str: "Completed" }],
      date_end: { $lt: threeDaysAgo }
    });

    if (completedMatches.length === 0) {
      console.log("No completed matches found to delete.");
      return;
    }
    await todaymatch1.deleteMany({
      $or: [{ status: 3 }, { status: 4 }, { status_str: "Completed" }],
      date_end: { $lt: threeDaysAgo }
    });

    console.log("Completed matches deleted successfully.");
  } catch (error) {
    console.error("Error deleting completed matches:", error);
  }
};

cron.schedule("0 0 * * *", async () => {
  console.log("Job for delete completed match");
  await deletecompletedmatch();
  console.log("end");
});
