(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    // Create the defaults once
    var pluginName = "hijax",
        defaults = {
            // The container to target the changes in
            container: '#siteContent',
            // Extra selector to use to exclude certain links
            // Could be an attribute, class, or other selector
            exclude: '[data-hijax="false"]',

            // Animate the body back to the top of the content
            smoothScroll: false,
            smoothScrollDuration: 1000,


            // Animation in
            sequenceIn: function( callback, data ){
                console.log('in');
                console.log(data.url.current + ' | ' + data.url.previous );
                callback();
            },
            // Animation out
            sequenceOut: function( callback, data ){
                console.log('out');
                console.log(data.url.target + ' | ' + data.url.current );
                callback();
            },

        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        base = this;
        base.element = element;

        // jQuery has an extend method that merges the
        // contents of two or more objects, storing the
        // result in the first object. The first object
        // is generally empty because we don't want to alter
        // the default options for future instances of the plugin
        base.settings = $.extend( {}, defaults, options) ;

        base._defaults = defaults;
        base._name = pluginName;

        base._init();
    }

    $.extend(Plugin.prototype, {

        /**
         * PRIVATE METHODS
         * ===============
         */
            _init: function() {
                var 
                    instance = this,
                    element = instance.element;


                // Stop the plugin init if there is no history support
                if ( !instance._check.supports ){
                    console.error('Hijax: History support not detected. Aborting.');
                    return false;
                }

                // Set default data
                instance._data = {
                    // URL data
                    // Useful for comparisons and event data
                    // Should allow for specific animations based on URL
                    url: {
                        initial: null,
                        previous: null,
                        current: null,
                        target: null
                    },
                    // This is all for foward and back buttons on the browser
                    // State keeps track of if the event was caused by those buttons
                    // We make decisions on history pushState based on that
                    // ID is how we keep track of "where" the user is in the history stack
                    // If they've been to the site before and a history entry was made, we use that information.
                    // If not, we start fresh
                    // Direction is what button they clicked, forward or back. Set by comparing IDs.
                    pop: {
                        state: false,
                        id: history.state.id || 0,
                        direction: ''
                    },
                    // What element called the event
                    // Either a link (<a>), the window (forward/back), or manually called (.hijax('load'))
                    element: null,
                    // AJAX information
                    // A loading flag to prevent extraneous loads
                    // A place to store the current request so we can abort it, if needed
                    // A place to store the response so we can manipulate it later
                    // The target url
                    // Success is used for fallback cases
                    ajax: {
                        loading: false,
                        request: null,
                        response: null,
                        target: '',
                        success: false
                    }
                };

                // Call during scrolling
                instance._bindEvents.call( instance );
            },

            /**
             * bindEvents
             * ---
             * Remap that to our own namespaced events in the plugin.
             */
            _bindEvents: function(){
                var
                    instance = this;

                // Plugin
                jQuery(document).on('click.'+pluginName, 'a:not('+instance.settings.exclude+')', 
                    function hijax_click(event){
                        instance._eventSwitch.call( instance, 'click', event, this );
                    }
                );
                jQuery(window).on('popstate.'+pluginName, 
                    function hijax_pop(event){
                        instance._eventSwitch.call( instance, 'popstate', event, this  );
                    }
                );
                jQuery(window).on('load.'+pluginName, 
                    function hijax_load(){
                        instance._eventSwitch.call( instance, 'load' );
                    }
                );
            },

            _eventSwitch: function( type, event, element ){
                var instance = this;

                switch( type ){
                    // Initial page load
                    case 'load':
                        instance._event.load.call( instance );
                        break;
                    // For when an anchor is clicked
                    case 'click':
                        instance._event.click.call( instance, event, element );
                        break;
                    // For when the window forward/backward buttons are used
                    case 'popstate':
                        instance._event.popstate.call( instance, event, element );
                        break;
                    // For manual use through the plugin
                    case 'manual':
                        instance._event.manual.call( instance );
                        break;
                }
            },
            _check: {
                supports: function(){
                    // The stock browser on Android 2.2 & 2.3, and 4.0.x returns positive on history support
                    // Unfortunately support is really buggy and there is no clean way to detect
                    // these bugs, so we fall back to a user agent sniff :(
                    var ua = navigator.userAgent;

                    // We only want Android 2 and 4.0, stock browser, and not Chrome which identifies
                    // itself as 'Mobile Safari' as well, nor Windows Phone (issue #1471).
                    if ((ua.indexOf('Android 2.') !== -1 ||
                        (ua.indexOf('Android 4.0') !== -1)) &&
                        ua.indexOf('Mobile Safari') !== -1 &&
                        ua.indexOf('Chrome') === -1 &&
                        ua.indexOf('Windows Phone') === -1) {
                      return false;
                    }
                    // Return the regular check
                    return (window.history && 'pushState' in window.history);
                },
                page: function( current_url, target_url ){
                    var
                        current_url_array = current_url.split('/'),
                        current_url_page = current_url_array[ current_url_array.length - 1 ],
                        target_url_array = target_url.split('/'),
                        target_url_page = target_url_array[ target_url_array.length - 1],
                        
                        pathCheckLength = ( current_url_array.length > target_url_array.length ) ? current_url_array.length : target_url_array.length,
                        pathDifferenceIndex = -1;

                    // Loop through and compare both paths. Stop if you find a difference.
                    for (var i = 0, l = pathCheckLength; i < l; i++ ){
                        var currItem = current_url_array[i] || null;
                        var targetItem = target_url_array[i] || null;
                        if ( currItem !== targetItem ){
                            pathDifferenceIndex = i;
                            break;
                        }
                    }
                    // Check if a path difference was found
                    if (pathDifferenceIndex > -1){
                        // Was the difference found in the last entry?
                        if ( pathDifferenceIndex === ( pathCheckLength - 1 ) ){
                            // Strip out hash tags to see if there really was a difference
                            var current_url_string = ( current_url_page.indexOf('#') > -1 ) ? current_url_page.substring(0, current_url_page.indexOf('#')) : current_url_page;
                            var target_url_string = ( target_url_page.indexOf('#') > -1 ) ? target_url_page.substring(0, target_url_page.indexOf('#')) : target_url_page;

                            // Compare the remainder of the string
                            if ( current_url_string === target_url_string ){
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
            },
            _event: {
                load: function(){
                    var
                        instance = this,
                        data = instance._data;

                    // Set the starting page for comparison later, if needed
                    // Set the current page the user is on (same thing)
                    data.url.initial = window.location.href;
                    data.url.current = window.location.href;

                    // If history.state is null, this is our first load on the site
                    // That means the user hasn't been here yet.
                    // Therefore, we need to replace the current entry so we can do comparisons
                    // We really aren't changing anything, we're just adding data for later
                    // If the user has been on this page before, there should already be data we can use that has been loaded
                    if ( history.state === null ){
                        // Replace the blank history state
                        history.replaceState({ url: data.url.initial, id: data.pop.id }, document.title, data.url.initial );    
                    }
                },
                click: function( event, element ){
                    var
                        instance = this,
                        $elem = jQuery(element),
                        target_url = $elem.attr('href'),
                        target_hash = $elem.prop('hash'),
                        target_download = $elem[0].hasAttribute('download'),
                        target_target = $elem.attr('target'),
                        target_state = ( target_target === '_blank' || target_target === '_parent' || target_target === '_top' ) ? false : true,
                        current_url = instance._data.url.current,
                        is_same_page = instance._check.page.call( this, current_url, target_url );

                    // The request is for the current page
                    if ( is_same_page ){
                        // There isn't a hash ("someplace.com/#target") in the request?
                        // Don't do anything then
                        if ( !target_hash.length ){
                            event.preventDefault();
                        }
                        // There is a hash
                        else {
                            // @todo: Animation? Callback?
                        }
                    }
                    // The anchor is not a download link nor is it pointing to another frame
                    // This must mean its an internal link to another page / resource
                    else if ( target_state && !target_download ){
                        // Stop what you normally do 
                        event.preventDefault();
                        // Set our data and get loading
                        instance._data.element = element;
                        instance._data.url.previous = window.location.href;
                        instance._data.url.target = target_url;
                        instance._data.pop.state = false;
                        instance._history.start_load.call( instance );
                    }
                },
                popstate: function( event, element ){
                    var
                        instance = this,
                        pop_id = instance._data.pop.id,
                        state_id = history.state.id;

                    // Set our data and get loading
                    instance._data.element = element;
                    instance._data.url.previous = instance._data.url.current;
                    instance._data.url.target = window.location.href;
                    instance._data.pop.state = true;

                    // back button
                    if ( pop_id > state_id ){
                        instance._data.pop.direction = 'back';
                    }
                    // forward button
                    else if ( pop_id < state_id ){
                        instance._data.pop.direction = 'forward';
                    } 
                    // Update
                    instance._data.pop.id = history.state.id;

                    instance._history.start_load.call( instance );
                },
                manual: function(){
                    var 
                        instance = this;

                    instance._data.element = window;
                    instance._data.url.previous = window.location.href;
                    // target url is set in the public method
                    instance._data.pop.state = false;
                    instance._history.start_load.call( instance );
                },
            },
            _history: {
                update: function(){
                    var
                        instance = this,
                        data = instance._data;

                    data.url.current = window.location.href;
                    data.url.target = null;
                },
                start_load: function(){
                    var
                        instance = this,
                        sequenceOutCallback = function(){
                            instance._history.load.call( instance );
                        },
                        smoothScrollCallback = function(){
                            // Are we currently loading anything?
                            if ( !instance._data.ajax.loading ){

                                // Let the plugin know loading has started
                                instance._data.ajax.loading = true;
                                instance._data.ajax.target = instance._data.url.target;
                                // Do sequence
                                if ( jQuery.isFunction( instance.settings.sequenceOut ) ){
                                    instance.settings.sequenceOut.call( instance._data.element, sequenceOutCallback, data );
                                }
                                else {
                                    console.error('Hijax: Setting for "sequenceOut" is not a function. Aborting.');
                                }
                            }
                            // We're loading something
                            // But, someone probably clicked forward/back
                            // So we need to load the new thing instead
                            else if ( instance._data.ajax.loading && instance._data.url.target !== instance._data.ajax.target){
                                // Cancel the current in progress request
                                if ( instance._data.ajax.request !== null ){
                                    instance._data.ajax.request.abort();    
                                }
                                // Let the plugin know loading has started
                                instance._data.ajax.loading = true;
                                instance._data.ajax.target = instance._data.url.target;
                                // Do sequence
                                if ( jQuery.isFunction( instance.settings.sequenceOut ) ){
                                    instance.settings.sequenceOut.call( instance._data.element, sequenceOutCallback, data );
                                }
                                else {
                                    console.error('Hijax: Setting for "sequenceOut" is not a function. Aborting.');
                                }
                            }
                        },
                        data = {
                            url: {
                                current: instance._data.url.current,
                                target: instance._data.url.target
                            },
                            element: instance._data.element
                        };

                    if ( instance._data.pop.state ){
                        data.direction = instance._data.pop.direction;
                    }

                    // If smoothscroll isn't enabled, snap back to the top
                    if ( !instance.settings.smoothScroll ){
                        window.scrollTo( 0, 0 );
                        smoothScrollCallback(); // Do the callback above
                    }
                    // If it is enabled, animate us to the top
                    // Then do the callback above
                    else {
                        $('html,body').animate({ scrollTop: 0, scrollLeft: 0 }, { 
                            duration: instance.settings.smoothScrollDuration,
                            complete: smoothScrollCallback 
                        });
                    }
                },
                load: function(){
                    var instance = this;

                    // Update the ajax target with the current target
                    // You'll notice we do this in the previous function as well
                    // For some reason, we need to do it immediately and here
                    instance._data.ajax.target = instance._data.url.target;
                    // Target is null? Stop.
                    // This fixes a strange problem of an incorrect page load when none was requested.
                    if ( instance._data.ajax.target === null ){
                        return;
                    }
                    // Trigger Percent
                    $(instance.element).trigger({ type: 'progress.hijax', percent: 0 });
                    // Do the beforeload event
                    $(instance.element).trigger('beforeload.hijax');
                    // Save the request for use later
                    // Things like aborting can be done then
                    instance._data.ajax.request = jQuery.ajax({
                        url: instance._data.ajax.target,
                        type: 'GET',
                        dataType: 'html',
                        xhr: function(){
                            var xhr = new window.XMLHttpRequest();
                            // Add progress support
                            xhr.addEventListener('progress', function(event){
                                if (event.lengthComputable){
                                    var percent = (event.loaded / event.total) * 100;
                                    $(instance.element).trigger({ type: 'progress.hijax', percent: percent});
                                }
                            }, false);
                            return xhr;
                        },
                    })
                    .done(function( response ) {
                        // Save the response
                        // We'll use it later
                        instance._data.ajax.response = response;
                        instance._data.ajax.success = true;
                        // Do afterload event
                        $(instance.element).trigger('afterload.hijax');
                        // Proceed to do the end load
                        instance._history.end_load.call( instance );
                    })
                    .fail(function() {
                        instance._data.ajax.success = false;
                    })
                    .always(function() {
                    });
                },
                end_load: function(){
                    var
                        instance = this,
                        sequenceInCallback = function(){
                            // Open up loading for another page
                            instance._data.ajax.loading = false;
                            // Do the completeload event
                            $(instance.element).trigger('completeload.hijax');
                        },
                        data = null;

                    // Update content
                    // Only update if there is new content
                    // This is where our actual document changes take place
                    // Updating title before the history push
                    if ( instance._data.ajax.success ){
                        instance._content.update_container.call( instance );
                        instance._content.update_title.call( instance );
                    }
                    // Only push if we popped
                    // We don't pop for window, but we do for links
                    if ( !instance._data.pop.state ){
                        instance._history.push.call( instance );
                    }
                    // Update GA
                    // This has to happen after the URL bar changes
                    instance._history.analytics.call( instance );
                    // Update data
                    // This has to happen after the URL bar changes
                    instance._history.update.call( instance );

                    // Make the callback data
                    data = {
                        url: {
                            current: instance._data.url.current,
                            previous: instance._data.url.previous
                        }
                    };
                    // Do the sequenceIn callback
                    if ( jQuery.isFunction( instance.settings.sequenceIn )){
                        instance.settings.sequenceIn.call( this, sequenceInCallback, data );
                    }
                    // No function? Error.
                    else {
                         console.error('Hijax: Setting for "sequenceIn" is not a function. Aborting.');
                    }
                },
                push: function(){
                    var
                        instance = this,
                        url = instance._data.url.target,
                        id = instance._data.pop.id,
                        history_url = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? url+'#' : url; // Fix for iOS;
                    // Push a new entry to history
                    history.pushState({ url: url, id: id + 1 }, document.title, history_url );

                    instance._data.pop.id = id + 1;
                },
                analytics: function(){
                    var ga = ga || undefined; // Detect Google Analytics

                    // Google Analytics
                    if (ga !== undefined){
                        // Send a pageview to Google since we loaded it via AJAX
                        ga('send', 'pageview');
                    }
                }
            },
            _content: {
                update_container: function(){
                    var 
                        instance = this,
                        container = instance.settings.container,
                        response = instance._data.ajax.response,
                        html = jQuery.parseHTML( response ),
                        content = jQuery(html).find(container).html(),
                        $cont = jQuery(container);

                    $cont.html(content);
                },
                update_title: function(){
                    var 
                        instance = this,
                        container = instance.settings.container,
                        response = instance._data.ajax.response,
                        html = jQuery.parseHTML( response ),
                        title = jQuery(html).filter('title').html(); // AJAX data page title

                    document.title = title;
                }
            },


        /**
         * PUBLIC METHODS
         * ==============
         */
        

            data: function(){
                var instance = this;
                return instance._data;
            },

            response: function(){
                var instance = this;
                return instance._data.ajax.response;
            },

            load: function( target_url ){
                var 
                    instance = this,
                    current_url = instance._data.url.current,
                    is_same_page = instance._check.page( current_url, target_url );

                if ( typeof url === 'string' && !is_same_page ){
                    instance._data.url.target = target_url;
                    instance._eventSwitch.call( instance, 'manual' );
                }
            }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        var args = Array.prototype.slice.call( arguments, 1);
        var result = null;
        this.each(function() {
            // Cache the instance of the plugin on this element
            var instance = $.data( this, "plugin_" + pluginName );
            // Does the plugin already exist on this element?
            if ( !instance ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
            // If the plugin already exists on this element, check the string because someone is probably trying to get a public method going.
            else if ( typeof options === 'string' && options.charAt(0) !== '_' && $.isFunction(instance[options]) ){
                result = instance[options].apply(instance, args);
            }
        });
        // Isn't null if we run a public method that returns information.
        // Return the method result instead.
        if ( result !== null ){
            return result;
        }
        // Return the jQuery object
        else {
            return this;
        }
    };
}));