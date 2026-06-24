import http from 'node:http'
import { spawn } from 'node:child_process'

const host = '127.0.0.1'
const port = 5173
const appUrl = `http://${host}:${port}`
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const devServer = spawn(npmCommand, ['run', 'dev:local'], {
  stdio: 'inherit',
})

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function pingApp() {
  return new Promise((resolve) => {
    const request = http.get(appUrl, (response) => {
      response.resume()
      resolve(true)
    })

    request.on('error', () => resolve(false))
    request.setTimeout(1500, () => {
      request.destroy()
      resolve(false)
    })
  })
}

function openBrowser(url) {
  const openConfig =
    process.platform === 'darwin'
      ? { command: 'open', args: [url] }
      : process.platform === 'win32'
        ? { command: 'cmd', args: ['/c', 'start', '', url] }
        : { command: 'xdg-open', args: [url] }

  const browserProcess = spawn(openConfig.command, openConfig.args, {
    detached: true,
    stdio: 'ignore',
  })

  browserProcess.unref()
}

async function waitForApp() {
  for (let attempt = 1; attempt <= 45; attempt += 1) {
    const isReady = await pingApp()

    if (isReady) {
      openBrowser(appUrl)
      return
    }

    await sleep(1000)
  }

  console.log('')
  console.log(`Le navigateur ne s'est pas ouvert automatiquement.`)
  console.log(`Tu peux ouvrir manuellement ${appUrl}`)
}

waitForApp()

devServer.on('error', (error) => {
  console.error("Impossible de lancer l'application.", error)
  process.exit(1)
})

devServer.on('exit', (code) => {
  process.exit(code ?? 0)
})

process.on('SIGINT', () => {
  devServer.kill('SIGINT')
})

process.on('SIGTERM', () => {
  devServer.kill('SIGTERM')
})
