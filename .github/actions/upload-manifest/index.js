const github = require('@actions/github')
const core = require('@actions/core')

;(async () => {
  const octokit = new github.GitHub(core.getInput('token', { required: true }))
  const tag = github.context.ref.replace('refs/tags/', '')

  const { data } = await octokit.repos.getReleaseByTag({ ...github.context.repo, tag })

  const json = JSON.parse(data.body)
  json.version = tag

  const body = JSON.stringify(json, null, 2)
  core.info('Uploading files...')
  const buffer = Buffer.from(body)
  await octokit.repos.uploadReleaseAsset({
    data: buffer,
    name: 'latestManifest.json',
    url: data.upload_url,
    headers: {
      'content-type': 'application/json',
      'content-length': buffer.length
    }
  })
  core.info('Uploaded files!')

  core.info('Uploading hash...')
  await octokit.repos.updateRelease({ ...github.context.repo, body, release_id: data.id }) // eslint-disable-line
  core.info('Hash uploaded!')
})().catch(e => {
  core.setFailed(e.stack)
})
