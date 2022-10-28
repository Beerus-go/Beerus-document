# Beerus

## Installing dependencies

```shell
go get github.com/Beerus-go/Beerus@v1.1.9
```

## The underlying technology used

- http uses the net/http package that comes with go, and extends the way routes are managed on top of it.
- WebSocket is an extension of http, the framework itself implements the protocol upgrade, message listening, message parsing, message sending and other functions
- udp is developed based on the net package, with a simple secondary wrapper

In addition to the underlying technologies described above, there are many other extensions, which you can learn about by reading the documentation below

## HTTP Service

### Create Route

- Simply call the functions below the route, choosing the most appropriate function for the type of request you need
- The first parameter is the URL of the route, which is the address requested by the front-end
- The second parameter is a function that will be automatically executed by the server when the front-end requests this URL
- The second parameter (function) must have a return value, the supported types are: struct, map, array, beerus will automatically convert the return value into a Json response to the front end, here for the sake of demonstration convenience to use the map
- If you don't like this type of response, or you don't intend to use JSON to interact with the front-end in your project, then you can turn off JSON mode, which will be discussed later

```go
func CreateRoute() {
	// post route example
    route.POST("/example/post", func (req commons.BeeRequest, res commons.BeeResponse) map[string]string {
        
        msg := make(map[string]string)
		msg["msg"] = "success"
		return param
    })

    // get route example
    route.GET("/example/get", func (req commons.BeeRequest, res commons.BeeResponse) map[string]string{
    
        msg := make(map[string]string)
		msg["msg"] = "success"
		return param
    })
}
```

### Using the traditional way of getting parameters

```go
// Get the parameters from the front end, regardless of the request method
req.FormValue("param name")

// Get multiple parameters with the same name, return an array, only works for x-www-form-urlencoded, GET requests, FormData can only get one value
req.FormValues("param name")

// Get the request header from the front end, regardless of the request method
req.HeaderValue("header name")

// Get the file from the front-end, form-data only
req.GetFile("param name")

// Get the json string passed as json
req.Json
```

### Extract parameters directly to struct

First, you need to define a struct, The matching rules are as follows

- If the field attribute is set in the tag, it will be matched against the field first, if not then it will be matched against the field name again.
- The supported types are shown in the following examples
- commons.BeeFile type Only works on formdata
- []string Only available for x-www-form-urlencoded, JSON, GET requests, FormData can only get one value.

```go
// DemoParam If you have a struct like this, and you want to put all the parameters from the request into this struct
type DemoParam struct {
	// You can customize any field
	// the name of the field must be exactly the same as the name of the requested parameter, and is case-sensitive
	TestStringReception    string  `field:"testStringReception"`
	TestIntReception       int     `field:"testIntReception"`
	TestInt64Reception     int64   
	TestUintReception      uint    
	TestUint32Reception    uint32  
	TestUint64Reception    uint64  
	TestFloatReception     float32 
	TestStringRegReception string  
	TestBoolReception      bool

	TestBeeFileReception   commons.BeeFile

	TestReception []string
}
```

Then, use this struct as a parameter to the routing function

- The number of parameters of the routing function is unlimited, you can set only one struct or multiple structs, or you can mix them with request and response as in the example

```go
// Note the first parameter
route.POST("/example/post", func(param DemoParam, req commons.BeeRequest, res commons.BeeResponse) map[string]string {

	println(param.TestStringReception)
	println(param.TestIntReception)
	println(param.TestInt64Reception)
	println(param.TestFloatReception)
	println(param.TestUintReception)
	println(param.TestUint64Reception)
	println(param.TestBoolReception)

	msg := make(map[string]string)
	msg["msg"] = "success"
	return param
})
```

Can also be extracted manually, call the params.ToStruct function to extract all the parameters from req to struct
- The first argument is req
- the second argument is a pointer to struct

When the params.ToStruct function is finished, there will be data in param
```go
param := DemoParam{}

// Extraction parameters, Generally used in scenarios where verification is not required or you want to verify manually
params.ToStruct(req, &param)
```

