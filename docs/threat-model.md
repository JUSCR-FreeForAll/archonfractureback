# JUSCR Threat Model

## 1. Core threats

### Consent spoofing
A participant may issue a token without actual mutual agreement.

Mitigation:
- Verify digital signatures.
- Require valid pairwise consent in both directions.
- Enforce expiration and revocation.

### Privilege accumulation
A participant may hoard permanent authority.

Mitigation:
- Roles are time-bounded.
- All privilege is logged and rotate by default.
- Expiration forces re-consent.

### Opacity abuse
Participants may hide loop state or make decisions non-transparently.

Mitigation:
- Public clarity endpoint.
- Loop state must be inspectable by participants.
- Opaque or unlogged loops are rejected.

### Extractive flow
Flows claim alignment while extracting resources.

Mitigation:
- Non-extractive throughput is mandatory.
- Require measurable benefit to the least-resourced participant.
- Reject unsupported scopes.
