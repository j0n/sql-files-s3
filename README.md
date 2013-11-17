# Migrate files to S3


Dont use if not know what you are doing. This slow way of migrate your files to S3, row by row in db.

Goes throu the SQL table row by row and fetches files of defined columns, 
upload them to S3 and update db (optional). 

## Prerequisite

node.js - [http://nodejs.org/](http://nodejs.org/)

Your Amazon S3 keys [https://console.aws.amazon.com/iam/home?#security_credential](https://console.aws.amazon.com/iam/home?#security_credential)

Your db credentials


## Usage

```
git clone git@github.com:j0n/sql-files-s3.git 

cd sql-files-s3

npm install

node index.js
```

Then follow the promt


To re-enter amazon and db credentials run ```node index.js -f``` or just edit config.js