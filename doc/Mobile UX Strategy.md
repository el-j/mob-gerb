# **Mobile-First PCB Editor: UX & Technical Strategy**

## **1\. The "Autoroute-First" Paradigm**

On mobile, drawing complex geometric paths is frustrating. The app should allow the user to define their *intent* and let the browser do the heavy lifting.

### **The UX Flow**

1. **Airwires (Ratsnest):** The user taps "Pad A" and then taps "Pad B". Instead of drawing a copper trace, the app draws a straight, thin, brightly colored line (an "Airwire" or "Ratsnest" line). This defines the *logical* connection (the Netlist) without committing to physical geometry.  
2. **The Magic Button:** Once the user has connected their components logically, they press an "Autoroute" button.  
3. **The Result:** The app converts all Airwires into physical, non-overlapping copper traces (\<polyline\> or \<path\> elements).

### **The Technical Implementation**

* **The Algorithm:** You will need a grid-based pathfinding algorithm. The *A (A-Star) search algorithm*\* or the **Lee routing algorithm** are standard for this. You treat your PCB board as a grid (e.g., 0.25mm cells) and the algorithm finds the shortest path while avoiding other traces and pads.  
* **Web Workers are Mandatory:** Running a routing algorithm for dozens of traces requires heavy computation. If you run this on the main JavaScript thread, the mobile browser will freeze. You must push the autorouter into a **Web Worker** so the UI remains responsive and can show a loading spinner or progress bar.

## **2\. The "Double-Tap Edit Mode" (Precision Adjustments)**

When the autorouter makes a choice the user doesn't like, or if they need to manually tweak a trace, the double-tap gesture is the perfect gateway to a precision UI.

### **The UX Flow**

1. **Trigger:** The user double-taps a specific trace segment.  
2. **Isolation State:** The rest of the PCB (other traces, silkscreen) dims to 30% opacity and becomes un-clickable. The selected trace enters "Edit Mode".  
3. **Touch Targets:** The joints (vertices) of the trace appear as large, draggable nodes.  
4. **Action:** The user drags a node to adjust the route. The app provides haptic feedback (if available via the Web Vibration API) when snapping to the grid.  
5. **Exit:** Tapping the dim background exits Edit Mode.

### **The Technical Implementation**

* **Fat-Finger Friendly Handles:** A major mistake in web SVG editors is making the visual node the same size as the touch target. You should render visual dots (e.g., r="2") but wrap them in an invisible touch target (r="20", fill="transparent") so the user's finger easily grabs it without needing pixel-perfect accuracy.  
* **Grid & Snapping Engine:**  
  * When Edit Mode is active, render a subtle background \<pattern\> in the SVG to show the grid.  
  * In your touch drag event listener (interact.js or touchstart/touchmove), intercept the X/Y coordinates before updating the SVG.  
  * Use a snapping function: snappedX \= Math.round(rawX / gridSize) \* gridSize;  
  * Apply magnetic snapping to nearby pads of the *same net* so the user can easily reconnect a broken trace.

## **3\. Recommended State Machine**

Managing these modes is critical so touches aren't misinterpreted. Your framework (React/Vue) should maintain a strict state:

* STATE\_VIEW: Default. Dragging pans the camera. Pinching zooms.  
* STATE\_LOGICAL\_CONNECT: Tapping pads creates Airwires.  
* STATE\_ROUTING: Web Worker is calculating. UI is locked.  
* STATE\_EDIT\_PART: Double-tapped a component. Can rotate/move on grid.  
* STATE\_EDIT\_TRACE: Double-tapped a trace. Nodes appear. Background dimmed. Dragging moves nodes.