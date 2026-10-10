# QModem 开发者指南

本文档为希望理解、扩展或适配 `luci-app-qmodem` 应用程序的开发者提供指南。

## 1. 项目结构

`luci-app-qmodem` 是用于调制解调器管理的核心LuCI应用程序。其结构遵循标准的LuCI MVC模式。

```
luci-app-qmodem/
├── Makefile              # 软件包的编译说明
├── htdocs/
│   └── luci-static/      # 静态Web资源 (JS, CSS, 图片)
│       └── resources/
│           └── qmodem/
│               ├── modem.js # 前端逻辑的主要JavaScript文件
│               └── ...      # 其他JS文件
├── luasrc/
│   ├── controller/
│   │   └── qmodem.lua    # 主控制器，处理API请求和页面渲染
│   ├── model/
│   │   └── cbi/
│   │       └── qmodem/   # 用于配置页面的CBI模型
│   │           ├── dial_config.lua
│   │           ├── modem_cfg.lua
│   │           └── ...
│   └── view/
│       └── qmodem/       # 视图的HTML模板
│           ├── modem_status.htm
│           └── ...
└── root/
    └── etc/
        ├── config/
        │   └── qmodem    # 默认配置文件
        └── uci-defaults/
            └── luci-qmodem # 用于设置默认配置的脚本
```

-   **`controller/qmodem.lua`**: 应用程序的核心。它定义了菜单结构并处理来自前端的所有API调用。
-   **`model/cbi/qmodem/`**: 包含CBI（配置绑定接口）文件，这些文件在LuCI Web界面中生成用于配置调制解调器的表单。
-   **`htdocs/luci-static/resources/qmodem/`**: 包含为Web界面提供动态功能的JavaScript文件，例如轮询调制解调器状态。
-   **`root/etc/config/qmodem`**: UCI配置文件，所有调制解调器的设置都存储在这里。

## 2. API端点和参数

前端通过由 `controller/qmodem.lua` 处理的API调用与后端通信。主端点是 `/cgi-bin/luci/admin/modem/qmodem`。操作由请求中的 `json` 参数确定。

以下是一些关键的API操作：

| 操作 (Action)         | 描述                                   | 参数                                  |
| --------------------- | -------------------------------------- | ------------------------------------- |
| `get_modem_list`      | 检索检测到的调制解调器列表。           | -                                     |
| `get_modem_info`      | 获取特定调制解调器的详细信息。         | `slot`: 调制解调器的卡槽ID。          |
| `set_modem_info`      | 设置调制解调器的配置。                 | `slot`, `key`, `value`                |
| `scan_modem`          | 启动扫描新调制解调器。                 | -                                     |
| `get_dial_status`     | 获取当前网络连接状态。                 | `slot`                                |
| `dial_up`             | 启动网络连接。                         | `slot`                                |
| `dial_down`           | 停止网络连接。                         | `slot`                                |
| `send_at_command`     | 向调制解调器发送AT命令。               | `slot`, `cmd`                         |
| `get_sms_list`        | 检索短信列表。                         | `slot`                                |
| `send_sms`            | 发送短信。                             | `slot`, `number`, `message`           |

## 3. 调制解调器扫描工作流

调制解调器扫描过程对于检测和初始化调制解调器至关重要。

1.  **用户触发**: 用户在Web界面中点击“扫描调制解调器”按钮。
2.  **API调用**: 前端向后端发送一个 `scan_modem` 请求。
3.  **后端脚本**: `qmodem.lua` 控制器执行一个shell脚本（例如 `/usr/share/qmodem/scan_modem.sh`）。
4.  **设备检测**: 脚本扫描看起来像调制解调器的设备。这通常通过以下方式完成：
    -   检查 `/sys/bus/usb/devices` 中具有已知供应商/产品ID的USB设备。
    -   检查 `/sys/bus/pci/devices` 中的PCIe设备。
    -   查找对 `ATI` 等基本AT命令有响应的TTY设备（`/dev/ttyUSB*`, `/dev/ttyACM*` 等）。
5.  **信息收集**: 对于每个检测到的调制解调器，脚本通过发送一系列AT命令来收集基本信息（制造商、型号、IMEI等）。
6.  **UCI更新**: 脚本使用检测到的调制解调器的信息更新 `qmodem` UCI配置文件，为每个调制解调器创建一个新的“卡槽”。
7.  **响应前端**: API调用返回，前端调用 `get_modem_list` 来刷新向用户显示的调制解调器列表。

## 4. 如何为新调制解调器进行适配

为新的、不受支持的调制解调器适配 `qmodem` 通常涉及以下步骤：

