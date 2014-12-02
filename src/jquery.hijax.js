/**
 * jQuery Hijax Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Hijax
 * @version: 0.4
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
			animationTarget: '#hijax-content',
			animationIn: { opacity: 1 },
			animationInOptions: { duration: 300 },
			animationOut: { opacity: 0 },
			animationOutOptions: { duration: 300 },

			// Callbacks
			beforeLoad: function(){}, // Before our AJAX loading.
			afterLoad: function(){}, // After our AJAX loading
		};

	$.Hijax = function(options){
		var settings = $.extend({}, defaults, options);
		var initialLoad = true;
		var velocitySupport = ( jQuery.Velocity !== undefined ) ? true : false;
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
					$(window).bind('popstate', methods.windowPop); // Bind the window forward & back buttons
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
					target = $(this).attr('target') || false,
					targetState = ( target === '_blank' || target === '_parent' || target === '_top' ) ? false : true,
					href = $(this).attr('href'),
					hrefArray = href.split('/'),
					fname = ( hrefArray[hrefArray.length-1] !== '') ? hrefArray[hrefArray.length-1] : hrefArray[hrefArray.length-2],
					ext = fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2),
					currentLocationArray = window.location.pathname.split('/'),
					currentLocation = ( currentLocationArray[ currentLocationArray.length-1 ] !== '') ? currentLocationArray[ currentLocationArray.length-1 ] : currentLocationArray[ currentLocationArray.length-2 ],
					whitelistArray = settings.whitelist;

				if ( 	
					href !== '#' && // No hash links (these are bad practice anyways)
					( whitelistArray.indexOf(ext) > -1 ) && // Check our whitelist of allowed extensions
					( targetState ) && // Check the target attribute
					fname !== currentLocation // Make sure the link is actually different
				){
					event.preventDefault(); // Link checks out. Stop it from doing normal things.
					methods.loadResource(href, true); // Load up that page!
				} else if ( fname === currentLocation ){
					event.preventDefault(); // We're on the same page. Do nothing.
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
				// Our AJAX request
				var request = $.ajax({
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

				// When we're done with AJAX
				request.done( function( responseText ){
					var 
						target = settings.element,
						html = jQuery.parseHTML( responseText ),
						content = $(html).find(target).html();

					$(target).html(content); // Change out content
					
					// Animate things
					if ( !velocitySupport ){
						$(target).find(settings.animationTarget).animate(settings.animationOut, { duration: 0 });
					}
					else {
						$(target).find(settings.animationTarget).velocity(settings.animationOut, { duration: 0 });
					}

					methods.changeMeta( html ); // Update page meta
					methods.changeHistory( url, pushHistory ); // Update history entry (if needed)
					window.scrollTo(0,0); // Go to top of page
				})
				request.complete( methods.loadComplete );
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
				var animationOutOptions = settings.animationOutOptions;

				// Not the initial load anymore.
				initialLoad = false;
				
				// Before load callback
				if ( typeof settings.beforeLoad === typeof Function){
					settings.beforeLoad();
				}

				// Overwrite/add complete
				animationOutOptions.complete = function animateOutCallback(){ 
					$('html').addClass(settings.loadingClass); // Add a class for loading
					methods.ajaxRequest(url, pushHistory); // Make the AJAX request
				};

				// Animate things
				if ( !velocitySupport ){
					$(settings.animationTarget).animate(settings.animationOut, animationOutOptions);
				}
				else {
					$(settings.animationTarget).velocity(settings.animationOut, animationOutOptions);
				}
			},
			/**
			 * loadComplete
			 * ------------
			 * Happens when a new page has been loaded in. 
			 * 
			 */
			loadComplete: function(){
				var animationInOptions = settings.animationInOptions;

				// After load callback
				if ( typeof settings.afterLoad === typeof Function){
					settings.afterLoad();
				}

				// Overwrite/add complete
				animationInOptions.complete = function animateInCallback(){
					$('html').removeClass(settings.loadingClass); // We're done. Remove the class.
				};

				// Animate things
				if ( !velocitySupport ){
					// Do the animateOut animation first. This 'resets' the animation so it can come in naturally.
					$(settings.animationTarget).animate(settings.animationIn, animationInOptions);
				}
				else {
					$(settings.animationTarget).velocity(settings.animationIn, animationInOptions);
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
				// Catches browsers which fire pop immediately.
				if (event.originalEvent.state === null && initialLoad){
					return;
				}
				else {
					initialLoad = false; // Not the first load anymore
					methods.loadResource(window.location, false); // Load that page! The pop itself modifies history, so no need to push.
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