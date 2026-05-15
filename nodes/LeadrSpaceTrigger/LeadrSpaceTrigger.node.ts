import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { classifyDelivery } from './classifyDelivery';
import { SUPPORTED_EVENTS } from './events';

export class LeadrSpaceTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Leadr Space Trigger',
		name: 'leadrSpaceTrigger',
		icon: 'file:leadrspace.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive real-time webhook events from your Leadr Space account.',
		defaults: {
			name: 'Leadr Space Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description:
					'Leadr Space event types this workflow should react to. Each delivery whose event-type is in this list emits one workflow execution; others are silently acknowledged with HTTP 200.',
				options: SUPPORTED_EVENTS.map((event) => ({
					name: event.name,
					value: event.value,
					description: event.description,
				})),
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const events = this.getNodeParameter('events', []) as string[];

		if (!Array.isArray(events) || events.length === 0) {
			const res = this.getResponseObject();
			res.status(400).json({ error: 'At least one event must be selected' });
			return { noWebhookResponse: true };
		}

		const body = this.getBodyData();
		const result = classifyDelivery(body, new Set(events));

		if (result.kind === 'reject') {
			const res = this.getResponseObject();
			res.status(400).json({ error: result.reason });
			return { noWebhookResponse: true };
		}

		if (result.kind === 'skip') {
			return { webhookResponse: { status: 200 } };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
