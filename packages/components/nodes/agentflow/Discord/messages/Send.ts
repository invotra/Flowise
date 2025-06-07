import { INodeParams, INodeData, ICommonObject } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import axios from 'axios'
import { DiscordSendMessageOutput, DiscordMessage } from '../types'

/**
 * Discord Send Message
 */
export class DiscordSendMessage {
    public static MODE = 'send'
    name: string
    constructor(name: string) {
        this.name = name
    }

    inputs: INodeParams[] = [
        {
            label: 'Message Content',
            name: 'content',
            type: 'string',
            description: 'Text content of the message (required if no embeds)',
            optional: true,
            rows: 4,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Reply to Message ID',
            name: 'replyToMessageId',
            type: 'string',
            description: 'Message ID to reply to (optional)',
            optional: true,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed Title',
            name: 'embedTitle',
            type: 'string',
            description: 'Title for embed (optional)',
            optional: true,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed Description',
            name: 'embedDescription',
            type: 'string',
            description: 'Description for embed (optional)',
            optional: true,
            rows: 3,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed Color',
            name: 'embedColor',
            type: 'string',
            description: 'Hex color for embed (e.g. #FF0000 or 16711680)',
            optional: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed URL',
            name: 'embedUrl',
            type: 'string',
            description: 'URL for embed title link (optional)',
            optional: true,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed Thumbnail URL',
            name: 'embedThumbnail',
            type: 'string',
            description: 'Thumbnail image URL for embed (optional)',
            optional: true,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        },
        {
            label: 'Embed Image URL',
            name: 'embedImage',
            type: 'string',
            description: 'Main image URL for embed (optional)',
            optional: true,
            acceptVariable: true,
            show: {
                mode: [DiscordSendMessage.MODE]
            }
        }
    ]

    async run(nodeData: INodeData, runId: string, options: ICommonObject): Promise<DiscordSendMessageOutput> {
        // 1. Fetch credentials
        const creds = await getCredentialData(nodeData.credential ?? '', options)
        const botToken = getCredentialParam('botToken', creds, nodeData) as string
        const apiVersion = (getCredentialParam('apiVersion', creds, nodeData) as string) || 'v10'

        if (!botToken?.trim()) {
            throw new Error('Bot token is missing from credentials')
        }

        // 2. Read inputs
        const { channelId, content, replyToMessageId, embedTitle, embedDescription, embedColor, embedUrl, embedThumbnail, embedImage } =
            nodeData.inputs as Record<string, any>

        // 3. Validate inputs
        if (!channelId?.trim()) {
            throw new Error('Channel ID is required and cannot be empty')
        }

        if (!/^\d{17,19}$/.test(channelId.trim())) {
            throw new Error('Channel ID must be a valid Discord snowflake (17-19 digit number)')
        }

        // 4. Build message payload
        const payload: any = {}

        // Add content if provided
        if (content?.trim()) {
            payload.content = content.trim()
        }

        // Build embed if embed fields are provided
        const hasEmbedContent = embedTitle || embedDescription || embedColor || embedUrl || embedThumbnail || embedImage
        if (hasEmbedContent) {
            const embed: any = {}

            if (embedTitle?.trim()) embed.title = embedTitle.trim()
            if (embedDescription?.trim()) embed.description = embedDescription.trim()
            if (embedUrl?.trim()) embed.url = embedUrl.trim()

            // Handle color (hex string or number)
            if (embedColor?.trim()) {
                const colorStr = embedColor.trim()
                if (colorStr.startsWith('#')) {
                    embed.color = parseInt(colorStr.slice(1), 16)
                } else if (/^\d+$/.test(colorStr)) {
                    embed.color = parseInt(colorStr, 10)
                } else {
                    throw new Error('Embed color must be a hex color (#FF0000) or decimal number')
                }
            }

            if (embedThumbnail?.trim()) {
                embed.thumbnail = { url: embedThumbnail.trim() }
            }

            if (embedImage?.trim()) {
                embed.image = { url: embedImage.trim() }
            }

            payload.embeds = [embed]
        }

        // Add reply reference if provided
        if (replyToMessageId?.trim()) {
            if (!/^\d{17,19}$/.test(replyToMessageId.trim())) {
                throw new Error('Reply message ID must be a valid Discord snowflake')
            }
            payload.message_reference = {
                message_id: replyToMessageId.trim(),
                channel_id: channelId.trim()
            }
        }

        // Validate that we have either content or embeds
        if (!payload.content && !payload.embeds) {
            throw new Error('Message must have either content or embed data')
        }

        // 5. Send message via Discord API
        const url = `https://discord.com/api/${apiVersion}/channels/${channelId}/messages`

        let sentMessage: DiscordMessage
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    Authorization: `Bot ${botToken}`,
                    'Content-Type': 'application/json'
                }
            })
            sentMessage = response.data
        } catch (err: any) {
            if (!err.response) {
                throw new Error(`Network error when contacting Discord: ${err.message}`)
            }

            const status = err.response?.status
            const detail = err.response?.data ?? err.message

            // Handle specific Discord API errors
            if (status === 403) {
                throw new Error('Bot lacks permission to send messages in this channel')
            } else if (status === 404) {
                throw new Error('Channel not found or bot cannot access it')
            } else if (status === 401) {
                throw new Error('Invalid bot token')
            } else if (status === 429) {
                const retryAfter = err.response?.headers['retry-after']
                throw new Error(`Discord API rate limited. Retry after ${retryAfter} seconds`)
            } else if (status === 400) {
                throw new Error(`Invalid message data: ${JSON.stringify(detail)}`)
            }

            throw new Error(`Discord API Error (${status}): ${JSON.stringify(detail)}`)
        }

        // 6. Return structured output
        return {
            id: nodeData.id,
            name: this.name,
            input: {
                form: {
                    channelId,
                    content,
                    replyToMessageId
                }
            },
            output: {
                form: {
                    message: sentMessage,
                    metadata: {
                        channelId,
                        messageId: sentMessage.id,
                        sentAt: sentMessage.timestamp,
                        isReply: !!replyToMessageId
                    }
                }
            },
            state: options.agentflowRuntime?.state as ICommonObject
        }
    }
}

module.exports = { nodeClass: DiscordSendMessage }
