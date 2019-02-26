"use strict";
const fs = require("fs");
const path = require("path");
const unzip = require("unzip");
const parse = require("csv-parse");

const getStopIds = function(zipfile) {
    const validStopIds = [];
    return new Promise((resolve, reject) => {

        let zfs = fs.createReadStream(zipfile);
        let parser = parse({ delimiter: ',', columns: true });

        zfs
          .pipe(unzip.Parse())
          .on("entry", function(entry) {
            if(entry.path === "stops.txt") {
                entry.pipe(parser)
                     .on("readable", function() {
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
          }).on("error", (e) => {
              reject(e);
          }).on("end", () => {
              zfs.close();
          });
    });
};

const getTripIds = function(stopTimes, zipfile) {
    let validTripIds = [];
    return new Promise((resolve, reject) => {

        let zfs = fs.createReadStream(zipfile);
        let parser = parse({ delimiter: ',', columns: true });

        zfs
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
          }).on("error", (e) => {
              reject(e);
          }).on("end", () => {
              zfs.close();
          })
    });
}

const getRouteIds = function(tripIds, zipfile) {
    return new Promise((resolve, reject) => {

        let validRouteIds = new Set();
        let zfs = fs.createReadStream(zipfile);
        let parser = parse({ delimiter: ',', columns: true });

        zfs
           .pipe(unzip.Parse())
           .on("entry", (entry) => {
               if(entry.path === "trips.txt") {
                   entry.pipe(parser).on("readable", function() {
                       let trip;
                       while(trip = this.read()) {
                           if (tripIds.includes(trip['trip_id'])) {
                               validRouteIds.add(trip['route_id']);
                           }
                       }
                   }).on("end", () => {
                       resolve(validRouteIds);
                   }).on("error", (e) => {
                       reject(e);
                   });
               } else {
                   entry.autodrain();
               }
           }).on("error", (e) => {
               reject(e);               
           }).on("end", () => {
               zfs.close();
           })
    });
};

const zippedFile = path.join(__dirname, "GTFS.zip");

try {
    getStopIds(zippedFile)
        .then(stops => {
            return getTripIds(stops, zippedFile);
        }).then(trips => {
            return getRouteIds(trips, zippedFile);
        }).then(routeids => {
            console.log(routeids);
        }).catch((err) => {
            console.log(err);
        });

} catch(e) {
    console.log(e);
}
