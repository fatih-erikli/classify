import json
import aioredis
import base64
import unidecode

from aiohttp.web import Application
from aiohttp.web import get, post, options
from aiohttp.web import run_app as serve
from aiohttp.web import json_response as respond
from aiohttp.web import middleware

redis = aioredis.from_url("redis://localhost")

@middleware
async def middleware(request, handler):
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

def decode(bytes):
  if not bytes:
    return bytes
  return str(bytes, 'utf-8')

def encode(text):
  return unidecode.unidecode(text)

async def labels(request):
  return respond({'labels': list(map(decode, await redis.smembers('labels')))})

async def stats(request):
  return respond({'hello': decode(await redis.get("my-key"))})

async def train(request, *, loads=json.loads):
  body = await request.json()
  text = body.get('text')
  label = body.get('label')
  encoded_label = encode(label)
  result = {}
  for word in text.split():
    encoded_word = encode(word);
    key = '%s:%s' % (encoded_label, encoded_word)
    print(key)
    await redis.incrby(key, 1)
    count = int(await redis.get(key))
    await redis.sadd('label:%s' % encoded_label, encoded_word)
    await redis.sadd('word:%s' % encoded_word, encoded_label)
    result[encoded_word] = count
  others = list(map(decode, await redis.smembers('label:%s' % encoded_label)))
  result['list'] = others
  result['label'] = encoded_label
  await redis.sadd('labels', encoded_label)
  return respond(result)

async def classify(request, *, loads=json.loads):
  body = await request.json()
  text = body.get('text')
  result = {}
  labels = set()
  scores = {}

  for word in text.split():
    encoded_word = encode(word)
    for label in await redis.smembers('word:%s' % encoded_word):
      decoded_label = decode(label)
      labels.add(decoded_label)
      key = '%s:%s' % (decoded_label, encoded_word)
      count = int(await redis.get(key) or 0)
      scores[decoded_label] = scores.get(decoded_label, 0) + count

  others = list(labels)
  result['labels'] = others
  result['scores'] = scores
  return respond(result)

routes = {
  'stats': ['get', stats],
  'train': ['post', train],
  'labels': ['get', labels],
  'classify': ['post', classify],
}

app = Application(middlewares=[middleware])

async def empty_response(request):
  return respond({})

for (route, (method, view)) in routes.items():
  app.add_routes([options('/%s' % route, empty_response)])
  app.add_routes([locals()[method]('/%s' % route, view)])

serve(app)
