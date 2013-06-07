##VRT

Realtime Data Visualizer for Node.js
<p>VRT is an API for displaying and buffering data for node.js.<br />
You can use this API to create your own widgets or use the widgets already included. You write data directly to the widget by posting JSON over http.<br />
The data and configuration can be buffered/stored in memory or other ways as long as there has been written a store module for it , currently only memory is supported. <br />
Currently the best way is to define plots using files, but the goal is to be able to remote control the whole application remotely using the http API.
</p>

## Quick Start

Get RGraph (http://www.rgraph.net/) and unzip to visualizert/deps/rgraph

```bash
# Install dependencies
cd visualizert
npm install

# Run the application and write test data to it.
node standalone.js
node test/test.js

```

##Sample 1
![Screenshot of Sample 1](https://raw.github.com/oddmarthon-lende/vrt/master/screenshots/s1.png "Sample Plot 1")
##Sample 2
![Screenshot of Sample 2](https://raw.github.com/oddmarthon-lende/vrt/master/screenshots/s2.png "Sample Plot 2")
##Sample 3
![Screenshot of Sample 3](https://raw.github.com/oddmarthon-lende/vrt/master/screenshots/s3.png "Sample Plot 3")

##License

(The MIT License)

Copyright (c) 2012-2013 Odd Marthon Lende <oddmarthon.lende@bakerhughes.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
