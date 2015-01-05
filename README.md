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
var java   = require('node-pigeon-client').java;

var url = 'EchoService'; // Remote service url.
pigeon.getService(url, function(err, service) {
  if (err) {
    return console.log('Get remote service error: %s.', err);
  }

  service.hello(java.int(123456), function(err, result) {
    if (err) {
      return console.log('Call remote service method error: %s.', err);
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

#### java.null()

Return a wrapped object represents Java primitive `null`.

#### java.int(int)

Return a wrapped object represents Java primitive `int`.

**Arguments**

* int `Number` - JS `Number` to be wrapped to Java primitive `int`.

#### java.long(long)

Return a wrapped object represents Java primitive `long`.

**Arguments**

* long `Number` - JS `Number` to be wrapped to Java primitive `long`.

#### java.double(double)

Return a wrapped object represents Java primitive `double`.

**Arguments**

* double `Number` - JS `Number` to be wrapped to Java primitive `double`.

#### java.boolean(boolean)

Return a wrapped object represents Java primitive `boolean`.

**Arguments**

* boolean `Boolean` - JS `Boolean` to be wrapped to Java primitive `boolean`.

#### java.Integer(integer)

Return a wrapped object represents Java `java.lang.Integer`.

**Arguments**

* integer `Number` - JS `Number` to be wrapped to Java `java.lang.Integer`.

#### java.Long(long)

Return a wrapped object represents Java `java.lang.Long`.

**Arguments**

* long `Number` - JS `Number` to be wrapped to Java `java.lang.Long`.

#### java.Double(double)

Return a wrapped object represents Java `java.lang.Double`.

**Arguments**

* double `Number` - JS `Number` to be wrapped to Java `java.lang.Double`.

#### java.Boolean(boolean)

Return the wrapped object represents Java `java.lang.Boolean`.

**Arguments**

* boolean `Boolean` - JS `Boolean` to be wrapped to Java `java.lang.Boolean`.

#### java.String(string)

Return a wrapped object represents Java `java.lang.String`.

**Arguments**

* string `String` - JS `String` to be wrapped to Java `java.lang.String`.

#### java.Object(object)

Return a wrapped object represents Java `java.lang.Object`.

**Arguments**

* object `Object` - JS `Object` to be wrapped to Java `java.lang.Object`.

#### java.Date(date)

Return a wrapped object represents Java `java.util.Date`.

**Arguments**

* date `Date` - JS `Date` to be wrapped to Java `java.util.Date`.

### Recursive types

#### java.List.BASIC_TYPES(list)

Return a wrapped object represents Java `java.util.List<BASIC_TYPES>`.

**Arguments**

* list `Array` - JS `Array` to be wrapped to Java `java.util.List<BASIC_TYPES>`.

**Example**

```javascript
java.List.int([1, 2, 3]);
java.List.long([1, 2, 3]);
java.List.double([1.0, 2.0]);
java.List.boolean([true, false]);
java.List.Integer([1, 2, 3]);
java.List.Long([1, 2, 3]);
java.List.Double([1.0, 2.0]);
java.List.Boolean([true, false]);
java.List.String(['hello', 'world']);
java.List.Object([{ a: 1 }, { b: 2 }]);
java.List.Date([new Date(1997, 1, 1)]);
```

#### java.Map.BASIC_TYPES(map)

Return a wrapped object represents Java `java.util.Map<String, BASIC_TYPES>`.

**Arguments**

* map `Object` - JS `Object` to be wrapped to Java `java.util.Map<String, BASIC_TYPES>`.

#### java.Class(classname, classvalue)

Return a wrapped object represents Java user-defined class.

**Arguments**

* classname `String` - Name of the user-defined class.
* classvalue `Object` - JS `Object` to be wrapped to Java user-defined class.

**Example**

```java
package com.xxx.demo;
public class Car implements java.io.serializable {
  private String name;
  private int money;
  private ArrayList<Integer> wheelSize = new ArrayList<Integer>();

  public Car() {}
}
```

```javascript
var car = java.Class('com.xxx.demo.Car', {
  name: java.String('car-name'),
  money: java.int(1000),
  wheelSize: java.List.Integer([2, 4, 6, 8]);
});
```








