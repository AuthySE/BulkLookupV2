//////////////////////////////////////////////////////////////////////////////////////////////////
////           Call script with: node bulkLookups.js input-file.csv               ////
//////////////////////////////////////////////////////////////////////////////////////////////////

var sid = process.env.BULK_SID;
var auth = process.env.BULK_AUTH;
var lookupType = process.env.BULK_LOOKUP_TYPE; // line type only right now
var bulkCSVHeaders = process.env.BULK_CSV_HEADERS;
var errorOutput = process.env.BULK_ERROR_OUTPUT;

if (!(process.argv[2] && sid && auth && lookupType && bulkCSVHeaders)) {

    console.log("Please pass in the input filename.");
    process.exit(1);

} else {
    console.log("You are running " + lookupType + " Lookups");
}

var pnCsv = process.argv[2];

var concurrency = 10;

var request = require('request');
var fs = require('fs');
var async = require('async');
var rp = require('request-promise');

var parse = require('csv-parse');
var transform = require('stream-transform');

var stream = fs.createWriteStream('output-' + lookupType + '.csv');

var errorStream = fs.createWriteStream('errors-' + lookupType + '.csv');

var errorList = [];

var uriSuffix = (lookupType === "line_type_intelligence") ? '?Fields=line_type_intelligence' : '?Type=sim_swap';
if (lookupType === "line_type_intelligence" && bulkCSVHeaders) {
    stream.write("phone_number, carrier_name, carrier_type, mcc, mnc, country_code\n");
} 

var q = async.queue(function (task, callback) {

    var uri = 'https://lookups.twilio.com/v2/PhoneNumbers/' + task.phoneNumber + uriSuffix;

    var options = {
        json: true,
        uri: uri,
        method: 'GET',
        auth: {
            user: sid,
            pass: auth
        }
    };

    rp(options)
        .then(function (response) {


            
          if (lookupType === "line_type_intelligence") {
                if (response.line_type_intelligence.carrier_name) {
                    var carrierName = response.line_type_intelligence.carrier_name.replace(",", "");
                }
                stream.write(response.phone_number + ',' + response.line_type_intelligence.carrier_name + ',' + response.line_type_intelligence.type + ',' + response.line_type_intelligence.mobile_country_code + ',' + response.line_type_intelligence.mobile_network_code + ',' + response.country_code + '\n');
            }
            callback();

        })
        .catch(function (err) {
            if (task)
                if (errorOutput) {
                    console.log('big error: ', err);
                    stream.write("error" + '\n');
                }
            if (!task.retries) {
                task.retries = 1;
                q.push(task);
            }
            else if (task.retries < 5) {
                task.retries++;
                q.push(task);
            } else {
                console.log("error with this number: ", task.phoneNumber);
                errorStream.write(task.phoneNumber + "invalid\n");
                errorList.push([task, 'Maximum retries exceeded!']);
            }

            callback();
        });

}, concurrency);

q.drain = function () {
    console.log('All numbers looked up.');
    if (errorList.length > 0 && errorOutput) {
        if(errorOutput) {
            console.log('Errors:\n', errorList);
        }
        console.log("Check errors-" + lookupType + ".csv for numbers and error codes");
        console.log("See a list of errors codes at https://www.twilio.com/docs/api/errors");
    }
};

fs.createReadStream(pnCsv)
    .pipe(parse({delimiter: ':'}))
    .on('data', function (csvrow) {
        q.push({phoneNumber: csvrow[0]});
    });
