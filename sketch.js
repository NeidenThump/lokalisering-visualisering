// Speed of pulse in pixels per second (100 pixels = 1 meter)
let pulseSpeed = 200; // e.g., 200 pixels per second
let transmitter = { x: 300, y: 300 }; // Position of the transmitter
let receivers = [
  { x: 300, y: 400, detected: false, detectionTime: 0 , startFrame: null, radius: 0},
  { x: 500, y: 100, detected: false, detectionTime: 0 , startFrame: null, radius: 0}
];
let pulseRadius = 0; // Initial pulse size
let lastTimestamp = 0; // For tracking time delta
let simulationRunning = true;

function millisToFrames(milliseconds) {
  return milliseconds / (1000 / frameRate());
}
let points = [];
function updateAndDrawReceivers() {
  let elapsedSeconds; // Time in seconds since the receiver's start frame  
  
  let currentFrame = frameCount - startFrame; // Use the relative frame count
  
  for (let receiver of receivers) {
    if (receiver.startFrame === null && currentFrame >= millisToFrames(receiver.detectionTime)) {
      receiver.startFrame = currentFrame;
    }

    if (receiver.startFrame !== null) {
      if (receiver.radius < width) { // Prevent the pulse from growing indefinitely
        elapsedSeconds = (currentFrame - receiver.startFrame) / frameRate();
        receiver.radius = elapsedSeconds * pulseSpeed; // Calculate radius based on pulse speed
        drawCircle(receiver);
      }
      else{
        console.log(points);
        noLoop();
      }
    }
  }
  let r1 = receivers[0];
  let r2 = receivers[1];
  //console.log(r1,r2)
  if(findCircleIntersections(r1.x, r1.y, r1.radius, r2.x, r2.y, r2.radius).length > 0)
    append(points,findCircleIntersections(r1.x, r1.y, r1.radius, r2.x, r2.y, r2.radius));
  
  
}
let startFrame = 0;
function setup() {
  createCanvas(800, 600);
  frameRate(60); // Set the frame rate
  
}

function draw() {
  frameRate(60)
  if (!simulationRunning) {
    return;
  }
  background(220);
  let currentTime = millis();
  //let deltaTime = (currentTime - lastTimestamp) / 1000; // Convert to seconds
  lastTimestamp = currentTime;
  // Update pulse
  if (pulseRadius < width) { // Prevent the pulse from growing indefinitely
    pulseRadius += deltaTime/1000 * pulseSpeed;
  }

  drawTransmitter();
  drawReceivers();
  checkPulseDetection(currentTime);
  
  
  //if all receivers detected
  if(receivers.every(receiver => receiver.detected)){
    if(startFrame == 0){
        startFrame = frameCount; // Record the starting frame count
        
        //swap delay
        let temp = receivers[0].detectionTime;
        receivers[0].detectionTime = receivers[1].detectionTime;
        receivers[1].detectionTime = temp;
    }
    updateAndDrawReceivers()
  }


  for(let p of points){
    for(let q of p){
      fill(0);
      //console.log(p);
      circle(q[0], q[1], 10); 
    }
  }

}


function findCircleIntersections(x0, y0, r0, x1, y1, r1) {
  let d = dist(x0, y0, x1, y1);

  // No solution if the circles don't intersect
  if (d > r0 + r1 || d < abs(r0 - r1)) {
    return [];
  }

  let a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  let h = sqrt(r0 * r0 - a * a);
  let x2 = x0 + a * (x1 - x0) / d;
  let y2 = y0 + a * (y1 - y0) / d;
  let x3 = x2 + h * (y1 - y0) / d;
  let y3 = y2 - h * (x1 - x0) / d;
  let x4 = x2 - h * (y1 - y0) / d;
  let y4 = y2 + h * (x1 - x0) / d;

  return [[x3, y3], [x4, y4]]; // Points of intersection
}

function plotPotentialTransmitterLocations() {
  loadPixels();
  for (let x = 0; x < width; x += 5) { // Sample every 5 pixels for efficiency
    for (let y = 0; y < height; y += 5) {
      let possible = true;
      for (let i = 0; i < receivers.length - 1; i++) {
        for (let j = i + 1; j < receivers.length; j++) {
          let d1 = dist(x, y, receivers[i].x, receivers[i].y); // Distance to first receiver
          let d2 = dist(x, y, receivers[j].x, receivers[j].y); // Distance to second receiver
          let toaDiff1 = abs(receivers[i].detectionTime - receivers[j].detectionTime) * pulseSpeed;
          let toaDiff2 = abs(d1 - d2);
          if (abs(toaDiff1 - toaDiff2) > 20) { // Threshold for considering a match
            possible = false;
            break;
          }
        }
        if (!possible) break;
      }
      if (possible) {
        // This pixel is a potential transmitter location
        circle(x, y, 40); // Semi-transparent red
      }
    }
  }
  updatePixels();
} //ta bort

function checkIntersections() {
  for (let i = 0; i < receivers.length; i++) {
    for (let j = i + 1; j < receivers.length; j++) {
      let d = dist(receivers[i].x, receivers[i].y, receivers[j].x, receivers[j].y);
      // Simple check for when circles are close to overlapping
      if (abs(d - (receivers[i].radius + receivers[j].radius)) < 10) {
        // Visually indicate potential intersection area
        fill(255, 0, 0, 100);
        noStroke();
        ellipse((receivers[i].x + receivers[j].x) / 2, (receivers[i].y + receivers[j].y) / 2, 10, 10);
      }
    }
  }
} //ta bort

function drawCircle(receiver) {
  noFill();
  stroke(0);
  circle(receiver.x, receiver.y, receiver.radius * 2); // Diameter is radius * 2
}

function drawTransmitter() {
  noFill();
  stroke(255, 0, 0);
  circle(transmitter.x, transmitter.y, pulseRadius * 2); // Pulse radius grows over time
  circle(transmitter.x, transmitter.y, 10); // Pulse radius grows over time
}

function drawReceivers() {
  for (let receiver of receivers) {
    fill(receiver.detected ? 'red' : 'green');
    noStroke();
    ellipse(receiver.x, receiver.y, 20, 20); // Draw receivers
  }
}

function checkPulseDetection(currentTime) {
  for (let receiver of receivers) {
    if (!receiver.detected) {
      let d = dist(transmitter.x, transmitter.y, receiver.x, receiver.y);
      if (d <= pulseRadius) {
        receiver.detected = true;
        receiver.detectionTime = currentTime;
        // Here you could trigger an event or call a function to handle the detection
        console.log(`Receiver at (${receiver.x}, ${receiver.y}) detected pulse at ${currentTime}ms`);
      }
    }
  }
}