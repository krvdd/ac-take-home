import styles from "@/styles.module.css";
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart } from 'chart.js/auto'; 
import Papa from 'papaparse';
import 'chartjs-adapter-date-fns';

function getReadings(id, t0) {
	if(!t0) return fetch(`api/readings/${id}`);
	return fetch(`api/readings/${id}/${t0}`);
}

function putReadings(id, data) {
	return fetch(`api/readings/${id}`, {
		method: 'PUT',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data)
	});
}

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

function monthsAgo(n) {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	date.setMonth(date.getMonth() - n);
	return date.toISOString();
}

function daysAgo(n) {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - n);
	return date.toISOString();
}

export function PowerplantChart({plant}) {
	
	const [data, dataSet] = useState({time: [], power: [], energy: []});
	const [refreshCount, refreshCountSet] = useState(1);
	const [loading, loadingSet] = useState(true);
	const [timeWindow, timeWindowSet] = useState('');
	
	useEffect(() => {
		getReadings(plant.id, timeWindow)
			.then(res => res.json())
			.then(json => {
				dataSet(json)
				loadingSet(false);
			})
	}, [plant, refreshCount, timeWindow]);
	
	function refresh() {
		refreshCountSet(refreshCount + 1);
	}
	
	const options = {
		maintainAspectRatio: false,
		responsive: true,
		scales: {x: {type: 'timeseries'}},
	};
	
	function handleFile(e) {
		loadingSet(true);
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
	
	let cls = styles.chart;
	if(loading) cls += ' ' + styles.loading;
	
	return (
		<div className={cls}>
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
			<div className={styles.options}>
			<button onClick={() => timeWindowSet('')}>all</button>
			<button onClick={() => timeWindowSet(monthsAgo(12*5))}>5 years</button>
			<button onClick={() => timeWindowSet(monthsAgo(12))}>1 year</button>
			<button onClick={() => timeWindowSet(monthsAgo(1))}>1 month</button>
			<button onClick={() => timeWindowSet(daysAgo(7))}>1 week</button>
			<button onClick={() => timeWindowSet(daysAgo(1))}>1 day</button>
			</div>
			<input id="files" type="file" accept=".csv" multiple onChange={handleFile}/>
		</div>
	);
}
