# RPCD AT Daemon User Guide

## Why Use This Service

1. **Queue Mechanism**: This service implements a command queue to ensure that only one AT command runs at a time, avoiding concurrent errors in the modem's ATD service
2. **Multiple Invocation Methods**: The service can be called by other services on the router via ubus, or by HTTP services via rpcd, making it suitable for both modem management and WebUI development
3. **Better Stability**: Compared to the modem's built-in ATD service, this service provides more stable and reliable performance across different vendor modems

## Usage Instructions

### 1. Configure rpcd Permissions
Add rpcd permissions for at-daemon (for demonstration purposes, the following configuration is unauthenticated - please configure appropriate authentication for production environments)
```bash
echo << EOF > /usr/share/rpcd/acl.d/unauthenticated.json
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

### 2. Send AT Commands via HTTP Interface
Use curl to access rpcd and send commands:

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

**Response example:**
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

### 3. Send AT Commands via ubus
You can also use ubus commands directly on the router:

```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm"}'
```

## API Reference
```bash
ubus -v list at-daemon
'at-daemon' @de5d6d53
        "open":{"at_port":"String","baudrate":"Integer","databits":"Integer","parity":"Integer","stopbits":"Integer","timeout":"Integer"}
        "sendat":{"at_port":"String","timeout":"Integer","end_flag":"String","at_cmd":"String","raw_at_content":"String","sendonly":"Boolean"}
        "list":{}
        "close":{"at_port":"String"}
```

### Method Descriptions

#### open - Open Serial Port
Opens the specified serial port device (usually called automatically when using `sendat`)

**Parameters:**
- `at_port` (String, required): Serial port device path, e.g., `/dev/ttyUSB0`
- `baudrate` (Integer, optional): Baud rate, default 115200
- `databits` (Integer, optional): Data bits, default 8
- `parity` (Integer, optional): Parity bit, 0=none, 1=odd, 2=even
- `stopbits` (Integer, optional): Stop bits, 1 or 2
- `timeout` (Integer, optional): Timeout in seconds, default 5

#### sendat - Send AT Command
Sends an AT command to the specified serial port and receives the response

**Parameters:**
- `at_port` (String, required): Serial port device path
- `at_cmd` (String, optional): AT command content, e.g., `at+cgmm`
- `raw_at_content` (String, optional): Raw content in hexadecimal format, choose one between this and `at_cmd`
- `timeout` (Integer, optional): Timeout in seconds, default 5
- `sendonly` (Boolean, optional): Whether to send only without receiving response, default false
- `end_flag` (String, optional): Custom termination character, truncates when this character is detected in response

**Default Termination Characters:** `OK`, `ERROR`, `+CMS ERROR:`, `+CME ERROR:`, `NO CARRIER`

#### list - List Serial Ports
Lists all opened serial port connections

**Parameters:** None

#### close - Close Serial Port
Closes the specified serial port connection

**Parameters:**
- `at_port` (String, required): Serial port device path to close

## Important Notes

### 1. Sharing Serial Port with QModem
If you want to share the serial port with QModem, you need to enable ubus at mode in QModem configuration. Otherwise, ubus at will monopolize the serial port buffer after startup, preventing QModem from receiving information.

**Configuration method:**
```bash
uci set qmodem.1_1_2.use_ubus='1'
uci commit qmodem
```

### 2. Response Termination Characters
When calling ubus-at-daemon in your project, ensure that AT commands return one of the following termination characters:
- `OK`
- `ERROR`
- `+CMS ERROR:`
- `+CME ERROR:`
- `NO CARRIER`

Or manually specify a termination character via the `end_flag` parameter. Otherwise, the request will wait until timeout and `status` will return an error.

### 3. Security Recommendation
Unauthenticated rpcd configuration is not recommended for production environments. Please configure appropriate authentication mechanisms based on your security requirements.

## Usage Examples

### Query Modem Model
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm"}'
```

### Query Signal Strength
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+csq"}'
```

### Send Command Without Waiting for Response
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cfun=1,1","sendonly":true}'
```

### Custom Timeout
```bash
ubus call at-daemon sendat '{"at_port":"/dev/ttyUSB0","at_cmd":"at+cgmm","timeout":10}'
```
