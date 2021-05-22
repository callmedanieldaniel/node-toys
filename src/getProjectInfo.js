const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')
const glob = require('glob')
const _ = require('lodash')
const {TOKEN} = require('./configs')

const { Client } = require('@razor-node/client')
const eachAnnotationResult = (data, callback) => {
  data.forEach(i => i.data.forEach(i => callback(i.labeled.latestResult)))
}

const client = new Client('http://bullet-time.nioint.com', {needSign: false})

const main = async (filePath, projectUuid) => {
  const result = []
  const str = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(str)
  const labelerJSON = _.groupBy(json, 'labeler')
  const labelerIds =   Object.keys(labelerJSON)
  const project = await client.get(`/v1/in/project/${projectUuid}`, {}, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  })
  for (let uuid of labelerIds) {
    if (['undefined', ''].includes(uuid)) {
      continue
    }
    const value = labelerJSON[uuid]
    const userStat = {}
    userStat['project_id'] = projectUuid
    userStat['项目名称'] = project.name
    const [userInfo] = await client.post(`/v1/in/account/gets`, {
      uuids: [uuid]
    }, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    })
    if (!userInfo) {
      continue
    }
    userStat['username'] = userInfo['username']
    userStat['姓名'] = userInfo['display_name']
    eachAnnotationResult(value, i => {
      const {objects, groups} = i
      objects.forEach(i => {
        userStat[i.type] = userStat[i.type] ? userStat[i.type] += 1 : 1
      })
      groups.forEach(i => {
        userStat['group'] = userStat['group'] ? userStat['group'] += 1 : 1
      })
    })
    userStat['标注包数'] = labelerJSON[uuid].length
    result.push(userStat)
  }
  const checkerJSON = _.groupBy(json, 'checker')
  const qaJSON = _.groupBy(json, 'qa')
  for (let uuid of Object.keys(checkerJSON)) {
    if (['undefined', ''].includes(uuid)) {
      continue
    }
    const userStat = {}
    userStat['project_id'] = projectUuid
    userStat['项目名称'] = project.name
    const [userInfo] = await client.post(`/v1/in/account/gets`, {
      uuids: [uuid]
    }, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    })
    if (!userInfo) {
      continue
    }
    userStat['username'] = userInfo['username']
    userStat['姓名'] = userInfo['display_name']
    userStat['质检包数'] = checkerJSON[uuid].length
    result.push(userStat)
  }


  for (let uuid of Object.keys(qaJSON)) {
    if (['undefined', ''].includes(uuid)) {
      continue
    }
    const userStat = {}
    userStat['project_id'] = projectUuid
    userStat['项目名称'] = project.name
    const [userInfo] = await client.post(`/v1/in/account/gets`, {
      uuids: [uuid]
    }, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    })
    if (!userInfo) {
      continue
    }
    userStat['username'] = userInfo['username']
    userStat['姓名'] = userInfo['display_name']

    userStat['验收包数'] = qaJSON[uuid].length
    result.push(userStat)
  }

  const sheet = XLSX.utils.json_to_sheet(result)
  const workBook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workBook, sheet, 'sheet1')
  const response = XLSX.write(workBook, {
    type: 'buffer',
  })

  fs.writeFileSync(`./data/${projectUuid}_stat.xlsx`, response)
  console.log('success!')
}

const all = async () => {
  const projects = glob.sync('./data/*_data.json')
  for (let p of projects) {
    await main(p, p.match(/data\/(.+?)_data.json/)[1])
  }
}



all()
