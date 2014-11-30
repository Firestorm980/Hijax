/**
 * jQuery Hijax Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Hijax
 * @version: 0.3
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
			element: '#siteContent', // jQuery target string of element to replace content in.
			exclude: '[data-hijax="false"]', // Optional class or data attribute that can be added to links so that they don't activate.
			loadingClass: 'hijax-loading', // Class that is appeneded to HTML when loading.
			metaClass: 'hijax-meta', // Class that the plugin will look for to find meta elements.
			whitelist: ['php','html','htm',''], // A list of extensions that will incur AJAX loading.
			
			// Callbacks
			beforeLoad: function(){}, // Before our AJAX loading.
			afterLoad: function(){}, // After our AJAX loading
		};

	$.Hijax = function(options){
		var settings = $.extend({}, defaults, options);
		var methods = {
			/**
			 * init
			 * ----
			 * Plugin startup function.
			 */
			init: function(){
				// Check for history API support.
				if ( !!(window.history && history.pushState) ){
					$(document).on('click', 'a:not(['+settings.exclude+'])', methods.linkClick); // Bind page links
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
					event.preventDefault();
				}
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
				var $html = $('html');
				var target = settings.element;
				var request = $.ajax({
					type: 'GET',
					url: url,
					dataType: 'html',
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

				// Before load callback
				if ( typeof settings.beforeLoad === typeof Function){
					settings.beforeLoad();
				}

				// Add a class for loading
				$html.addClass(settings.loadingClass);

				// Trigger Percent
				$(document).trigger({ type: 'hijax.progress', percent: 0 });

				// AJAX
				request.done( function( responseText ){
					var 
						html = jQuery.parseHTML( responseText ),
						content = $(html).find(target).html();

					$(target).html(content); // Change out content
					methods.changeMeta(); // Update page meta
					methods.changeHistory(url, pushHistory); // Update history entry (if needed)
					window.scrollTo(0,0); // Go to top of page
				})
				request.complete( function(){
					// After load callback
					if ( typeof settings.afterLoad === typeof Function){
						settings.afterLoad();
					}

					$html.removeClass(settings.loadingClass); // We're done. Remove the class.
				});
			},
			/**
			 * changeMeta
			 * ----------
			 * Updates the meta information of the page, including title, description meta, and body classes.
			 * 
			 */
			changeMeta: function(){
				var
					$pageMeta = $('.'+settings.metaClass);

				$pageMeta.each(function(){
					var
						$meta = $(this),
						metaTag = $meta.attr('data-tag'),
						metaType = $meta.attr('data-type'),
						metaTypeContent = $meta.attr( 'data-'+metaType ),
						metaContent = $meta.attr('data-content');

					if ( metaTag === 'title' ){
						document.title = metaContent;
					}
					else {
						$('head meta['+metaType+'="'+metaTypeContent+'"]').attr('content', metaContent);
					}
				});
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
					pageTitle = document.title,
					ga = ga || undefined;

				// Push a history entry
				if (pushHistory){
					history.pushState({ url: url }, pageTitle, historyURL);
				}
				// Google Analytics
				if (ga !== undefined){
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
				methods.loadResource(window.location, false); // Load that page! The pop itself modifies history, so no need to push.
			}
		};

		// Start everything
		methods.init();
	};


})( jQuery );