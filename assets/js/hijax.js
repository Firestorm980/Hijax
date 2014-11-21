/**
 * jQuery Hijax Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Hijax
 * @version: 0.1
 *
 * Licensed under the MIT License.
 */

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $ ) {

	// Create the defaults once
	
	var defaults = {
			whitelist: ['php','html','htm',''], // A list of extensions that will incur AJAX loading

			element: '#siteContent', // jQuery target string of element to replace content in.

			// Callbacks
			beforeLoad: function(){}, // Before our AJAX loading. First thing to happen on load resource.
			beforeSend: function(){}, // Right before our AJAX loading.
			afterLoad: function(){}, // After our AJAX loading
		};

	$.Hijax = function(options){
		var settings = $.extend({}, defaults, options);
		var methods = {
			init: function(){
				// Check for history API support.
				if ( !!(window.history && history.pushState) ){
					$(document).on('click', 'a', methods.linkClick); // Bind page links
					$(window).bind('popstate', methods.windowPop); // Bind the window forward & back buttons
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
					whitelistArray = settings.whitelist;

				if ( 	href !== '#' && // No hash links (these are bad practice anyways)
						( whitelistArray.indexOf(ext) > -1 ) && // Check our whitelist of allowed extensions
						(target !== '_blank' || target !== '_parent' || target !== '_top') && // Check the target attribute
						fname !== currentLocation // Make sure the link is actually different
					)
				{
					event.preventDefault(); // Link checks out. Stop it from doing normal things.
					methods.loadResource(href, true); // Load up that page!
				} else if ( fname === currentLocation ){
					event.preventDefault();
				}
			},
			loadResource: function(url, pushHistory){
				var target = settings.element;

				// Before load callback
				if ( typeof settings.beforeLoad === typeof Function){
					settings.beforeLoad();
				}

				// Add a class for loading
				$('html').addClass('ajax-loading');

				$.ajax({
					beforeSend: function(){
						// Before load callback
						if ( typeof settings.beforeSend === typeof Function){
							settings.beforeSend();
						}
					},
					type: 'GET',
					url: url,
					dataType: 'html',
					xhr: function(){
						var xhr = new window.XMLHttpRequest();
						xhr.addEventListener('progress', function(event){
							if (event.lengthComputable){
								var percent = event.loaded / event.total;
								$(document).trigger({ type: 'hijax.progress', percent: percent});
							}
						}, false);
						return xhr;
					},
				}).done( function( responseText ){
					var html = jQuery.parseHTML( responseText );
					var content = $(html).find('#siteContent').html();

					$(target).html(content);

					methods.changeMeta(); // Update page meta
					methods.changeHistory(url, pushHistory); // Update history entry (if needed)
					window.scrollTo(0,0); // Go to top of page
				}).complete( function(){
					// After load callback
					if ( typeof settings.afterLoad === typeof Function){
						settings.afterLoad();
					}

					$('html').removeClass('ajax-loading'); // We're done. Remove the class.
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
				methods.loadResource(window.location, false); // Load that page! The pop itself modifies history, so no need to push.
			}
		};

		methods.init();

	};


})( jQuery );