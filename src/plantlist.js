import styles from "@/styles.module.css";
import { useState } from 'react';

function TextInput({ name, value, valueSet, invalid, placeholder }) {
	return  <input
		className={invalid ? styles.invalid : ''}
		name={name}
		type="text"
		value={value}
		size={value.length || 1}
		placeholder={placeholder}
		onChange={(e) => valueSet(e.target.value)}
	/>;
}

function EditPowerplant({ plantData, ok, cancel }) {
	const [name, nameSet] = useState(plantData.name);
	const [power, powerSet] = useState(plantData.power);
	
	const valid = name && !isNaN(power) && (name !== plantData.name || power !== plantData.power);
	
	function handleSubmit(v) {
		if(valid) ok({name, power: Number(power)});
	}
	
	return (
		<form className={styles.row} action={handleSubmit}>
			<TextInput name="name" value={name} valueSet={nameSet} placeholder="Name..."/>
			<TextInput name="power" value={power} valueSet={powerSet} placeholder="0" invalid={isNaN(power)}/>
			<div className={styles.options}>
				<button type="submit" disabled={!valid}>save</button>
				<button onClick={() => cancel()}>cancel</button>
			</div>
		</form>
	);
}

function Powerplant({ plantData, showOptions, handleEdit, handleDelete, openReadings }) {
	
	return (
		<div className={styles.row}>
			<a href="#" onClick={() => openReadings(plantData)}>{plantData.name}</a>
			<div>{plantData.power} kW</div>
			{showOptions
			? <div className={styles.options}>
					<button onClick={() => handleEdit(plantData)}>edit</button>
					<button onClick={() => handleDelete(plantData)}>delete</button>
				</div>
			: ''}
		</div>
	);
}

function SortDirectionIndicator({ active, ascending }) {
	const dir = ascending ? '\u028C' : 'v';
	return <div className={styles.sortdirection}>{active ? dir : '\u2261'}</div>
}

export function PowerplantList({ data, loading, handleDelete, handlePutPlant, handlePostPlant, openReadings }) {
	
	const [sortkey, sortkeySet] = useState('id');
	const [sortAscending, sortAscendingSet] = useState(true);
	const [editPlant, editPlantSet] = useState(null);
	
	const displayData = data.toSorted((a, b) => {
		if(a[sortkey] === b[sortkey]) return 0;
		return (a[sortkey] < b[sortkey]) === sortAscending ? -1 : 1;
	});
	
	function cancel() {
		editPlantSet(null);
	}
	
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
		
		return (
			<button className={styles.sortbutton} onClick={toggle}>
				{text}
				<SortDirectionIndicator active={sortkey === column} ascending={sortAscending}/>
			</button>
		);
	}
	
	function Head({}) {
		return (
			<div className={styles.row}>
				<SortButton text="Name" column="name" preferAscending={true}/>
				<SortButton text="Nominal power" column="power" preferAscending={false}/>
			</div>
		);
	}
	
	function Row({ plantData }) {
		
		function ok(plant) {
			editPlantSet(null);
			handlePutPlant(plantData.id, plant);
		}
		
		if(editPlant === plantData)
			return <EditPowerplant plantData={plantData} ok={ok} cancel={cancel}/>;
		
		function handleEdit() {
			editPlantSet(plantData)
		}
		
		return (
			<Powerplant
				plantData={plantData}
				showOptions={editPlant === null}
				handleEdit={handleEdit}
				handleDelete={handleDelete}
				openReadings={openReadings}
			/>
		);
	}
	
	function Foot({}) {
		
		function ok(plant) {
			editPlantSet(null);
			handlePostPlant(plant);
		}
		
		if(editPlant === 'add')
			return <EditPowerplant plantData={{name: '', power: ''}} ok={ok} cancel={cancel}/>
		
		if(editPlant)
			return '';
		
		return <button onClick={() => editPlantSet('add')}>add</button>;
	}
	
	let cls = styles.plants;
	if(loading) cls += ' ' + styles.loading;
	
	return (
		<div className={cls}>
			<Head/>
			{displayData.map(plantData =>
				<Row plantData={plantData} key={plantData.id}/>)}
			<Foot/>
		</div>
	);
}
