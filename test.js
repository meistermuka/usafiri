"use strict";
const fs = require("fs");
const path = require("path");
const unzip = require("unzip");
const parse = require("csv-parse");
const Papa = require("papaparse");
const csvparser = require("csv-parser");

const parser = parse({
    delimiter: ',',
    columns: true
});



const validStopTimes = [];

const zippedFile = path.join(__dirname, "GTFS.zip");

/* function getValidStopTimes(zipFile, validStopIds) {

    fs.createReadStream(zipFile)
      .on(unzip.Parse())
      .on("entry", function(entry) {
        if(entry.path === "stop_times.txt") {
            entry.pipe(parser).on("readable", function() {

            })
        }
      })

} */
const getStopIds = function(zipFile) {
    const validStopIds = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
          .pipe(unzip.Parse())
          .on("entry", function(entry) {
            if(entry.path === "stops.txt") {
                entry.pipe(parser).on("readable", function() {
                    let stop;
                    while (stop = this.read()) {
                        if (stop['stop_name'] !== undefined && stop['stop_name'].includes("Grand Central")) {
                          validStopIds.push(stop['stop_id']);
                        }
                    }
                }).on("end", function() {
                  resolve(validStopIds);
                }).on("error", function(e) {
                    reject(e);
                });  
            } else {
              entry.autodrain();
            }
          })
    });
}

const getTripIds = function(stopTimes, zipFile) {
    const validTripIds = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
          .pipe(unzip.Parse())
          .on("entry", function(entry) {
              if(entry.path === "stop_times.txt") {
                  entry.pipe(parser).on("readable", function() {
                      let stop_time;
                      while (stop_time = this.read()) {
                          if (stopTimes.includes(stop_time['stop_id'])) {
                            validTripIds.push(stop_time['trip_id']);
                          }
                      }
                  }).on("end", function() {
                      resolve(validTripIds);
                  }).on("error", function(e) {
                      reject(e);
                  });
              } else {
                  entry.autodrain();
              }
          });
    });
}
try {

    getStopIds(zippedFile)
    .then(stops => {
        console.log(getTripIds(stops, zippedFile));
    }).catch(console.error);

    /* fs.createReadStream(zippedFile)
      .pipe(unzip.Parse())
      .on("entry", function(entry) {
          if(entry.path === "stops.txt") {
              entry.pipe(parser).on("readable", function() {
                  let stop;
                  while (stop = this.read()) {
                      if (stop['stop_name'] !== undefined && stop['stop_name'].includes("Grand Central")) {
                        validStopIds.push(stop['stop_id']);
                      }
                  }
              }).on("end", function() {
                return validStopIds;
              });

          } else {
            entry.autodrain();
          }
        }).resume()
          .pipe(unzip.Parse())
          .on("entry", function(entry) {
              if(entry.path === "stop_times.txt") {
                  console.log("FOUND STOP TIMES!");
              } else {
                  entry.autodrain();
              }
          });


          /* } else if(filename === "stop_times.txt") {
              entry.pipe(parser).on("readable", function() {
                  let time_rec;
                  while (time_rec = this.read()) {
                    if (validStopIds.includes(time_rec['stop_id'])) {
                        validStopTimes.push(time_rec['trip_id']);
                    }
                  }
              }).on("end", function() {
                  console.log(validStopTimes);
              }) */

} catch(e) {
    console.log(e);
}

//const w = fs.createWriteStream("./demofile.txt.gz");

//r.pipe(gzip).pipe(w);