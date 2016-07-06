jQuery(document).ready(function($) {

	var sequenceOut = function ( callback ) {
		jQuery('#siteContent').animate({
			opacity: 0,
			},
			500, function() {
			callback();
		});
	};
	var sequenceIn = function ( callback ) {
		jQuery('#siteContent').animate({
			opacity: 1,
			},
			500, function() {
			callback();
		});
	};

	jQuery(document).hijax({
		element: '#siteContent',
		sequenceIn: sequenceIn,
		sequenceOut: sequenceOut,
	});

});