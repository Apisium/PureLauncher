const github = require('@actions/github')
const core = require('@actions/core')
const COS = require('cos-nodejs-sdk-v5')
const Refresher = require('tencent-cdn-refresh')
const { extname, basename } = require('path')
const { promises: fs } = require('fs')
const { createHash } = require('crypto')
const { promisify } = require('util')

;(async () => {
  const octokit = new github.GitHub(core.getInput('token', { required: true }))

  const options = {
    SecretId: core.getInput('secretId', { required: true }),
    SecretKey: core.getInput('secretKey', { required: true })
  }
  const cos = new COS({ ...options, Domain: '{Bucket}.cos.accelerate.myqcloud.com' })
  const putObject = promisify(cos.putObject.bind(cos))
  const Bucket = core.getInput('bucket', { required: true })

  const names = []
  const tag = github.context.ref.replace('refs/tags/', '')
  const files = core.getInput('files', { required: true })
    .split(' ')
    .filter(Boolean)
    .map(it => {
      const [file, name] = it.replace(/{VERSION}/g, tag).split('?', 2)
      names.push(basename(name || file))
      return file
    })

  const { data } = await octokit.repos.getReleaseByTag({ ...github.context.repo, tag })
  core.info('Files: ' + JSON.stringify(files))

  const json = JSON.parse(data.body || `{"version":"${tag}","md5":{}}`)
  core.info('Reading files...')
  const buffers = await Promise.all(files.map(it => fs.readFile(it)))
  core.info('Read files!')
  buffers.forEach((it, i) => {
    const ext = extname(names[i]).replace(/^\./, '')
    json[ext] = createHash('sha1').update(it).digest('hex')
    json.md5[ext] = createHash('md5').update(it).digest('hex')
  })
  core.info('Files hash: ' + JSON.stringify(json, null, 2))

  core.info('Uploading files...')
  await Promise.all(names.map((name, i) => octokit.repos.uploadReleaseAsset({
    name,
    url: data.upload_url,
    data: buffers[i],
    headers: {
      'content-type': 'binary/octet-stream',
      'content-length': buffers[i].length
    }
  })))
  await Promise.all(names.map((Key, i) => putObject({
    Key,
    Bucket,
    Region: 'ap-chengdu',
    Body: buffers[i]
  })))
  core.info('Uploaded files!')

  if (core.getInput('final') === 'true') {
    core.info('Running final actions...')
    await octokit.repos.updateRelease({
      ...github.context.repo,
      body: JSON.stringify(json, null, 2),
      release_id: data.id // eslint-disable-line
    })
    const { md5, ...jsonData } = json
    const hashesData = JSON.stringify(jsonData)
    await octokit.repos.uploadReleaseAsset({
      name: 'latest.json',
      url: data.upload_url,
      data: hashesData,
      headers: {
        'content-type': 'application/json',
        'content-length': hashesData.length
      }
    })
    await putObject({
      Bucket,
      Key: 'latest.json',
      Region: 'ap-chengdu',
      Body: hashesData
    })
    try {
      core.info(JSON.stringify(await new Refresher(options).purgeDirsCache('https://dl.pl.apisium.cn/')))
    } catch (e) {
      core.warning(e)
    }
    core.info('Final actions ran successfully!')
  }
})().catch(e => {
  core.setFailed(e.stack)
})
