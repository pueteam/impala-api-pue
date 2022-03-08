const bunyan = require('bunyan');
const pretty = require('@mechanicalhuman/bunyan-pretty');
const { LoggingBunyan } = require('@google-cloud/logging-bunyan');

const loggingBunyan = new LoggingBunyan({
  logName: 'impala-api_log',
  serviceContext: {
    service: 'puebill', // required to report logged errors
    // to the Google Cloud Error Reporting
    // console
    version: '1',
  },
});

// Create a Bunyan logger that streams to Stackdriver Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/bunyan_log"
const logger = bunyan.createLogger({
  // The JSON payload of the log as it appears in Stackdriver Logging
  // will contain "name": "my-service"
  name: 'impala-api',
  streams: [
    // Log to the console at 'info' and above
    { stream: process.env.NODE_ENV === 'development' ? pretty(process.stdout, { timeStamps: false }) : process.stdout, level: process.env.LOG_LEVEL || 'debug' },
    // And log to Stackdriver Logging, logging at 'info' and above
    loggingBunyan.stream(process.env.LOG_LEVEL || 'debug'),
  ],
});

module.exports = {
  logger,
};
