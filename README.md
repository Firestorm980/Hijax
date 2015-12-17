jQuery Hijax
============

Hijax is a jQuery dependant plugin that uses the JavaScript History API in HTML5 and jQuery's AJAX method to dynamically replace content when new pages are loaded. The plugin works similarly to others such as [jQuery BBQ](https://github.com/cowboy/jquery-bbq) and [History.js](https://github.com/browserstate/history.js/). The difference between those plugins and this are that:

- Hijax does not to alter the URL for its own use. No query strings, no hashtags or fragments are added.
- Hijax is progressive enhancement only. No backwards compatibility with browsers that don't support the History API.

The goal of Hijax is to simply add the functionality needed in order to easily make a site load pages and switch out content via AJAX while keeping the browser functionality that users expect. It also provides easy access to animating between those states.

# Getting Started

#### Installation

Load the Hijax script after you load jQuery on your pages and initiate it.

```HTML
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="/path-to-source/jquery.hijax.min.js"></script>
<script>
	jQuery(document).ready(function($) {
		
		jQuery(document).hijax();

	});
</script>
```

And that's all you need! While the basic use of the script is fairly simple, there are a lot of things that you may need to do to make sure it works as intended. The biggest of which are:

- Make sure the script loads on all of your pages.
- In your template for your pages, make sure there is a consistent area where you'll be switching out content.


#### HTML

Hijax switches content on one page for content in another page from the same area. So, your content on every page should be contained within the same content tag in the page structure. As an example, most sites follow a structure like this:

```HTML
<div id="header"><!-- Navigation, logo, search usually go in here somewhere --></div>
<div id="content">
	<!-- Here is where the actual page content that changes goes -->
</div>
<div id="footer"><!-- Footer navigation, copyrights, addresses, etc. --></div>
```

When loading a new page, usually only the content within #content changes from page to page. This is the tag you would target for Hijax. The default ID Hijax will target is #siteContent (this can be changed in the options).

# Options
These are the options currently available for Hijax.

| Option       | Type   | Default                 | Description                                                             |
|--------------|--------|-------------------------|-------------------------------------------------------------------------|
| `element`      | string | '#siteContent'          | jQuery selector of the element to target. Should be an ID.                |
| `exclude`      | string |  '[data-hijax="false]'  | jQuery selector of link elements to exclude. Recommend a class or data attribute. |
| `sequenceIn`   | function | `function( callback, data ){ callback(); }` | Special function for adding your own animations. The callback argument and function call is required. |
| `sequenceOut`   | function | `function( callback, data ){ callback(); }` | Special function for adding your own animations. The callback argument and function call is required. |
| `smoothScroll` | boolean | false | Makes the window/container animate scroll back to the top when going in between pages.* |
| `smoothScrollDuration` | number | 750 | Time in milliseconds that the scroll animation should take. |
| `smoothScrollContainer` | string | '' | A selector of the element to use for scrolling. Overrides the browser's default scrolling element (html or body, depending on browser). |
| `scrollToTop` | boolean | false | Whether to scroll the window to the top or not on an event that would cause loading. This overrides `smoothScroll` if it is false. |
| `scrollToHash` | boolean | false | Whether to scroll to hash changes automatically. Uses the same duration as `smoothScrollDuration` | 

You can use them like the example below: 

```Javascript
var Hijax = $.Hijax({
    element: '#my-element',
    exclude: '.link-exclude'
    ...
});
```
* Currently, `smoothScroll` only works for links in the document. It doesn't animate for `popstate` events. Instead, the plugin falls back to just snapping the window back to the top.


#### Animating Pages In / Out
By default, these functions simply proceed to the next phase of loading. However, they are supplied for use that will allow a developer to have multiple functions activate and finish before the actual AJAX load occurs. This is mainly so that you can add your own custom animations to have smooth transitions between pages (but it could be used/abused for other purposes). An example of this is below:

```Javascript
var Hijax = $.Hijax({
	sequenceOut: function(callback, data){
		$('#element').animate({ opacity: 0 }, { duration: 1000, complete: callback });
	},
	sequenceIn: function(callback, data){
		$('#element').animate({ opacity: 1 }, { duration: 1000, complete: callback });	
	}
});
```

The callback argument and the actual call of the callback are required for the functions to work properly and for an actual page load to occur. The data argument has an object that can help you make decisions on what animation is appropriate. It contains:

