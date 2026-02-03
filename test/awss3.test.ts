import { Readable } from 'node:stream'
import { text as readableToText } from 'node:stream/consumers'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  type GetObjectCommandOutput,
  StorageClass,
} from '@aws-sdk/client-s3'
import { sdkStreamMixin } from '@smithy/util-stream'
import { mockClient } from 'aws-sdk-client-mock'
import { listObjects, getObject, upload } from '../functions/common/awss3'
import { Upload } from '@aws-sdk/lib-storage'

const s3Mock = mockClient(S3Client)

vitest.mock('@aws-sdk/lib-storage')

describe('awss3', () => {
  afterEach(() => {
    s3Mock.reset()
    vitest.resetAllMocks()
  })

  it('listObjects', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'KEY1' }, { Key: 'KEY2' }, {}],
      CommonPrefixes: [{ Prefix: 'PREFIX1' }, { Prefix: 'PREFIX2' }, {}],
    })
    const result = await listObjects('BUCKET', 'PREFIX')
    expect(s3Mock).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 'BUCKET',
      Prefix: 'PREFIX',
      Delimiter: '/',
    })
    expect(result).toEqual({
      objects: ['KEY1', 'KEY2'],
      prefixes: ['PREFIX1', 'PREFIX2'],
    })
  })

  it('listObjects: コンテンツもプレフィックスもない', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({})
    const result = await listObjects('BUCKET', 'PREFIX')
    expect(s3Mock).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 'BUCKET',
      Prefix: 'PREFIX',
      Delimiter: '/',
    })
    expect(result).toEqual({
      objects: [],
      prefixes: [],
    })
  })

  it('getObject', async () => {
    const stream = new Readable()
    stream.push('hello world')
    stream.push(null)
    const sdkStream = sdkStreamMixin(stream)
    s3Mock
      .on(GetObjectCommand)
      .resolves({ Body: sdkStream } as GetObjectCommandOutput)
    const result = await getObject('BUCKET', 'KEY')
    expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 'BUCKET',
      Key: 'KEY',
    })
    const resultText = await readableToText(result)
    expect(resultText).toBe('hello world')
  })

  it('upload', async () => {
    const mockUpload = { done: vitest.fn() }
    const mockUploadConstructor = vitest.mocked(Upload).mockImplementation(function (this: unknown) {
      return mockUpload
    })

    upload('BUCKET', 'KEY', Readable.from(Buffer.from('hello')))
    expect(mockUploadConstructor).toHaveBeenCalledTimes(1)
    expect(mockUploadConstructor.mock.calls[0][0].params).toMatchObject({
      Bucket: 'BUCKET',
      Key: 'KEY',
      StorageClass: StorageClass.INTELLIGENT_TIERING,
    })
    expect(mockUpload.done).toHaveBeenCalledTimes(1)
  })
})
