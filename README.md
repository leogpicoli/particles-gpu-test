# interactive-bulletin

Code to create an interactive website for the bulletin

# Install livereload

Livereload is necessary to start the server:
`sudo apt install python3-livereload`

# Requirements

- npm

# Run

Start a simple web server, using python, for example:  
`npm run start`

# Accessing the page

http://127.0.0.1:35729/

# Libraries Used

- Leaflet version 3.1: Used for map display.
- CanvasLayer: Layer on the map to display routes and currents.

## Layer Setup

To display currents and routes on the map, the following scripts are utilized:

- L.CanvasLayer.js: Provides functionality for creating a canvas layer.
- Layer-Controller.js: Controls the layers on the map.

## Current Display

The current display functionality consists of the following scripts:

- particle.js: Defines the particle object.
- particles-controller.js: Controls the generation and display of particles.

## Route Display

The route display functionality is implemented using the following scripts:

- route.js: Defines the route object.
- route-controller.js: Controls the display of routes.

## Data Loading

The data loading process involves the following scripts:

- field.js: Loads data for currents.
- data.js: Loads data for routes.

## Required Files

To properly run the application, the following files are needed:

- 1 file for currents in ASC format.
- 12 files for routes in JSON format, including 2 files per speed (speed values ranging from 10 to 12).

# Current Display

The display of currents operates as follows:

1. A set of "particle" objects is generated and displayed based on the value of the "nbrParticle" attribute in the particle controller. These particles are randomly created with random lifespans and positions.
2. Each point of the particle is transformed into a line using ASC files (u and v) to determine the next point. If the next point does not exist, it means that the particle has reached its maximum age, and it is reset. The age of the particle increases each time a new point is drawn.
3. When a particle reaches its maximum age, it is reset. This involves the disappearance of the line formed by the particle's points, and the particle undergoes changes in position, age, color, etc.
4. Each point of the particle is transformed into a line using ASC files (u and v) to determine the next point. If the next point does not exist, it means that the particle has reached its maximum age, and it is reset.
5. The speed of the particles changes with each zoom level. The color of the particles is determined by the magnitude of the current at the point where the particle is drawn. A color gradient is used for this purpose.
6. The layer controller (LayerController) is used to update the animation with each movement of the map. It also calls a function to update the points of each particle every 2 seconds.

# Route Display

The display of routes operates as follows:

First, there are three types of routes to display: a direct route without current ("no-currents"), a direct route with current ("currents"), and a direct route with current and optimization ("fast" or "eco").
The route is drawn on the same canvas used for displaying currents.
The process starts by drawing a transparent line representing the route on which particles will move. This step is performed using the "drawBackground" function.
To draw the particles of the route, a concept similar to the one used for currents is employed. However, in this case, the "number of particles" attribute is not used. Instead, the start and end points of the route visible on the screen are utilized. Then, the points between the start and end are traversed and displayed. A specific distance is defined between each point of the route.
The previous particles take the place of the subsequent ones.
