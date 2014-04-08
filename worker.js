var update = require("./update");
update.pingTransifexAndUpdateLocalDB(function numbersFetched () {
  console.log("== ## == ALL NUMBERS FETCHED");
});
