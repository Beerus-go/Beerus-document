# Beerus-DB

## Initial configuration

### Installing dependencies

```shell
go get github.com/yuyenews/Beerus-DB@v1.1.3

go get github.com/go-sql-driver/mysql
```

### Configuring the data source

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

### Configuring multiple data sources

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

This code only needs to be executed once when the project starts

### Field explanation

- InitialSize: Number of initialized connections
- ExpandSize: The number of connections to be extended at a time when the connections are exhausted (this configuration will be disabled after the maximum number of connections has been reached in the connection pool)
- MaxOpen: Maximum number of connections
- MinOpen: Minimum number of connections
- Url: Database connection string
- TestConn: Test if the connection is valid, once set to true, if the connection obtained is no longer valid, a new connection will be obtained and will be automatically dropped if it fails 3 times

## Single Table Operations

### Search for single table data based on conditions

```go
conditions := builder.Create().
    Add("id > ?", 10).
    Add("and (user_name = ? or age > ?)", "bee", 18).
    Add("order by create_time desc", entity.NotWhere).
    Build()

resultMap, err := operation.GetDBTemplate("Data source name").Select("table name", conditions)
```

### Modify single table data according to conditions

```go
// Conditions set
conditions := builder.Create().
    Add("id = ?", 1).
    Build()

// Data settings to be modified
data := ResultStruct{UserName: "TestNoSqlUpdate"}

// Execute the modification operation
result, err := operation.GetDBTemplate("Data source name").Update("table name", dbutil.StructToMapIgnore(&data, true),conditions)
```

### Delete single table data based on conditions

```go
// Set delete conditions
conditions := builder.Create().
    Add("id = ?", 2).
    Build()

// Perform a delete operation
_, err := operation.GetDBTemplate("Data source name").Delete("table name", conditions)
```

### Insert a piece of data

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
    UpdateTime: "2021-12-09 13:50:00",
}

result, err := operation.GetDBTemplate("Data source name").Insert("table name", dbutil.StructToMapIgnore(&data, true))
```

### Description of condition setters

The internal structure is as follows

```go
type Condition struct {
	Key string
	Val interface{}
}
```

- Key Set the criteria, which can be anywhere, order by, group by, etc.
- Val Set the value, if the Key is where, then val is the value of the where parameter

The following examples can be seen

```go
conditions := builder.Create().

// Here is the Key set to where condition, so val must be the value of where, that is, the query id > 10 data, placeholder only support ?
Add("id > ?", 10).

// Same as above, but with an extra and in front, because he is the second condition, so you need to use the conjunction, you can use and, or
// Like the example, if and is followed by a conditional combination, you can write it like this, Val is a... type that can be infinitely appended to
Add("and (user_name = ? or age > ?)", "bee", 18).

// Here the Key is set as a sort condition, so Val doesn't need to be given a value, just set it to entity.NotWhere
Add("order by create_time desc", entity.NotWhere).

Builder()

```

### Entity Mapping Description

Two tags can be used, field, ignore, for the following example

```go
type ResultStruct struct {
	Id         int    `field:"id" ignore:"true"`
	UserName   string `field:"user_name"`
	UserEmail  string `field:"user_email"`
	UpdateTime string `field:"update_time"`
}
```

- field The value set is the field name of the database, if this is not set, the field name will be used to match the database by default
- ignore If set to true this field will be excluded from database operations, if the tag is not set or set to false the opposite is true

### Use of entities

The above examples of single table operations already show the usage of entities, but here is a more detailed explanation

```go
// Used directly, this way the ignore is disabled and will not work no matter what it is set to
// Use his return value as a parameter when calling DBTemplete's function
dbutil.StructToMap(&data)

// Making ignore work
// Similarly, use his return value as a parameter when calling DBTemplete's function
dbutil.StructToMapIgnore(&data, true)
```

### Query results into struct

The query returns each row of data as a map type, which needs to be converted using the following function

```go
// The target struct to be transformed into
res := ResultStruct{}

