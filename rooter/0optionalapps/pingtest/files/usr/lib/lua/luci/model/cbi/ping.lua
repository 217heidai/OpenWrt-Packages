local utl = require "luci.util"

local sys   = require "luci.sys"
local zones = require "luci.sys.zoneinfo"
local fs    = require "nixio.fs"
local conf  = require "luci.config"

m = Map("ping", translate("Custom Ping Test"), translate("Enable/Disable Custom Ping Test"))

d = m:section(TypedSection, "ping", " ")
d.anonymous = true

c1 = d:option(ListValue, "enable", "Ping Test Status : ", "Ping every 20 seconds and, if it fails, restart modem or reboot router");
c1:value("0", "Disabled")
c1:value("1", "Enabled")
c1.default=0

interval = d:option(Value, "interval", translate("Test Interval :"), translate("Number of seconds between testing the connection. Range is 20 to 120 secs.")); 
interval.rmempty = true;
interval.optional=false;
interval.datatype = 'range(20,120)';
interval.default="20";

type = d:option(ListValue, "type", "Test Type :", "Type of test - Page Retrieval or Ping");
type:value("0", "Ping")
type:value("1", "Page Retrieval")
type.default=1

d1 = d:option(ListValue, "delay", "Reconnection Delay","Delay in seconds after restarting modem before checking for connection");
d1:value("40", "40 seconds")
d1:value("45", "45 seconds")
d1:value("50", "50 seconds")
d1:value("55", "55 seconds")
d1:value("60", "60 seconds")
d1:value("70", "70 seconds")
d1:value("80", "80 seconds")
d1:value("90", "90 seconds")
d1:value("100", "100 seconds")
d1:value("120", "120 seconds")
d1.default=40

return m