1.  **识别设备端口**: 连接调制解调器并识别哪个TTY端口用于AT命令，哪个用于数据（例如QMI, NCM, MBIM）。您可以使用 `dmesg` 并查看 `/dev/` 来找到这些端口。
2.  **获取AT命令集**: 获取新调制解调器的AT命令手册。虽然许多命令是标准的，但一些，特别是针对特定供应商功能的命令，会有所不同。
3.  **更新 `tom_modem` 或其他工具**: 如果调制解调器需要特殊的AT命令处理（例如，二进制AT命令，不寻常的响应格式），您可能需要修改像 `tom_modem` 这样的底层命令行工具。
4.  **更新连接脚本**: 拨号脚本（例如 `quectel-cm` 使用的那些）可能需要更新。这可能涉及：
    -   将调制解调器的QMI/MBIM设备路径添加到脚本中。
    -   修改用于将调制解调器置于正确拨号模式的AT命令。
5.  **更新扫描逻辑（如果需要）**: 如果调制解调器具有未被识别的唯一USB供应商/产品ID，您可能需要将其添加到检测脚本中。
6.  **添加到 `support_list.md`**: 一旦调制解调器工作正常，将其添加到 `support_list.md` 文件中以记录其兼容性。
7.  **自定义AT命令**: 对于新调制解调器的特殊功能（例如，独特的锁频段命令），您可以通过编辑CBI和控制器文件，在LuCI界面中添加自定义AT命令按钮。这使用户可以轻松访问这些功能。

通过遵循这些步骤，您可以将新的调制解调器集成到 `qmodem` 生态系统中，并利用其管理功能。

## 5. `/usr/share/qmodem` 中的核心脚本

后端逻辑在很大程度上依赖于一组shell脚本。理解这些脚本是调试和扩展应用程序的关键。

### `modem_scan.sh`

-   **用途**: 此脚本负责检测、识别和配置调制解调器设备。它是热插拔和自动检测系统的核心。
-   **命令和参数**:
    -   `scan [usb|pcie]`: 扫描所有调制解调器。可以限制为特定的总线类型（`usb` 或 `pcie`）。它识别设备，确定其型号，并为找到的每个设备调用 `add`。
    -   `add <slot>`: 基于总线卡槽ID（例如，USB为 `1-1.2`，PCIe为 `0000:01:00.0`）在UCI中添加或更新调制解调器配置。它收集设备信息并创建 `qmodem.<slot_name>` 配置节。
    -   `remove <slot>`: 从UCI中删除调制解调器的配置。
    -   `disable <slot>`: 将调制解调器的配置标记为禁用。
-   **功能**: 它读取 `modem_support.json` 和 `modem_port_rule.json` 来识别支持的调制解调器并找到它们的AT命令端口。

### `modem_ctrl.sh`

-   **用途**: 这是主控制脚本，作为LuCI界面的大多数API调用的后端。它读取调制解调器的配置，加载正确的特定于供应商的脚本，并执行请求的函数。
-   **命令和参数**:
    -   `modem_ctrl.sh <method> <config_section> [json_data]`
    -   `<method>`: 要调用的函数（例如 `base_info`, `set_lockband`, `send_at`）。
    -   `<config_section>`: 调制解调器的UCI配置节名称（例如 `modem_usb_1_1_2`）。
    -   `[json_data]`: 需要输入的功能的可选JSON数据（例如，要锁定的频段）。
-   **功能**: 它使用调制解调器UCI配置中的 `manufacturer` 在 `vendor/` 目录中找到相应的脚本文件（通过 `vendor/dynamic_load.json`），然后调用该脚本中的函数。

### `modem_util.sh`

-   **用途**: 一个包含其他脚本使用的通用辅助函数的库。
-   **关键函数**:
    -   `at <device> <command>`: 使用 `tom_modem` 向指定端口发送AT命令。
    -   `fastat <device> <command>`: 发送一个带有短超时的AT命令，用于在扫描期间进行快速检查。
    -   `m_debug <message>`: 向系统日志写入调试消息。

### `vendor/` 目录

-   **`dynamic_load.json`**: 一个简单的JSON文件，将供应商名称（例如 "quectel"）映射到其对应的脚本文件（例如 "quectel.sh"）。
-   **`<vendor_name>.sh`**: 这些脚本包含特定品牌调制解调器的具体AT命令实现。例如，`quectel.sh` 知道如何使用Quectel特定的AT命令来获取信号强度或设置锁频。
-   **`generic.sh`**: 提供一组默认函数。如果某个函数在特定的供应商脚本中未实现，系统将回退到 `generic.sh` 中的函数。

## 6. 适配新调制解调器（高级）

适配新调制解调器涉及让 `qmodem` 了解其特性和命令。

### 情况1：来自现有供应商的新型号

如果调制解调器来自已经支持的供应商（例如，一个新的Quectel型号），过程会更简单。

1.  **识别型号名称**: 使用 `tom_modem` 或其他工具向调制解调器的AT端口发送 `AT+CGMM` 以获取其型号名称。
2.  **更新 `modem_support.json`**: 为您的型号添加一个新条目。您可以从同一供应商和平台复制一个现有的条目。
    -   指定其 `manufacturer`、`platform`、支持的 `modes`（qmi, mbim等）以及可用的频段。