// The first argument is the data to be transformed, the second argument is a pointer to the target struct
dbutil.MapToStruct(row, &res)
```

After the above transformation, the data will be available in res

## Custom sql operations

### Query based on array parameters

```go
param := make([]interface{}, 1)
param[0] = 1

// Select multiple entries
resultMap, err := operation.GetDBTemplate("Data source name").SelectList("select * from xt_message_board where id = ?", param)

// Select one
resultMap, err := operation.GetDBTemplate("Data source name").SelectOne("select * from xt_message_board where id = ?", param)
```

### Search by struct parameter

```go
// struct parameters
res := ResultStruct{Id: 1}

// Select multiple entries, note: placeholders are needed here
resultMap, err := operation.GetDBTemplate("Data source name").SelectListByMap("select * from xt_message_board where id < {id}", dbutil.StructToMap(&res))

// Select one, note: placeholders are needed here
resultMap, err := operation.GetDBTemplate("Data source name").SelectOneByMap("select * from xt_message_board where id < {id}", dbutil.StructToMap(&res))
```

### Adding, deleting and changing based on array parameters

```go

param := make([]interface{}, 2)
param[0] = "TestUpdate"
param[1] = 1

// Whether adding, deleting or updating, the Exec function is called and the sql and parameters are passed in
operation.GetDBTemplate("Data source name").Exec("update xt_message_board set user_name = ? where id = ?", param)
```

### Add, delete and update according to struct parameters

```go
res := ResultStruct{Id: 1, UserName: "TestUpdateByMap"}

// Whether adding, deleting, or updating, the ExecByMap function is called, and the sql and parameters are passed in.
operation.GetDBTemplate("Data source name").ExecByMap("update xt_message_board set user_name = {user_name} where id = {id}", dbutil.StructToMap(&res))

```

## Paging queries

### Use the default countSql

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
}

// Create paging parameters
param := entity.PageParam{
    CurrentPage: 1,  // Pages
    PageSize: 20,  // How many entries per page
    Params: dbutil.StructToMap(&data), // Enquiry parameters
}

// Performing a query operation
result, err := operation.GetDBTemplate("Data source name").SelectPage("select * from xt_message_board where user_name = {user_name} and user_email = {user_email}", param)
```

### Use custom countSql

```go
data := ResultStruct{
    UserName: "TestNoSqlInsert",
    UserEmail: "xxxxx@163.com",
}

// Your own definition of countSql
countSql := "Your own definition of countSql"

// Create paging parameters
param := entity.PageParam{
    CurrentPage: 1,  // Pages
    PageSize: 20,  // How many entries per page
    Params: dbutil.StructToMap(&data), // Enquiry parameters
}

// Performing a query operation
result, err := operation.GetDBTemplate("Data source name").SelectPageCustomCount("select * from xt_message_board where user_name = {user_name} and user_email = {user_email}", countSql， param)
```

## Transaction Management

### Open a transaction
```go
// This id is very useful and will be used later for rollbacks and commits
id, err := db.Transaction()
if err != nil {
    t.Error("TestUpdateTx: " + err.Error())
    return
}
```

### Commit and rollback transactions

```go
// Rollback transactions
db.Rollback(id)

// Commit transactions
db.Commit(id)
```

### Used together it looks like this

```go
// Open a transaction
id, err := db.Transaction()
if err != nil {
    t.Error("TestUpdateTx: " + err.Error())
    return
}

res := ResultStruct{Id: 1, UserName: "TestUpdateTx"}

// Note: GetDBTemplateTx and ExecByTxMap must be used here.
// The difference between using a transaction and not using a transaction, in terms of the functions called, is that there is an additional Tx
ss, err := operation.GetDBTemplateTx(id, "dbPoolTest").ExecByTxMap("update xt_message_board set user_name = {user_name} where id = {id}", dbutil.StructToMap(&res))

if err != nil {
    // Roll back the transaction if there is a problem
    db.Rollback(id)
    t.Error("TestUpdateTx: " + err.Error())
    return
}

// Commit transactions
db.Commit(id)
```

## Web Management

[Click here -> Web Management](/beerus/index.html)