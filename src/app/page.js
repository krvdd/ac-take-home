'use client';
import styles from "./page.module.css";
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart } from 'chart.js/auto'; 
import Papa from 'papaparse';
import 'chartjs-adapter-date-fns';


// api wrappers

function getPowerplants() {
	return fetch('api/powerplants');
}

function postPowerplant(plant) {
	return fetch('api/powerplants', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(plant)
	});
}

function putPowerplant(id, plant) {
	return fetch(`api/powerplants/${id}`, {
		method: 'PUT',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(plant)
	});
}

function deletePowerplant(id) {
	return fetch(`api/powerplants/${id}`, {method: 'DELETE'});
}

function getReadings(id) {
	return fetch(`api/readings/${id}`);
}

function putReadings(id, data) {
	return fetch(`api/readings/${id}`, {
		method: 'PUT',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data)
	});
}


// table

function EditPowerplant({ plantData, ok, cancel }) {
	const [name, nameSet] = useState(plantData.name);
	const [power, powerSet] = useState(plantData.power);
	
	const valid = name && !isNaN(power) && (name != plantData.name || power != plantData.power);
	
	function handleSubmit(v) {
		if(valid) ok({name, power: Number(power)});
	}
	
	const cls = isNaN(power) ? styles.invalid : '';
	
	return (
		<form className={styles.row} action={handleSubmit}>
			<input name="name" type="text" value={name} size={name.length || 1} placeholder="Name..." onChange={(e) => nameSet(e.target.value)}/>
			<input className={cls} name="power" type="text" value={power} size={power.length || 1} placeholder="0" onChange={(e) => powerSet(e.target.value)}/>
			<div className={styles.options}>
				<button type="submit" disabled={!valid}>save</button>
				<button onClick={() => cancel()}>cancel</button>
			</div>
		</form>
	);
}

function AddPowerplant({ refresh }) {
	const [adding, addingSet] = useState(false);
	
	function cancel() {
		addingSet(false);
	}
	
	function ok(plant) {
		addingSet(false);
		refresh(postPowerplant(plant));
	}
	
	if(adding)
		return <EditPowerplant plantData={{name: '', power: ''}} ok={ok} cancel={cancel}/>
	
	return <button onClick={() => addingSet(true)}>add</button>;
}

function Powerplant({ refresh, plantData, handleDelete, openReadings }) {
	const [editing, editingSet] = useState(false);
	
	function cancel() {
		editingSet(false);
	}
	
	function ok(plant) {
		editingSet(false);
		refresh(putPowerplant(plantData.id, plant));
	}
	
	if(editing)
		return <EditPowerplant plantData={plantData} ok={ok} cancel={cancel}/>
	
	return (
		<div className={styles.row}>
			<a href="#" onClick={() => openReadings(plantData)}>{plantData.name}</a>
			<div>{plantData.power} kW</div>
			<div className={styles.options}>
				<button onClick={() => editingSet(true)}>edit</button>
				<button onClick={() => handleDelete(plantData)}>delete</button>
			</div>
		</div>
	);
}

function SortDirectionIndicator({active, ascending}) {
	const dir = ascending ? '\u028C' : 'v';
	return <div className={styles.sortdirection}>{active ? dir : '\u2261'}</div>
}

function PowerplantList({ data, refresh, refreshing, handleDelete, openReadings }) {
	
	const [sortkey, sortkeySet] = useState('id');
	const [sortAscending, sortAscendingSet] = useState(true);
	
	const displayData = data.toSorted((a, b) => {
		if(a[sortkey] === b[sortkey]) return 0;
		return a[sortkey] < b[sortkey] === sortAscending ? -1 : 1;
	});
	
	function setOrder(column, ascending) {
		sortkeySet(column);
		sortAscendingSet(ascending);
	}
	
	function SortButton({ text, column, preferAscending }) {
		
		function toggle() {
			if(sortkey === column) {
				if(sortAscending === preferAscending)
					setOrder(column, !preferAscending);
				else
					setOrder('id', true);
			} else
				setOrder(column, preferAscending);
		}
		
		return <button className={styles.sortbutton} onClick={toggle}>{text}<SortDirectionIndicator active={sortkey === column} ascending={sortAscending}/></button>;
	}
	
	let cls = styles.plants;
	if(refreshing) cls += ' ' + styles.loading;
	
	return (
		<div className={cls}>
			<div className={styles.row}>
				<SortButton text="Name" column="name" preferAscending={true}/>
				<SortButton text="Nominal power" column="power" preferAscending={false}/>
			</div>
			{displayData.map(plantData =>
				<Powerplant
					refresh={refresh}
					plantData={plantData}
					handleDelete={handleDelete}
					openReadings={openReadings}
					key={plantData.id}
				/>)}
			<AddPowerplant refresh={refresh}/>
		</div>
	);
}


