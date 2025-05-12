import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('plants.db');
import Ajv from 'ajv';

const ajv = new Ajv();

const plantSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		power: { type: 'number' },
		energy: { type: 'number' },
	},
	required: ['name', 'power', 'energy'],
};

const plantValid = ajv.compile(plantSchema);

db.serialize(() => {
	db.run(`
		CREATE TABLE IF NOT EXISTS plants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			power REAL NOT NULL,
			energy REAL NOT NULL)`);
});

function validatePlant(plant) {
	if(!plantValid(plant))
		throw 'malformed input';
	return plant;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function(err) {
			if(err) return reject(err);
			delay(0).then(() => resolve(this));
		});
	});
}

function getAll(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if(err) return reject(err);
			delay(0).then(() => resolve(rows));
		});
	});
}

export function get_plants() {
	return getAll(`SELECT * FROM plants`);
}

export function add_plant(plant) {
	const { name, power, energy } = validatePlant(plant);
	return run(
		`INSERT INTO plants (name, power, energy) VALUES (?, ?, ?)`,
		[name, power, energy]
	);
}

export function put_plant(id, plant) {
	const { name, power, energy } = validatePlant(plant);
	return run(
		`UPDATE plants SET name = ?, power = ?, energy = ? WHERE id = ?`,
		[name, power, energy, id]
	);
}

export function delete_plant(id) {
	return run(`DELETE FROM plants WHERE id = ?`, [id]);
}
