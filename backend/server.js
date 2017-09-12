const request = require('request-promise');
const config = require('./local.json');

// Twitter stuff
const Twitter = require('twitter');
const twitterClient = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_key,
  access_token_secret: config.twitter_access_secret
});

// Azure IoT stuff
const IoTMessage = require('azure-iot-device').Message;
const iotClientFactory = require('azure-iot-device-amqp').clientFromConnectionString;
const iotClient = iotClientFactory(config.iot_hub_connection_string);

// WebSocket Server
const WebSocket = require('ws');
const options = {
    port: 8000, 
    clientTracking: true
}
const wss = new WebSocket.Server(options);

wss.on('listening', function listening() {
    console.log('WebSocket Server started, listening for connections');
});

wss.on('error', function serverError(error) {
    console.error('WebSocket server error', error);
});

wss.on('connection', function connection(socket, request) {
  const clientIp = request.connection.remoteAddress;
  let tweetStream = null;

  console.log(`new connection:  ${clientIp}`);
  console.log(`connected clients: ${wss.clients.size}`);
  
  socket.on('message', function incoming(terms) {
    let input = JSON.parse(terms);
    console.log(`received from ${clientIp}: ${input}`);
    if (tweetStream) {
        tweetStream.destroy();
    }
    tweetStream = startTweetStream(input, socket);
  });

  socket.on('close', function close(code, reason) {
    console.log(`connection ${clientIp} closed (code ${code})`);
    console.log(`connected clients: ${wss.clients.size}`);
    if (tweetStream) {
        tweetStream.destroy();
    }
  });
});

function startTweetStream(searchTerms, wsSocket) {
    const tweetStream = twitterClient.stream('statuses/filter', {track: searchTerms, language: 'en'});
    console.log('Created Twitter stream');
    tweetStream.on('data', function(tweet) {
        
        if (!isRetweet(tweet)) {
            console.log('Tweet found');
            getSentiment(tweet, searchTerms).then(data => {
                if (wsSocket.readyState === WebSocket.OPEN) {
                    wsSocket.send(JSON.stringify(data), function acknowledge(error){
                        if (error) {
                            console.error(`Error sending message`, error);
                        }
                    });
                }
                // sendIoTMessage(data);
            });
        }
    });
    
    tweetStream.on('error', function(error) {
        console.error('Twitter api error', error);
    });
    
    return tweetStream;
}
 
function isRetweet(tweet) {
    return (tweet.text != undefined) && (tweet.text.substring(0,2) === 'RT');
}

function getSentiment(tweet, searchTerms) {
        const text = encodeURIComponent(tweet.text);
        const query = encodeURIComponent(searchTerms.split(',').join(' OR '));
        const sentimentUrl = `http://www.sentiment140.com/api/classify?appid=${config.sentiment140_appid}&text=${text}&query=${query}`;

        let options = {
                url: sentimentUrl,
                method: "GET",
                json: true
        }

        return request(options)
                .then(response => {
                    const result = {
                        id: tweet.id,
                        createdAt: tweet.created_at,
                        text: tweet.text,
                        author: tweet.user.name,
                        lang: tweet.lang,
                        sentimentScore: response.results.polarity 
                    };

                    return Promise.resolve(result);
                })
                .catch(err => {
                    console.error('Sentiment API error', err);
                    return Promise.reject(err);
                });
}

const iotConnectCallback = function (err) {
    if (err) {
      console.error('Could not connect to IoT Hub: ' + err);
    } else {
      console.log('Client connected to IoT Hub');
    };
  };
  
// iotClient.open(iotConnectCallback);

function sendIoTMessage(payload) {
    const iotMessage = new IoTMessage(JSON.stringify(payload));
    iotClient.sendEvent(iotMessage, function (err) {
        if (err) {
            console.error('Error sending message to IoT Hub', err);
        } else {
            console.log('Message sent to IoT Hub');
        };
    });
}