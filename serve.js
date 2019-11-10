const express = require('express')
const graphqlHTTP = require('express-graphql')
const app = express()
const fetch = require('node-fetch')
const schema = require('./schema')
const DataLoader = require('dataloader')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)
const port = 3000;

const apiKey = 'JhAxN6ovTxTfH7RMRo5VoQ';

const fetchAuthor = id =>
  fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=${apiKey}`)
    .then(response => response.text())
    .then(parseXML);

const fetchBook = id =>
  fetch(`https://www.goodreads.com/book/show/${id}.xml?key=${apiKey}`)
    .then(response => response.text())
    .then(parseXML);

app.use('/graphql', graphqlHTTP(req => {
  const context = {
    authorLoader: new DataLoader(keys => Promise.all(keys.map(fetchAuthor))),
    bookLoader: new DataLoader(keys => Promise.all(keys.map(fetchBook)))
  };

  return {
    schema,
    context,
    graphiql: true
  }
}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))