const updateAPI = `https://api.bitbucket.org/2.0/repositories/padavan/rt-n56u/commits?pagelen=1`;

const https = require('https');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'n56u-update-checker.log');
const lastStatusFile = path.join(__dirname, 'n56u-update-checker.last');

const timestamp = (new Date).toISOString();

function logger(data) {
  const screenData = `[${timestamp}][${data.type.toUpperCase()}] ${data.message}`;
  fs.appendFile(logFile, screenData, function(err) {
    process[data.type === 'error' ? 'stderr' : 'stdout'].write(screenData);
    if (err) {
      console.error(err);
    }
    if (data.code) process.exit(data.code);
  });
  return true;
}

let response = [];

https.get(updateAPI, (res) => {
  if (res.statusCode !== 200) return logger({type: 'error', message: `Call to Bitbucket API failed: ${res.message}`, code: 1});

  res.on('data', (chunk) => {response.push(chunk);});

  res.on('end', () => {
    try {
      let data = JSON.parse(response.join('').toString());
      let lastUpdateData = data.values && data.values[0];
      if (lastUpdateData) {
        let successResult = `${lastUpdateData.date} ${lastUpdateData.message}`;
        fs.readFile(lastStatusFile, function(err, lastSaveResult) {
          if ((lastSaveResult && lastSaveResult.toString()) === successResult) {
            logger({type: 'ignore', message: successResult, code: 0});
          } else {
            fs.writeFile(lastStatusFile, successResult, function() {
              logger({type: 'success', message: successResult, code: 0});
            });
          }
        });
        return;
      } else {
        return logger({type: 'error', message: `接口缺少必要数据`, code: 2});
      }
    } catch (parseDataError) {
      return logger({type: 'error', message: parseDataError, code: 3});
    }
  });

}).on('error', (e) => {
  return logger({type: 'error', message: e, code: 4});
});
