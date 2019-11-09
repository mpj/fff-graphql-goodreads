const { mergeSchemas } = require('graphql-tools')
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')

const BookType = new GraphQLObjectType({
  name: 'Book',
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: xml => {
        return xml.GoodreadsResponse.book[0].title[0];
      }
    },
    isbn: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
    },
    authors: {
      type: new GraphQLList(AuthorType),
      resolve: (xml, args, context) => {
        const ids = xml.GoodreadsResponse.book[0].authors[0].author.map(elem => elem.id[0])

        return context.authorLoader.loadMany(ids)
      }
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.author[0].name[0]
    },
    books: {
      type: new GraphQLList(BookType),
      resolve: (xml, arg, context) => {
        const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem => elem && elem.id[0]._)

        return context.bookLoader.loadMany(ids)
      }
    }
  })
})

const AuthorSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'AuthorQuery',
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

const BookSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'BookQuery',
    fields: () => ({
      book: {
        type: BookType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, args, context) => context.bookLoader.load(args.id)
      }
    })
  })
})

const schemas = mergeSchemas({
  schemas: [
    AuthorSchema,
    BookSchema
  ]
});

module.exports = schemas