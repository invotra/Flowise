## Overview

The **Discord** Agentflow node provides two main capabilities within an Agentflow V2 workflow:

1. **Retrieve Messages** from a Discord channel
2. **Send Messages** to a Discord channel

------

## Prerequisites

- A **Discord Bot** with a valid Bot Token and appropriate channel permissions, such as the Message Content Intent which is required for your bot to receive message contents.
- A Flowise “Credential” entry named e.g. `discordBot` that holds:
  - `botToken` (your Discord Bot token)
  - `apiVersion` (optional; default `v10`)

------

## Configuration

1. In the Flowise UI, go to **Settings → Credentials**, click **“Add credential”**, and choose a **Discord Bot** credential type.
2. Name it `discordBot` (or your preferred key) and paste in:
   - **Bot Token**
   - *(Optional)* API Version (e.g. `v10`)

------

## Component Inputs

| Parameter         | Type   | Required | Description                                                  |
| ----------------- | ------ | -------- | ------------------------------------------------------------ |
| `channelId`       | string | ✓        | Discord channel ID (17–19 digit snowflake)                   |
| `mode`            | enum   | ✓        | Operation: `retrieve` or `send`                              |
| **Retrieve Mode** |        |          | **Additional inputs:** `limit`, `beforeId`, `afterId`, `aroundId` |
| **Send Mode**     |        |          | **Additional inputs:** `content`, `replyToMessageId`, `embedTitle`, `embedDescription,embedColor, embedDescription, embedThumbnail, embedImage` fields |

## Common Inputs

- **channelId**
   The Discord channel’s unique Snowflake ID (a 64-bit integer as a string). It must be a 17–19 digit number matching the Snowflake format; this ID tells Discord which channel to target.
- **mode**
   An enum selecting the operation:
  - `retrieve` → fetch messages
  - `send` → post a new message

## Retrieve Mode Inputs

These fields only apply when `mode` = `retrieve`:

- **limit** (`number`, default `50`)
   Maximum number of messages to return in one call. Discord’s API allows `1 ≤ limit ≤ 100`; values outside this range will produce a 400 error
- **beforeId** (`string`, optional)
   A Snowflake. When provided, only messages with an ID *less than* this value are returned. Exactly one of `beforeId`/`afterId`/`aroundId` may be set at a time
- **afterId** (`string`, optional)
   A Snowflake. When provided, only messages with an ID *greater than* this value are returned (useful for “newer-than” pagination)
- **aroundId** (`string`, optional)
   A Snowflake. When provided, returns messages *around* this ID (up to half before/half after, bounded by `limit`)

## Send Mode Inputs

These fields only apply when `mode` = `send`:

- **content** (`string`, required)
   The plain-text body of your message. Discord limits this to 2,000 characters per message; exceeding it causes the API to reject
- **replyToMessageId** (`string`, optional)
   If set, your message will thread as a reply to the given Snowflake ID. Under the hood it populates the `message_reference` field in the API payload
- **embedTitle** (`string`, optional)
   If you’re sending an embed, this is the main title text. Must not exceed 256 characters or the API will return an error
- **embedDescription** (`string`, optional)
   The body text of your embed. Limited to 4,096 characters by Discord’s embed object spec
- **embedColor** (`string`, optional)
   The sidebar color for your embed. Accepts either a hex string (e.g. `#FF0000`) or a decimal number. The API field is numeric under the hood
- **embedUrl** (`string`, optional)
   Makes the `embedTitle` text a hyperlink to this URL. Must be a valid HTTPS/HTTP URL
- **embedThumbnail** (`string`, optional)
   A small image shown in the top right of the embed. Provide a direct URL; Discord fetches it at send time
- **embedImage** (`string`, optional)
   A larger image embedded below the description. Provide a direct URL; Discord fetches it at send time

------

## Outputs

- **Retrieve Messages** returns an array of `DiscordMessage` objects plus pagination metadata.
- **Send Message** returns the newly posted `DiscordMessage` object plus sending metadata.

