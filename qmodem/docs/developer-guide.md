# QModem Developer Guide

This document provides a guide for developers looking to understand, extend, or adapt the `luci-app-qmodem` application.

## 1. Project Structure

The `luci-app-qmodem` is the core LuCI application for modem management. Its structure follows the standard LuCI MVC pattern.

```
luci-app-qmodem/
├── Makefile              # Build instructions for the package
├── htdocs/
│   └── luci-static/      # Static web assets (JS, CSS, images)
│       └── resources/
│           └── qmodem/
│               ├── modem.js # Main JavaScript for frontend logic
│               └── ...      # Other JS files
├── luasrc/
│   ├── controller/
│   │   └── qmodem.lua    # Main controller, handles API requests and page rendering
│   ├── model/
│   │   └── cbi/
│   │       └── qmodem/   # CBI models for configuration pages
│   │           ├── dial_config.lua
│   │           ├── modem_cfg.lua
│   │           └── ...
│   └── view/
│       └── qmodem/       # HTML templates for the views
│           ├── modem_status.htm
│           └── ...
└── root/
    └── etc/
        ├── config/
        │   └── qmodem    # Default configuration file
        └── uci-defaults/
            └── luci-qmodem # Script to set up default configs
```

-   **`controller/qmodem.lua`**: The heart of the application. It defines the menu structure and handles all the API calls from the frontend.
-   **`model/cbi/qmodem/`**: Contains the CBI (Configuration Binding Interface) files that generate the forms in the LuCI web interface for configuring the modem.
-   **`htdocs/luci-static/resources/qmodem/`**: Contains JavaScript files that provide dynamic functionality to the web interface, such as polling for modem status.
-   **`root/etc/config/qmodem`**: The UCI configuration file where all settings for the modem are stored.

## 2. API Endpoints and Parameters

The frontend communicates with the backend via API calls handled by `controller/qmodem.lua`. The primary endpoint is `/cgi-bin/luci/admin/modem/qmodem`. The action is determined by a `json` parameter in the request.

Here are some of the key API actions:

| Action                | Description                                   | Parameters                                  |
| --------------------- | --------------------------------------------- | ------------------------------------------- |
| `get_modem_list`      | Retrieves a list of detected modems.          | -                                           |
| `get_modem_info`      | Gets detailed information for a specific modem. | `slot`: The slot ID of the modem.           |
| `set_modem_info`      | Sets configuration for a modem.               | `slot`, `key`, `value`                      |
| `scan_modem`          | Initiates a scan for new modems.              | -                                           |
| `get_dial_status`     | Gets the current network connection status.   | `slot`                                      |
| `dial_up`             | Starts the network connection.                | `slot`                                      |
| `dial_down`           | Stops the network connection.                 | `slot`                                      |
| `send_at_command`     | Sends an AT command to the modem.             | `slot`, `cmd`                               |
| `get_sms_list`        | Retrieves a list of SMS messages.             | `slot`                                      |
| `send_sms`            | Sends an SMS message.                         | `slot`, `number`, `message`                 |

## 3. Modem Scan Workflow

The modem scan process is crucial for detecting and initializing modems.

1.  **User Trigger**: The user clicks the "Scan Modems" button in the web interface.
2.  **API Call**: The frontend sends a `scan_modem` request to the backend.
3.  **Backend Script**: The `qmodem.lua` controller executes a shell script (`/usr/share/qmodem/scan_modem.sh` or similar).
4.  **Device Detection**: The script scans for devices that look like modems. This is typically done by:
    -   Checking `/sys/bus/usb/devices` for USB devices with known vendor/product IDs.
    -   Checking `/sys/bus/pci/devices` for PCIe devices.
    -   Looking for TTY devices (`/dev/ttyUSB*`, `/dev/ttyACM*`, etc.) that respond to basic AT commands like `ATI`.
5.  **Information Gathering**: For each detected modem, the script gathers basic information (Manufacturer, Model, IMEI, etc.) by sending a series of AT commands.
6.  **UCI Update**: The script updates the `qmodem` UCI configuration file with the information about the detected modems, creating a new "slot" for each.
7.  **Response to Frontend**: The API call returns, and the frontend calls `get_modem_list` to refresh the list of modems displayed to the user.

## 4. How to Adapt for a New Modem

Adapting `qmodem` for a new, unsupported modem generally involves the following steps:

