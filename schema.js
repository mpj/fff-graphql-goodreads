const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')

function translate(lang, str) {
  // Google Translate API is a paid (but dirt cheap) service. This is my key
  // and will be disabled by the time the video is out. To generate your own,
  // go here: https://cloud.google.com/translate/v2/getting_started
  const apiKey =
    'AIzaSyBN-bwtos8sKU6X84wkrdjtCF7uzng6kgQ'
	const url =
    'https://www.googleapis.com' +
    '/language/translate/v2' +
  	'?key=' + apiKey +
    '&source=en' +
    '&target=' + lang +
    '&q=' + encodeURIComponent(str)
  return fetch(url)
 		.then(response => response.json())
	  .then(parsedResponse =>
    	parsedResponse
      	.data
        .translations[0]
        .translatedText
    )
}

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: '...',

  fields: () => ({
    title: {
      type: GraphQLString,
      args: {
        lang: { type: GraphQLString }
      },
      resolve: (xml, args) => {
        const title = xml.GoodreadsResponse.book[0].title[0]
        return args.lang ? translate(args.lang, title) : title
      }
    },
    isbn: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
    },
    authors: {
      type: new GraphQLList(AuthorType),
      resolve: (xml, args, context) => {
        const authorElements = xml.GoodreadsResponse.book[0].authors[0].author
        const ids = authorElements.map(elem => elem.id[0])
        return context.authorLoader.loadMany(ids)
      }
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: '...',

  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: xml =>
        xml.GoodreadsResponse.author[0].name[0]
    },
    books: {
      type: new GraphQLList(BookType),
      resolve: (xml, args, context) => {
        const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem => elem.id[0]._)
        return context.bookLoader.loadMany(ids)
      }
    }
  })
})

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: '...',

    fields: () => ({
      author: {
        type: AuthorType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, args, context) => context.authorLoader.load(args.id)
      }
    })
  })
})
