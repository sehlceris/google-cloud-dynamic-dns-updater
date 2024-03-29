# google-cloud-dynamic-dns-updater

If you have a domain that has its name servers set to Google Cloud DNS, this script will allow you to set/update DNS A records to your current external IP address.

## limitations and considerations

- Only A records
- Only Google Cloud DNS
- Needs node.js and npm
- Requires you to drop a sensitive credentials file in the same directory as this script
- I am not really going to maintain this, unless it benefits me, but you can fork or PR

## setup

Firstly, make sure this script is located on a secure server or computer, as you will be giving it some pretty hefty permissions to mess with your Google account, and you don't want those credentials stolen.

### dns configuration at Google Cloud and creating the config files

1. Create yourself a [Google Cloud project](https://console.cloud.google.com/)
1. Create yourself a managed zone at Google Cloud DNS
1. Point your domain's DNS entries to Google Cloud DNS' name servers. [Instructions](https://cloud.google.com/dns/docs/update-name-servers)
1. Create a Service Account for your project. Give it the role of DNS Administrator
1. Create and download a JSON key for your service account, and save it to the same directory as this script. Rename it `google-cloud.json`. Again, this file stores passwords to your Google Cloud project so you should ensure it is in a safe place.
1. Make a copy of `secrets/config.example.json` into `secrets/config.json` and edit it to your needs.
    - Project ID
    - Zone Name
    - DNS names. Note: your DNS names should have a period at the end, like so: `cloud.mydomain.com.` 

## running the application

Ensure that you have `secrets/google-cloud.json` and `secrets/config.json` ready.

### running with docker

```bash
docker pull sehlceris/google-cloud-dynamic-dns-updater

docker container run --rm \
    -v "${PWD}/secrets:/usr/src/app/secrets" \
    sehlceris/google-cloud-dynamic-dns-updater:latest
```

### running on your local machine, without docker

#### installation

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/sehlceris/google-cloud-dynamic-dns-updater.git
cd google-cloud-dynamic-dns-updater
touch secrets/config.json
touch secrets/google-cloud.json
chmod 600 secrets/google-cloud.json
npm install
```

#### execution

```bash
npm start
```

#### cron job

```bash
mkdir -p ~/logs
crontab -e
```

This example cron job runs your script at 3:07AM every day and saves the log.

##### node.js

```
7 3 * * * npm start --prefix /home/ubuntu/projects/google-cloud-dynamic-dns-updater >> /home/ubuntu/logs/google-cloud-dynamic-dns-updater.log 2>&1
```

##### docker-compose

```
7 3 * * * /usr/local/bin/docker-compose -f /home/ubuntu/projects/google-cloud-dynamic-dns-updater/docker-compose.yml up
```