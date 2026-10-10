# RPCD AT Daemon 用户指南

## 为什么要使用这个服务
1. **队列机制**：该服务实现了一个命令队列，可以较大程度确保同一时间只有一个AT指令运行，避免模组端的ATD出现并发错误
2. **多种调用方式**：该服务可以借助 ubus 在路由端被其他服务调用，借助 rpcd 被 HTTP 服务调用，同时适合模组管理和 WebUI 开发
3. **稳定性更好**：相比模组自带的 ATD 服务，该服务在不同厂商的模组上表现更加稳定可靠

## 使用方法

### 1. 添加 rpcd 权限配置
为 at-daemon 添加 rpcd 权限（为了方便演示，下面添加的是免认证服务，生产环境请根据安全需求配置适当的认证）
```bash
cat << EOF > /usr/share/rpcd/acl.d/unauthenticated.json
{
        "unauthenticated": {
                "description": "Access controls for unauthenticated requests",
                "read": {
                        "ubus": {
                                "session": [
                                        "access",
                                        "login"
                                ],
                                "at-daemon" : ["list","open","sendat","close"]
                        }
                }
        }
}
EOF
```

### 2. 通过 HTTP 接口发送 AT 指令
使用 curl 访问 rpcd 发送指令：

```bash
curl -s -X POST -H "Content-Type: application/json" -d '
{
    "jsonrpc":"2.0",
    "id":1,
    "method":"call",
    "params":["00000000000000000000000000000000","at-daemon","sendat",{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm"}]
}
' http://192.168.1.1/ubus
```

**响应示例：**
```json
{
   "jsonrpc": "2.0",
   "id": 1,
   "result": [
     0,
     {
       "port": "/dev/ttyUSB0",
       "command": "at+cgmm",
       "is_raw": 0,
       "sendonly": 0,
       "timeout": 5,
       "end_flag": "default",
       "end_flags_used": [
         "OK",
         "ERROR",
         "+CMS ERROR:",
         "+CME ERROR:",
         "NO CARRIER"
       ],
       "status": "success",
       "response": "\r\nMH5000-82M\r\n\r\nOK\r\n",
       "response_length": 20,
       "end_flag_matched": "OK",
       "response_time_ms": 79
     }
   ]
 }
```

### 3. 通过 ubus 命令发送 AT 指令
也可以直接在路由器上使用 ubus 命令：

```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm"}'
```

## API 参数详解
```bash
ubus -v list at-daemon
'at-daemon' @de5d6d53
        "open":{"at_port":"String","baudrate":"Integer","databits":"Integer","parity":"Integer","stopbits":"Integer","timeout":"Integer"}
        "sendat":{"at_port":"String","timeout":"Integer","end_flag":"String","at_cmd":"String","raw_at_content":"String","sendonly":"Boolean"}
        "list":{}
        "close":{"at_port":"String"}
```

### 方法说明

#### open - 打开串口
打开指定的串口设备（通常使用 `sendat` 时会自动调用此方法）

**参数：**
- `at_port` (String, 必需): 串口设备路径，如 `/dev/ttyUSB0`
- `baudrate` (Integer, 可选): 波特率，默认 115200
- `databits` (Integer, 可选): 数据位，默认 8
- `parity` (Integer, 可选): 校验位，0=无校验，1=奇校验，2=偶校验
- `stopbits` (Integer, 可选): 停止位，1 或 2
- `timeout` (Integer, 可选): 超时时间（秒），默认 5

#### sendat - 发送 AT 指令
发送 AT 指令到指定串口并接收响应

**参数：**
- `at_port` (String, 必需): 串口设备路径
- `at_cmd` (String, 可选): AT 指令内容，如 `at+cgmm`
- `raw_at_content` (String, 可选): 16进制格式的原始内容，与 `at_cmd` 二选一
- `timeout` (Integer, 可选): 超时时间（秒），默认 5
- `sendonly` (Boolean, 可选): 是否只发送不接收响应，默认 false
- `end_flag` (String, 可选): 自定义结束符，响应包含该字符时截断

**默认结束符：** `OK`、`ERROR`、`+CMS ERROR:`、`+CME ERROR:`、`NO CARRIER`

#### list - 列出串口
列出所有已打开的串口连接

**参数：** 无

#### close - 关闭串口
关闭指定的串口连接

**参数：**
- `at_port` (String, 必需): 要关闭的串口设备路径

## 重要注意事项

### 1. 与 QModem 共享串口
如果要与 QModem 共享串口，需要在 QModem 配置中启用 ubus at 模式，否则 ubus at 启动后会独占串口缓冲区，导致 QModem 无法获取信息。

**配置方法：**
```bash
uci set qmodem.1_1_2.use_ubus='1'
uci commit qmodem
```

### 2. 响应终止符
在项目中调用 ubus-at-daemon 时，请确保 AT 命令返回包含以下终止符之一：
- `OK`
- `ERROR`
- `+CMS ERROR:`
- `+CME ERROR:`
- `NO CARRIER`

或者手动通过 `end_flag` 参数指定终止符。否则请求会等待超时才返回，且 `status` 会返回错误。

### 3. 安全建议
生产环境中不建议使用免认证的 rpcd 配置，请根据实际安全需求配置适当的认证机制。

## 使用示例

### 查询模组型号
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm"}'
```

### 查询信号强度
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+csq"}'
```

### 仅发送指令不等待响应
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cfun=1,1","sendonly":true}'
```

### 自定义超时时间
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm","timeout":10}'
```
