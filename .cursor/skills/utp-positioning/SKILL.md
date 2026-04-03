---
name: utp-positioning
description: Defines Annet Cloud positioning and pricing communication for user-facing copy. Use when writing or reviewing onboarding, tariff texts, promo copy, bot messages, or landing content related to UTP, access model, invite links, and start codes.
---

# UTP positioning for Annet Cloud

## Purpose

Use this skill to keep all user-facing communication aligned with the product strategy:

- soft premium pricing
- closed start code for first month
- public bot entry with gated purchase flow (invite link or code)
- small "for own users" service positioning

This skill complements legal copy rules and focuses on positioning consistency.

## Core positioning

Describe Annet Cloud as:

- a small personal service with controlled load
- protected access and traffic encryption
- calm service quality without mass-market mechanics

Avoid "secret service" framing. Do not promise immunity from blocks, restrictions, or regulation.

## Product facts to anchor copy

Use these as canonical product facts:

- Public plans:
  - `1 month - 399 RUB`
  - `6 months - 1890 RUB`
  - `12 months - 3290 RUB`
- Closed start code:
  - first payment only
  - only for `1 month` plan
  - start price `299 RUB`
- Access model:
  - bot entry is public
  - start offer and purchase are available via invite link or valid code
  - fallback is support request

## Message pillars

Build copy around these pillars:

1. Small service, controlled load
2. Personal service over conveyor-style mass flow
3. Stronger value on long periods
4. Closed start mechanics instead of public endless discounts

## Language guardrails

For user-visible RU copy:

- Use neutral security language: protection, encryption, safe connection, privacy.
- Do not use claims about bypassing restrictions or opening blocked resources.
- Do not use wording like "we will not be blocked because we are small."
- No emoji in user-facing texts.

When writing text for bot handlers/keyboards, follow:

- `.cursor/rules/user-facing-copy-rf.mdc`

## Preferred offer framing

Use these framing patterns:

- "Small service with controlled load"
- "Personal format for own users"
- "Closed start via invite or code"
- "Long period is meaningfully cheaper per month"

Avoid generic weak claims:

- "stable speed" as a standalone USP
- "best quality" without evidence
- "cheap for everyone"

## Output templates

### Template: short UTP block (2-3 lines)

```text
Annet Cloud is a small personal service for protected access with controlled load.
We keep a calm quality format instead of mass flow.
Start access is opened by invite link or start code.
```

### Template: tariff card copy

```text
Plans:
- 1 month - 399 RUB
- 6 months - 1890 RUB
- 12 months - 3290 RUB

Long periods provide stronger monthly value.
Start code unlocks first-month start price 299 RUB.
```

### Template: gated purchase explanation

```text
Purchase is opened by invite link or start code.
If you already have a code, enter it in the bot.
If not, contact support for access.
```

## Review checklist

Before finalizing copy, verify:

- [ ] Matches the four message pillars
- [ ] Uses current tariff facts (`399 / 1890 / 3290`)
- [ ] Mentions closed start code correctly (`299` first month only)
- [ ] Does not contain bypass/blocking promises
- [ ] Complies with `user-facing-copy-rf` rule
- [ ] Keeps tone "small premium service", not "mass discount service"
