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

The actual endpoints are in `src/app/api/powerplants/route.js` and `src/app/api/powerplants/[id]/route.js`
Which I hate, but I didn't find a good way of changing it.

## UI
Implemented in `src/app/page.js`

- `Home` renders the page and also contains logic for loading the powerplants
- `PowerplantList()` and `Powerplant()` are responsible for rendering the table
- `EditPowerplant` renders the form for editing plants
- `PlantChart` loads readings and renders the chart

The experience with Chart.js was relatively painless.
The only issue I encountered was the line color reverting to grey sometimes. I fixed it by explicitly setting the color.

### Notes
- There is a moment after modifications where the old data still shows. I hide this by lowering the opacity using css.
- Having both power and energy on the same axis may not be appropriate. I don't know enough about engineering to say.
- The time window selection is restrictive. It would be nice to have a slider for it.
- I should add a button to load demo data
