var async       = require('async');
var toTrack     = require('./to_track');
var data        = require('./data');
var transifex   = require('transifex');


// Get our JSON config file
var teams = toTrack.teams;

exports.pingTransifexAndUpdateLocalDB = function pingTransifexAndUpdateLocalDB  () {
  fetchAllTheData(teams, function allDataFetched () {
    console.log('DB updated');
    process.exit(0);
  });
}

// exports.clearAndRebuildDB = function clearAndRebuildDB () {
//   console.time('reset');
//   data.resetDatabaseYesIreallyWantToDoThis(function resetAttempted () {
//     console.log('Database Reset Complete');

//     fetchAllTheData(orgs, null, function allDataFetched () {
//       console.timeEnd('reset');
//       process.exit(0);
//     });
//   });
// }


function fetchAllTheData (orgs, callback) {

  transifex.init({
      project_slug: "webmaker",
      credential: process.env.TRANSIFEX_AUTH // In the same format
  });

  async.each(toTrack.projects, fetchProjectData, function fetchedProjectData (err){
      console.log("fetched all project data");
      callback(null);
  });

  function fetchProjectData (item, callback) {
    var projectName = item.name;
    var team = item.team;

    transifex.projectInstanceMethods(projectName, function retrievedProjectLevelInfo (err, data) {
      if (data && data.resources) {
        var language_codes = [];
        if (data.teams) { language_codes = data.teams };

        async.each(
            data.resources,
            function (item, callback) {
              fetchResourceData(item, language_codes, function fetchedxResource (err, res) {
                callback(null);
              });
            },
            function fetchedResourceLevelInfo (err, data) {
              console.log("Fetched Resource Level Info");
              callback(null);
            }
        );
      } else {
        console.error("No Resources found for", projectName);
        callback(null);
      }
    });

    function fetchResourceData (item, language_codes, callback) {
      if (item && item.slug && language_codes) {
        var resource = item.slug;
        async.each(language_codes,
          function (item, callback) {
            setTimeout( function() {
              getContributionActivities(item, resource, function gotActivities (err, res) {
                if (err) { console.error(err); };
                console.log("project:", projectName, "resource:", resource, "item", item);
                callback(null);
              })
            },
            getRandomInt(200000,10)); // setTimeout

          },
          function gotContributionActivities (err, data) {
            console.log("Saved activities for", team, "resource:", resource);
            callback(null);
          }
        );
      } else {
        console.error("Missing item slug or language_codes");
        callback(null);
      }
    }

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getContributionActivities (language_code, resource, callback) {
       transifex.translationStringsMethod(projectName, resource, language_code, function(err, response) {
        var translationStrings;
        if (response) {
          translationStrings = JSON.parse(response);
        }
        if (translationStrings) {
          console.log("=========", projectName, resource, language_code);
          async.each(translationStrings,
            function (item, callback) {
              if (item.user && item.last_update) {
                data.saveItem(item.last_update, item.user, team, function savedItem (err, response) {
                  if (err) { console.error("Error saving item:", err);}
                  console.log("-- saved:", projectName, resource, item.user, team);
                  callback(null);
                });
              }
            },
            function allActivitiesSaved (err, response) {
              console.log("all activities saved to this");
              callback(null);
            }
          );
        } else {
          console.log("No translationStrings");
          callback(null);
        }
      });
    }
  }
}
