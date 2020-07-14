const glob = require('glob')
const path = require('path')
const yaml = require('js-yaml')
const fs = require('fs-extra')
const MarkdownProcessor = require('./processor')
const { sync } = require('sha1-from-file')

/**
 * A helper class for reading markdown files and transpiling them
 */
class Compiler {
  writeChangelog(source = './content/', target = './compiled/') {
    glob.sync(`${source}/**/*.md`).forEach(filename => {
      new MarkdownProcessor({ 
        sourcePath: filename
       }).write({
        from: source,
        to: target
      })
    })
    glob.sync(`${source}/**/*.+(jpg|jpeg|png|gif)`).forEach(filename => {
      copyAssets(source, target, filename)
    })
    this.writeIndex(source, target)
  }

  writeIndex(source = './content/', target = './compiled/') {
    const index = glob.sync(`${source}/**/*.md`)
      .map(entry => entry.replace(source, ''))
      .map(entry => entry.replace('.md', ''))
      .map(entry => entry.replace('/', '-'))
      .filter(entry => entry !== 'index')
      .sort()
      .map(entry => entryWithLabels(entry))
    
    fs.writeFileSync(path.join(target, 'index.json'), JSON.stringify(index, null, 2))
  }
}

const copyAssets = (sourceDir, targetDir, source) => {
  const destination = `${targetDir}${source.replace(sourceDir, '')}`.replace(/\/\d*-/g, '/')
  const destinationDir = path.dirname(destination)
  fs.mkdirpSync(destinationDir)
  
  const sourceHash = sync(fs.readFileSync(source))
  const destinationHash = fs.existsSync(destination) ? sync(fs.readFileSync(destination)) : ''

  if (sourceHash !== destinationHash) {
    fs.copyFileSync(source, destination)
  }
}

const entryWithLabels = (id) => {
  const content = fs.readFileSync(path.join('./compiled', `${id}.md`)).toString()
  const [_, fm] = content.split('---')
  const { applies_to } = yaml.load(fm)
  return {
    id,
    applies_to
  }
}

// export a new loader
module.exports = new Compiler()