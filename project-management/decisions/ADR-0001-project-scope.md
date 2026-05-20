# ADR-0001 — Project Scope

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

This repository is being prepared as an interview portfolio project that needs to be built, deployed, and demo-ready within nine days. The goal is to demonstrate full-stack engineering ability, not to reproduce the entire Discord product surface.

A full Discord clone would immediately expand the scope into voice, video, complex permissions, moderation, uploads, direct messages, and large-scale UX concerns that do not fit the timeline.

## Decision

This project will be a Discord-inspired real-time team chat PWA, not a full Discord clone.

The MVP will focus on:

- JWT authentication
- Workspace membership
- Owner/member authorization
- Text channels
- Persisted MongoDB messages
- Socket.IO real-time delivery
- PWA installability
- Public deployment and demo readiness

## Consequences

### Positive

- The scope is small enough to finish credibly in nine days.
- The product can be explained as a polished vertical slice with clear tradeoffs.
- Engineering time stays focused on the highest interview-value features.
- Deployment and documentation remain achievable instead of becoming afterthoughts.

### Negative

- The feature set will be visibly narrower than Discord.
- Some users may assume missing features unless the scope is explained clearly.
- A smaller MVP requires intentional positioning to avoid underselling the work.

## Non-goals

The following are explicitly out of scope for the nine-day MVP:

- Voice chat
- Video chat
- Screen sharing
- Direct messages
- Message reactions
- File uploads
- Image uploads
- Advanced permissions matrix
- Push notifications
- Bots
- Threads
- End-to-end encryption
- Complex moderation systems
- Any attempt to fully clone Discord behavior

## Interview Value

This decision improves the project's interview value because it demonstrates judgment. The strongest story is not “I tried to build everything.” It is “I chose a realistic scope, completed it end to end, documented the tradeoffs, and deployed something I can confidently explain and demo.”

