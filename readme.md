
# Sex Panther

Static router (aka "Sex Panther") handles the serving of all static files for FlexSites.

## View rendering

There are 3 types of delimiters involved in static HTML rendering:

### 1. Compile

__delimiter__: `<< >>`

Handled by gulp during build process

### 2. Server-side

__delimiter__: `[[ ]]`

Handled by _Sex Panther_ and hogan during view serving. Rerender for every request

### 3. Client-side

__delimiter__: `{{ }}`

Handled by client-side code (Angular, React, Backbone, Polymer, etc.)

<hr>

## Dynamic Data

The following base paths are considered "dynamic", and should not be used in regular routing:

  * `/events`
  * `/entertainers`
  * `/venues`
  * `/posts`
  * `/media`

These routes pull down data for their respective modals. They will be available in the server-side rendering step.

## Clearing template cache

By default, the template generated from the `index.html` file for a site will be cache for subsequent requests.
This would normally require a server restart to see updates but we've added a convenient helper URL to clear a template
for a specific site:

> http://YOUR-SITE.com/sex-panther

If you really need the path `/sex-panther` to be available, we probably should talk about the content of your site.
