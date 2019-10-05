import { Launcher } from '@xmcl/launch'

addEventListener('message', function (e) {
  const option = e.data as Launcher.Option
  console.log(option)
  Launcher.launch(option).then(p => {
    p.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    p.on('exit', (code) => {
      console.log(`exit ${code}`)
      // postMessage({ state: 'exit', code }, '*')
    })
    // postMessage({ state: 'launched' }, '*')
  }).catch(err => {
    console.log(err)
    // postMessage({ state: 'error', error: err }, '*')
  })
})
