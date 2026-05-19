# **Mobile-First Fritzing-Compatible PCB Editor**

## **Open Source Implementation & Planning Document**

### **Executive Summary**

This project aims to build a 100% client-side, mobile-first web application for PCB design. By utilizing standard web technologies (HTML, JS, inline SVG) and leaning on the existing Fritzing data structure (.fzp, .fzz), the tool will allow users to design circuits on touchscreens, utilize an "autoroute-first" workflow, and export production-ready Gerber files without ever needing a backend server.

## **1\. Technology Stack**

The goal is zero backend dependencies. Everything runs in the user's browser.

* **Core Framework:** **React** (or Vue 3). React is highly recommended for mapping complex state arrays (nets, parts) directly to the SVG DOM.  
* **Rendering:** Pure inline **HTML5 \<svg\>**. No Canvas, no WebGL. This allows direct DOM manipulation and CSS styling.  
* **File Parsing & Generation:**  
  * JSZip (for reading/writing .fzpz and .fzz archives).  
  * Native browser DOMParser (for converting XML strings to JS objects).  
  * FileSaver.js \+ Native Blob API (for downloading Gerbers and Parts).  
* **Gestures & Touch:** @use-gesture/react (or interact.js) to handle complex multi-touch scaling, panning, and double-tapping flawlessly.  
* **Heavy Computation:** **Web Workers**. Strictly used for the Autorouting algorithm to keep the mobile UI thread at 60fps.  
* **Math & Collision (DRC):** RBush (a high-performance 2D spatial index) for fast Design Rule Checking to detect overlapping traces.

## **2\. Global State Machine Architecture**

To prevent touch-event conflicts, the app will strictly manage "Modes".

* VIEW\_MODE: Default. 1-finger drag pans the canvas, 2-finger pinch zooms.  
* PLACE\_MODE: Dropping a new Fritzing part from the library onto the grid.  
* LOGICAL\_MODE: Tapping pads to define intent. Creates Airwires (Ratsnest) without physical traces.  
* ROUTING\_MODE: UI locked. Web worker is running A\* or Lee pathfinding.  
* EDIT\_TRACE\_MODE: Triggered via double-tap. Background dims. Exposes large, transparent SVG nodes over trace vertices for precision dragging.  
* PART\_CREATOR\_MODE: Free-drawing SVG tools (rect, circle, line) with UI for tagging elements as "Copper0" or "Silkscreen".

## **3\. Development Roadmap**

### **Phase 1: Foundation & The Fritzing Bridge (Weeks 1-4)**

*Goal: Get Fritzing files rendering on screen.*

* **Setup:** Initialize React/Vite project. Setup the main SVG canvas with infinite pan/zoom.  
* **Coordinate Calibration:** Establish the core conversion function mapping SVG pixels to millimeters (crucial for later Gerber export).  
* **The Ingestion Engine:** Write the JSZip and DOMParser logic to accept a .fzz or .fzpz file drop.  
* **Rendering Pipeline:** Parse the XML and inject the nested SVG components (\<g id="copper0"\>, \<g id="silkscreen"\>) into the React component tree.

### **Phase 2: Mobile UX & The Autorouter (Weeks 5-8)**

*Goal: Implement the "Intent-based" connection flow.*

* **Airwires:** Implement the logic where tapping Pad A and Pad B creates a logical Net and draws a direct, thin SVG line between them.  
* **Web Worker Autorouter:** Implement an A\* grid-based pathfinding algorithm in a separate thread.  
* **Execution:** Feed the Web Worker the component bounding boxes, pad locations, and Netlist. Receive back an array of waypoints and render them as \<polyline\> tags with specific stroke widths.

### **Phase 3: Precision Editing & DRC (Weeks 9-11)**

*Goal: Allow users to fix bad routes manually.*

* **Double-Tap Engine:** Implement the transition into EDIT\_TRACE\_MODE.  
* **Fat-Finger UI:** Render the invisible, oversized touch targets on trace joints.  
* **Grid Snapping:** Intercept touchmove events and apply magnetic rounding to a user-defined grid (e.g., 0.25mm).  
* **Design Rule Check (DRC):** Feed all copper SVG coordinates into RBush. If two different nets intersect or breach clearance rules, highlight them red.

### **Phase 4: The Part Creator (Weeks 12-14)**

*Goal: The SVG-to-Part feature.*

* **Drawing Tools:** Basic UI to add lines, circles, and text.  
* **Tagging System:** The popup UI allowing users to tap an element and assign it an ID (e.g., connector1pin).  
* **JSON to XML Compilation:** Convert the drawn SVG and tagged data back into a valid Fritzing .fzp XML string and bundle it via JSZip for download.

### **Phase 5: The "Boss Fight" \- Gerber Export (Weeks 15-18)**

*Goal: Generate physical manufacturing files.*

* **SVG Math Parser:** Flatten all SVG transforms (translate, scale).  
* **Aperture Generation:** Map SVG \<circle\> and \<rect\> pads to Gerber RS-274X Flashes (D03).  
* **Trace Generation:** Map SVG \<polyline\> paths to Gerber Line Draws (D01/D02) with defined aperture widths.  
* **Excellon Drill File:** Parse the nesting of copper0 within copper1 to calculate via and through-hole drill coordinates and sizes.  
* **Export Pipeline:** Package .GTL, .GBL, .GTO, .GBO, and .DRL into a standard gerbers.zip via JSZip.

## **4\. Open Source Strategy**

* **License:** Recommend **MIT** or **GPLv3**.  
* **Hosting:** The app requires no backend, so it can be hosted for free infinitely on **GitHub Pages**, **Vercel**, or **Netlify**.  
* **Community:** By natively supporting .fzpz, you can immediately tap into the thousands of parts already created by the Fritzing open-source community, solving the "empty library" problem that kills most new EDA tools.