3.  **测试**: 运行 `modem_scan.sh scan`，看调制解调器是否被正确检测和配置。如果某些功能（如锁频）使用的AT命令与该供应商的其他型号不同，您将需要修改 `vendor/<vendor_name>.sh` 中的供应商脚本，根据 `$modem_name` 或 `$platform` 变量添加条件逻辑。

### 情况2：新供应商

如果调制解调器来自一个全新的供应商，您需要创建一个新的供应商集成。

1.  **创建供应商脚本**:
    -   创建一个新文件：`/usr/share/qmodem/vendor/<new_vendor>.sh`。
    -   最佳实践是复制 `/usr/share/qmodem/vendor/generic.sh` 作为模板。这确保您拥有所有必需的函数存根。
2.  **更新 `dynamic_load.json`**:
    -   添加一个条目，将您的新供应商名称映射到您刚刚创建的脚本文件。
    -   `"<new_vendor>": "<new_vendor>.sh"`
3.  **实现供应商函数**:
    -   编辑您的新 `<new_vendor>.sh` 文件。您必须实现获取信息和控制调制解调器的函数。请参考供应商的AT命令手册。
    -   **需要实现的关键函数**:
        -   `get_imei`
        -   `get_mode` / `set_mode`
        -   `get_network_prefer` / `set_network_prefer`
        -   `get_lockband` / `set_lockband`
        -   `base_info` (收集固件、制造商等基本信息)
        -   `sim_info` (收集SIM状态、IMSI、ICCID)
        -   `network_info` (收集网络类型、信号强度)
        -   `cell_info` (收集详细的小区基站信息)
        -   `get_neighborcell` / `set_neighborcell` (用于锁小区)
4.  **更新 `modem_support.json`**: 为新型号添加一个条目，引用您的新 `manufacturer` 名称。

### 如何禁用不支持的功能

如果调制解调器不支持特定功能，您可以禁用其对应的UI元素。这是通过在供应商的脚本文件（`/usr/share/qmodem/vendor/<vendor_name>.sh`）中的 `vendor_get_disabled_features` 函数中添加逻辑来控制的。

`modem_ctrl.sh` 脚本会调用此函数，然后前端JavaScript会读取返回的被禁用功能的列表，并隐藏相应的选项卡或UI元素。

#### 可禁用的功能列表

可以禁用的功能对应于“调制解调器调试”页面中的选项卡。禁用某个功能将从UI中移除其选项卡。以下是可控制的UI组件及其配置名称的列表：

| 功能名称 (UI选项卡) | 配置名称       | 描述                               |
| ------------------- | -------------- | ---------------------------------- |
| 拨号模式            | `DialMode`     | 禁用“拨号模式”选择选项卡。         |
| 网络偏好            | `RatPrefer`    | 禁用“网络偏好”选择选项卡。         |
| 设置IMEI            | `IMEI`         | 禁用“设置IMEI”选项卡。             |
| 邻近小区            | `NeighborCell` | 禁用“邻近小区”选项卡。             |
| 锁定频段            | `LockBand`     | 禁用“锁定频段”选项卡。             |
| 重启调制解调器      | `RebootModem`  | 禁用“重启调制解调器”选项卡。       |
| AT调试              | `AtDebug`      | 禁用“AT调试”选项卡。               |

#### 禁用策略与示例

您可以实现不同粒度的逻辑来禁用功能。

**1. 为整个供应商禁用**

要为特定供应商的所有调制解调器禁用某个功能，只需将该功能的配置名称添加到 `vendor_get_disabled_features` 函数中。

*示例：为所有 "ExampleVendor" 的调制解调器禁用短信和电压功能。*
```sh
# 在 /usr/share/qmodem/vendor/example_vendor.sh 中

vendor_get_disabled_features() {
    json_add_string "" "IMEI"
    json_add_string "" "RebootModem"
}
```

**2. 为特定平台禁用**

如果某个供应商只有特定的平台（例如 `qualcomm`, `unisoc`）缺少某个功能，您可以根据 `$platform` 变量添加条件逻辑。

*示例：为 `unisoc` 平台上的所有Quectel调制解调器禁用“邻近小区”功能。*
```sh
# 在 /usr/share/qmodem/vendor/quectel.sh 中

vendor_get_disabled_features() {
    if [ "$platform" = "unisoc" ]; then
        json_add_string "" "NeighborCell"
    fi
}
```

**3. 为特定型号禁用**

要针对单个调制解调器型号，请使用 `$modem_name` 变量。

*示例：为 "RM500U-CN" 型号禁用锁频段功能。*
```sh
# 在 /usr/share/qmodem/vendor/quectel.sh 中

vendor_get_disabled_features() {
    if [ "$modem_name" = "rm500u-cn" ]; then
        json_add_string "" "LockBand"
    fi
    
    # 您可以组合条件
    if [ "$platform" = "unisoc" ]; then
        json_add_string "" "NeighborCell"
    fi
}
```