1.  **Identify Device Ports**: Connect the modem and identify which TTY port is used for AT commands, and which is used for data (e.g., QMI, NCM, MBIM). You can use `dmesg` and look at `/dev/` to find these.
2.  **AT Command Set**: Obtain the AT command manual for the new modem. While many commands are standard, some, especially for vendor-specific features, will be different.
3.  **Update `tom_modem` or other tools**: If the modem requires special handling for AT commands (e.g., binary AT commands, unusual response formats), you may need to modify the underlying command-line tools like `tom_modem`.
4.  **Update Connection Scripts**: The dialing scripts (e.g., those used by `quectel-cm`) may need to be updated. This could involve:
    -   Adding the modem's QMI/MBIM device path to the script.
    -   Modifying the AT commands used to put the modem into the correct mode for dialing.
5.  **Update Scan Logic (if necessary)**: If the modem has a unique USB Vendor/Product ID that isn't recognized, you may need to add it to the detection scripts.
6.  **Add to `support_list.md`**: Once the modem is working, add it to the `support_list.md` file to document its compatibility.
7.  **Custom AT Commands**: For special features of the new modem (e.g., unique band locking commands), you can add custom AT command buttons to the LuCI interface by editing the CBI and controller files. This allows users to easily access these features.

By following these steps, you can integrate new modems into the `qmodem` ecosystem and take advantage of its management features.

## 5. Core Scripts in `/usr/share/qmodem`

The backend logic is heavily reliant on a set of shell scripts. Understanding these scripts is key to debugging and extending the application.

### `modem_scan.sh`

-   **Purpose**: This script is responsible for detecting, identifying, and configuring modem devices. It is the core of the hotplug and auto-detection system.
-   **Commands & Parameters**:
    -   `scan [usb|pcie]`: Scans for all modems. Can be limited to a specific bus type (`usb` or `pcie`). It identifies devices, determines their model, and calls `add` for each one found.
    -   `add <slot>`: Adds or updates a modem configuration in UCI based on a bus slot ID (e.g., `1-1.2` for USB, `0000:01:00.0` for PCIe). It gathers device info and creates the `qmodem.<slot_name>` configuration section.
    -   `remove <slot>`: Removes a modem's configuration from UCI.
    -   `disable <slot>`: Marks a modem's configuration as disabled.
-   **Functionality**: It reads `modem_support.json` and `modem_port_rule.json` to identify supported modems and find their AT command ports.

### `modem_ctrl.sh`

-   **Purpose**: This is the main control script that acts as the backend for most API calls from the LuCI interface. It reads the modem's configuration, sources the correct vendor-specific script, and executes the requested function.
-   **Commands & Parameters**:
    -   `modem_ctrl.sh <method> <config_section> [json_data]`
    -   `<method>`: The function to call (e.g., `base_info`, `set_lockband`, `send_at`).
    -   `<config_section>`: The UCI section name of the modem (e.g., `modem_usb_1_1_2`).
    -   `[json_data]`: Optional JSON data for functions that require input (e.g., the bands to lock).
-   **Functionality**: It uses the `manufacturer` from the modem's UCI config to find the corresponding script file in the `vendor/` directory (via `vendor/dynamic_load.json`) and then calls the function within that script.

### `modem_util.sh`

-   **Purpose**: A library of common helper functions used by the other scripts.
-   **Key Functions**:
    -   `at <device> <command>`: Sends an AT command to the specified port using `tom_modem`.
    -   `fastat <device> <command>`: Sends an AT command with a short timeout, used for quick checks during scanning.
    -   `m_debug <message>`: Writes a debug message to the system log.

### `vendor/` Directory

-   **`dynamic_load.json`**: A simple JSON file that maps a vendor name (e.g., "quectel") to its corresponding script file (e.g., "quectel.sh").
-   **`<vendor_name>.sh`**: These scripts contain the specific AT command implementations for a particular brand of modem. For example, `quectel.sh` knows how to get signal strength or set band locks using Quectel's specific AT commands.
-   **`generic.sh`**: Provides a default set of functions. If a function is not implemented in a specific vendor script, the system falls back to the one in `generic.sh`.

## 6. Adapting for a New Modem (Advanced)

Adapting a new modem involves teaching `qmodem` about its characteristics and commands.

### Case 1: New Model from an Existing Vendor

If the modem is from a vendor that is already supported (e.g., a new Quectel model), the process is simpler.

1.  **Identify Model Name**: Use `tom_modem` or another tool to send `AT+CGMM` to the modem's AT port and get its model name.
2.  **Update `modem_support.json`**: Add a new entry for your model. You can copy an existing one from the same vendor and platform.
    -   Specify its `manufacturer`, `platform`, supported `modes` (qmi, mbim, etc.), and available frequency bands.