### Launching services

You need to call the route creation function manually

```go
func main() {    
    // Interceptors, routes, etc. Loading of data requires its own calls
    routes.CreateRoute()

    // Listen the service and listen to port 8080
    beerus.ListenHTTP(8080)
}
```

Once the service is started, it can be accessed normally, by http://ip:port/routePath

### Parameter validation

To achieve automatic parameter validation, the parameters must first be extracted to struct, and the validation method is simple, see the following example

- notnull: Set to true to indicate that this parameter must not be empty
- reg: Write your own regular expression that fails to validate when it does not match.
- max: Maximum value of the field
- min: Minimum value of the field
- msg: The message returned when the verification does not pass
- notnull, reg valid only for string, max, min valid only for numeric fields
- routes: Used to set which routes this validation is valid for, multiple comma-separated, supports * wildcards

```go
type DemoParam struct {
	// You can customize any field
	// the name of the field must be exactly the same as the name of the requested parameter, and is case-sensitive
	TestStringReception    string  `notnull:"true" msg:"TestStringReception Cannot be empty" routes:"/example/put"`
	TestIntReception       int     `max:"123" min:"32" msg:"TestIntReception The value range must be between 32 - 123" routes:"/example/post"`
	TestInt64Reception     int64   `max:"123" min:"32" msg:"TestInt64Reception The value range must be between 32 - 123"`
	TestUintReception      uint    `max:"123" min:"32" msg:"TestUintReception The value range must be between 32 - 123"`
	TestUint32Reception    uint32  `max:"123" min:"32" msg:"TTestUint32Reception The value range must be between 32 - 123"`
	TestUint64Reception    uint64  `max:"123" min:"32" msg:"TestUint64Reception The value range must be between 32 - 123"`
	TestFloatReception     float32 `max:"123" min:"32" msg:"TestFloatReception The value range must be between 32 - 123"`
	TestStringRegReception string  `reg:"^[a-z]+$" msg:"TestStringRegReception Does not meet the regular"`
}
```

Once the above has been configured, parameter validation will automatically take effect and a json message will be automatically returned to the front-end if the validation does not pass

```json
{"code":1128, "msg":"The msg you set in the validation tag"}
```

### Exception handling mechanism

- In development, we often give the front-end some error messages, according to the conventional practice, we need to manually return the message in the if, but this is not very elegant way to write
- We can use error in go to achieve this
- Set a second return value for the routing function, which must be of type error

```go
// post route example
route.POST("/example/post", func (req commons.BeeRequest, res commons.BeeResponse) (map[string]string, error) {

	if xxx {
		return nil, errors.New("The error message you want to return to the front-end")
	}
	
	msg := make(map[string]string)
	msg["msg"] = "success"
	return param, nil
})
```

### File download

```go
// Example of file download
route.GET("/downLoad/file", func(req commons.BeeRequest, res commons.BeeResponse) string {
	file, err := ioutil.ReadFile("/Users/yeyu/Downloads/goland-2021.2.4.dmg")
	if err == nil {

	}
	// Writing files to the client
	res.SendStream("goland.dmg", file)

	// Just return this constant
	return web.Download
})
```

### Turn off JSON mode

It's easy to turn off, just add the following code before creating the route

```go
route.JsonMode = false
```

Once JSON mode is turned off, automatic validation will not work as beerus cannot predict what type of data you intend to return to the front end, so the developer will need to manually call a function to validate

- In your route, add the following code to implement parameter validation

```go
// Validation function is called with the second parameter being a pointer to the struct from which the request parameters were extracted
var result = params.Validation(req, &param)
// When the return is not SUCCESS, it means that the validation did not pass
if result != params.SUCCESS {
    // Here you can choose the appropriate SendXXX function yourself
    res.SendErrorMsg(1128, result)
    return
}
```

- The routing function cannot have a return value and must call the SendXXX function inside res to respond to the front-end data

