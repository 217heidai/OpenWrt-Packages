# OpenWrt-Packages
常用 ImmortalWrt 软件包收集

## 注意事项

1. 适用于 ImmortalWrt 25.12 版本。

## 作为 Feed 引用（推荐）

在 ImmortalWrt 源码根目录 `feeds.conf`（或 `feeds.conf.default`）**开头**插入一行：

    src-git zz_openwrtpackages https://github.com/217heidai/OpenWrt-Packages.git;openwrt-25.12

然后执行：

    ./scripts/feeds update zz_openwrtpackages
    ./scripts/feeds install -a

之后即可在 `make menuconfig` 中按包名选择安装。

### Feed 使用注意事项

1. 必须使用与分支对应的 ImmortalWrt 版本编译（本分支对应 25.12）。
2. 本 feed 部分包与 ImmortalWrt 的 packages/luci feed 同名（如 golang、smartdns、mosdns、xray-core、luci-theme-argon、luci-app-smartdns 等），`feeds install` 对同名包按 `feeds.conf` 行序先到先得，本行必须放在官方 feeds **之前**才能让本 feed 版本生效；feed 名只能使用 `[A-Za-z0-9_]`（勿加连字符），`zz_` 前缀可保证多 feed 并存时构建扫描也排在官方之后。
3. ImmortalWrt 的 packages / luci / routing feed 必须保留，`luci-*` 等包依赖 `luci-base`。
4. 本地调试可用 `src-link` 直连本仓库：`src-link zz_openwrtpackages /本地路径/OpenWrt-Packages`。

## 软件清单

|软件|分支|作者|功能|包类型|更新日期|
|:-|:-|:-|:-|:-|:-|
|[luci-theme-argon](https://github.com/jerrykuku/luci-theme-argon)|master|jerrykuku|argon 主题|single|20261009|
|[luci-app-argon-config](https://github.com/jerrykuku/luci-app-argon-config)|master|jerrykuku|argon 主题配置插件|single|20261009|
|[luci-app-store](https://github.com/linkease/istore)|main|linkease|istore 应用市场|multi|20260925|
|[luci-app-netwizard](https://github.com/sirpdboy/luci-app-netwizard)|main|sirpdboy|设置向导|multi|20260312|
|[luci-app-partexp](https://github.com/sirpdboy/luci-app-partexp)|main|sirpdboy|分区管理|multi|20260330|
|[luci-app-taskplan](https://github.com/sirpdboy/luci-app-taskplan)|main|sirpdboy|定时任务|multi|20260312|
|[luci-app-eqosplus](https://github.com/sirpdboy/luci-app-eqosplus)|main|sirpdboy|定时限速|single|20260310|
|[luci-app-parentcontrol](https://github.com/sirpdboy/luci-app-parentcontrol)|main|sirpdboy|家长控制|single|20260304|
|[luci-app-ddns-go](https://github.com/sirpdboy/luci-app-ddns-go)|main|sirpdboy|ddns|multi|20260623|
|[luci-app-adguardhome](https://github.com/rufengsuixing/luci-app-adguardhome)|master|rufengsuixing|adguardhome|single|20200113|
|[luci-app-smartdns](https://github.com/pymumu/luci-app-smartdns)|master|pymumu|smartdns luci 界面|single|20260708|
|[smartdns](https://github.com/pymumu/openwrt-smartdns)|master|pymumu|smartdns|single|20260701|
|[luci-app-mosdns](https://github.com/sbwml/luci-app-mosdns)|v5|sbwml|mosdns|multi|20260913|
|[v2ray-geodata](https://github.com/sbwml/v2ray-geodata)|master|sbwml|mosdns 依赖|single|20250125|
|[luci-app-passwall](https://github.com/Openwrt-Passwall/openwrt-passwall)|main|Openwrt-Passwall|passwall|multi|20261009|
|[luci-app-passwall2](https://github.com/Openwrt-Passwall/openwrt-passwall2)|main|Openwrt-Passwall|passwall2|multi|20261003|
|[passwall-packages](https://github.com/Openwrt-Passwall/openwrt-passwall-packages)|main|Openwrt-Passwall|passwall、passwall2 依赖|multi|20261009|
|[luci-app-gecoosac](https://github.com/laipeng668/luci-app-gecoosac)|main|laipeng668|集客 AC|multi|20260913|
|[luci-app-lucky](https://github.com/gdy666/luci-app-lucky)|main|gdy666|lucky 插件|multi|20261005|
|[luci-app-easytier](https://github.com/EasyTier/luci-app-easytier)|main|EasyTier|EasyTier 插件|multi|20260925|
|[qmodem](https://github.com/FUjr/QModem)|main|FUjr|5G/4G Modem 管理套件（应用+LuCI+内核驱动，整库 33 包）|project|20260919|
