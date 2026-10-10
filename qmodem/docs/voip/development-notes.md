# QModem VoIP development notes

## Status of these notes

These notes preserve reusable findings from the RM520N-GL serial PCM
experiment. They are not a support declaration. Production voice support for
this module and firmware remains unconfirmed until the exact target passes the
complete repeated-call acceptance matrix.

## Tested identity

- Module: Quectel RM520N-GL
- Firmware: `RM520NGLAAR03A03M4G`
- USB ID: `2c7c:0801`
- PCM USB interface number: `01`
- Canonical media: mono signed 16-bit little-endian PCM, 8 kHz, 20 ms
- Selected media backend: `serial_pcm`; UAC disabled for this profile

TTY basenames changed across USB compositions and reboots. Both control and PCM
ports must be resolved from USB slot and interface identity. Persisting a path
such as `/dev/ttyUSB1` or `/dev/ttyUSB4` is incorrect.

## Hardware and registration observations

Initial inspection showed a ready SIM but no service, IMS disabled, an
unsupported IMS-registration query, and voice disabled. Generic product-family
material described voice as optional, which did not establish support for this
SKU. The experiment therefore continued as a narrowly scoped engineering test,
not as evidence that the modem is a supported production voice device.

The runtime safety probe now requires exact identity, SIM readiness, LTE or NR
registration, an allowed operator MBN, a parseable IMS state, and successful
endpoint rediscovery. This is intentionally stricter than checking whether one
AT command is accepted.

## Serial PCM findings

The tested firmware exposed `QPCMV`, `qpcmv_cfg`, `QDAI`, and `QAUDMOD` controls.
Although the `QAUDMOD` test command advertised a broad numeric range, several
advertised values returned `ERROR`. Live data established mode 2 as the usable
serial PCM route for this exact firmware; mode 1 produced a silent or stalled
path.

The working profile used 1024-byte transfers. At 8 kHz mono S16LE, 1024 bytes
represent 512 samples, or 64 ms. This does not align with a 320-byte 20 ms RTP
frame, so the implementation needs a continuous byte FIFO across frame and USB
transfer boundaries. Transfer cadence is a measured per-profile parameter, not
a universal Quectel constant.

Clean read, write, and duplex experiments and two consecutive calls once showed
sustained serial and RTP movement, non-silent RMS, and clean return to idle.
This ruled out the then-proposed Linux `option`/`usb_wwan` zero-length-packet
patch: there was no A/B evidence that such a kernel change was needed.

A later build/deployment run reproduced successful SIP signaling but stalled
the media path: serial reads stopped early, writes plateaued, downlink RTP was
minimal, and a following call could not proceed. The correct overall verdict is
therefore partial. The positive experiment is useful evidence, but it does not
override the later reproducibility failure.

## Lifecycle lessons

### Keep one serial owner

The daemon should open and retain exclusive ownership of the serial PCM TTY.
Closing and reopening it around each call was not a reliable recovery mechanism
and can race modem endpoint activation. Call boundaries should reset stream
state while retaining the descriptor.

### Clear cross-call state

A 1024-byte USB aggregation buffer can retain 256, 512, or 768 bytes after
consuming 320-byte media frames. Carrying that tail into the next call shifts
the stream boundary and can make the first call work while the second fails.
Teardown must clear aggregation length, write offset, deadlines, and both media
queues. After the cellular call is confirmed released, flush completed-call
kernel input/output without closing the exclusively owned descriptor.

### Converge volatile modem state

Audio routing settings are volatile across modem reboot. Apply and verify them
after any required USB re-enumeration, and reconverge them before originate,
answer, or RTP attachment. Startup recovery must also repair a stale mixed UAC
and serial composition instead of assuming the journaled enabled phase still
matches hardware.

The validated reset form was `AT+QPCMV=0`. Do not substitute an unverified
multi-argument form copied from another documentation generation.

### Separate data and voice CLCC entries

Packet-data mode-1 `CLCC` entries are normal and must be ignored by the voice
state machine. Every outgoing test must observe the intended mode-0 entry.
Cleanup must poll and repeat bounded `CHUP` until no mode-0 entry remains; one
successful command response is not sufficient.

### Treat incremental builds as untrusted

An OpenWrt package build can exit successfully while retaining an old artifact.
Clean the package, rebuild, hash the package, install that exact file, and hash
the installed runtime binary. Also inspect `.apk-new` or equivalent preserved
conffiles, because an old init script can run with a new daemon.

## Rejected shortcuts

- Rebinding the PCM interface from `option` to `usbserial_generic` changed only
  transient buffering and did not activate a missing PCM direction.
- Adding a kernel ZLP patch without short-packet A/B evidence was not justified.
- Reading the AT TTY directly would conflict with QModem's AT-daemon ownership.
- Counting SIP `200`, AT `OK`, RTP packets, or bytes alone creates false
  positives when payload is silent, stale, unidirectional, or unrelated to a
  mode-0 call.
- Applying command sequences from older EC2x/EG9x or other RM5xx documents
  without read-back and hardware proof produced misleading partial results.

## Remaining work

Before promoting the profile beyond experimental status:

1. Reproduce two or more consecutive calls from a clean modem composition and
   the exact installed build.
2. Confirm mode-0 `CLCC`, sustained serial RX/TX, sustained RTP/browser traffic,
   packet continuity, and non-silent content for every call.
3. Measure pacing and drift over longer speech sessions rather than relying
   only on a tone test.
4. Verify incoming answer/reject, peer disconnect, stale SIP contact recovery,
   and bounded hangup behavior.
5. Complete browser audio testing over authenticated HTTPS/WSS on desktop and
   mobile browsers.
6. Restore the original modem configuration and verify normal packet data after
   every failure path.

Keep raw logs, phone numbers, SIP credentials, packet captures, artifact hashes,
and device configuration backups in protected test evidence, not in this
repository.
