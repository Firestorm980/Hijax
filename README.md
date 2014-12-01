jQuery Hijax
============

Hijax is a jQuery dependant plugin that uses the JavaScript History API in HTML5 and jQuery's AJAX method to dynamically replace content when new pages are loaded. The plugin works similarly to others such as [jQuery BBQ](https://github.com/cowboy/jquery-bbq) and [History.js](https://github.com/browserstate/history.js/). The difference between those plugins and this are that:

- Hijax does not to alter the URL. No query strings, no hashtags or fragments. 
- Hijax is progressive enhancement only. No backwards compatibility with browsers that don't support the History API.

The goal of Hijax is to simply add the functionality needed in order to easily make a site load pages and switch out content via AJAX while keeping the browser functionality that users expect.

# Getting Started

#### Installation

Load the Hijax script after you load jQuery on your pages and initiate it.

```HTML
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="/path-to-source/jquery.hijax.js"></script>
<script>
	jQuery(document).ready(function($) {
		$.Hijax();
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


#### Page Meta Tags

Hijax wants to make sure you can easily update your page meta tags to match the content that gets loaded in. For this, Hijax looks for a particular structure for meta information. Within your content that will be switched out, add in tags with the "hijax-meta" class (you can also specify your own class in the options). Hijax will search these and switch out any meta tags in your head after the page loads. An example of how to format them is below.

```HTML
<div id="content">
	<!-- for the <title> tag, required -->
	<span class="hijax-meta" data-type="title" data-content="Page Title"></span>
	<!-- for the <meta name="description" content="Page Description" /> tag -->
	<span class="hijax-meta" data-type="name" data-name="description" data-content="Page description"></span>
	<!-- for the <meta property="og:title" content="Page Title" /> tag -->
	<span class="hijax-meta" data-type="property" data-property="og:title" data-content="Page Title"></span>

	<!-- Here is where the actual page content that changes goes -->
</div>
```

The meta tag for your page title is special and required. Hijax will look for this so it can update the document title. All other tags follow a similar pattern. Open Graph and other meta tags can be easily switched by following it.

It's recommended that you also add in a CSS rule to hide these tags or that you contain them in a parent that is hidden.

# Options

These are the options currently available for Hijax.

```Javascript
$.Hijax({
    element: '#siteContent',
    exclude: '[data-hijax="false"]',
    loadingClass: 'hijax-loading',
    metaClass: 'hijax-meta',
    whitelist: ['php','html','htm','']
});
```

| Option       | Type   | Default                 | Description                                                             |
|--------------|--------|-------------------------|-------------------------------------------------------------------------|
| `element`      | string | '#siteContent'          | String of the jQuery element to target                                  |
| `exclude`      | string |  '[data-hijax="false]'  | String of the elements to exclude. Recommend a class or data attribute. |
| `loadingClass` | string | 'hijax-loading'         | Class to toggle on HTML tag when loading takes place.                   |
| `metaClass`    | string | 'hijax-meta'            | Class of the tag the plugin will look for to find meta data.            |
| `whitelist`    | array  | ['php','html','htm',''] | An array of allowed file extensions for loading.                        |
