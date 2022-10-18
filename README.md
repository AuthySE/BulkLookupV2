# BulkLookupV2
# Bulk Lookups for Twilio Lookup

1. Add TWILIO SID and AUTH TOKEN to demo.env
1. Do you want to do `Line Type Intelligence` or `Sim Swap` Lookups? //currently only Line Type is supported in this Bulk Lookup Script
    1. Put in the appropriate value.
1. Execute npm install
1. `source demo.env`
1. Put source phone numbers into a csv file (e.g. input.csv).  1 column of numbers. (e.g. +12024561111)
1. Execute the script with the input file `node bulkLookup.js input.csv`

## Output
Found information:
output-[type].csv

Error information (invalid numbers):
error-[type].csv

### Resources
The error output will include the error response for each particular number.
You can find a list of all Twilio error codes, [here](https://www.twilio.com/docs/api/errors);
