# Beerus

## Installing dependencies

```shell
go get github.com/yuyenews/Beerus v1.1.0
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

```go
func CreateRoute() {
	// post route example
    route.POST("/example/post", func (req *commons.BeeRequest, res *commons.BeeResponse) {
        
        res.SendJson(`{"msg":"SUCCESS"}`)
    })

    // get route example
    route.GET("/example/get", func (req *commons.BeeRequest, res *commons.BeeResponse) {
    
        res.SendJson(`{"msg":"SUCCESS"}`)
    })
}
```

### Using the traditional way of getting parameters

```go
// Get the parameters from the front end, regardless of the request method
req.FormValue("name")

// Get the request header from the front end, regardless of the request method
req.HeaderValue("name")

// Get the file from the front-end, form-data only
req.GetFile("name")

// Get the json string passed as json
req.Json
```

### Extract parameters directly to struct

First, you need to define a struct, The matching rules are as follows

- If the field attribute is set in the tag, it will be matched against the field first, if not then it will be matched against the field name again.
- The supported types are shown in the following examples
- commons.BeeFile type Only works on formdata
- []string Only works with json

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

	TestJsonReception []string
}
```

Then, call the params.ToStruct function to extract all the parameters from req to struct
- The first argument is req
- the second argument is a pointer to struct
- The third argument is the value of struct

When the params.ToStruct function is finished, there will be data in param
```go
param := DemoParam{}

// Extraction parameters, Generally used in scenarios where verification is not required or you want to verify manually
params.ToStruct(req, &param, param)
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

For the above configuration to take effect, one more thing must be done, see the following example and pay attention to the comments

```go
// Call the params.Validation function and perform validation
var result = params.Validation(req, &param, param)
// When the return is not SUCCESS, it means that the authentication did not pass
if result != params.SUCCESS {
    res.SendErrorMsg(1128, result)
    return
}

// There is also a one-step approach, calling the params.ToStructAndValidation function
// Extraction of parameters + data validation in one step
var result = params.ToStructAndValidation(req, &param, param)
if result != params.SUCCESS {
    res.SendErrorMsg(1128, result)
    return
}
```

### Returning data to the client

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
- If it is allowed, it returns SUCCESS, otherwise it returns a prompt message
- As with the route, the CreateInterceptor function needs to be called in the main function

```go
// This function needs to be called in the main function
func CreateInterceptor() {
	route.AddInterceptor("/example/*", loginInterceptorBefore)
}

func loginInterceptorBefore(req *commons.BeeRequest, res *commons.BeeResponse) string {
	res.SetHeader("hello", "hello word").SetHeader("hello2", "word2")

	log.Println("exec interceptor")
	return params.SUCCESS
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
	route.AddWebSocketRoute("/ws/test", onConnection, onMessage, onClose)
	route.AddWebSocketRoute("/ws/test2", onConnection, onMessage, onClose)
}

// In order to save time, only three functions are used below. In practice, you can configure a set of functions for each route

func onConnection(session *params.WebSocketSession, msg string) {
	println(msg + "-------------------------------")
	session.SendString("connection success")
}

func onMessage(session *params.WebSocketSession, msg string) {
	println(msg + "-------------------------------")
	session.SendString("I got the message.")
}

func onClose(session *params.WebSocketSession, msg string) {
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

[Database operations](/beerusdb/index.html)