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

## Documentation

#### getService(url, [options], callback)

Retrieve the service of the given url.

**Arguments**

* url `String` - The service url.

* options `Object` - An object to set the service retrive options. Currently
  available options are:

  * `zkserver`: Comma seperated `host:port` pairs, each represents a Zookeeper
  server. e.g.

  ```javascript
  '127.0.0.1:2181, 127.0.0.1:2182, 127.0.0.1:2183'
  ```

  * `timeout` Remote service method call timeout in milliseconds.
  * `protocol` Protocol of remote service method call.
  * `serialize` Serailization of network transmission.
  * `timeoutRetry` Whether to retry when timeout.
  * `retries` The number of retry attempts for timeout.
  * `loadBalance` Type of remote service server load balance.

  Default options:

  ```javascript
  {
    zkserver    : '127.0.0.1:2181' // Can also set in '/data/webapps/appenv'.
    timeout     : 1000,
    protocol    : 'http'           // http.
    serialize   : 'hessian'        // hessian.
    timeoutRetry: true             // true/false
    retries     : 1
    loadBalance : 'autoaware'      // autoaware/roundRobin/random
  }
  ```

* callback(err, service) `Function` - The callback function. The `service` can
  be regarded as an object containing all the service methods that can be
  called.

#### java.int(value)

Return the wrapped object represents Java `int`.

**Arguments**

* value `Number` - JS `Number` to be wrapped to Java `int`.

#### java.long(value)

Return the wrapped object represents Java `long`.

**Arguments**

* value `Number` - JS `Number` to be wrapped to Java `long`.

#### java.double(value)

Return the wrapped object represents Java `double`.

* value `Number` - JS `Number` to be wrapped to Java `double`.

#### java.boolean(value)

Return the wrapped object represents Java `boolean`.

* value `Boolean` - JS `Boolean` to be wrapped to Java `boolean`.





