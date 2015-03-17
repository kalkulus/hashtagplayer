
var hashtagPlayer = function(){
	
	var 

	self = this,
	defaults = {				
		autoPlay: false,
		loopPlay: true,
		randomPlay: false,
		playerId: 'myytplayer',
		fullPlayerContainer: 'hashtag-player',
		playerContainer: 'ytapiplayer',
		playlistContainer: 'playlist',
		debug: false
	},
	player = '',
	playerStates = {
	    UNSTARTED: -1, // (unstarted)
	    ENDED: 0, // (ended)
	    PLAYING: 1, // (playing)
	    PAUSED: 2, // (paused)
	    BUFFERING: 3, // (buffering)
	    CUED: 5 // (video cued).
	},
	options,
	tweets = [],
	tweetCount = 0,
	currentVideoIndex = -1,
	currentVideoId = -1,
	connection = {},
	hashtag = '',

	initPlayer = function(videoId){
		var params = { allowScriptAccess: "always" };
		var atts = { id: options.playerId }; // TODO: configurable
		swfobject.embedSWF("http://www.youtube.com/v/"+videoId+"?enablejsapi=1&playerapiid=ytplayer&version=3",
   			options.playerContainer, "640", "390", "8", null, null, params, atts);
	},

	play = function(index){
		debug(index);
		if (typeof index == 'undefined'){
			index = 0;
		}
		if (player === ''){
			initPlayer(tweets[0].videoId);			
			setPlaying(0);
		}
		else {
			player.loadVideoById(tweets[index].videoId);			
			setPlaying(index);
		}
	},

	playNext = function(){
		var next = currentVideoIndex + 1;
		if (options.randomPlay) {
			var randomIndex = Math.floor((Math.random()*tweetCount));
			debug("randomIndex: "+randomIndex);
			play(randomIndex);
		}
		else if (typeof tweets[next] != 'undefined'){
			play(next);					
		}
		else if (options.loopPlay) {
			play(0);
		}
	},

	playPrev = function(){
		var prev = currentVideoIndex - 1;

		if (typeof tweets[prev] != 'undefined'){
			play(prev);					
		}
		else if (options.autoPlay){
			prev = tweetCount -1;
			play(prev);
		}
	}

	setPlaylistListeners = function(){
		$('#'+options.playlistContainer).on('click','.tweet .ctrl .play',function(e){
			var tweetIndex = $(this).parents('.tweet').data('tweet-index');
			if (tweetIndex != 'undefined'){
				play(tweetIndex);
			}
			if (typeof _gaq != 'undefined'){
				_gaq.push(['_trackEvent', "play", "playlistPlayClick"]);
			}
		});
	},

	setPlayerListeners = function(){
		player.addEventListener("onStateChange", "onytplayerStateChange");
	},

	setPlaying = function(index){
		currentVideoIndex = index;
		currentVideoId = tweets[index].id;

		var playlist = $('#'+options.playlistContainer);
	    var tweet = $('#'+options.playlistContainer+' #'+currentVideoId);

		$('#'+options.playlistContainer+' .tweet').removeClass('current');
		tweet.addClass('current');

		// scroll to the current song
		// TODO: react only on autoplay, if user clicks don't scroll
		playlist.scrollTop(
		    tweet.offset().top - playlist.offset().top + playlist.scrollTop()
		);

	},

	startPlayback = function(){
		if (hashtag == '' || tweets.length == 0){
			debug('no hashtag/tweets');
			return false;
		}
		if (player === '' || $('#'+options.playlistContainer).html() == ''){
			buildPlaylist();
		}
		play();
		$('#'+options.fullPlayerContainer).show();
	},


	buildPlaylist = function() {
		for(t in tweets){
			var tweet = tweets[t];

			tweet.index = t;
			var tweetRow = tmpl('tweet_row',tweet);

			$('#'+options.playlistContainer).append(tweetRow);
		}
	},

	rebuildPlaylist = function(){
		//var currentVideoId = tweets[currentVideoIndex].id;
		var newVideoIndex = -1;
		var newPlaylist = '';


		for(t in tweets){
			var tweet = tweets[t];

			if (tweet.id == currentVideoId){
				newVideoIndex = t;
			}

			tweet.index = t;
			var tweetRow = tmpl('tweet_row',tweet);

			newPlaylist += tweetRow;
		}

		$('#'+options.playlistContainer).html(newPlaylist);		
		setPlaying(newVideoIndex);
	},

	clearPlaylist = function(update) {
		if (typeof update == 'undefined'){
			update = false;
		}
		if (!update){
			currentVideoId = -1;
		}
		currentVideoIndex = -1;
		tweets = [];
		tweetCount = 0;

		$('#'+options.playlistContainer).html('');
	},

	connectToTwitter = function(){
		// Using popup (option 1)
		OAuth.popup('twitter', function(error, result) {
			if (error) {
		    	debug(error); // do something with error
		    	return;
		  	}

		  	// debug(result);

		  	connection = result;

		  	getTweets();
		});
	},

	getTweets = function(update){		
		if (hashtag == ''){
			return false;
		}

		if (typeof update == 'undefined'){
			update = false;
		}
		
		if (update){
			clearPlaylist(update);
		}

		if ($.isEmptyObject(connection)){
			connectToTwitter();
		}
		else {			
			connection.get('/1.1/search/tweets.json?q=%23'+hashtag+'&count=100')		
				.done(function(data){
					debug(data);
					if (data.statuses.length === 0){
						return;
					}
					for (s in data.statuses){
						var status = data.statuses[s];
						if (status.entities.urls.length > 0){
							for (u in status.entities.urls){
								var url = status.entities.urls[u];
								var videoId = '';
								
								debug(url.expanded_url);
								if (url.expanded_url.indexOf('youtube') > 0 && url.expanded_url.indexOf('=') > 0) {
									videoId = url.expanded_url.split('=')[1].split('&')[0];
								}
								else if( url.expanded_url.indexOf('youtu.be') > 0){
									videoId = url.expanded_url.split('/')[3];
								}
								debug(videoId);						
								

								if (videoId != ''){
									var tweet = {
											user: {
												username: status.user.screen_name
											},
											id: status.id_str,
											text: status.text,
											videoId: videoId,
											dateTime: status.created_at.split('+')[0]
										};

									// if adding a tweet fails step out of the loop
									// it fails when update==true and we get tweet that is already in the list
									if (!addTweet(tweet, update)){
										continue;
									}
									
								}
							}
						}
					}

					if (update){
						rebuildPlaylist();
					}
					else {
						startPlayback();				
					}
				}
			);
		}		
	},

	addTweet = function(tweet, update){
		if (update){
			for(t in tweets){
				var existingTweet = tweets[t];
				if (tweet.id == existingTweet.id){
					return false;
				}
			}
		}
/*	
		if (update){
			var newTweets = [tweet];
			newTweets.concat(tweets);
			tweets = newTweets;
		}	
		else{
			tweets.push(tweet);
		}*/
		tweets.push(tweet);
		tweetCount++;
		
	},

	debug = function(msg){
		if (options.debug){
			console.debug(msg);
		}
	}

	;

	var that = {
		init: function(config){
			options = $.extend(defaults,config);
			setPlaylistListeners();				
		},		
		listTweets: function(){
			debug(tweets);
		},		
		setPlayer: function(playerObject){
			player = playerObject;		
			setPlayerListeners();		
		},
		startPlayback: function(){
			if (hashtag == '' || tweets.length == 0){
				debug('no hashtag/tweets');
				return false;
			}
			if (player === ''){
				buildPlaylist();
			}
			play();
		},
		onPlayerStateChange: function(newState){
			if (newState === playerStates.ENDED && options.autoPlay) {
				playNext();
			}
			debug("Player's new state: " + newState);
		},

		playHashtag: function(newHashtag){
			if (newHashtag == hashtag && player != ''){
				return true;
			}

			hashtag = newHashtag;
			
			clearPlaylist();

			getTweets();
		},		

		toggleAutoPlay: function(){
			options.autoPlay = !options.autoPlay;
		},

		getAutoPlay: function() {
			return options.autoPlay;
		},

		toggleRandomPlay: function(){
			options.randomPlay = !options.randomPlay;
		},
		getRandomPlay: function() {
			return options.randomPlay;
		},

		updatePlaylist: function(){
			getTweets(true);
		},

		setDebug: function(debug){
			options.debug = debug;
		},

		playNextSong: function(){
			playNext();
		},	
		playPrevSong: function(){
			playPrev();
		}	

	}

	return that;
}
