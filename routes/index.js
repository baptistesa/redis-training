var express = require('express');
var router = express.Router();

const redis = require("redis");
const http = require("http")


const port_redis = process.env.PORT || 6379;
const redis_client = redis.createClient(port_redis);

checkCache = (req, res, next) => {

  redis_client.get("articles", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
      return;
    }
    if (data != null) {
      res.send(JSON.parse(data));
    } else {
      next();
    }
  });
};

// Check sans cache
router.get('/', async function (req, res2, next) {
  var options = {
    host: 'newsapi.org',
    path: '/v2/top-headlines?country=fr&apiKey=b1378b398f404be18ddd252068b3b099'
  };

  var req = http.get(options, function (res) {
    var bodyChunks = [];
    res.on('data', function (chunk) {
      bodyChunks.push(chunk);
    }).on('end', function () {
      var body = JSON.parse(Buffer.concat(bodyChunks));
      redis_client.setex("articles", 3600, JSON.stringify(body));
      res2.json({
        data: body
      })
    })
  });

  req.on('error', function (e) {
    console.log('ERROR: ' + e.message);
  });
});

/* Check avec cache */
router.get('/cache', checkCache, async function (req, res2, next) {
  var options = {
    host: 'newsapi.org',
    path: '/v2/top-headlines?country=fr&apiKey=b1378b398f404be18ddd252068b3b099'
  };

  var req = http.get(options, function (res) {
    var bodyChunks = [];
    res.on('data', function (chunk) {
      bodyChunks.push(chunk);
    }).on('end', function () {
      var body = JSON.parse(Buffer.concat(bodyChunks));
      res2.json({
        data: body
      })
    })
  });

  req.on('error', function (e) {
    console.log('ERROR: ' + e.message);
  });
});

module.exports = router;
