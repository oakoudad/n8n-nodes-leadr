/**
 * Pure classifier for inbound Leadr Space webhook deliveries.
 * Externally documented in specs/001-leadrspace-webhook-trigger/contracts/webhook-inbound.md.
 */

export type ClassifyResult =
	| { kind: 'emit'; eventType: string }
	| { kind: 'skip' }
	| { kind: 'reject'; reason: string };

const EVENT_TYPE_KEY = 'event-type';

export function classifyDelivery(body: unknown, allowedEvents: ReadonlySet<string>): ClassifyResult {
	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return { kind: 'reject', reason: 'Body must be a JSON object' };
	}

	const record = body as Record<string, unknown>;

	if (!(EVENT_TYPE_KEY in record)) {
		return { kind: 'reject', reason: 'Missing event-type field' };
	}

	const eventType = record[EVENT_TYPE_KEY];
	if (typeof eventType !== 'string') {
		return { kind: 'reject', reason: 'event-type must be a string' };
	}

	if (!allowedEvents.has(eventType)) {
		return { kind: 'skip' };
	}

	return { kind: 'emit', eventType };
}
