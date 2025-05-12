'use client';
import styles from "./page.module.css";
import { useState, useEffect } from 'react';


// api wrappers

function fetchPowerplants() {
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


// components

function TextInput({value, valueSet, validate, placeholder}) {
	const cls = !validate || validate(value) ? '' : styles.invalid;
	return <input type="text" className={cls} value={value} size={value.length || 1} placeholder={placeholder} onChange={(e) => valueSet(e.target.value)}/>;
}

function EditPowerplant({ plantData, ok, cancel }) {
	const [name, nameSet] = useState(plantData.name);
	const [power, powerSet] = useState(plantData.power);
	const [energy, energySet] = useState(plantData.energy);
	
	const shouldCancel = !name || isNaN(power) || isNaN(energy) || (name == plantData.name && power == plantData.power && energy == plantData.energy);
	
	function validate(v) {
		return !isNaN(v);
	}
	
	function handleSubmit() {
		if(shouldCancel) cancel();
		else ok({name, power: Number(power), energy: Number(energy)});
	}
	
	return (
		<div className={styles.plant}>
			<TextInput value={name} valueSet={nameSet} placeholder="Name..."/>
			<TextInput value={power} valueSet={powerSet} validate={validate} placeholder="0"/>
			<TextInput value={energy} valueSet={energySet} validate={validate} placeholder="0"/>
			<button onClick={handleSubmit}>{shouldCancel ? 'cancel' : 'save'}</button>
		</div>
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
		return <EditPowerplant plantData={{name: '', power: '', energy: ''}} ok={ok} cancel={cancel}/>
	
	return <button onClick={() => addingSet(true)}>add</button>;
}

function Powerplant({ refresh, plantData }) {
	const [editing, editingSet] = useState(false);
	
	function cancel() {
		editingSet(false);
	}
	
	function ok(plant) {
		editingSet(false);
		refresh(putPowerplant(plantData.id, plant));
	}
	
	function handleDelete() {
		refresh(deletePowerplant(plantData.id));
	}
	
	if(editing)
		return <EditPowerplant plantData={plantData} ok={ok} cancel={cancel}/>
	
	return (
		<div className={styles.plant}>
			<div>{plantData.name}</div>
			<div>{plantData.power}</div>
			<div>{plantData.energy}</div>
			<div className={styles.options}>
				<button onClick={() => editingSet(true)}>edit</button>
				<button onClick={handleDelete}>delete</button>
				<button>{'\u2261'}</button>
			</div>
		</div>
	);
}

function PowerplantList({}) {
	
	const [data, dataSet] = useState([]);
	
	const [sortkey, sortkeySet] = useState('id');
	const [sortAscending, sortAscendingSet] = useState(true);
	const [refreshCount, refreshCountSet] = useState(1);
	const [refreshing, refreshingSet] = useState(true);
	
	function refresh(promise) {
		refreshingSet(true);
		console.log("yes");
		if(promise) promise.then(() => refreshCountSet(refreshCount + 1));
		else refreshCountSet(refreshCount + 1);
	}
	
	useEffect(() => {
		const count = refreshCount;
		fetchPowerplants()
			.then(res => res.json())
			.then(json => {
				dataSet(json)
				refreshingSet(false);
			})
	}, [refreshCount]);
	
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
		
		let direction = "";
		if(sortkey === column)
			direction = sortAscending ? "^" : "v"
		
		return <button onClick={toggle}>{text} {direction}</button>;
	}
	
	let cls = styles.plants;
	if(refreshing) cls += ' ' + styles.loading;
	
	return (
		<div className={cls}>
			<div className={styles.tablehead}>
				<SortButton text="Name" column="name" preferAscending={true}/>
				<SortButton text="Nominal power" column="power" preferAscending={false}/>
				<SortButton text="Energy" column="energy" preferAscending={false}/>
			</div>
			{displayData.map(plantData => <Powerplant refresh={refresh} plantData={plantData} key={plantData.id}/>)}
			<AddPowerplant refresh={refresh}/>
		</div>
	);
}


// page

export default function Home() {
	
	return (
		<div className={styles.page}>
			
			<main className={styles.main}>
				<PowerplantList/>
			</main>
			
			<footer className={styles.footer}>
			</footer>
		</div>
	);
}
