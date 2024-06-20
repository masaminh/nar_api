import {Readable} from 'node:stream';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {getTracer} from './powertools';

const tracer = getTracer();
const client = tracer.captureAWSv3Client(new S3Client({}));

export type ListObjectsResult = {
  objects: string[];
  prefixes: string[];
};

export async function listObjects(
  bucket: string,
  prefix: string
): Promise<ListObjectsResult> {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: '/',
  });
  const output = await client.send(command);
  const objects = output.Contents?.flatMap(item => item.Key ?? []) ?? [];
  const prefixes =
    output.CommonPrefixes?.flatMap(item => item.Prefix ?? []) ?? [];
  return {objects, prefixes};
}

export async function getObject(
  bucket: string,
  key: string
): Promise<Readable> {
  const command = new GetObjectCommand({Bucket: bucket, Key: key});
  const output = await client.send(command);
  const stream = output.Body as Readable;
  return stream;
}

export async function upload(
  bucket: string,
  key: string,
  body: Readable
): Promise<void> {
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
    },
  });

  await upload.done();
}