3.  **Test**: Run `modem_scan.sh scan` and see if the modem is detected and configured correctly. If some functions (like band locking) use different AT commands than other models from that vendor, you will need to modify the vendor's script in `vendor/<vendor_name>.sh`, adding conditional logic based on the `$modem_name` or `$platform` variable.

### Case 2: New Vendor

If the modem is from a completely new vendor, you need to create a new vendor integration.

1.  **Create Vendor Script**:
    -   Create a new file: `/usr/share/qmodem/vendor/<new_vendor>.sh`.
    -   The best practice is to copy `/usr/share/qmodem/vendor/generic.sh` as a template. This ensures you have all the required function stubs.
2.  **Update `dynamic_load.json`**:
    -   Add an entry to map your new vendor name to the script file you just created.
    -   `"<new_vendor>": "<new_vendor>.sh"`
3.  **Implement Vendor Functions**:
    -   Edit your new `<new_vendor>.sh` file. You must implement the functions to get information and control the modem. Refer to the vendor's AT command manual.
    -   **Key functions to implement**:
        -   `get_imei`
        -   `get_mode` / `set_mode`
        -   `get_network_prefer` / `set_network_prefer`
        -   `get_lockband` / `set_lockband`
        -   `base_info` (gathers basic info like firmware, manufacturer)
        -   `sim_info` (gathers SIM status, IMSI, ICCID)
        -   `network_info` (gathers network type, signal strength)
        -   `cell_info` (gathers detailed cell tower information)
        -   `get_neighborcell` / `set_neighborcell` (for cell locking)
4.  **Update `modem_support.json`**: Add an entry for the new modem model, referencing your new `manufacturer` name.

### How to Disable Unsupported Features

If a modem does not support a specific feature (e.g., it cannot report temperature, or it has no cell locking capability), you can disable its corresponding UI element. This is controlled by adding logic to the `vendor_get_disabled_features` function within the vendor's script file (`/usr/share/qmodem/vendor/<vendor_name>.sh`).

The `modem_ctrl.sh` script calls this function, and the frontend JavaScript reads the returned list of disabled features to hide the corresponding tabs or UI elements.

#### Available Features to Disable

The features that can be disabled correspond to the tabs in the "Modem Debug" page. Disabling a feature will remove its tab from the UI. Here is the list of controllable UI components and their configuration names:

| Feature Name (UI Tab) | Config Name    | Description                               |
| --------------------- | -------------- | ----------------------------------------- |
| Dial Mode             | `DialMode`     | Disables the "Dial Mode" selection tab.   |
| Rat Prefer            | `RatPrefer`    | Disables the "Rat Prefer" selection tab.  |
| Set IMEI              | `IMEI`         | Disables the "Set IMEI" tab.              |
| Neighbor Cell         | `NeighborCell` | Disables the "Neighbor Cell" tab.         |
| Lock Band             | `LockBand`     | Disables the "Lock Band" tab.             |
| Reboot Modem          | `RebootModem`  | Disables the "Reboot Modem" tab.          |
| AT Debug              | `AtDebug`      | Disables the "AT Debug" tab.              |

#### Disabling Strategies and Examples

You can implement logic to disable features at different granularities.

**1. Disable for an Entire Vendor**

To disable a feature for all modems from a specific vendor, simply add the feature's config name to the `vendor_get_disabled_features` function.

*Example: Disable SMS and Voltage for all "ExampleVendor" modems.*
```sh
# In /usr/share/qmodem/vendor/example_vendor.sh

vendor_get_disabled_features() {
    json_add_string "" "sms"
    json_add_string "" "voltage"
}
```

**2. Disable for a Specific Platform**

If only a certain platform (e.g., `qualcomm`, `unisoc`) from a vendor lacks a feature, you can add conditional logic based on the `$platform` variable.

*Example: Disable the "Neighbor Cell" feature for all Quectel modems on the `unisoc` platform.*
```sh
# In /usr/share/qmodem/vendor/quectel.sh

vendor_get_disabled_features() {
    if [ "$platform" = "unisoc" ]; then
        json_add_string "" "NeighborCell"
    fi
}
```

**3. Disable for a Specific Model**

To target a single modem model, use the `$modem_name` variable.

*Example: Disable band locking for the "RM500U-CN" model.*
```sh
# In /usr/share/qmodem/vendor/quectel.sh

vendor_get_disabled_features() {
    if [ "$modem_name" = "rm500u-cn" ]; then
        json_add_string "" "LockBand"
    fi
    
    # You can combine conditions
    if [ "$platform" = "unisoc" ]; then
        json_add_string "" "NeighborCell"
    fi
}
```
