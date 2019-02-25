"use strict";

const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const stopsFile = path.join(__dirname, "stops.txt");
const tripsFile = path.join(__dirname, "trips.txt");
const stopsTimesFile = path.join(__dirname, "stop_times.txt");

const stopsContent = fs.readFileSync(stopsFile, "utf8");
const tripsContent = fs.readFileSync(tripsFile, "utf8");
const stopsTimesContent = fs.readFileSync(stopsTimesFile, "utf8");

// Getting the stops matching "Grand Central"
let stopsStruct;
Papa.parse(stopsContent, {
    header: true,
    delimiter: ",",
    complete: function(results) {
        stopsStruct = results.data.filter(function(stop) {
            return stop['stop_name'] !== undefined && stop['stop_name'].includes("Grand Central");            
        });
    }
});

let stops = []
stopsStruct.forEach(element => {
    stops.push(element['stop_id']);
});

// Getting the stop times for all stop_ids matching "Grand Central"
let stopsTimesStruct;
Papa.parse(stopsTimesContent, {
    header: true,
    delimiter: ",",
    complete: function(results) {
        stopsTimesStruct = results.data.filter(function(stopsTime) {
            return stops.includes(stopsTime['stop_id']);
        })
    }
});

let trip_ids = [];
stopsTimesStruct.forEach(element => {
    trip_ids.push(element['trip_id']);
})

let tripsStruct;
Papa.parse(tripsContent, {
    header: true,
    delimiter: ",",
    complete: function(results) {
        tripsStruct = results.data.filter(function(trip) {
            return trip_ids.includes(trip['trip_id']);
        })
    }
})

const route_ids = new Set();
tripsStruct.forEach(element => {
    route_ids.add(element['route_id'])
})

console.log("ROUTE IDs");
console.log(route_ids);


