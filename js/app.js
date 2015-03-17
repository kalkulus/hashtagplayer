
function onYouTubePlayerReady(playerId) {
  	ytplayer = document.getElementById("myytplayer");
  	// console.log('YouTubePlayerReady');

  	hp.setPlayer(ytplayer);
  	hp.startPlayback();
}

function onytplayerStateChange (newState) {
	// alert("Player's new state: " + newState);
	hp.onPlayerStateChange(newState);	
}

window.onhashchange = function(e) {
	playHashtag();
	if (_gaq) _gaq.push(['_trackEvent', "play", "hashChange", window.location.hash]);
};


function playHashtag() {
	if (window.location.hash != ''){
		var hashtag = window.location.hash.substring(1);
		$('#hashtag-input').val('#'+hashtag);

		hp.playHashtag(hashtag);	
	}
}

function setHashtag() {
	var hashtag = $('#hashtag-input').val().replace('#','');
	
	window.location.hash = '';
	window.location.hash = '#'+hashtag;
}

$(function(){
	
	hashtagPlayerOptions = {
		autoPlay: true,
		debug: false
	};

	hp = new hashtagPlayer();
	hp.init(hashtagPlayerOptions);

	OAuth.initialize('L7O96IMZtWzG1pcdpixMIhGd5g0');

	if (window.location.hash != ''){

		if (_gaq) _gaq.push(['_trackEvent', "play", "urlHash"]);

		$('#hashtag-input').val(window.location.hash);

		playHashtag();	
	};

	if (hp.getAutoPlay()){
		$('#ctrl-auto').button('toggle');
	}

	if (hp.getRandomPlay()){
		$('#ctrl-rnd').button('toggle');
		$('#ctrl-prev').prop('disabled',true);
	}

	$('.hpnav-about').click(function(e){
		e.preventDefault();

		// $('.hpnav-div').hide();
		$('#about').toggle();
		if (_gaq) _gaq.push(['_trackEvent', "view", "about"]);
	});

	$('#close-about').click(function(e){
		e.preventDefault();
		
		$('#about').toggle();
	});

	$( "#hashtag-input" ).keypress(function( e ) {
		if ( e.which == 13 ) {
			e.preventDefault();
			setHashtag();
			if (_gaq) _gaq.push(['_trackEvent', "play", "inputEnter", window.location.hash]);
		}
	});

	$('#play-hashtag').click(function(e){
		e.preventDefault();

		setHashtag();
		if (_gaq) _gaq.push(['_trackEvent', "play", "playItClick", window.location.hash]);

	});

	$('.btn').button();

	$('#ctrl-auto').click(function(){
		hp.toggleAutoPlay();
		if (_gaq) _gaq.push(['_trackEvent', "controls", "toggleAutoPlay"]);
	});
	$('#ctrl-rnd').click(function(){
		hp.toggleRandomPlay();
		if (_gaq) _gaq.push(['_trackEvent', "controls", "toggleRandomPlay"]);

		if (hp.getRandomPlay()){
			$('#ctrl-prev').prop('disabled',true);
		}
		else {
			$('#ctrl-prev').prop('disabled',false);	
		}
	});
	$('#ctrl-refresh').click(function(){
		hp.updatePlaylist();
		if (_gaq) _gaq.push(['_trackEvent', "controls", "refreshPlaylist"]);
	});
	$('#ctrl-next').click(function(){
		hp.playNextSong();
		if (_gaq) _gaq.push(['_trackEvent', "controls", "playNext"]);
	});
	$('#ctrl-prev').click(function(){
		hp.playPrevSong();
		if (_gaq) _gaq.push(['_trackEvent', "controls", "playPrev"]);
	});
	$('#ctrl-next').mouseover(function(event) {
		$('#ctrl-next').tooltip('show');
	});
	$('#ctrl-next').mouseout(function(event) {
		$('#ctrl-next').tooltip('hide');
	});
	$('#ctrl-prev').mouseover(function(event) {
		$('#ctrl-prev').tooltip('show');
	});
	$('#ctrl-prev').mouseout(function(event) {
		$('#ctrl-prev').tooltip('hide');
	});

	

});
