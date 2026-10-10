# tom-modem User Manual

`tom-modem` is a versatile command-line utility designed to communicate with modem devices via serial (TTY) ports. It allows users to send AT commands, manage SMS messages, and configure serial communication parameters.

## Synopsis

```bash
tom_modem <device> [options]
```

## Description

The primary function of `tom_modem` is to facilitate interaction with a modem. It can be used for simple AT command testing, as well as for more complex operations like sending and reading SMS messages in PDU format.

### Positional Arguments

-   `<device>`: The TTY device path for the modem's AT command port (e.g., `/dev/ttyUSB2`). This is a required argument.
-   `<at_cmd>`: The AT command to be sent to the modem. This is optional and can also be specified with the `-c` or `--cmd` flag.

### Options

#### General Options
-   `-c, --cmd <command>`: Specifies the AT command to execute.
-   `-o, --op <operation>`: Defines the operation to perform. Supported operations are:
    -   `at`: Send a standard AT command (default).
    -   `binary_at`: Send a binary AT command.
    -   `sms_read`: Read an SMS message.
    -   `sms_send`: Send an SMS message.
    -   `sms_delete`: Delete an SMS message.
-   `--debug`: Enables verbose debug output.
-   `-t, --timeout <seconds>`: Sets the timeout for the operation in seconds. Default is 3 seconds.
-   `--greedy-read`: Enables a greedy read mode, which may be necessary for some commands that have delayed or multi-part responses.

#### Serial Port Configuration
-   `-d, --device <device>`: Specifies the TTY device path.
-   `-b, --baudrate <rate>`: Sets the serial port baud rate. Default is 115200.
-   `--databits <bits>`: Sets the number of data bits. Default is 8.
-   `--parity <parity>`: Sets the parity (`none`, `even`, `odd`).
-   `--stopbits <bits>`: Sets the number of stop bits. Default is 1.
-   `--flowcontrol <type>`: Sets the flow control (`none`, `hardware`).

#### SMS Options
-   `--sms-pdu <pdu>`: The PDU string for the SMS message to be sent. Required for the `sms_send` operation.
-   `--sms-index <index>`: The index of the SMS message to read or delete. Required for `sms_read` and `sms_delete` operations.

## Examples

### 1. Send a simple AT command
Check the modem's signal quality.

```bash
tom_modem /dev/ttyUSB2 -c "AT+CSQ"
```
or
```bash
tom_modem /dev/ttyUSB2 "AT+CSQ"
```

### 2. Send an SMS
Send an SMS message in PDU format.

```bash
tom_modem /dev/ttyUSB2 --op sms_send --sms-pdu "0011000D9168..."
```

### 3. Read an SMS
Read the SMS message at index 1.

```bash
tom_modem /dev/ttyUSB2 --op sms_read --sms-index 1
```

### 4. Delete an SMS
Delete the SMS message at index 3.

```bash
tom_modem /dev/ttyUSB2 --op sms_delete --sms-index 3
```

### 5. Using a different baud rate
Communicate with a device using a 9600 baud rate.

```bash
tom_modem /dev/ttyUSB2 -c "ATI" -b 9600
```
