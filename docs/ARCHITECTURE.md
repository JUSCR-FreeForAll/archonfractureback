# JUSCR Architecture

This repository provides a minimal, runnable implementation of the JUSCR mesh specification.

The architecture follows the core runtime invariants:

- Full transparency by default
- Explicit, time-bound consent
- No permanent privileged nodes
- Respect and clarity as hard constraints
- Infrastructure as a source of capacity rather than an intermediary

## Components

- API: Fastify service for loop creation, intention submission, consent issuance, and clarity reporting
- Storage: PostgreSQL schema for loops, intent vectors, consent tokens, audits, and scaffolds
- Dashboard: a lightweight HTML dashboard for loop monitoring
- Validation: runtime checks for expiry, signature presence, and mutual consent
