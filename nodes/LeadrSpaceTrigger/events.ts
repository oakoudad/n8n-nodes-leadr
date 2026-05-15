/**
 * Single source of truth for the v1 event taxonomy.
 * Per spec FR-003 and data-model.md §1.
 */

export interface EventOption {
	name: string;
	value: string;
	description: string;
}

export const SUPPORTED_EVENTS: readonly EventOption[] = [
	{
		name: 'Message Received',
		value: 'message.received',
		description: 'Triggered when an inbound WhatsApp message arrives from a customer',
	},
	{
		name: 'Message Sent',
		value: 'message.sent',
		description: 'Triggered when an outbound WhatsApp message is sent by a user or by automation',
	},
	{
		name: 'Contact Created',
		value: 'contact.created',
		description: 'Triggered when a new contact is added to the account',
	},
	{
		name: 'Contact Updated',
		value: 'contact.updated',
		description: 'Triggered when an existing contact\'s fields change',
	},
] as const;

export const SUPPORTED_EVENT_VALUES: ReadonlySet<string> = new Set(
	SUPPORTED_EVENTS.map((option) => option.value),
);
