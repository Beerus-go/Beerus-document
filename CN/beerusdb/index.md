# Beerus-DB

## 初始化配置

### 安装依赖

```shell
go get github.com/yuyenews/Beerus-DB

go get github.com/go-sql-driver/mysql
```

### 配置数据源

```go
dbPool := new(pool.DbPool)
dbPool.InitialSize = 1
dbPool.ExpandSize = 1
dbPool.MaxOpen = 1
dbPool.MinOpen = 0
dbPool.TestConn = true
dbPool.Url = "root:123456@(127.0.0.1:3306)/xt-manager"

db.AddDataSource("dbPoolTest", dbPool)
```

### 配置多个数据源

只需要重复上面步骤即可

```go
dbPool := new(pool.DbPool)
dbPool.InitialSize = 1
dbPool.ExpandSize = 1
dbPool.MaxOpen = 1
dbPool.MinOpen = 0
dbPool.TestConn = true
dbPool.Url = "root:123456@(127.0.0.1:3306)/test"

db.AddDataSource("dbPoolTest", dbPool)

dbPool2 := new(pool.DbPool)
dbPool2.InitialSize = 1
dbPool2.ExpandSize = 1
dbPool2.MaxOpen = 1
dbPool2.MinOpen = 0
dbPool.TestConn = true
dbPool2.Url = "root:123456@(127.0.0.1:3306)/test"

db.AddDataSource("dbPoolTest2", dbPool2)
```

这段代码只需要在项目启动时执行一次即可

### 字段解释

- InitialSize: 初始化连接数量
- ExpandSize: 连接用完后，每次扩展的连接数量（当连接池里的连接数已经达到最大连接数以后，这个配置将失效）
- MaxOpen: 最大连接数
- MinOpen: 最小连接数
- Url: 数据库连接字符串
- TestConn: 测试连接是否有效，一旦设置为true，如果获取到的链接已经失效，会重新获取新的连接，失败3次将会自动放弃

## 单表操作

### 根据条件查询单表数据

```go
conditions := make([]*entity.Condition,0)
conditions = append(conditions, &entity.Condition{Key:"id > ?", Val: 10})
conditions = append(conditions, &entity.Condition{Key:"and user_name = ?", Val: "bee"})
conditions = append(conditions, &entity.Condition{Key: "order by create_time desc", Val: entity.NotWhere})

resultMap, err := operation.GetDBTemplate("Data source name").Select("table name", conditions)
```

### 根据条件修改单表数据

```go
// 条件设定
conditions := make([]*entity.Condition,0)
conditions = append(conditions, &entity.Condition{Key:"id = ?", Val: 1})

// 要修改的数据设定
data := ResultStruct{UserName: "TestNoSqlUpdate"}

// 执行修改操作
result, err := operation.GetDBTemplate("Data source name").Update("table name", dbutil.StructToMapIgnore(&data, data, true),conditions)
```

### 根据条件删除单表数据

```go
// 设定删除条件
conditions := make([]*entity.Condition,0)
conditions = append(conditions, &entity.Condition{Key:"id = ?", Val: 2})

// 执行删除操作
_, err := operation.GetDBTemplate("Data source name").Delete("table name", conditions)
```

### 插入一条数据

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
    UpdateTime: "2021-12-09 13:50:00",
}

result, err := operation.GetDBTemplate("Data source name").Insert("table name", dbutil.StructToMapIgnore(&data, data, true))
```

### 条件设定器说明

内部结构如下

```go
type Condition struct {
	Key string
	Val interface{}
}
```

- Key 设定条件，可以是where，order by，group by，等任意查询条件
- Val 设定值，如果Key里面是where，那么val 就是where对应的参数值

可以看如下实例

```go
conditions := make([]*entity.Condition,0)

// 这里就是将Key设定成where条件了，所以val必须是where的值，也就是查询 id > 10的数据，占位符只支持 ?
conditions = append(conditions, &entity.Condition{Key:"id > ?", Val: 10})

// 这里同上，只是前面多了一个and，因为他是第二个条件，所以需要用连接符，可以用 and，or
conditions = append(conditions, &entity.Condition{Key:"and user_name = ?", Val: "bee"})

// 这里就是将Key设定成 排序条件了，所以Val不需要给值，只需要设置成 entity.NotWhere 即可
conditions = append(conditions, &entity.Condition{Key: "order by create_time desc", Val: entity.NotWhere})

```

### 实体映射说明

可以用 field，ignore 两个tag，具体实例如下

```go
type ResultStruct struct {
	Id         int    `field:"id" ignore:"true"`
	UserName   string `field:"user_name"`
	UserEmail  string `field:"user_email"`
	UpdateTime string `field:"update_time"`
}
```

- field 设定的值 就是数据库的字段名称，如果不设置这个 就会默认使用字段名称去跟数据库匹配
- ignore 如果设置成true 就说明这个字段会被排除在外，不参与数据库操作，如果不设置这个tag或者设置成false 则相反

### 实体的使用

上面的几个单表操作的 实例里面 已经展示了实体的相关用法，这里再详细说明一下

```go
// 直接使用，这种方式会让ignore 失效，无论设置成啥都不起作用
// 将他的返回值 作为参数 在调用DBTemplete里面的函数时使用
dbutil.StructToMap(&data, data)

