#
# Library of retrieval, persistance, validation, json view, and domain logic
# for the "artworks" resource. Positron artworks are a compilation of Gravity
# artworks, their related data such as their artist and partner, and helpful
# data like their image url curies resolved.
#
# e.g.
# {
#   artwork: { id: '', title: '', _links: [] }
#   artists: [{ id: '', name: '', _links: [] }]
#   partner: { id: '', name: '', _links: [] }
#   image_urls: { large: 'http://stagic.artsy.net/images/1/large.jpg' }
# }
#

_ = require 'underscore'
async = require 'async'
request = require 'superagent'
{ ObjectId } = require 'mongojs'
{ ARTSY_URL } = process.env

# Retrieval

@findByIds = (ids, accessToken, callback) ->

  # Parallel fetch each artwork
  async.parallel (for id in ids
    ((id) ->
      (cb) ->
        request
          .get("#{ARTSY_URL}/api/artworks/#{id}")
          .set('X-Access-Token': accessToken)
          .end (err, res) -> cb err or res.error, res?.body
    )(id)
  ), (err, artworks) ->
    return callback err if err

    # Fetch each artwork's artists & partner
    async.parallel (for artwork in artworks
      ((artwork) ->
        (cb) ->
          async.parallel [
            (cb) ->
              request
                .get(artwork._links.artists.href)
                .set('X-Access-Token': accessToken)
                .end (err, res) -> cb err, res?.body._embedded.artists
            (cb) ->
              request
                .get(artwork._links.partner.href)
                .set('X-Access-Token': accessToken)
                .end (err, res) -> cb err, res?.body
          ], (err, [artists, partner]) ->

            # Map curries into an image urls hash
            imageUrls = {}
            for version in artwork.image_versions
              imageTempl = (curie.href for curie in artwork._links.curies when \
                curie.name is 'image')[0]
              imageUrls[version] = imageTempl.replace '{rel}', version + '.jpg'

            # Finally callback with our compiled data
            cb err, {
              artwork: artwork
              artists: artists
              partner: partner
              image_urls: imageUrls
            }
      )(artwork)
    ), (err, results) ->
      callback null, results