##VRT

Realtime Data Visualizer for Node.js
<p>VRT + D3 (Data-Driven Documents) is an API for creating visualizations and buffering the data on the server.<br />
You can use this API to create your own widgets or use the widgets already included. You write data directly to the widget by posting JSON over http.<br />
The data and configuration can be buffered/stored in memory or other ways as long as there has been written a store module for it , currently only memory is supported. <br />
Currently the best way is to define plots using files, but the goal is to be able to remote control the whole application remotely using the http API.
</p>
<p>
It has been tested in Chrome and Safari. Probably works in IE10 also...
</p>

## Quick Start

```bash
# Install dependencies
cd visualizert
npm install

# Run the application and write test data to it.
node standalone.js
node test/test.js

```

##License

Copyright 2013 Odd Marthon Lende

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

Cubism - http://github.com/square/cubism
Copyright 2012 Square, Inc.

D3 - http://github.com/mbostock/d3
Copyright (c) 2013, Michael Bostock
All rights reserved.