import { classifyDelivery } from '../../nodes/LeadrSpaceTrigger/classifyDelivery';

const ALL_EVENTS = new Set([
	'message.received',
	'message.sent',
	'contact.created',
	'contact.updated',
]);

describe('classifyDelivery', () => {
	describe('emit path', () => {
		it('emits when event-type is in the selected set (contact.created)', () => {
			const body = { 'event-type': 'contact.created', uuid: 'abc-123', first_name: 'Test' };
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({
				kind: 'emit',
				eventType: 'contact.created',
			});
		});

		it('emits for a nested message.received payload', () => {
			const body = {
				data: { value: { messaging_product: 'whatsapp', messages: [] }, field: 'messages' },
				'event-type': 'message.received',
			};
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({
				kind: 'emit',
				eventType: 'message.received',
			});
		});
	});

	describe('skip path', () => {
		it('skips when event-type is not in the selected set', () => {
			const body = { 'event-type': 'contact.created' };
			const onlyMessages = new Set(['message.received', 'message.sent']);
			expect(classifyDelivery(body, onlyMessages)).toEqual({ kind: 'skip' });
		});

		it('skips for an unknown event-type entirely', () => {
			const body = { 'event-type': 'lead.created' };
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({ kind: 'skip' });
		});
	});

	describe('reject path — missing or malformed event-type', () => {
		it('rejects when event-type field is missing', () => {
			const body = { foo: 'bar' };
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Missing event-type field',
			});
		});

		it('rejects when event-type is not a string (number)', () => {
			const body = { 'event-type': 42 };
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'event-type must be a string',
			});
		});

		it('rejects when event-type is not a string (null)', () => {
			const body = { 'event-type': null };
			expect(classifyDelivery(body, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'event-type must be a string',
			});
		});
	});

	describe('reject path — non-object body', () => {
		it('rejects a string body', () => {
			expect(classifyDelivery('not json', ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Body must be a JSON object',
			});
		});

		it('rejects a null body', () => {
			expect(classifyDelivery(null, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Body must be a JSON object',
			});
		});

		it('rejects an array body', () => {
			expect(classifyDelivery([{ 'event-type': 'contact.created' }], ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Body must be a JSON object',
			});
		});

		it('rejects a number body', () => {
			expect(classifyDelivery(42, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Body must be a JSON object',
			});
		});

		it('rejects undefined body', () => {
			expect(classifyDelivery(undefined, ALL_EVENTS)).toEqual({
				kind: 'reject',
				reason: 'Body must be a JSON object',
			});
		});
	});

	describe('empty allowedEvents', () => {
		it('skips when allowedEvents is empty even for a well-formed body', () => {
			const body = { 'event-type': 'contact.created' };
			expect(classifyDelivery(body, new Set())).toEqual({ kind: 'skip' });
		});
	});
});
