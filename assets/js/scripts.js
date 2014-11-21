jQuery(document).ready(function($) {
	
	//dynamicLoading.init();
	
	$.Hijax({
		beforeLoad: function(){
			$('#hijaxLoader').addClass('loading');
		},
		afterLoad: function(){
			$('#hijaxLoader').removeClass('loading');
		}
	});

	

});

/*
var dynamicLoading = {

	everPushed: false,

	whitelist: ['php','html','htm',''],
	blacklist: ['pdf','doc','docx','xls','xlsx','mp4','mp3','jpeg','jpg','png','gif','ogg','oga','ogv','svg','ico'],

	afterLoad: function(){
	},
	beforeLoad: function(){
	},

	init: function(){
		// Check for history API support.
		if ( !!(window.history && history.pushState) ){
			$(document).on('click', 'a', dynamicLoading.linkClick); // Bind page links
			$(window).bind('popstate', dynamicLoading.windowPop); // Bind the window forward & back buttons
		}
	},
	linkClick: function(event){
		var
			target = $(this).attr('target') || '',
			href = $(this).attr('href'),
			hrefArray = href.split('/'),
			fname = hrefArray[hrefArray.length-1],
			ext = fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2),
			currentLocationArray = window.location.pathname.split('/'),
			currentLocation = currentLocationArray[ currentLocationArray.length-1 ],
			whitelistArray = dynamicLoading.whitelist,
			blacklistArray = dynamicLoading.blacklist;

		if ( 	href !== '#' && // No hash links (these are bad practice anyways)
				( whitelistArray.indexOf(ext) > -1 ) && // Check our whitelist of allowed extensions
				( blacklistArray.indexOf(ext) === -1 ) && // Check our blacklist of disallowed extensions
				(target !== '_blank' || target !== '_parent' || target !== '_top') && // Check the target attribute
				fname !== currentLocation // Make sure the link is actually different
			)
		{
			event.preventDefault(); // Link checks out. Stop it from doing normal things.
			dynamicLoading.loadResource(href, true); // Load up that page!
		}
	},
	loadResource: function(url, pushHistory){

		// Before load callback
		if ( typeof dynamicLoading.beforeLoad === typeof Function){
			dynamicLoading.beforeLoad();
		}

		// Add a class for loading
		$('html').addClass('ajax-loading');

		// AJAX load in our new content
		$('#siteContent').load(url+' #siteContent', function(){
			dynamicLoading.changeMeta(); // Update page meta
			dynamicLoading.changeHistory(url, pushHistory); // Update history entry (if needed)
			window.scrollTo(0,0); // Go to top of page
			
			$('html').removeClass('ajax-loading'); // We're done. Remove the class.
			// After load callback
			if ( typeof dynamicLoading.afterLoad === typeof Function){
				dynamicLoading.afterLoad();
			}
		});
	},
	changeMeta: function(){
		var
			pageTitle = $('#metaTitle').text(),
			pageDescription = $('#metaDescription').text(),
			pageClasses = $('#metaClasses').text();

		$('body').removeClass().addClass(pageClasses); // Change any page specific classes
		$('head meta[name="description"]').attr('content', pageDescription); // Change head meta
		document.title = pageTitle; // Change head title tag
	},
	changeHistory: function(url, pushHistory){
		var 
			historyURL = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? url+'#' : url, // Fix for iOS
			pageTitle = $('#metaTitle').text();

		// Push a history entry
		if (pushHistory){
			history.pushState({ url: url }, pageTitle, historyURL);
		}
		// Google Analytics
		//ga('send', 'pageview', { 'page': document.location.pathname, 'title': ajaxPageTitle });
	},
	windowPop: function(event) {
		dynamicLoading.loadResource(window.location, false); // Load that page! The pop itself modifies history, so no need to push.
	}
};
*/