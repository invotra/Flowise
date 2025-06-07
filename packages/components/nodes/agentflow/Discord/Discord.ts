import { INode, INodeParams, INodeData, ICommonObject } from '../../../src/Interface'

const NAME = 'discord'
// Import the existing implementations
const { nodeClass: DiscordRetrieveMessages } = require('./messages/Retrieve')
const { nodeClass: DiscordSendMessage } = require('./messages/Send')

// Instantiate to reuse their input definitions and run logic
const retrieveMessages = new DiscordRetrieveMessages(NAME)
const sendMessage = new DiscordSendMessage(NAME)

/**
 * Discord Agent Flow Node
 * This node allows sending messages to a Discord channel using a bot token.
 * It supports both retrieving messages and sending messages.
 */
export class Discord_Agentflow implements INode {
    label = 'Discord'
    name = NAME
    version = 1.0
    icon = 'discord.svg'
    type = 'utility'
    category = 'Agent Flows'
    description = 'Send a message to a Discord channel using your bot token'
    color = '#7289DA'
    baseClasses = [this.type]

    // Credential parameter
    credential: INodeParams = {
        label: 'Discord Bot Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['discordBot'],
        optional: false
    }

    // Combine inputs from both receive and send nodes
    inputs: INodeParams[] = [
        {
            label: 'Channel ID',
            name: 'channelId',
            type: 'string',
            description: 'Discord channel'
        },

        {
            label: 'Mode',
            name: 'mode',
            type: 'options',
            options: [
                { label: 'Retrieve Messages', name: DiscordRetrieveMessages.MODE },
                { label: 'Send Message', name: DiscordSendMessage.MODE }
            ],
            default: 'retrieve',
            description: 'Select the operation to perform'
        },
        ...retrieveMessages.inputs,
        ...sendMessage.inputs
    ]

    async run(nodeData: INodeData, runId: string, options: ICommonObject) {
        const mode = nodeData.inputs?.mode as string
        if (mode === DiscordRetrieveMessages.MODE) {
            return await retrieveMessages.run(nodeData, runId, options)
        } else if (mode === DiscordSendMessage.MODE) {
            return await sendMessage.run(nodeData, runId, options)
        }
        throw new Error(`Unsupported mode: ${mode}.`)
    }
}

module.exports = { nodeClass: Discord_Agentflow }
