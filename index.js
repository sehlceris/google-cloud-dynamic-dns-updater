const {promisify} = require('util');
const fs = require('fs');

const getExternalIP = promisify(require('external-ip')());
const {DNS} = require('@google-cloud/dns');

async function main() {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

  const {
    projectId,
    keyFileLocation,
    zoneName,
    dnsNames
  } = config;

  if (!projectId || !zoneName || !dnsNames) throw new Error('config is missing some things!');

  const dnsNamesSet = new Set(dnsNames);

  const externalIp = await getExternalIP();
  if (!externalIp) throw new Error(`failed to get external IP: ${externalIp}`);
  console.log('external IP of this server was detected: ', externalIp);

  const dns = new DNS({
    projectId,
    keyFilename: keyFileLocation
  });
  const zone = await dns.zone(zoneName);

  const records = (await zone.getRecords())[0];
  const recordsToModify = records.filter((record) => dnsNamesSet.has(record.name) && record.type === 'A');

  const recordsToRemove = [...recordsToModify];

  const modifiedRecords = recordsToModify.map((record) => {
    return zone.record('a', {
      name: record.name,
      data: externalIp,
      ttl: record.metadata.ttl,
    });
  });

  const dnsNamesThatNeedToBeAdded = dnsNames.filter((dnsName) => !recordsToModify.find((record) => record.name === dnsName));

  const newRecords = dnsNamesThatNeedToBeAdded.map((dnsName) => {
    return zone.record('a', {
      name: dnsName,
      data: externalIp,
      ttl: 300
    });
  });

  const recordsToAdd = [
    ...newRecords,
    ...modifiedRecords,
  ];

  recordsToRemove.forEach((record) => {
    console.log(`removing record: ${record.name} | ${record.data} | ${record.metadata.ttl}`);
  });
  recordsToAdd.forEach((record) => {
    console.log(`adding record: ${record.name} | ${record.data} | ${record.metadata.ttl}`);
  });

  const changeConfig = {
    delete: recordsToRemove,
    add: recordsToAdd,
  };

  const change = await zone.createChange(changeConfig);
  console.log('change completed');
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));