| Key        | Type | Description   |
|-------------|--------|---|
| `url`       | object | Lets you know either the previous/next URL and the current URL, depending on the sequence. |
| `element`   | DOM element | The element that made the request happen. A link (`<a>`) or the `window` (for forward/back). Manual `load` requests are shown as coming from `window`. (sequenceOut only) |
| `direction` | string | Only happens on a `popstate` event (forward/back buttons are clicked). Lets you know which button was clicked. (sequenceOut only)| 

#### Events
Events have replaced the old loading callbacks. Those callbacks didn't pass any information and weren't used much in testing. In addition, all events are now namespaced to Hijax, which should make them easier to unbind, if needed.

| Event        | Description   |
|--------------|--------|
| `beforeload.hijax`   | Happens just before AJAX call. |
| `afterload.hijax`    | Happens when the AJAX call has successfully completed. |
| `completeload.hijax` | Happens after the `sequenceIn` callback has completed. |
| `progress.hijax`     | Happens while the AJAX call is occuring. Useful for a possible loading bar. |

#### Methods
There are a couple methods for use with Hijax that should help you out in very specific circumstances.

| Method | Example | Description | 
|--------|-------------|---------|
| `response` | `jQuery(document).hijax('response')` | Returns the last response from the AJAX call that Hijax used. This should be the source code of the last page loaded, if the call succeeded. Useful if you need to extract more data out of it (such as classes, meta information, etc.) that is outside of the content area. |
| `load` | `jQuery(document).hijax('load', 'someurl')` | Manually load a page. You must supply a URL string as an argument. If you specify a URL that is external, it is simply a convenience function for `window.location.href`. The page will not load if it is the same as the current one. |


# Additional Information

#### Behavior with Links

Hijax is meant to take over links in your page by default. It targets all the links except those specified in the `exclude` option. However, Hijax will also automatically ignore certain links if:
- It has a hashtag for the current page (in which case the browser should do its default behavior)
- It has a `target` attribute that points to: "_blank", "_parent", or "_top"
- It has a `download` attribute (Part of HTML5 spec. The browser should prompt for download - if supported.)
- It is an external link (By comparing the host/domain of the current URL and the target, should do default behavior)
- It is determined to be the same as the current page (in which case loading is redundant)

This should get rid of most undesired behavior with links and UX.

#### Tested On ####

Tests for version 2 have not been completed, but it is assumed to work where Hijax used to:

- OSX (Chrome 39, Safari 8, Firefox 34)
- iOS 8 (Safari)
- Android 4.1 (Chrome 39)

Note: iOS was tested in simulator.

#### Version History ####

##### 0.6.1
- Added `scrollToHash`
- Fixed multiple issues with popstate changes and loading on the same page
- Fixed issues with page loads when there was only a hash changed
- Added animated scrolling for hashes

##### 0.6.0
A complete refactor of the plugin has been made to better organize, improve performance and make future updates easier. There are some additional checks, methods, and options.

- Added `response` method
- Changed loading callbacks to events
- Namespaced events
- Added additional data to callbacks
- Fixed popstate events (for the most part)
- Removed `whitelist` option. Devs should instead use the `exclude` option and more semantic attributes with `target` and `download`
- Simplification of `sequenceIn` and `sequenceOut`
- Added `smoothScrollContainer` option
- Removed meta tag loading (you can do this in an event callback or a time of your choosing with the `response` method)
- Removed loading class (you can add/remove one with the event callbacks)
- Additional page and domain checking for similarities

---

##### 0.5.3
Moved `beforeLoad` to a more appropriate spot. The order of events is now: `sequenceOut`, `beforeLoad`, `afterLoad`, `sequenceIn`, `loadComplete`.

##### 0.5.2
Additional callback arguments for additional data. Some variable cleanup.

##### 0.5.1
Additional code for hash URLs, general code cleanup, additional check for public load method, added some smooth scrolling.

##### 0.5
Added in check to prevent abuse of the forward back buttons if pushed fast, added in a new function to compare URLs for better loading of pages, added support for hash URLs.

##### 0.4.1
Added two special functions with callbacks so people can add advanced transitions to their page loading. Fixes the issue of stopping the AJAX load until someone is ready to have it happen. 

##### 0.4
Fixed Safari window pop bug.

##### 0.3

Updated the way meta information is parsed and handled to make it more modular and standardized. Also fixed bugs with progress and exclusion list. Added some additional options.

##### 0.2

Added comments to source.

Fixed:
- Issue with pretty URLs not working properly.
- Google Analytics erroring out
- Content targeting not working.

##### 0.1 

Initial build.
