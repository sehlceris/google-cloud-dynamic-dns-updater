const {promisify} = require('util');
const fs = require('fs');

const getExternalIP = promisify(require('external-ip')());
const {DNS} = require('@google-cloud/dns');

async function main() {

  console.log('********************');
  console.log(new Date().toISOString() + ' - updating dynamic dns entries');

  // read and parse config
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  const {
    projectId,
    keyFileLocation,
    zoneName,
    dnsNames
  } = config;
  if (!projectId || !zoneName || !dnsNames) throw new Error('config is missing some things!');
  const dnsNamesSet = new Set(dnsNames);

  // get external IP
  const externalIp = await getExternalIP();
  if (!externalIp) throw new Error(`failed to get external IP: ${externalIp}`);
  console.log('external IP of this server was detected: ', externalIp);

  // initialize DNS API
  const dns = new DNS({
    projectId,
    keyFilename: keyFileLocation
  });

  // find the zone and records
  const zone = await dns.zone(zoneName);
  const records = (await zone.getRecords())[0];

  // find existing records that match the DNS names we want to set
  const recordsOfInterest = records.filter((record) => dnsNamesSet.has(record.name) && record.type === 'A');

  // filter out records that already match our external IP (no need to modify them)
  const recordsToModify = recordsOfInterest.filter((record) => {
    if (record.data && record.data[0] && record.data[0] === externalIp) {
      return false;
    }
    return true;
  });

  // modifying a record entails removing and then re-adding the record
  const recordsToRemove = [...recordsToModify];
  const modifiedRecords = recordsToModify.map((record) => {
    return zone.record('a', {
      name: record.name,
      data: externalIp,
      ttl: record.metadata.ttl,
    });
  });

  // dns names are in the config that did not previously exist, create those records
  const dnsNamesThatNeedToBeAdded = dnsNames.filter((dnsName) => !recordsOfInterest.find((record) => record.name === dnsName));
  const newRecords = dnsNamesThatNeedToBeAdded.map((dnsName) => {
    return zone.record('a', {
      name: dnsName,
      data: externalIp,
      ttl: 300
    });
  });

  // join the records to add
  const recordsToAdd = [
    ...newRecords,
    ...modifiedRecords,
  ];

  if (!recordsToAdd.length && !recordsToRemove.length) {
    console.log('no records to modify');
  }
  else {
    recordsToRemove.forEach((record) => {
      console.log(`removing record: ${record.name} | ${record.data} | ${record.metadata.ttl}`);
    });
    recordsToAdd.forEach((record) => {
      console.log(`adding record: ${record.name} | ${record.data} | ${record.metadata.ttl}`);
    });

    // effect the change
    const changeConfig = {
      delete: recordsToRemove,
      add: recordsToAdd,
    };
    const change = await zone.createChange(changeConfig);
    console.log('change completed');
  }
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));