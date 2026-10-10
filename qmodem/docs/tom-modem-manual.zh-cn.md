# tom-modem 用户手册

`tom-modem` 是一个多功能的命令行工具，设计用于通过串行（TTY）端口与调制解调器（Modem）设备进行通信。它允许用户发送AT命令、管理短信以及配置串行通信参数。

## 命令格式

```bash
tom_modem <device> [options]
```

## 描述

`tom_modem` 的主要功能是方便与调制解调器的交互。它可以用于简单的AT命令测试，也可以用于更复杂的操作，如以PDU格式发送和读取短信。

### 位置参数

-   `<device>`：调制解调器AT命令端口的TTY设备路径（例如 `/dev/ttyUSB2`）。这是一个必需参数。
-   `<at_cmd>`：要发送给调制解調器的AT命令。这是可选的，也可以通过 `-c` 或 `--cmd` 标志指定。

### 选项

#### 通用选项
-   `-c, --cmd <command>`：指定要执行的AT命令。
-   `-o, --op <operation>`：定义要执行的操作。支持的操作有：
    -   `at`：发送标准AT命令（默认）。
    -   `binary_at`：发送二进制AT命令。
    -   `sms_read`：读取短信。
    -   `sms_send`：发送短信。
    -   `sms_delete`：删除短信。
-   `--debug`：启用详细的调试输出。
-   `-t, --timeout <seconds>`：设置操作的超时时间（秒）。默认为3秒。
-   `--greedy-read`：启用贪婪读取模式，这对于某些响应延迟或分段的命令可能是必需的。

#### 串口配置
-   `-d, --device <device>`：指定TTY设备路径。
-   `-b, --baudrate <rate>`：设置串口波特率。默认为115200。
-   `--databits <bits>`：设置数据位数。默认为8。
-   `--parity <parity>`：设置奇偶校验位（`none`, `even`, `odd`）。
-   `--stopbits <bits>`：设置停止位数。默认为1。
-   `--flowcontrol <type>`：设置流控（`none`, `hardware`）。

#### 短信选项
-   `--sms-pdu <pdu>`：要发送的短信的PDU字符串。`sms_send` 操作需要此参数。
-   `--sms-index <index>`：要读取或删除的短信的索引。`sms_read` 和 `sms_delete` 操作需要此参数。

## 示例

### 1. 发送一个简单的AT命令
检查调制解调器的信号质量。

```bash
tom_modem /dev/ttyUSB2 -c "AT+CSQ"
```
或
```bash
tom_modem /dev/ttyUSB2 "AT+CSQ"
```

### 2. 发送短信
以PDU格式发送一条短信。

```bash
tom_modem /dev/ttyUSB2 --op sms_send --sms-pdu "0011000D9168..."
```

### 3. 读取短信
读取索引为1的短信。

```bash
tom_modem /dev/ttyUSB2 --op sms_read --sms-index 1
```

### 4. 删除短信
删除索引为3的短信。

```bash
tom_modem /dev/ttyUSB2 --op sms_delete --sms-index 3
```

### 5. 使用不同的波特率
使用9600波特率与设备通信。

```bash
tom_modem /dev/ttyUSB2 -c "ATI" -b 9600
```
