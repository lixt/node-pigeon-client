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

## Java Types Supported
* null
* int
* long
* double
* boolean
* java.lang.Integer
* java.lang.Long
* java.lang.Double
* java.lang.Boolean
* java.lang.String
* java.lang.Object
* java.util.List
* java.util.Set
* java.util.Date
* array
* user-defined

#### java.null()

**Example**

```java
Object a = null;
```

```javascript
var a = java.null()
```

#### java.int(jsNumber)

**Example**

```java
int a = 123;
```

```javascript
var a = java.int(123);
```

#### java.long(jsNumber)

**Example**

```java
long a = 123;
```

```javascript
var a = java.long(123);
```

#### java.double(jsNumber)

**Example**

```java
double a = 1.23;
```

```javascript
var a = java.double(1.23);
```

#### java.boolean(jsBoolean)

**Example**

```java
boolean a = true;
```

```javascript
var a = java.boolean(true);
```

#### java.Integer(jsNumber)

**Example**

```java
java.lang.Integer a = new java.lang.Integer(123);
```

```javascript
var a = java.Integer(123);
```

#### java.Long(jsNumber)

**Example**

```java
java.lang.Long a = new java.lang.Long(123);
```

```javascript
var a = java.Long(123);
```

#### java.Double(jsNumber)

**Example**

```java
java.lang.Double a = new java.lang.Double(1.23);
```

```javascript
var a = java.Double(1.23);
```

#### java.Boolean(jsBoolean)

**Example**

```java
java.lang.Boolean a = new java.lang.Boolean(true);
```

```javascript
var a = java.Boolean(true);
```

#### java.String(jsString)

**Example**

```java
java.lang.String a = new java.lang.String('123');
```

```javascript
var a = java.String('123');
```

#### java.Object(jsObject)

**Example**

```java
public Class Car {
  private String name;
  private int money;
  private ArrayList<Integer> wheelSize = new ArrayList<Integer>();

  public Car(name, money, wheelSize) {
    this.name = name;
    this.money = money;
    this.wheelSize = wheelSize;
  }
}

java.lang.Object a = new Car("Benz", 123, new ArrayList([1, 2, 3, 4]));
```

```javascript
var a = java.Object({
  name     : java.String('Benz'),
  money    : java.int(123),
  wheelSize: java.List.Integer([1, 2, 3, 4])
});
```

#### java.List.Generics(jsArray)

`Generics` represents the following types:
* int
* long
* double
* boolean
* java.lang.Integer
* java.lang.Long
* java.lang.Double
* java.lang.Boolean
* java.lang.String
* java.lang.Object
* java.util.Date
* user-defined

**Example**

```java
List<String> a = new ArrayList(["a", "b", "c"]);
```

```javascript
var a = java.List.String(['a', 'b', 'c']);
```

#### java.Set.Generics(jsArray)

See java.List.Generics(jsArray).

#### java.array.Generics(jsArray)

See java.List.Generics(jsArray).

#### java.Date(jsDate)

**Example**

```java
java.util.Date a = new java.util.Date();
```

```javascript
var a = java.Date(new Date());
```

#### java.Class(classname, jsObject)

**Example**

```java
package packagename;
public Class Car {
  private String name;
  private int money;
  private ArrayList<Integer> wheelSize = new ArrayList<Integer>();

  public Car(name, money, wheelSize) {
    this.name = name;
    this.money = money;
    this.wheelSize = wheelSize;
  }
}

packagename.Car a = new packagename.Car("Benz", 123, new ArrayList([1, 2, 3, 4]));
```

```javascript
var a = java.Class('packagename.Car', {
  name     : java.String('Benz'),
  money    : java.int(123),
  wheelSize: java.List.Integer([1, 2, 3, 4])
})
```






