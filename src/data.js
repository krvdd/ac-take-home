import Ajv from 'ajv';
import addFormats from "ajv-formats";
import Database from 'better-sqlite3';

const db = new Database('plants.db');
const ajv = new Ajv();
addFormats(ajv);

const plantSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		power: { type: 'number' },
	},
	required: ['name', 'power'],
	additionalProperties: false
};

const readingsSchema = {
	type: 'object',
	properties: {
		time: {type: 'array', items: { type: 'string', format: 'iso-date-time' }},
		power: {type: 'array', items: { type: 'number' }},
		energy: {type: 'array', items: { type: 'number' }}
	},
	required: ['time', 'power', 'energy'],
	additionalProperties: false
};

const plantValid = ajv.compile(plantSchema);
const readingsValid = ajv.compile(readingsSchema);

db.pragma('journal_mode = WAL');
db.exec(`
	CREATE TABLE IF NOT EXISTS plants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		power REAL NOT NULL
	) STRICT;

	CREATE TABLE IF NOT EXISTS readings (
		plant INTEGER NOT NULL REFERENCES plants,
		time INTEGER NOT NULL,
		power REAL NOT NULL,
		energy REAL NOT NULL
	) STRICT;
`);

function normalizePlant(plant) {
	if(!plantValid(plant))
		throw 'malformed input';
	plant.name = plant.name.trim();
	return plant;
}

export function get_plants() {
	return db.prepare(`SELECT * FROM plants`).all();
}

export function add_plant(plant) {
	const { name, power } = normalizePlant(plant);
	return db.prepare(`INSERT INTO plants (name, power) VALUES (?, ?)`).run(name, power);
}

export function put_plant(id, plant) {
	const { name, power } = normalizePlant(plant);
	return db.prepare(`UPDATE plants SET name = ?, power = ? WHERE id = ?`).run(name, power, id);
}

export function delete_plant(id) {
	db.transaction(() => {
		db.prepare(`DELETE FROM readings WHERE plant = ?`).run(id);
		db.prepare(`DELETE FROM plants WHERE id = ?`).run(id);
	})();
}

export function get_readings(id) {
	const data = db.prepare(`SELECT time, power, energy FROM readings WHERE plant = ? ORDER BY time ASC`).all(id);
	const time = data.map(({time}) => time);
	const power = data.map(({power}) => power);
	const energy = data.map(({energy}) => energy);
	return {time, power, energy};
}

export function put_readings(id, data) {
	if(!readingsValid(data))
		throw 'malformed input';
	
	const {time, power, energy} = data;
	const n = time.length;
	
	if(power.length !== n || energy.length !== n)
		throw 'malformed input';
	
	if(n === 0) return;

	const timestamps = time.map((t) => Date.parse(t));
	if(timestamps.some(Number.isNaN)) throw 'invalid timestamp';

	const start = Math.min(...timestamps);
	const end = Math.max(...timestamps);

	const del = db.prepare(`DELETE FROM readings WHERE plant = ? AND time BETWEEN ? AND ?`);
	const insert = db.prepare(`INSERT INTO readings (plant, time, power, energy) VALUES (?, ?, ?, ?)`);

	db.transaction(() => {
		del.run(id, start, end);
		for(let i = 0; i < n; i++)
			insert.run(id, timestamps[i], power[i], energy[i]);
	})();
}
