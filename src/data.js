import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('plants.db');
import Ajv from 'ajv';

const ajv = new Ajv();

const plantSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		power: { type: 'number' },
	},
	required: ['name', 'power'],
};

const plantValid = ajv.compile(plantSchema);

db.serialize(() => {
	db.run(`
		CREATE TABLE IF NOT EXISTS plants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			power REAL NOT NULL)`);
});

function normalizePlant(plant) {
	if(!plantValid(plant))
		throw 'malformed input';
	plant.name = plant.name.trim();
	return plant;
}

function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function(err) {
			if(err) return reject(err);
			resolve(this);
		});
	});
}

function getAll(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if(err) return reject(err);
			resolve(rows);
		});
	});
}

export function get_plants() {
	return getAll(`SELECT * FROM plants`);
}

export function add_plant(plant) {
	const { name, power } = normalizePlant(plant);
	return run(
		`INSERT INTO plants (name, power) VALUES (?, ?)`,
		[name, power]
	);
}

export function put_plant(id, plant) {
	const { name, power } = normalizePlant(plant);
	return run(
		`UPDATE plants SET name = ?, power = ? WHERE id = ?`,
		[name, power, id]
	);
}

export function delete_plant(id) {
	return run(`DELETE FROM plants WHERE id = ?`, [id]);
}