```go
// post route example
route.POST("/example/post", func (req commons.BeeRequest, res commons.BeeResponse) {

	res.SendText("text")
})
```

- Returning data to the client

```go
// Return json to client
res.SendJson("json")

// Return text to client
res.SendText("text")

// Return html to client
res.SendHtml("html text")

// Returning files to the client
res.SendStream("filename", []byte)

// Return other custom content-type data to the client
res.SendData("data")
```

### Interceptors

- Creating an interceptor is particularly similar to creating a route, just call the route.AddInterceptor function
- The first parameter is the path of the route to be intercepted and supports * wildcards
- The second parameter is a function that implements the interceptor logic
- Returns true directly if it passes, false otherwise

Points to note:

***If you return false in the interceptor, it's important to call the res.SendXXX function to give the front-end a response, otherwise the request will block until it times out, with a performance impact***

```go
// This function needs to be called in the main function
func CreateInterceptor() {
	route.AddInterceptor("/example/*", loginInterceptorBefore)
}

func loginInterceptorBefore(req *commons.BeeRequest, res *commons.BeeResponse) bool {
	res.SetHeader("hello", "hello word").SetHeader("hello2", "word2")

	log.Println("exec interceptor")
	return true
}
```

### Session management

You need to create a session first

- Secret: encryption key, length must be = 32
- InitializationVector: initialization constant, length must be = 16
- Timeout: duration of the session, in milliseconds

```go
session := new(commons.BeeSession)
session.Secret = "12345678abcdefgh09876543alnkdjfh"
session.InitializationVector = "12345678qwertyui"
session.Timeout = 3000
```

Then you can use the session to create a token
- Give the token to the front-end, which will bring it back with each request
```go
demo := Demo{}
demo.Name = "Beerus"
demo.Age = 18
demo.Height = 180

token, err := session.CreateToken(demo)
```

Restore the token to its original data

```go
demo2 := Demo{}
err = session.RestoreToken(token, &demo2)
```

[Details](session.md)

## WebSocket Service

### Create route

- Only three functions are used here, in practice it is possible to use three different functions for each route
- The first parameter session: there are just two elements in it, an ID and a SendString, Send function
- The second parameter msg: is the message sent by the client, which can be used directly

```go
// CreateWebSocketRoute Creating websocket routes
func CreateWebSocketRoute() {
	wroute.AddWebSocketRoute("/ws/test", onConnection, onMessage, onClose)
	wroute.AddWebSocketRoute("/ws/test2", onConnection, onMessage, onClose)
}

// In order to save time, only three functions are used below. In practice, you can configure a set of functions for each route

func onConnection(session *wparams.WebSocketSession, msg string) {
	println(msg + "-------------------------------")
	session.SendString("connection success")
}

func onMessage(session *wparams.WebSocketSession, msg string) {
	println(msg + "-------------------------------")
	session.SendString("I got the message.")
}

func onClose(session *wparams.WebSocketSession, msg string) {
	println(msg + "-------------------------------")
}
```

### Launching services

You need to call the route creation function manually, the service started is still an HTTP service

```go
func main() {    
    // Interceptors, routes, etc. Loading of data requires its own calls
    routes.CreateWebSocketRoute()

    // Listen the service and listen to port 8080
    beerus.ListenHTTP(8080)
}
```

Once started, you can launch WebSocket communication normally, with the connection method: ws://ip:port/route path

## UDP Service

### Launching services

- There is no concept of routing, only a function to receive data
- The first parameter is the handler
- The second parameter is the data separator
- The third parameter is the port

```go
func main() {

	// Listening to a UDP service
	// The first parameter is the handler
	// The second parameter is the data separator
	// The third parameter is the port
	beerus.ListenUDP(updHandler, []byte("|"), 8080)

}

func updHandler(data []byte) {
	// data is the data you received
	println(util.BytesToString(data))
}
```

Once the data is received, it can be converted directly to string

## Database operations

[Click here -> Database operations](/beerusdb/index.html)