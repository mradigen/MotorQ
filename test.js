import request from 'supertest';

import app from './src/api/index.js';

describe('API', () => {
	describe('GET /vehicle/create/vin1', function() {
		it('Responds with 200', function(done) {
			request(app)
			.post('/vehicle/create/vin1')
			.send({
				manufacturer: "Ford",
				model: "Testing",
				fleet: "23456",
				owner: "owner_id",
				registration_status: "Active"
			})
			.set('Accept', 'application/json')
			// .expect('Content-Type', /json/)
			.expect(200, done);
		});
	});

	describe('GET /vehicle/list/fleet/23456', function() {
		it('Responds with 200', function(done) {
			request(app)
			.get('/vehicle/list/fleet/23456')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200, done);
		});
	});
});