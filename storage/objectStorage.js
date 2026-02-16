const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || 'us-east-1';

const clientConfig = {
  region,
  endpoint: endpoint || undefined,
  forcePathStyle: Boolean(endpoint)
};

if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  };
}

const s3 = new S3Client(clientConfig);

function buildObjectUrl(key) {
  if (process.env.S3_PUBLIC_BASE_URL) {
    return `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadBuffer({ key, buffer, contentType }) {
  if (!bucket) {
    throw new Error('S3_BUCKET is required for object storage uploads');
  }

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));

  return {
    key,
    url: buildObjectUrl(key)
  };
}

module.exports = {
  uploadBuffer
};
