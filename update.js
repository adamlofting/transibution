var async       = require('async');
var toTrack     = require('./to_track');
var data        = require('./data');
var transifex   = require('transifex');


exports.pingTransifexAndUpdateLocalDB = function pingTransifexAndUpdateLocalDB  () {
  fetchAllTheData(function allDataFetched () {
    console.log('DB updated');
    process.exit(0);
  });
};

/**
 * Utility function in-case project names etc change on Transifex
 */
exports.clearAndRebuildDB = function clearAndRebuildDB () {
  console.time('reset');
  data.resetDatabaseYesIreallyWantToDoThis(function resetAttempted () {
    console.log('Database Reset Complete');

    fetchAllTheData(function allDataFetched () {
      console.timeEnd('reset');
      process.exit(0);
    });
  });
};


function fetchAllTheData (callback) {

  transifex.init({
      project_slug: "webmaker",
      credential: process.env.TRANSIFEX_AUTH // In the same format
  });

  async.eachSeries(toTrack.projects, fetchProjectData, function fetchedProjectData (err){
      console.log("fetched all project data");
      callback(null);
  });

  function fetchProjectData (item, callback) {
    var projectName = item.name;
    var team = item.team;

    transifex.projectInstanceMethods(projectName, function retrievedProjectLevelInfo (err, data) {
      if (data && data.resources) {
        var language_codes = [];
        if (data.teams) { language_codes = data.teams; }

        async.eachSeries(
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
        async.eachLimit(language_codes, 3,
          function (item, callback) {
            getContributionActivities(item, resource, function gotActivities (err, res) {
              if (err) { console.error(err); }
              console.log("project:", projectName, "resource:", resource, "item", item);
              callback(null);
            });
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
          try {
            translationStrings = JSON.parse(response);
          } catch (e) {
            console.error(e);
          }
        }
        if (translationStrings) {
          console.log("=========", projectName, resource, language_code);

          var activitiesToSave = [];
          translationStrings.forEach(function (item) {
            if (item.user && item.last_update) {
              var activity = {};
              activity.happened_on = item.last_update;
              activity.user = item.user;
              activity.mozilla_team = team;
              activitiesToSave.push(activity);
            }
          });

          if (activitiesToSave.length > 0) {
            data.saveItems(activitiesToSave, function savedItems (err, response) {
              if (err) { console.error("Error saving item:", err);}
              console.log("-- saved:", activitiesToSave.length, "activities");
              callback(null);
            });
          } else {
            callback(null);
          }

        } else {
          console.log("No translationStrings");
          callback(null);
        }
      });
    }
  }
}
