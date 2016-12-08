# balu-console

A node/express app to manage the data underpinning all the Balu apps. Provides basic data management pages (view, add, update, delete for each class) and usage dashboards and analytics.

## Running locally

You need to be running:
1. redis-server
2. balu-parse-server  

To start the balu-console, npm start

_Note, if you restart the Balu Parse Server you will need to log back in (while the node session is persistent, the Parse session is not)_
