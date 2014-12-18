##VRT

Realtime Data Visualizer for Node.js
<p>VRT + D3 (Data-Driven Documents) is a framework for creating visualizations and buffering the data on the server.<br />
You can use the API to create your own widgets or use the widgets already included. You write data directly to the widget by posting JSON 
over http or you can create schemas and write data using paths. The data is then routed to the "subscribing" widgets. Being able to write 
data directly to a widget (also from the browser) gives the ability to make widgets that are interactive and you can modify the data using 
the api. The API in the browser is pretty much the same as on the server. <br />
The data and configuration can be buffered/stored in memory or other ways as long as there has been written a store module for it , currently are modules for MongoDB and Memory. <br />
Currently the best way is to define plots using files, but the goal is to be able to remote control the whole application remotely using the http API.
</p>
<p>
It has been tested in Chrome and Safari. Probably works in IE10 also...
</p>

## Quick Start

```bash
# Install dependencies
cd vrt
npm install

# Run the application and write test data to it. "--initialize" required only at first boot to load configuration files from disk if using a storage
# module other than memory

node standalone.js --initialize
node test/test.js

```
##License

VRT

Copyright (c) Odd Marthon Lende, 2013
All rights reserved.

====

This license applies to all parts of VRT that are not externally
maintained libraries. The externally maintained libraries used by VRT are:

D3     - http://github.com/mbostock/d3
jQuery - https://github.com/jquery/jquery
W2UI   - https://github.com/vitmalina/w2ui
