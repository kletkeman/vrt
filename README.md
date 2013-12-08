##VRT

Realtime Data Visualizer for Node.js
<p>VRT + D3 (Data-Driven Documents) is a framework for creating visualizations and buffering the data on the server.<br />
You can use the API to create your own widgets or use the widgets already included. You write data directly to the widget by posting JSON over http or you can create schemas and write data using paths. The data is then routed to the "subscribing" widgets. Being able to write data directly to a widget (also from the browser) gives the ability to make widgets that are interactive. Take the Messages widget for example. This widget displays a grid of squares, red square means that the message is unread. When you click on that square it updates the data and marks it as read. The API in the browser is pretty much the same as on the server. <br />
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

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. The names Baker Hughes Incorporated, Odd Marthon Lende nor the names of its contributors may not be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

====

This license applies to all parts of VRT that are not externally
maintained libraries. The externally maintained libraries used by VRT are:

Cubism - http://github.com/square/cubism
D3     - http://github.com/mbostock/d3
jQuery - https://github.com/jquery/jquery
W2UI   - https://github.com/vitmalina/w2ui

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/oddmarthon-lende/vrt/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

