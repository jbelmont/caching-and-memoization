'use strict'

const path = require('path')
const nano = require('nano')('http://admin:password@db:5984')
const client = require(path.join(__dirname, '../redis'))
const winston = require('winston')

const usermodels = require('./usersMock')

function createDbConnection ({ dbName = 'caching', name = 'users' } = {}) {
  return new Promise((resolve, reject) => {
    nano.db.create(dbName, (err, body) => {
      if (!err) {
        const couchDBName = nano.use(dbName)
        return insertInitialDocument({ dbName: couchDBName, name })
        .then(() => {
          resolve(retrieveDocument({ dbName: couchDBName, name }))
        })
        .catch(err => {
          winston.error(err)
        })
      } else {
        const db = nano.use(dbName)
        resolve(retrieveDocument({ dbName: db, name }))
      }
    })
  })
}

function retrieveDocument ({dbName, name}) {
  return new Promise((resolve, reject) => {
    dbName.get(name, (err, body) => {
      if (!err) {
        client.set('users', JSON.stringify(body))
        resolve(body)
      } else {
        winston.error(err)
        reject(err)
      }
    })
  })
}

function insertInitialDocument ({dbName, name}) {
  return new Promise((resolve, reject) => {
    dbName.insert(usermodels, name, (err, body, header) => {
      if (!err) {
        winston.info(`Created ${name} table: ${usermodels}`)
        resolve(body)
      } else {
        winston.error(err)
        reject(usermodels)
      }
    })
  })
}

function dbActions ({ dbName = 'caching', name = 'users' } = {}) {
  return createDbConnection({dbName, name})
}

exports.dbActions = dbActions
