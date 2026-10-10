# QModem VoIP architecture

## Goals and boundaries

`qmodem_voip` is a small, fail-closed voice application layered beside QModem.
It reuses QModem's AT transport and modem discovery instead of opening another
control TTY. The application owns voice capability gating, one call state
machine, media conversion, LAN SIP registration, browser attachment, and
crash-safe restoration of modem settings.

The following remain outside its scope:

- PBX features, multiple extensions, queues, recording, or external SIP trunks;
- host-side IMS registration or replacement of modem firmware signaling;
- generic claims that all variants of a modem family support voice;
- copied QModem, LuCI, or product-specific implementation code.

## Component ownership

| Component | Responsibility |
| --- | --- |
| QModem / `ubus-at-daemon` | AT-port ownership, command serialization, URC delivery, and modem identity |
| `qmodem_voip_modem_safety` | Exact capability probe, baseline journal, configuration convergence, and restoration |
| `qmodem_voip` daemon | Call state, ubus API, event ordering, media ownership, browser token issuance, and RTP attachment |
| LAN SIP registrar | One authenticated LAN contact and the SIP-to-cellular call bridge |
| `luci-app-qmodem-voip` | Theme-compatible administrative UI, ACL declarations, polling, and browser audio client |
| Product workspace | Package selection, firmware build, deployment, and device-specific acceptance evidence |

The application feed owns application code. QModem owns modem-core and
transport changes. Workspace repositories may select packages and retain test
orchestration, but must not become a second source of runtime implementation.

## Control and media paths

```text
LuCI / LAN SIP client
        |
        | ubus call control or authenticated SIP
        v
  qmodem_voip daemon
        |                         media owner (one at a time)
        | AT commands             +-- browser WSS
        |                         +-- LAN SIP RTP (PCMA/PCMU)
        v
  ubus-at-daemon                         |
        |                                v
        +--> modem control TTY     canonical PCM
                                  S16LE, mono, 8 kHz, 20 ms
                                         |
                                         v
                              serial PCM or explicit UAC backend
                                         |
                                         v
                                   modem voice DSP
```

IMS/VoLTE signaling stays in modem firmware. Host software selects the
documented vendor voice mode, originates or answers through AT commands, and
bridges the modem's usable audio function. An IMS setting or successful `ATD`
does not prove that this audio path exists.

## Capability and safety model

Support is selected from `modem_supports.json` by exact model, firmware, and
USB ID. A profile also declares its media method and all backend-specific
parameters. Unknown or mismatched hardware fails closed before any modem
mutation.

Enabling voice is a transaction:

1. Probe modem identity, SIM readiness, registration, and operator profile.
2. Capture volatile modem and USB settings in a checksummed journal.
3. Apply IMS, voice, audio-routing, and USB-composition changes in phases.
4. Rediscover endpoints by USB slot and interface identity after re-enumeration.
5. Read back the selected media forwarding state before exposing call control.
6. On failure or disable, restore the journaled baseline and reboot/re-enumerate
   when required.

Startup recovery inspects the journal. A completed voice configuration is
reconverged; an interrupted transaction is restored. A corrupt or incomplete
journal is a fault, not permission to guess the previous modem state.

## Call state and ordering

There is one call slot. Public states are:

```text
disabled -> idle -> outgoing_setup -> early_media -> active
                \-> incoming_ringing -----------/
active or setup -> terminating -> idle
any enabled state -> recovering or fault
```

The recognized endpoints are `browser`, `lan_sip`, `cellular`, and the reserved
`external_sip`. External SIP is deliberately unsupported. For incoming calls,
the first browser or LAN SIP answer wins atomically and becomes
`answer_owner`. Duplicate termination in `idle` or `terminating` is
idempotent and must not send a second hangup command.

`revision` identifies call-state changes. `restart_epoch`, `sequence`, and
`drop_count` independently describe the modem event stream. A restart or
sequence gap enters `recovering`, emits an `event_gap`, and requires a
correlated `CLCC` reconciliation. Clients must discard assumed continuity and
request a fresh snapshot.

Only mode-0 `CLCC` entries are voice calls. Packet-data mode-1 entries must not
create an active call or block cleanup. A command response such as `ATD: OK` is
only command acceptance; the target mode-0 entry is the call-state evidence.

## Media architecture

All endpoints convert through one canonical format: signed 16-bit little-endian
mono PCM, 8 kHz, 20 ms frames. Backend-specific transfer units remain outside
the canonical contract. For example, a serial backend may aggregate several
20 ms frames into a larger USB transfer and carry the remainder in a byte FIFO.

Only one local media owner may attach to a call. Browser media uses an
authenticated, short-lived WSS token. LAN SIP uses negotiated PCMA or PCMU RTP.
Session release clears application queues, aggregation tails, deadlines, and
kernel-side completed-call data without surrendering exclusive ownership of a
serial PCM TTY.

Media readiness is not equivalent to call success. Acceptance requires
sustained modem RX and TX, RTP or browser-frame flow in both directions,
non-silent content or a known tone, a mode-0 active call, and bounded teardown
back to `idle`.

## Security and privacy

- rpcd ACLs separate read-only status from administrative mutations.
- The daemon validates payload, endpoint, state, capability, and media-owner
  constraints; the browser UI is not a security boundary.
- Dialed and calling numbers are accepted only where required and are never
  emitted in public status or event payloads. Snapshots expose only
  `number_present` and `caller_id_withheld`.
- SIP passwords and digest material are write-only. Media tokens are random,
  single-use, expire after 30 seconds, and are bound to session, call revision,
  HTTPS origin, and connection context.
- SIP and browser media listeners are LAN-bound by product configuration.
  Credentials, phone numbers, packet captures, and device logs do not belong in
  source control.
