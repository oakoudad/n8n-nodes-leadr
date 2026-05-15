import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { classifyDelivery } from './classifyDelivery';
import { SUPPORTED_EVENTS } from './events';

/**
 * Returns one output port per selected event so each event type emits on its own edge.
 *
 * This function is stringified into the node description's `outputs` expression and
 * evaluated by n8n's expression engine at canvas-render time — it MUST be self-contained
 * (no external references, no imports). The event-label map is inlined for that reason.
 */
function configuredOutputs(events: unknown): Array<{ type: string; displayName: string }> {
	const labels: Record<string, string> = {
		'message.received': 'Message Received',
		'message.sent': 'Message Sent',
		'contact.created': 'Contact Created',
		'contact.updated': 'Contact Updated',
	};
	if (!Array.isArray(events) || events.length === 0) {
		return [{ type: 'main', displayName: 'main' }];
	}
	return (events as string[]).map((value) => ({
		type: 'main',
		displayName: labels[value] ?? value,
	}));
}

export class LeadrSpaceTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Leadr Space Trigger',
		name: 'leadrSpaceTrigger',
		icon: 'file:leadrspace.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive real-time webhook events from your Leadr Space account',
		defaults: {
			name: 'Leadr Space Trigger',
		},
		inputs: [],
		outputs: `={{(${configuredOutputs})($parameter.events)}}`,
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
					'Leadr Space event types this workflow should react to. Each selected event becomes its own output edge; deliveries are routed to the matching edge. Deliveries with an event-type outside this list are acknowledged with HTTP 200 but do not trigger the workflow',
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

		const item: INodeExecutionData[] = this.helpers.returnJsonArray(body as IDataObject);
		const outputIndex = events.indexOf(result.eventType);
		const workflowData: INodeExecutionData[][] = events.map((_, i) =>
			i === outputIndex ? item : [],
		);

		return { workflowData };
	}
}
