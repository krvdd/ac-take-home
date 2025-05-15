'use client';

import styles from "@/styles.module.css";
import { useState, useEffect } from 'react';
import { PowerplantList } from "@/plantlist.js"
import { PowerplantChart } from "@/plantchart.js"

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

export default function Home() {
	
	const [data, dataSet] = useState([]);
	const [chartPlant, chartPlantSet] = useState(null);
	const [refreshCount, refreshCountSet] = useState(1);
	const [loading, loadingSet] = useState(true);
	
	function refresh_after(promise) {
		loadingSet(true);
		promise.then(() => refreshCountSet(refreshCount + 1));
	}
	
	useEffect(() => {
		getPowerplants()
			.then(res => res.json())
			.then(json => {
				dataSet(json)
				loadingSet(false);
			})
	}, [refreshCount]);
	
	function openReadings(plant) {
		chartPlantSet(plant)
	}
	
	function handleDelete(plant) {
		if(chartPlant == plant) chartPlantSet(null);
		refresh_after(deletePowerplant(plant.id));
	}
	
	function handlePostPlant(plant) {
		refresh_after(postPowerplant(plant));
	}
	
	function handlePutPlant(id, plant) {
		refresh_after(putPowerplant(id, plant));
	}
	
	return (
		<div className={styles.page}>
			<PowerplantList
				data={data}
				loading={loading}
				openReadings={openReadings}
				handleDelete={handleDelete}
				handlePutPlant={handlePutPlant}
				handlePostPlant={handlePostPlant}
			/>
			{ chartPlant ? <PowerplantChart plant={chartPlant}/> : '' }
		</div>
	);
}
