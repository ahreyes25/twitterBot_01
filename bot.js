console.log('SpikyBot running');

//-----------------------------------------------------------------------------------------------
let Twit 	= require('twit');		// twit api
let config 	= require('./config');  // twitter dev keys
let Twitter = new Twit(config);

//-----------------------------------------------------------------------------------------------
let oneSecond = 1000;
let oneMinute = oneSecond * 60;
let oneHour   = oneMinute * 60;
let oneDay    = oneHour * 24;
let oneWeek   = oneDay * 7;
let oneMonth  = oneWeek * 4;
let oneYear   = oneMonth * 12;
 
var authUsers = [ // accounts that can trigger bot
	{'tag': 'GentooGames',   'id': 760930210493542401},
	//{'tag': 'PopDaddyGames', 'id': 931437582621143040}
];

//-----------------------------------------------------------------------------------------------
// Post a Tweet
function tweet(text){
	if (checkCharLength(text))
		Twitter.post('statuses/update', {'status': text}, function(){});
}

// Retweet
function retweet(tweet) {
	Twitter.post('statuses/retweet', {'id': tweet.id_str}, function(){});
}

// Favorite
function favorite(tweet) {
	Twitter.post('favorites/create', {'id': tweet.id_str}, function(){});
}

// Check direct messages that are less than 24 hours old
function checkMessages() {
	Twitter.get('/direct_messages/events/list', {'count': 50}, function(err, data, response){
		if (!err) {
			//for (var i = 0; i < data.events.length; i++) {
			for (var i = 0; i < 1; i++) {
				var mssgTime = data.events[i].created_timestamp;
				if (approvedTimeFrame(mssgTime, oneDay)) { // if mssgTime is <= oneDay old
					notifyOwners(data.events[i]);
				}
			}
		}
	});
}
//-----------------------------------------------------------------------------------------------
// Streams
// Check for approved tweets to retweet
var userStream = Twitter.stream('user');
userStream.on('tweet', function(tweet) {
	var msgFrom  = tweet.user.screen_name;
	var hashes   = tweet.entities.hashtags;
	var authUser = false;
	var hasHash  = false;

	// check for authenticated user
	for (var i = 0; i < authUsers.length; i++) {
		if (msgFrom === authUsers[i].tag) {
			authUser = true;
			break;
		}
	}

	// check for approved hashtags
	for (var i = 0; i < hashes.length; i++) { 
		if (hashes[i].text === 'spikybois') {
			hasHash = true;
			break;
		}
	}

	if (authUser && hasHash) { // like and retweet
		retweet(tweet);
		favorite(tweet);
	}
	else if (authUser && !hasHash) { // just like, no retweet
		favorite(tweet);
	}
});

var dmStream = Twitter.stream('user');
dmStream.on('direct_message', function notifyOwners(mssg) {
	var mssgText = mssg.direct_message.text;

	for (var i = 0; i < authUsers.length; i++) {
		var param = {
			'event': {
				'type': 'message_create',
				'message_create': {
					'target': {
						'recipient_id': String(authUsers[i].id)
					},
					'message_data': {
						'text': mssgText
					}
				}
			}
		};
		console.log(param);
		Twitter.post('/direct_messages/events/new', param, function(){});
	}
});

//-----------------------------------------------------------------------------------------------
// Utility functions
// check length of tweet
function checkCharLength(text){
	if (text.length <= 280)
		return true
	else
		return false;
}