const github = require('@actions/github')
const core = require('@actions/core')
const { extname, basename } = require('path')
const { promises: fs } = require('fs')
const { createHash } = require('crypto')

;(async () => {
  const files = core.getInput('files', { required: true }).split(' ')

  const octokit = new github.GitHub(core.getInput('token', { required: true }))
  const tag = github.context.ref.replace('refs/tags/', '')

  const { data } = await octokit.repos.getReleaseByTag({ ...github.context.repo, tag })
  core.info('Files: ' + JSON.stringify(files))

  const json = JSON.parse(data.body || '{}')
  core.info('Reading files...')
  const buffers = await Promise.all(files.map(it => fs.readFile(it)))
  core.info('Read files!')
  buffers.forEach((it, i) => (json[extname(files[i]).replace(/^\./, '')] = createHash('sha1').update(it).digest('hex')))
  const body = JSON.stringify(json, null, 2)
  core.info('Files hash: ' + body)

  core.info('Uploading files...')
  await Promise.all(files.map((it, i) => octokit.repos.uploadReleaseAsset({
    name: basename(it),
    url: data.upload_url,
    data: buffers[i],
    headers: {
      'content-type': 'binary/octet-stream',
      'content-length': buffers[i].length
    }
  })))
  core.info('Uploaded files!')

  core.info('Uploading hash...')
  await octokit.repos.updateRelease({ ...github.context.repo, body: JSON.stringify(json, null, 2), release_id: data.id }) // eslint-disable-line
  core.info('Hash uploaded!')
})().catch(e => {
  core.setFailed(e.stack)
})