// 让ignore 生效
// 同样的，将他的返回值 作为参数，在调用DBTemplete里面的函数时使用
dbutil.StructToMapIgnore(&data, data, true)
```

### 查询结果转化成struct

查询返回的是每一行数据都是map类型的，需要使用如下函数进行转化

```go
// 要转化成的目标struct
res := ResultStruct{}

// 转化函数，第一个参数是 要转化的数据，第二个参数是目标struct的指针，第三个参数是目标struct本身
dbutil.MapToStruct(row, &res, res)
```

经过了上面的转化，res里面就会有数据了

## 自定义sql操作

### 根据数组参数查询

```go
param := make([]interface{}, 1)
param[0] = 1

// 查多条
resultMap, err := operation.GetDBTemplate("Data source name").SelectList("select * from xt_message_board where id = ?", param)

// 查一条
resultMap, err := operation.GetDBTemplate("Data source name").SelectOne("select * from xt_message_board where id = ?", param)
```

### 根据struct参数查询

```go
// struct参数
res := ResultStruct{Id: 1}

// 查多条, 注：这里需要用到占位符
resultMap, err := operation.GetDBTemplate("Data source name").SelectListByMap("select * from xt_message_board where id < {id}", dbutil.StructToMap(&res, res))

// 查一条, 注：这里需要用到占位符
resultMap, err := operation.GetDBTemplate("Data source name").SelectOneByMap("select * from xt_message_board where id < {id}", dbutil.StructToMap(&res, res))
```

### 根据数组参数做增删改

```go

param := make([]interface{}, 2)
param[0] = "TestUpdate"
param[1] = 1

// 无论是增删改，都是调用Exec函数，将sql和参数传入即可
operation.GetDBTemplate("Data source name").Exec("update xt_message_board set user_name = ? where id = ?", param)
```

### 根据struct参数做增删改

```go
res := ResultStruct{Id: 1, UserName: "TestUpdateByMap"}

// 无论是增删改，都是调用ExecByMap函数，将sql和参数传入即可，注：这里需要用到占位符
operation.GetDBTemplate("Data source name").ExecByMap("update xt_message_board set user_name = {user_name} where id = {id}", dbutil.StructToMap(&res, res))

```

## 分页查询

### 使用默认的countSql

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
}

// 创建分页参数
param := entity.PageParam{
    CurrentPage: 1,  // 第几页
    PageSize: 20,  // 每页多少条
    Params: dbutil.StructToMap(&data, data)， // 查询参数
}

// 执行查询操作
result, err := operation.GetDBTemplate("Data source name").SelectPage("select * from xt_message_board where user_name = {user_name} and user_email = {user_email}", param)
```

### 使用自定义的countSql

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
}

// 你自己定义的countSql
countSql := "Your own definition of countSql"

// 创建分页参数
param := entity.PageParam{
    CurrentPage: 1,  // 第几页
    PageSize: 20,  // 每页多少条
    Params: dbutil.StructToMap(&data, data)， // 查询参数
}

// 执行查询操作
result, err := operation.GetDBTemplate("Data source name").SelectPageCustomCount("select * from xt_message_board where user_name = {user_name} and user_email = {user_email}", countSql， param)
```

## 事务管理

### 开启事务
```go
// 这个id是很有用的，后面回滚和提交都会用它
id, err := db.Transaction()
if err != nil {
    t.Error("TestUpdateTx: " + err.Error())
    return
}
```

### 提交和回滚事务

```go
// 回滚事务
db.Rollback(id)

// 提交事务
db.Commit(id)
```

### 连起来使用就是这样的

```go
// 开启事务
id, err := db.Transaction()
if err != nil {
    t.Error("TestUpdateTx: " + err.Error())
    return
}

res := ResultStruct{Id: 1, UserName: "TestUpdateTx"}

// 注：这里使用的不是GetDBTemplate，ExecByMap，而是 GetDBTemplateTx 和 ExecByTxMap
// 使用事务和不使用事务，在调用的函数上，区别就是多了个Tx
ss, err := operation.GetDBTemplateTx(id, "dbPoolTest").ExecByTxMap("update xt_message_board set user_name = {user_name} where id = {id}", dbutil.StructToMap(&res, res))

if err != nil {
    // 如果有问题就回滚事务
    db.Rollback(id)
    t.Error("TestUpdateTx: " + err.Error())
    return
}

// 提交事务
db.Commit(id)
```

## Web管理

[点击此处->跳转到Web管理](/beerus/index.html)