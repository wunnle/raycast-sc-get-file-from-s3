#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Get file from S3
// @raycast.mode compact
// @raycast.argument1 { "type": "text", "placeholder": "S3 URI or URL" }

// Optional parameters:
// @raycast.icon 📦

// Documentation:
// @raycast.author sinan_aksay
// @raycast.authorURL https://raycast.com/sinan_aksay

const { exec } = require("child_process");

const s3Uri = process.argv[2];

const AWS = require('aws-sdk');
const fs = require('fs');
const os = require('os');
const path = require("path");

require('dotenv').config();

const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

if (!s3Uri) {
  console.error('Please provide an S3 URI as an argument.');
  process.exit(1);
}

const parseS3Uri = (uri) => {
  const matchURI = uri.match(/^s3:\/\/([^\/]+)\/(.+)$/);
  if (matchURI) {
    return {
      bucket: match[1],
      filePath: match[2]
    }
  }

  const matchURL = uri.match(/^https:\/\/([^\.]+)\.s3.+.com\/(.+)$/);

  if (matchURL) {
    const bucket = matchURL[1]
    const filePath = matchURL[2];
    return {
      bucket,
      filePath
    }
  }


  if (!match && !matchURL) {
    throw new Error('Invalid S3 URI');
  }

};

const { bucket, filePath } = parseS3Uri(s3Uri);

async function downloadFile(bucket, filePath) {
  const params = {
    Bucket: bucket,
    Key: filePath
  };

  try {
    console.log(`Downloading file from S3: ${bucket}/${filePath}`);
    const data = await S3.getObject(params).promise();
    const downloadsFolder = path.join(os.homedir(), 'Downloads');
    const localFilePath = path.join(downloadsFolder, filePath.split('/').pop());
    fs.writeFileSync(localFilePath, data.Body);
    console.log(`File downloaded successfully to ${localFilePath}`);
    return `file://${localFilePath}`;
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
    throw error;
  }
}

downloadFile(bucket, filePath)
  .then(link => {
    exec(`open "${link}"`, (error) => {
      if (error) {
        console.error("Failed to open the file with Preview:", error);
        process.exit(1);
      } else {
        console.log(`Opened file: ${link} with Preview`);
      }
    });
  })
  .catch(error => console.error(`Failed to download file: ${error.message}`));