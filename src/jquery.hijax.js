/**
 * jQuery Hijax Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Hijax
 * @version: 0.5
 *
 * Licensed under the MIT License.
 */

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $ ) {

	// Create the defaults once
	var defaults = {
		// Options
		element: '#hijax-content', // jQuery target string of element to replace content in.
		exclude: '[data-hijax="false"]', // Optional class or data attribute that can be added to links so that they don't activate.
		loadingClass: 'hijax-loading', // Class that is appeneded to HTML when loading.
		metaClass: 'hijax-meta', // Class that the plugin will look for to find meta elements.
		whitelist: ['php','html','htm',''], // A list of extensions that will incur AJAX loading.
		
		// Animation
		sequenceOut: function(callback){ callback(); }, // Velocity sequence to use on a page load.
		sequenceIn: function(callback){ callback(); }, // Velocity sequence to use when new page is done loading.

		// Callbacks
		beforeLoad: function(){}, // Before our AJAX loading.
		afterLoad: function(){}, // Immediately after our AJAX loading.
		loadComplete: function(){} // After all loading is done.
	};

	$.Hijax = function(options){
		var settings = $.extend({}, defaults, options);
		var popped = false;
		var initialUrl = location.href;
		var initialLoad;
		var requestCount = 0;
		var request;
		var resourceLoading = false;
		var currentLocation = initialUrl;
		var methods = {
			/**
			 * init
			 * ----
			 * Plugin startup function.
			 */
			init: function(){
				// Check for history API support.
				if ( !!(window.history && history.pushState) ){
					$(document).on('click', 'a:not('+settings.exclude+')', methods.linkClick); // Bind page links
					$(window).on('popstate', methods.windowPop); // Bind the window forward & back buttons
				}
			},
			/**
			 * checkSamePage
			 * -------------
			 * Method for comparing to sets of URL strings.
			 * 
			 * @param  {[string]} currentUrl [URL string we're coming from]
			 * @param  {[string]} targetUrl  [URL string we're trying to go to]
			 * @return {[boolean]}            [True if it is the same page, false if not.]
			 */
			checkSamePage: function(currentUrl, targetUrl){
				var
					currArray = currentUrl.split('/'),
					currPage = currArray[ currArray.length - 1 ],

					targetArray = targetUrl.split('/'),
					targetPage = targetArray[ targetArray.length - 1],

					pathCheckLength = ( currArray.length > targetArray.length ) ? currArray.length : targetArray.length;
					pathDifferenceIndex = -1;

				// Loop through and compare both paths. Stop if you find a difference.
				for (var i = 0, l = pathCheckLength; i < l; i++ ){
					var currItem = currArray[i] || null;
					var targetItem = targetArray[i] || null;
					if ( currItem !== targetItem ){
						pathDifferenceIndex = i;
						break;
					}
				}

				// Check if a path difference was found
				if (pathDifferenceIndex > -1){
					// Was the difference found in the last entry?
					if ( pathDifferenceIndex === (pathCheckLength-1) ){
						// Strip out hash tags to see if there really was a difference
						var currString = ( currPage.indexOf('#') > -1 ) ? currPage.substring(0, currPage.indexOf('#')) : currPage;
						var targetString = ( targetPage.indexOf('#') > -1 ) ? targetPage.substring(0, targetPage.indexOf('#')) : targetPage;

						// Compare the remainder of the string
						if ( currString === targetString){
							return true; // Nope. Same query string or file.
						}
						else {
							return false; // Yes. Different query or file.
						}
					}
					// This for sure is a different thing, as it means the difference was spotted somewhere in the structure before the final slash
					else {
						return false; // Not same page
					}
				}
				// Exact same path
				else {
					return true; // Is same page
				}
			},
			/**
			 * linkClick
			 * ---------
			 * Event handler for normal links.
			 * 
			 */
			linkClick: function(event){
				var
					location = window.location,

					target = $(this).attr('target') || false,
					targetState = ( target === '_blank' || target === '_parent' || target === '_top' ) ? false : true,
					targetHref = $(this).attr('href'),
					targetHash = $(this).prop('hash'),
					targetArray = targetHref.split('/'),
					fname = targetArray[targetArray.length-1],
					ext = fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2),

					whitelistArray = settings.whitelist,
					samePage = methods.checkSamePage( location.href, targetHref );

				// Is it the same page?
				// Yes.
				if ( samePage ){
					event.preventDefault();
					// Does it have a hash it wants us to go to? Yep.
					if ( targetHash.length ){
						window.scrollTo( 0, $(targetHash).offset().top ); // Scroll to the hash.
						window.location.hash = targetHash; // Change the hash for history.
					}
				}
				// Not the same page. Do additional checks.
				else if (
						( whitelistArray.indexOf(ext) > -1 ) && // Check our whitelist of allowed extensions
						( targetState ) //&& // Check the target attribute
					){
					event.preventDefault(); // Link checks out. Stop it from doing normal things.
					methods.loadResource(targetHref, true); // Load up that page!					
				}

			},
			/**
			 * ajaxRequest
			 * -----------
			 * Handles the actual AJAX request, progress, and callbacks when done.
			 * 
			 * @param  {[string]} url         [URL to load]
			 * @param  {[boolean]} pushHistory [Push a history entry or not]
			 */
			ajaxRequest: function(url, pushHistory){
				requestCount++;
				var requestnumber = requestCount; 
				console.log(requestnumber);
				// Our AJAX request
				request = $.ajax({
					type: 'GET',
					url: url,
					dataType: 'html',
					// Add in support for progress
					xhr: function(){
						var xhr = new window.XMLHttpRequest();
						xhr.addEventListener('progress', function(event){
							if (event.lengthComputable){
								var percent = (event.loaded / event.total) * 100;
								$(document).trigger({ type: 'hijax.progress', percent: percent});
							}
						}, false);
						return xhr;
					},
				});

				// Trigger Percent
				$(document).trigger({ type: 'hijax.progress', percent: 0 });

				window.scrollTo(0,0); // Go to top of page.

				// When we're done with AJAX
				request.done( function( responseText ){
					var 
						target = settings.element,
						html = jQuery.parseHTML( responseText ),
						content = $(html).find(target).html();

					console.log(requestCount);

					if (requestnumber == requestCount){

						$(target).html(content); // Change out content

						// After load callback
						if ( typeof settings.afterLoad === typeof Function){
							settings.afterLoad();
						}
						methods.changeMeta( html ); // Update page meta
						methods.changeHistory( url, pushHistory ); // Update history entry (if needed)

						methods.loadComplete();
					}
					
				});
			},
			/**
			 * loadResource
			 * ------------
			 * Loads a page we specify with AJAX. Switches out the content in the option element and kicks off other changes.
			 * 
			 * @param  {[string]} url         [URL of the page we want to load.]
			 * @param  {[boolean]} pushHistory [Whether to push a new history entry. Useful for different events.]
			 */
			loadResource: function(url, pushHistory){
				if ( !resourceLoading ) {

					resourceLoading = true;

					// Not the initial load anymore.
					initialLoad = false;
					
					// Before load callback
					if ( typeof settings.beforeLoad === typeof Function){
						settings.beforeLoad();
					}

					// Add class to HTML
					$('html').addClass(settings.loadingClass);
					
					// Sequence Out Callback
					if ( typeof settings.sequenceOut === typeof Function){
						settings.sequenceOut( function(){ methods.ajaxRequest(url, pushHistory); } );
					}
				}
				else {
					request.abort();
					request = null;
					methods.ajaxRequest( url, pushHistory );
				}
			},
			/**
			 * loadComplete
			 * ------------
			 * Happens when a new page has been loaded in. 
			 * 
			 */
			loadComplete: function(){
				var 
					completeCallback = function(){
						// After load callback
						if ( typeof settings.loadComplete === typeof Function){
							settings.loadComplete();
						}
						// Add class to HTML
						$('html').removeClass(settings.loadingClass);

						resourceLoading = false;
						currentLocation = window.location.href;
					};

				// Sequence In Callback
				if ( typeof settings.sequenceIn === typeof Function){
					settings.sequenceIn( completeCallback );
				}
			},
			/**
			 * changeMeta
			 * ----------
			 * Updates the meta information of the page, including title, description meta, and body classes.
			 * 
			 */
			changeMeta: function( html ){
				var
					title = $(html).filter('title').html(), // AJAX data page title
					$pageMeta = $('.'+settings.metaClass); // New page meta information

				// If we included new meta information
				if ( $pageMeta.length ){
					// Loop through new meta
					$pageMeta.each(function(){
						var
							$meta = $(this), // New meta tag
							metaTag = $meta.attr('data-tag'), // What kind of tag is it (meta, title)
							metaType = $meta.attr('data-type'), // What type of meta (name, property)
							metaTypeContent = $meta.attr( 'data-'+metaType ), // What is the data for the type 
							metaContent = $meta.attr('data-content'); // What is the meta content

						// For the title meta only
						if ( metaTag === 'title' ){
							document.title = metaContent; // Replace the page title
						}
						// Every other meta tag
						else {
							// Replace the corresponding meta information
							$('head meta['+metaType+'="'+metaTypeContent+'"]').attr('content', metaContent);
						}
					});
				}
				// If no new title was supplied, use our AJAX data to get one
				if ( !$('.'+settings.metaClass+'[data-tag="title"]').length ) {
					document.title = title;
				}
			},
			/**
			 * changeHistory
			 * -------------
			 * Updates the history entries of the browser, if applicable. Also updates Google Analytics, if used.
			 * 
			 * @param  {[string]} url         [The URL to push to the history.]
			 * @param  {[boolean]} pushHistory [Whether to actually push this new entry or not. Useful for different events.]
			 */
			changeHistory: function(url, pushHistory){
				var 
					historyURL = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? url+'#' : url, // Fix for iOS
					pageTitle = document.title, // Page title
					ga = ga || undefined; // Detect Google Analytics

				// Push a new history entry
				if (pushHistory){
					history.pushState({ url: url }, pageTitle, historyURL);
					popped = true;
				}
				// Google Analytics
				if (ga !== undefined){
					// Send a pageview to Google since we loaded it via AJAX
					ga('send', 'pageview');
				}
			},
			/**
			 * windowPop
			 * ---------
			 * Happens when the user clicks the forward / back buttons on their browser.
			 * 
			 * @param  {[object]} event [Event object that comes with the user interaction.]
			 */
			windowPop: function(event) {
				// Catch for bad browsers
				var initialPop = ( !popped && location.href == initialUrl );

				popped = true; // We popped.

				// Catches browsers which fire pop immediately.
				if ( initialPop ){
					return;
				}
				else {
					var samePage = methods.checkSamePage( currentLocation, window.location.href);
					var hash = window.location.hash;

					// If this isn't the same page that we have in memory
					if ( !samePage ){
						initialLoad = false; // Not the first load anymore
						methods.loadResource(window.location, false); // Load that page! The pop itself modifies history, so no need to push.
					}
					// It is the same page. Check for hash and move there.
					else if ( hash.length ) {
						window.scrollTo( 0, $(hash).offset().top ); // Scroll to the hash element.
					}
				}
				
			}
		};

		// Start everything
		methods.init();

		// Public Methods
		return {
			/**
			 * load
			 * ----
			 * Programically load in a new page. Treats it like a link, adding a new history entry.
			 * 
			 * @param  {[string]} url [The URL of the page to load.]
			 */
			load: function(url){
				methods.loadResource(url, true);
			}
		};
	};
})( jQuery );