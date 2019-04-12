# google-cloud-dynamic-dns-updater

If you have a domain that has its name servers set to Google Cloud DNS, this script will allow you to set/update DNS A records to your current external IP address.

## limitations and considerations

- Only A records
- Only Google Cloud DNS
- Needs node.js and npm
- Requires you to drop a sensitive credentials file in the same directory as this script
- I am not really going to maintain this, unless it benefits me, but you can fork or PR
- I don't want to make this into a Docker image, but you can if you want to fork or PR

## installation

```bash
git clone https://github.com/sehlceris/google-cloud-dynamic-dns-updater.git
cd google-cloud-dynamic-dns-updater
cp config.example.json config.json
touch google-cloud.json
chmod 600 google-cloud.json
npm install
```

## setup

Firstly, make sure this script is located on a secure server or computer, as you will be giving it some pretty hefty permissions to mess with your Google account, and you don't want those credentials stolen.

### dns configuration

1. Create yourself a [Google Cloud project](https://console.cloud.google.com/)
1. Create yourself a managed zone at Google Cloud DNS
1. Point your domain's DNS entries to Google Cloud DNS' name servers. [Instructions](https://cloud.google.com/dns/docs/update-name-servers)
1. Create a Service Account for your project. Give it the role of DNS Administrator
1. Create and download a JSON key for your service account, and save it to the same directory as this script. Rename it `google-cloud.json`. Again, this file stores passwords to your Google Cloud project so you should ensure it is in a safe place.
1. Copy `config.example.json` into `config.json` and edit it to your needs.
    - Project ID
    - Zone Name
    - DNS names. Note: your DNS names should have a period at the end, like so: `cloud.mydomain.com.` 

## execution

```bash
npm start
```

## cron job

```bash
mkdir -p ~/logs
crontab -e
```

This runs your script at 3:07AM every day and saves the log.

```
7 3 * * * npm start --prefix /home/donkey/apps/google-cloud-dynamic-dns-updater >> /home/donkey/logs/google-cloud-dynamic-dns-updater.log 2>&1
```