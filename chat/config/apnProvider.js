var path = require('path')
const apn = require('apn')
// sandbox or production APN service
const apnProduction = process.env.NODE_ENV === 'production'
  ? true
  : false;

// configuring APN with credentials
const apnOptions = {
  token: {
    key: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgFcO8FobWNSOH/mrBSu/iMSeapwM0MSP6gBvFj5SNI7+gCgYIKoZIzj0DAQehRANCAAQA11Yyqv6TlKfcqpIrD3EdwRsDQlGaG+IuHzZkzWA0nzf/9tY7/Lp32fsuH97VyylzWhKoygW7vISS6DyNGtPp',
    keyId: 'S4V3AKYZM4',
    teamId: 'Y5N5LD2WUK'
  },
  production: apnProduction
};

export default apnProvider = new apn.Provider(apnOptions);