// chart

function parse_csv(file) {
	return new Promise((resolve, reject) => {
		const config = {
			header: true,
			skipEmptyLines: 'greedy',
			complete: (results, file) => resolve(results),
			error: (error, file) => reject(error),
		};
		Papa.parse(file, config);
	});
}

function PlantChart({plant}) {
	
	const [data, dataSet] = useState({time: [], power: [], energy: []});
	const [refreshCount, refreshCountSet] = useState(1);
	const [refreshing, refreshingSet] = useState(true);
	
	useEffect(() => {
		getReadings(plant.id)
			.then(res => res.json())
			.then(json => {
				dataSet(json)
				refreshingSet(false);
			})
	}, [plant, refreshCount]);
	
	function refresh() {
		refreshCountSet(refreshCount + 1);
	}
	
	const options = {
		maintainAspectRatio: false,
		responsive: true,
		scales: {x: {type: 'timeseries'}},
	};
	
	function handleFile(e) {
		refreshingSet(true);
		for(const file of e.target.files)
			parse_csv(file).then((result) => {
				const time = result.data.map(({timestamp}) => timestamp);
				const power = result.data.map(({active_power_kW}) => Number(active_power_kW));
				const energy = result.data.map(({energy_kWh}) => Number(energy_kWh));
				return putReadings(plant.id, {time, power, energy});
			}).then(() => refresh());
		e.target.value = null;
	}
	
	const {time, power, energy} = data;
	const power_data = power.map((y, i) => ({x: time[i], y}));
	const energy_data = energy.map((y, i) => ({x: time[i], y}));
	return (
		<div className={styles.chart}>
			<h1> {plant.name} </h1>
			<div className={styles.chartcontainer}>
				<Line
					options={options}
					data={{
						datasets: [
							{label: 'Power (kW)', data: power_data, borderColor: '#28f'},
							{label: 'energy (kWh)', data: energy_data, borderColor: '#f54'},
						]
					}}/>
			</div>
			<input id="files" type="file" accept=".csv" multiple onChange={handleFile}/>
		</div>
	);
}


// page

export default function Home() {
	
	const [data, dataSet] = useState([]);
	const [chartPlant, chartPlantSet] = useState(null);
	const [refreshCount, refreshCountSet] = useState(1);
	const [refreshing, refreshingSet] = useState(true);
	
	function refresh(but_first) {
		refreshingSet(true);
		if(but_first) but_first.then(() => refreshCountSet(refreshCount + 1));
		else refreshCountSet(refreshCount + 1);
	}
	
	useEffect(() => {
		getPowerplants()
			.then(res => res.json())
			.then(json => {
				dataSet(json)
				refreshingSet(false);
			})
	}, [refreshCount]);
	
	function openReadings(plant) {
		chartPlantSet(plant)
	}
	
	function handleDelete(plant) {
		if(chartPlant == plant) chartPlantSet(null);
		refresh(deletePowerplant(plant.id));
	}
	
	return (
		<div className={styles.page}>
			<PowerplantList
				data={data}
				refresh={refresh}
				refreshing={refreshing}
				openReadings={openReadings}
				handleDelete={handleDelete}
			/>
			{ chartPlant ? <PlantChart plant={chartPlant}/> : '' }
		</div>
	);
}
