const request = require('request');
const Twitter = require('twitter');
const config = require('./local.json');
const twitterClient = new Twitter({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token_key: config.twitter_access_key,
  access_token_secret: config.twitter_access_secret
});
const clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
const Message = require('azure-iot-device').Message;
const iotHubConnectionString = config.iot_hub_connection_string;
const iotClient = clientFromConnectionString(iotHubConnectionString);

const searchTerms = 'javascript';

iotClient.open(iotConnectCallback);

function iotConnectCallback (err) {
  if (err) {
    console.error('Could not connect to IoT Hub: ' + err);
  } else {
    console.log('Client connected to IoT Hub');
    streamTweets();
  };
};

function streamTweets() {
    var tweetStream = twitterClient.stream('statuses/filter', {track: searchTerms, language: 'en'});
    tweetStream.on('data', function(event) {
        if (!isRetweet(event)) {
            console.log('Tweet found');
            getSentiment(event);
        }
    });
    
    tweetStream.on('error', function(error) {
        console.log('Twitter api error: ', error);
    });
}

function isRetweet(event) {
    return (event.text != undefined) && (event.text.substring(0,2) === 'RT');
}


function getSentiment(tweet) {
        const text = encodeURIComponent(tweet.text);
        const query = encodeURIComponent(searchTerms.split(',').join(' OR '));
        const sentimentUrl = `http://www.sentiment140.com/api/classify?appid=${config.sentiment140_appid}&text=${text}&query=${query}`;

        let options = {
                url: sentimentUrl,
                method: "GET",
                json: true
        }

        request(options, function(err, resp, body) {
                if ((!err && resp.statusCode == 200 && body.results !== undefined)) {
                    var message = {
                        id: tweet.id,
                        createdAt: tweet.created_at,
                        text: tweet.text,
                        author: tweet.user.name,
                        lang: tweet.lang,
                        sentiment140Score: body.results.polarity 
                    };

                    sendIoTMessage(message);

                } else {
                    console.log('Sentiment API error: ', err);
                }
        });
}

function sendIoTMessage(message) {
    var iotMessage = new Message(JSON.stringify(message));
    iotClient.sendEvent(iotMessage, function (err) {
        if (err) {
            console.log('Error sending message to IoT Hub', err);
        } else {
            console.log('Message sent to IoT Hub');
        };
    });
}