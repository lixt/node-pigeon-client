# node-pigeon-client
This module is designed to resemble the Pigeon Java client API but with tweaks to follow the convention of Node.js modules. Develops that are familiar with the Pigeon Java client would be able to pick it up quickly.

This module has been tested to work with Pigeon version 2.3.10.

## Getting Started
1. Install node.
2. Install node-pigeon-client using npm:

``` bash
$ npm install node-pigeon-client --save
```

3. An environment configuration file `/data/webapps/appenv` should be provided in the given format

```
deployenv = qa             # Environment.
zkserver  = 127.0.0.1:2181 # Zookeeper host and port.
```

## Example
Remote service "EchoService":

```java
public class EchoService {
  public int hello(int a) {
    return a;
  }
}
```

Call the remote service "EchoService":

```javascript
var pigeon = require('node-pigeon-client');

var url = 'EchoService'; // Remote service url.
pigeon.getService(url, function(err, service) {
  if (err) {
    return console.log('Get remote service error: %j.', err);
  }

  service.hello(pigeon.java.int(123456), function(err, result) {
    if (err) {
      return console.log('Call remote service method error: %j.', err);
    }

    // Output 123456 to the console.
    console.log('Remote service method result: %d.', result);
  });
});
```





## Configuration
Before you can use the Node.js Pigeon client, you should
