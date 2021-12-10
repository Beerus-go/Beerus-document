# Beerus

## 安装依赖

```shell
go get github.com/yuyenews/Beerus v1.1.0
```

## 架构组成

- http直接使用的go自带的net/http包，在此基础上扩展了路由的管理方式
- WebSocket 在http的基础上做的扩展，实现了协议升级，消息监听，报文解析，消息发送 等功能
- udp 基于net包开发的，做了一个简单的二次封装

除了上面介绍的这些依赖的底层的技术，还扩展了很多功能，大家可以看下面的文档慢慢了解

## HTTP服务

### 创建路由

- 直接调用route 下面的函数即可，需要什么请求方式 就调用什么请求方式的函数
- 第一个参数是路由的URL，就是前端请求的地址
- 第二个参数是 一个函数，当前端请求这个URL，服务端就会自动执行这个函数

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

### 传统的方式获取参数

```go
// 可以获取到前端传来的参数，不限请求方式
req.FormValue("参数name")

// 可以获取到前端传来的请求头，不限请求方式
req.HeaderValue("请求头name")

// 可以获取前端传来的文件，仅限 form-data
req.GetFile("参数name")

// 可以获取到以json传参的 json字符串
req.Json
```

### 直接将参数提取到struct

首先需要定一个struct，匹配规则如下

- 如果tag里面设置了field属性，会优先根据field去匹配，如果没匹配到 那么会根据字段名再匹配一次
- 支持的类型，都在下面的示例中了
- commons.BeeFile 类型 只对 formdata生效
- []string 只对json生效

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

然后，调用 params.ToStruct函数 将req里面的参数全部提取到struct
- 第一个参数是req
- 第二个参数是 struct的指针
- 第三个参数是 struct的值

当执行完 params.ToStruct函数，param里就会有数据了
```go
param := DemoParam{}

// Extraction parameters, Generally used in scenarios where verification is not required or you want to verify manually
params.ToStruct(req, &param, param)
```

### 启动服务

需要手动调用一下 创建路由的函数

```go
func main() {    
    // Interceptors, routes, etc. Loading of data requires its own calls
    routes.CreateRoute()

    // Listen the service and listen to port 8080
    beerus.ListenHTTP(8080)
}
```

服务启动后，前端即可正常访问，访问方式： http://ip:port/路由地址

### 参数验证

想要实现自动验证参数，必须使用将参数提取到struct的方式来接收参数，验证方法也很简单，看如下示例

- notnull: 设置成true，说明这个参数不可以为空
- reg: 自己写正则进行验证，当不匹配时说明没通过验证
- max: 字段的最大取值
- min: 字段的最小取值
- msg: 当验证没通过时，返回的提示消息
- 其中: notnull，reg 仅对 string有效，max，min 仅对数字类型的字段有效
- routes: 用来设置 这个验证对那些路由有效，多个用逗号分割，支持*通配符

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

要让上面的配置生效，必须再做一件事，看如下示例，注意看注释

```go
// 调用params.Validation 函数进行验证
var result = params.Validation(req, &param, param)
// 当返回的不是SUCCESS，就说明验证没通过
if result != params.SUCCESS {
    res.SendErrorMsg(1128, result)
    return
}

// 还有一步到位的方法，调用params.ToStructAndValidation函数
// 提取参数+数据验证，一步到位
var result = params.ToStructAndValidation(req, &param, param)
if result != params.SUCCESS {
    res.SendErrorMsg(1128, result)
    return
}
```

### 响应数据

```go
// 返回json给客户端
res.SendJson("json")

// 返回纯文本给客户端
res.SendText("text")

// 返回html页面给客户端
res.SendHtml("html text")

// 返回文件流给客户端
res.SendStream("filename", []byte)

// 返回其他自定义content-type的数据给客户端
res.SendData("data")
```

### 拦截器

- 创建拦截器，跟创建路由特别像，直接调用 route.AddInterceptor函数即可
- 第一个参数是 要拦截的路由路径，支持 * 通配符
- 第二个参数是一个函数，里面可以实现拦截逻辑
- 如果予以放行，直接返回SUCCESS，否则直接返回 提示信息
- 跟路由一样，需要在main函数里调用一下 CreateInterceptor 函数

```go
// 需要在main函数里调用一下这个函数
func CreateInterceptor() {
	route.AddInterceptor("/example/*", loginInterceptorBefore)
}

func loginInterceptorBefore(req *commons.BeeRequest, res *commons.BeeResponse) string {
	res.SetHeader("hello", "hello word").SetHeader("hello2", "word2")

	log.Println("exec interceptor")
	return params.SUCCESS
}
```

### 会话管理

需要先创建一个session

- Secret: 加密秘钥，长度必须=32
- InitializationVector: 初始化常量，长度必须=16
- Timeout: 有效时长，单位毫秒
```go
session := new(commons.BeeSession)
session.Secret = "12345678abcdefgh09876543alnkdjfh"
session.InitializationVector = "12345678qwertyui"
session.Timeout = 3000
```

然后可以用session创建token
- 将token给前端，前端每次请求都带回来即可
```go
demo := Demo{}
demo.Name = "Beerus"
demo.Age = 18
demo.Height = 180

token, err := session.CreateToken(demo)
```

将token还原成原来的数据

```go
demo2 := Demo{}
err = session.RestoreToken(token, &demo2)
```

[原理介绍](session.md)

## WebSocket 服务

### 创建路由

- 这里为了偷懒只用了三个函数，实际操作中可以 每个路由对应三个不同的函数
- 第一个参数session: 里面就两个元素，一个ID，一个 SendString，Send 函数
- 第二个参数msg: 是客户端发来的消息，直接用即可
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

### 启动服务

需要手动调用一下 创建路由的函数，启动的服务依然是HTTP服务

```go
func main() {    
    // Interceptors, routes, etc. Loading of data requires its own calls
    routes.CreateWebSocketRoute()

    // Listen the service and listen to port 8080
    beerus.ListenHTTP(8080)
}
```

启动后 前端就可以正常的发起WebSocket通讯了，连接方式: ws://ip:port/路由路径

## UDP服务

### 启动服务

- 不存在路由的概念，只有一个函数用来接收数据
- 第一个参数就是 这个接收数据的函数
- 第二个参数是结束符，用来标识数据读到哪 才算一个消息读完了
- 第三个参数就是端口号

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

接收到数据以后，直接转成string即可

## 数据库操作

[点击此处->跳转到数据库操作](/beerusdb/index.html)