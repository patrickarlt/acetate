# Install it!

1. clone down this repo
2. `npm install`
3. `node bin/press server`
4. visit [http://localhost:3000](http://localhost:3000)

# Todo

* Docs
* Tests
* Error Handling
* Logging
* Collections
* Progressive Rebuild(watch/server)?
* Grunt Task!
* Docs
* Code Highlighting

# Notes

#### Server vs. Watch

Need to think more about how to work with press in development. Currently the process of clean and rebuild on everychange is unmaintainable as sites scale up. There are 2 ways to solve this...

1. Create a web server that will intercept requests and reload and render the appropriate pages. This is nice because pages are always up to date on refresh even if the changes occur in partials or layouts. The downside is that users have to use the server provided by press when there might be a good reason not too, like integrating into another app.
2. Create a task that will watch files for changes and rebuild the resources on the fly. This is nice because it is simple but if changes are made in another file they will not trickle down to the main page so it will appear to not be rebuilt when in fact it should be.
3. Could the watch task be optimized by using a "dirty" flag to let the build process know if a file needs to be rerendered? this might be the best of both worlds.
4. Could `grunt newer` solve this? Maybe.

