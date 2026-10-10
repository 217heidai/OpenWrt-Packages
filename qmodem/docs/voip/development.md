# QModem VoIP development guide

## Repository split

Use the repository that owns the change:

| Change | Owning repository |
| --- | --- |
| AT daemon, modem discovery, common vendor transport | `FUjr/QModem` |
| Voice daemon, modem safety profiles, SIP/RTP/media, LuCI package | independent `qmodem-voip` feed |
| Firmware package selection, build/deployment orchestration | product workspace |

Do not copy implementations between these repositories. When a voice
experiment discovers a transport defect, reduce it to a QModem change with its
own transport tests. Product-specific configuration stays in the product
workspace.

## Application layout

The independent feed uses this layout:

```text
application/qmodem-voip/
  files/etc/config/qmodem_voip
  files/etc/init.d/qmodem_voip
  files/usr/lib/qmodem_voip/       safety and AT adapters
  files/usr/share/qmodem_voip/     exact hardware capability registry
  src/                             daemon, call state, SIP, RTP and media
luci/luci-app-qmodem-voip/         LuCI view, ACL and frontend tests
tests/                             host fixtures and repository checks
docs/                              implementation-local design records
```

Runtime identifiers use `qmodem_voip`; OpenWrt packages use `qmodem-voip` and
`luci-app-qmodem-voip`.

## Development workflow

1. Inspect both QModem and application worktrees before editing. Preserve
   unrelated changes and stage explicit paths.
2. Establish the exact modem identity: model, firmware, USB ID, USB slot,
   interface numbers, endpoint descriptors, and active operator profile.
3. Perform read-only capability checks first. Treat advertised AT ranges as
   hints until exact values pass set/read-back and live media tests.
4. Add backend parameters to the capability registry. Do not introduce global
   serial or UAC constants for settings that vary by modem profile.
5. Extend pure host fixtures for parser, state, recovery, media framing, and
   failure behavior before device mutation.
6. Build the package from a clean package state. Record the artifact hash and
   confirm the installed binary hash so a successful incremental build cannot
   hide a stale artifact.
7. Run device tests in layers and retain the verdict at each layer. A later
   failure must not be summarized as complete voice support.
8. Restore the modem baseline, terminate calls, detach media, remove temporary
   credentials and captures, and verify the data connection after testing.

## Static and host validation

Run the checks required by the application repository after each relevant
change:

```sh
sh -n application/qmodem-voip/files/etc/init.d/qmodem_voip
sh -n application/qmodem-voip/files/usr/lib/qmodem_voip/at_daemon_adapter.sh
sh -n application/qmodem-voip/files/usr/lib/qmodem_voip/modem_safety.sh
node --check luci/luci-app-qmodem-voip/htdocs/luci-static/resources/qmodem-voip/contract.js
node --check luci/luci-app-qmodem-voip/htdocs/luci-static/resources/qmodem-voip/reducer.js
sh tests/repository-contract.sh
sh tests/call-state.sh
sh tests/modem-safety.sh
sh tests/media.sh
sh tests/serial-media.sh
sh tests/rtp-media.sh
sh tests/sip-gateway.sh
sh luci/luci-app-qmodem-voip/tests/contract.sh
git diff --check
```

Run additional focused fixtures for browser media, startup recovery, SIP
activation, and the affected backend. Host fixtures prove deterministic logic;
they do not prove modem firmware behavior.

## Adding a modem profile

A profile is eligible only when all of these are known:

- exact model, firmware, and USB identity;
- stable sysfs/interface identity for AT and audio endpoints;
- voice enable/disable and IMS behavior with read-back;
- media method (`serial_pcm` or `uac`) and its exact sample format;
- backend routing commands and restore values;
- re-enumeration requirements and bounded recovery behavior;
- operator registration prerequisites;
- two consecutive real calls with sustained bidirectional media and clean
  teardown.

For serial PCM, measure endpoint packet sizes, processing unit, pacing,
short-write behavior, simultaneous drain/write requirements, and multi-call
buffer reset. For UAC, record the actual ALSA capture/playback devices and
rates after every supported USB composition.

## Device acceptance matrix

Record each layer separately:

| Layer | Required evidence |
| --- | --- |
| Build | clean package build, artifact path and SHA-256 |
| Install | installed package/version and runtime binary hash |
| Capability | exact model/firmware/USB/profile match and successful read-only probe |
| Configuration | journaled baseline, set/read-back, re-enumerated endpoint identity |
| Signaling | authenticated SIP or browser action, AT command result, target mode-0 `CLCC` |
| Downlink | sustained modem PCM reads and packets/frames delivered to the local endpoint |
| Uplink | sustained packets/frames received locally and modem PCM writes without a plateau |
| Content | non-silent RMS or known-frequency evidence, plus far-end confirmation when available |
| Repetition | at least two consecutive calls without stale buffers or ownership leaks |
| Teardown | BYE/hangup, bounded `CHUP`, no mode-0 `CLCC`, state returns to `idle` |
| Restore | baseline restored and normal data service healthy |

Never collapse these layers into a single PASS. In particular, SIP `200`, AT
`OK`, packet counters, or a successful host test do not establish bidirectional
cellular audio.

## LuCI integration

Register the generic page under `admin/modem/qmodem`. Use LuCI-native
`ui.Textfield`, `ui.Checkbox`, `ui.showModal()`/`ui.hideModal()`, standard
`cbi-*` classes, and theme variables. Keep read-only ACL methods separate from
administrative call and credential methods. Test narrow/mobile and desktop
layouts, keyboard access, disabled reasons, permission denial, unsupported
hardware, recovery, and fault states.
