require('dotenv').config()
const { URL } = require('url')
const fetch = require('node-fetch')
const movies = require('../data/movies.json')
const { query } = require('./util/hasura')

exports.handler = async () => {
  const { movies } = await query({
    query: `
        query AllMovies {
            movies {
              id
              poster
              tagline
              title
            }
          }
        `,
  })

  console.log(movies)
  const api = new URL('http://www.omdbapi.com/')

  // add secret api key to the query string
  api.searchParams.set('apikey', process.env.OMDB_API_KEY)

  const promises = movies.map((movie) => {
    // use the movie's IMDB id to look up details
    api.searchParams.set('i', movie.id)

    return fetch(api)
      .then((response) => response.json())
      .then((data) => {
        const scores = data.Ratings

        return {
          ...movie,
          scores,
        }
      })
  })

  const moviesWithRatings = await Promise.all(promises)
  return {
    statusCode: 200,
    body: JSON.stringify(moviesWithRatings),
  }
}
