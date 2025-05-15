# Take home task

Run with `npm install; npm run build; npm start`

Built with React, Node.js, Next.js, and SQLite

## API

- GET `/api/powerplants` retrieves the list of power plants from the database.
- PUSH `/api/powerplants` adds a new plant.
- PUT `/api/powerplants/:id` modifies an existing plant.
- DELETE `/api/powerplants/:id` deletes a plant.
- GET `/api/readings/:id/[:t0]` retrieves power and energy readings for a plant. Always returns fewer than 2000 samples.
- PUT `/api/readings/:id` updates readings for a plant.

The functionality is implemented in `src/data.js`

The actual endpoints are in `src/app/api/powerplants/route.js`, `src/app/api/powerplants/[id]/route.js`, and `src/app/api/readings/[id]/route.js`
Which I hate, but I didn't find a good way of changing it.

## Table (`src/plantlist.js`)

- `Powerplant` renders a single table row
- `EditPowerplant` renders a row in an editable state
- `PowerplantList` renders a table and keeps track of which row is being edited. The data is managed by the caller.

## Chart (`src/plantchart.js`)

`PowerplantChart` renders a chart using Chart.js and a few buttons to change the time window and to upload a csv.

There are a few minor issues with the way Chart.js formats dates.
I also encountered an issue where the line color would revert to grey sometimes. I fixed it by explicitly setting the color.

## Page (`src/app/page.js`)

- manages the data for the table
- keeps track of which readings should be displayed

## Notes
- There is a moment after modifications where old data still shows. I hide this by lowering the opacity using css.
- Having both power and energy on the same axis may not be appropriate. I don't know enough about engineering to say.
- The time window selection is restrictive. It would be nice to have a slider for it.
- I should add a button to load demo data
