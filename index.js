#!/usr/bin/env node

import { argv, cwd, exit } from 'node:process'
import path from 'node:path'
import * as fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

// Usage: npm create wiki-plugin pluginName

// The first argument will be the plugin name
const pluginName = argv[2]

// check we have been given a plugin name
if (typeof pluginName != 'string') {
  console.log('Usage: npm create wiki-plugin <new-plugin-name>')
  console.log('e.g. npm create wiki-plugin CoolThing')
  exit(0)
}

// check for plugin name capitalization
if (!/^[A-Z]/.test(pluginName)) {
  console.log('Expecting capitalised name')
  console.log('e.g. CoolThing')
  exit(2)
}

// Name the new plugin repo will given
const pluginRepo = `wiki-plugin-${pluginName.toLowerCase()}`

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const currentDir = cwd()
const pluginDir = path.resolve(currentDir, pluginRepo)

const dateStamp = new Date().getTime()

const randomByte = () => (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1)
const randomBytes = n => [...Array(n)].map(() => randomByte()).join('')
const itemId = () => randomBytes(8)

// does directory already exist?
await fs
  .stat(pluginDir)
  .then(stats => {
    if (stats.isDirectory()) {
      console.log('Directory already exists for plug-in')
      exit(1)
    }
    if (stats.isFile()) {
      console.log('File with the same name already exists')
      exit(1)
    }
  })
  .catch(e => {
    console.log(`Creating ${pluginRepo}`)
  })

await fs.mkdir(pluginDir)

const templateDir = path.resolve(__dirname, 'template')

await fs.cp(templateDir, pluginDir, { recursive: true })

// List folders and files that need a dot adding
const dotFolders = ['github', 'vscode', 'zed']
const dotFiles = ['editorconfig', 'gitignore', 'npmignore', 'prettierignore', 'prettierrc.json']

;[...dotFolders, ...dotFiles].forEach(async name => {
  await fs.rename(path.join(pluginDir, name), path.join(pluginDir, `.${name}`))
})

// We need to update some files to replace placeholder name with the plugin name.
// 0. a helper function (replace 'template' with plugin name)
const replacePlaceholder = async filePath => {
  await fs
    .readFile(filePath, { encoding: 'utf8' })
    .then(source => source.replace(/Template/g, pluginName))
    .then(source => source.replace(/template/g, pluginName.toLowerCase()))
    .then(source => fs.writeFile(filePath, source, { encoding: 'utf8' }))
    .catch(e => {
      console.error(e.message)
      exit(1)
    })
}
// 1. client source, this also needs renaming.
await replacePlaceholder(path.join(pluginDir, 'src', 'client', 'template.js')).then(() =>
  fs.rename(
    path.join(pluginDir, 'src', 'client', 'template.js'),
    path.join(pluginDir, 'src', 'client', `${pluginName.toLowerCase()}.js`),
  ),
)
// 2. client test
await replacePlaceholder(path.join(pluginDir, 'test', 'test.js'))
// 3. client build
await replacePlaceholder(path.join(pluginDir, 'scripts', 'build-client.js'))
// 4. README.md
await replacePlaceholder(path.join(pluginDir, 'README.md'))
// 5. package.json
await replacePlaceholder(path.join(pluginDir, 'package.json'))
// 6. gitignore
await replacePlaceholder(path.join(pluginDir, '.gitignore'))
// 7. about plugin package
const aboutPage = path.join(pluginDir, 'pages', 'about-template-plugin')
// first replace placeholders that are unique to the about page
await fs
  .readFile(aboutPage, { encoding: 'utf8' })
  .then(source => source.replace(/created/g, dateStamp))
  .then(source => source.replace(/id1/g, itemId()))
  .then(source => source.replace(/id2/g, itemId()))
  .then(source => fs.writeFile(aboutPage, source, { encoding: 'utf8' }))
  .catch(e => {
    console.error(e.message)
    exit(1)
  })
await replacePlaceholder(aboutPage)
await fs.rename(aboutPage, path.join(pluginDir, 'pages', `about-${pluginName.toLowerCase()}-plugin`))

// install developer dependencies
console.log('Installing developer dependencies')
const devDependencies = ['@eslint/js', 'esbuild', 'eslint', 'globals', 'prettier']

const installCommand = `npm install --save-dev ${devDependencies.join(' ')}`
const installOptions = { cwd: pluginDir }

const npmProcess = exec(installCommand, installOptions)
npmProcess.stdout.pipe(process.stdout)
