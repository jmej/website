let bioBlurb = "Jesse Mejía is an artist, programmer and educator."
let projectImages = []; 
let particles = []; //single image per project now - change into array of sub images
let turquoise;
let magenta;
let gold;

let vimeoIframe;
let cnv;

let faceImages = []; // length 6: faceImages[0] = content gfx (front), others = p5.Image
let contentG;
let cubeSize;

// wind params
const WIND_SCALE = 0.002;
const WIND_STRENGTH = 0.08;
const WIND_TIME_SCALE = 0.0002;

//cube rotation
let currentRot = { x: 0, y: 0 };
let targetRot = { x: 0, y: 0 };
let lastSwitch = 0;
const SWITCH_INTERVAL = 5000; // ms between rotation target changes

function preload() {
  header = loadFont('assets/Team-Athletics-Freeware.ttf');
  for (let i = 0; i < projects.length; i++) {
    projectImages[i] = loadImage("assets/" + projects[i].image);
  }
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('position', 'relative');
  cnv.style('z-index', '1'); // canvas above the video
  turquoise = color(64, 224, 208);
  magenta   = color(255, 0, 255);
  gold = color(255,200,87);
  for (let i = 0; i < projects.length; i++){ //create a particle for each project
    particles.push(new Particle(i)); //pass i for project id
  }
  textFont(header);
  createVimeoIframe(); // create iframe (hidden by default)
}

function draw() {
  background(0);
  lights();
  particles.forEach(e => {
    e.update();
    e.show();
  });
  
  checkForMouseHoverOvercube();

  // resolve collisions
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      resolveCollision(particles[i], particles[j]);
    }
  }
  //main content box
  push();
  strokeWeight(4);
  noStroke();
  fill(magenta);
  rectMode(CENTER);
  rect(0, 0, width * 0.8, height * 0.8);
  textAlign(CENTER, CENTER)
  textSize(width * 0.1);
  textLeading(width * 0.1);        // line spacing
  textWrap(WORD);
  const textBoxW = width * 0.7;
  fill(0); //text color
  text(bioBlurb, 0, 0, textBoxW); // draw wrapped text in box with given width
  pop();  


  //work box
  const workCenterX = width * 0.17;
  const workCenterY = height * 0.17;
  const workW = width * 0.15;
  const workH = height * 0.15;
  const wleft = workCenterX - workW * 0.5;
  const wright = workCenterX + workW * 0.5;
  const wtop = workCenterY - workH * 0.5;
  const wbottom = workCenterY + workH * 0.5;
  const wHovered = mouseX >= wleft && mouseX <= wright && mouseY >= wtop && mouseY <= wbottom;
  push();
  // translate from center for webgl
  translate(-width/2 + workCenterX, -height/2 + workCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);
  if (wHovered) {
    fill(gold);
  } else {
    noFill();
  }
  rect(0, 0, workW, workH);

  if (wHovered) {
    changeCubesToImages(true); //change cube faces to project images
    expandCubesToGrid(); //expand cubes into grid layout
    //showVimeoBackground();
  }

  // label
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(width * 0.06);
  textLeading(width * 0.06);
  textWrap(WORD);
  text("WORK", 0, 0, workW);
  pop();

  //bio box
  const bioCenterX = width - width *0.17;
  const bioCenterY = height - height * 0.17;
  const bioW = width * 0.15;
  const bioH = height * 0.15;
  const bleft = bioCenterX - bioW * 0.5;
  const bright = bioCenterX + bioW * 0.5;
  const btop = bioCenterY - bioH * 0.5;
  const bbottom = bioCenterY + bioH * 0.5;
  const biohovered = mouseX >= bleft && mouseX <= bright && mouseY >= btop && mouseY <= bbottom;
  push();
  // draw in WEBGL space (translate from center)
  translate(-width/2 + bioCenterX, -height/2 + bioCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);
  if (biohovered) {
    fill(gold);
  } else {
    noFill();
  }
  rect(0, 0, bioW, bioH);

  // label
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(width * 0.06);
  textLeading(width * 0.06);
  textWrap(WORD);
  text("BIO", 0, 0, bioW);
  pop();
}

class Particle{
  constructor(id){
    let loc = createVector(random(width), random(height));
    let vel = createVector(random(-1, 1), random(-1, 1));
    this.position = loc;
    this.velocity = vel;
    this.size = 10;
    let pColor = color(random(255), random(255), random(255));
    this.pColor = pColor;
    this.birthTime = millis();
    this.age;
    this.enforceMainRect = true; // toggle for whether to keep particles in main content box
    this.turquoise = turquoise;
    this.magenta = magenta;
    this.gold = gold;
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.01, 0.01);
    this.projectId = id; //each box is associated with a project
    this.image = projects[id].image;
  }
  show(){
    let c = lerpColor(this.turquoise, this.magenta, this.age / 5000);
    fill(c);
    if(this.showImage){
      texture(projectImages[this.projectId]);
    }
    noStroke();
    push();
    translate(this.position.x - width / 2, this.position.y - height / 2);
    rotateX(this.angle);
    rotateY(this.angle);
    rotateZ(this.angle);
    box(this.size);
    pop();
  }
  update(){
    this.age = millis() - this.birthTime;
    this.angle += this.rotationSpeed;
    this.position.add(this.velocity);
    // apply subtle swirling wind force
    this.velocity.add( getWindAt(this.position) );
    // keep speeds reasonable
    this.velocity.limit(3);

    if(this.enforceMainRect){
      enforceMainRect(this);
    }

    if(this.position.x > width || this.position.x < 0){
      this.velocity.x *= -1;
      this.birthTime = millis(); //reborn when it hits the wall
    }
    if(this.position.y > height || this.position.y < 0){
      this.velocity.y *= -1;
      this.birthTime = millis(); //reborn when it hits the wall
    }
  }
 
}

class MenuItem{ //figure out positioning
  constructor(itemname, itemnumber){
    this.x = width * 0.17;
    this.y = height * 0.17;
    this.w = width * 0.15;
    this.h = height * 0.15;
    this.hovered = false;
    this.name = itemname;
    this.number = itemnumber;
  }
  show(){
    push();
    translate(-width/2 + this.x, -height/2 + this.y, 20);
    strokeWeight(4);
    stroke(turquoise);
    rectMode(CENTER);
    if (this.hovered) {
      fill(gold);
    } else {
      noFill();
    }
    rect(0, 0, this.w, this.h);

    // label
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(width * 0.06);
    textLeading(width * 0.06);
    text(this.name, 0, 0, this.w);
    pop();  
  }
}


//helpers

// collision resolver (equal-mass elastic, circle-approximation + separation)
function  resolveCollision(a, b) {
    const boxSize = 10;
    const minDist = boxSize; // approximate collision radius
    let n = p5.Vector.sub(b.position, a.position);
    let d = n.mag();
    if (d === 0) {
    // jitter to avoid divide-by-zero
      n = createVector(random(-1,1), random(-1,1));
      d = n.mag();
    }
    if (d < minDist) {
      n.normalize();
      // separate overlapping boxes
      const overlap = (minDist - d);
      a.position.add(p5.Vector.mult(n, -overlap * 0.5));
      b.position.add(p5.Vector.mult(n, overlap * 0.5));

      // decompose velocities into normal/tangent
      const aNormProj = p5.Vector.dot(a.velocity, n);
      const bNormProj = p5.Vector.dot(b.velocity, n);
      const aNorm = p5.Vector.mult(n, aNormProj);
      const bNorm = p5.Vector.mult(n, bNormProj);
      const aTang = p5.Vector.sub(a.velocity, aNorm);
      const bTang = p5.Vector.sub(b.velocity, bNorm);

      // swap normal components (elastic equal-mass collision)
      a.velocity = p5.Vector.add(aTang, bNorm);
      b.velocity = p5.Vector.add(bTang, aNorm);

      a.birthTime = millis();
      b.birthTime = millis();
  }
}

function getWindAt(position) {
  // perfect circular swirl around canvas center
  const center = createVector(width / 2, height / 2);
  let r = p5.Vector.sub(position, center);
  const dist = r.mag();
  if (dist === 0) return createVector(0, 0);

  // tangent (perpendicular) gives circular flow
  let tangent = createVector(-r.y, r.x).normalize();

  // slow precession of the whole field
  const spin = millis() * 0.0002; // tweak to speed up/down
  tangent.rotate(spin);

  // fade wind toward edges
  const maxR = min(width, height) * 0.5;
  const falloff = constrain(1 - dist / maxR, 0, 1);

  return tangent.mult(WIND_STRENGTH * falloff);
}

function enforceMainRect(p) {
  const rectHalfW = (width * 0.8) * 0.5;
  const rectHalfH = (height * 0.8) * 0.5;
  const boxHalf = 5; // half of box(10)
  // local position relative to rect center
  const localX = p.position.x - width / 2;
  const localY = p.position.y - height / 2;

  // inside rectangle?
  if (abs(localX) < rectHalfW && abs(localY) < rectHalfH) {
    // penetration depths to each edge
    const penX = rectHalfW - abs(localX);
    const penY = rectHalfH - abs(localY);

    if (penX < penY) {
      // push out horizontally
      const side = localX >= 0 ? 1 : -1;
      p.position.x = width / 2 + side * (rectHalfW + boxHalf);
      p.velocity.x = -p.velocity.x * 0.8; // reflect + damp
    } else {
      // push out vertically
      const side = localY >= 0 ? 1 : -1;
      p.position.y = height / 2 + side * (rectHalfH + boxHalf);
      p.velocity.y = -p.velocity.y * 0.8; // reflect + damp
    }
    p.birthTime = millis();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // keep iframe size updated even if hidden
  if (vimeoIframe) vimeoIframe.size(windowWidth, windowHeight);
  for (let p of particles) {
    p.position.x = constrain(p.position.x, 0, width);
    p.position.y = constrain(p.position.y, 0, height);
  }
}


// ...existing code...
function createVimeoIframe() {
  const src = 'https://player.vimeo.com/video/932979322?autoplay=1&loop=1&muted=1&autopause=0&background=1';
  vimeoIframe = createElement('iframe');
  vimeoIframe.attribute('src', src);
  vimeoIframe.attribute('frameborder', '0');
  vimeoIframe.attribute('allow', 'autoplay; fullscreen; picture-in-picture');
  vimeoIframe.attribute('allowfullscreen', '');

  // initial minimal styling; actual sizing done in showVimeoBackground to guarantee cover
  vimeoIframe.style('position', 'fixed');
  vimeoIframe.style('left', '50%');
  vimeoIframe.style('top', '50%');
  vimeoIframe.style('transform', 'translate(-50%,-50%)');
  vimeoIframe.style('object-fit', 'cover');
  vimeoIframe.style('pointer-events', 'none'); // keep canvas interactive
  vimeoIframe.style('z-index', '9999');        // visible above canvas when shown
  vimeoIframe.style('border', '0');
  vimeoIframe.hide(); // start hidden
}

const VIDEO_ASPECT = 16 / 9; // adjust if your Vimeo video uses another aspect

function showVimeoBackground() {
  if (!vimeoIframe) return;

  // viewport
  const vw = Math.max(1, window.innerWidth);
  const vh = Math.max(1, window.innerHeight);

  // compute size that fully covers the viewport while preserving aspect ratio
  let w, h;
  if (vw / vh < VIDEO_ASPECT) {
    // viewport is narrower than video -> make width based on height
    h = vh;
    w = Math.ceil(h * VIDEO_ASPECT);
  } else {
    // viewport is wider (or equal) -> make height based on width
    w = vw;
    h = Math.ceil(w / VIDEO_ASPECT);
  }

  // apply centered oversize sizing (px ensures precise cover on narrow viewports)
  vimeoIframe.style('position', 'fixed');
  vimeoIframe.style('left', '50%');
  vimeoIframe.style('top', '50%');
  vimeoIframe.style('transform', 'translate(-50%,-50%)');
  vimeoIframe.style('width', `${w}px`);
  vimeoIframe.style('height', `${h}px`);
  vimeoIframe.style('min-width', '100vw');
  vimeoIframe.style('min-height', '100vh');
  vimeoIframe.style('object-fit', 'cover');
  vimeoIframe.style('pointer-events', 'none');
  vimeoIframe.style('z-index', '9999');
  vimeoIframe.show();
}

function hideVimeo() {
  if (!vimeoIframe) return;
  vimeoIframe.hide();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // update iframe sizing if visible
  if (vimeoIframe && vimeoIframe.elt && vimeoIframe.elt.style.display !== 'none') {
    showVimeoBackground();
  }
  for (let p of particles) {
    p.position.x = constrain(p.position.x, 0, width);
    p.position.y = constrain(p.position.y, 0, height);
  }
}

function changeCubesToImages(showImages) {
  for (let p of particles) {
    p.showImage = showImages; // set to project image
    p.enforceMainRect = false; // allow free movement when showing images
  }
}

function expandCubesToGrid() {
  const cols = ceil(sqrt(particles.length));
  const rows = ceil(particles.length / cols);
  const gridW = width * 0.9;
  const gridH = height * 0.9;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const startX = width / 2 - gridW / 2 + cellW / 2;
  const startY = height / 2 - gridH / 2 + cellH / 2;

  particles.forEach((p, i) => {
    const col = i % cols;
    const row = floor(i / cols);
    p.position.x = lerp(p.position.x, startX + col * cellW, 0.1);
    p.position.y = lerp(p.position.y, startY + row * cellH, 0.1);
    p.size = lerp(p.size, min(cellW, cellH) * 0.8, 0.1); // grow to fit grid cell
    p.velocity.mult(0.9); // slow down as they move to grid
    p.angle = lerp(p.angle, 0, 0.1); // reset rotation for better image display
  });
}

function checkForMouseHoverOvercube(){
  let hoveringAny = false;
  for (let p of particles) {
    const screenPos = createVector(p.position.x - width / 2, p.position.y - height / 2);
    const d = dist(screenPos.x, screenPos.y, mouseX - width / 2, mouseY - height / 2);
    if (d < p.size/2) {
      // moveOneCubeToGrid(p); // mouse is hovering over this cube
      changeCubesToImages(true); // show images when hovering any cube
      expandCubesToGrid();
      hoveringAny = true; 
    }
  }
  if (!hoveringAny) {
    changeCubesToImages(false); // revert to cubes when not hovering any
    returnCubesToParticles(); // move cubes back to particle positions
  }
}

function moveOneCubeToGrid(p) {
  const cols = ceil(sqrt(particles.length));
  const rows = ceil(particles.length / cols);
  const gridW = width * 0.9;
  const gridH = height * 0.9;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const startX = width / 2 - gridW / 2 + cellW / 2;
  const startY = height / 2 - gridH / 2 + cellH / 2;

  const i = particles.indexOf(p);
  const col = i % cols;
  const row = floor(i / cols);
  p.position.x = lerp(p.position.x, startX + col * cellW, 0.1);
  p.position.y = lerp(p.position.y, startY + row * cellH, 0.1);
  p.size = lerp(p.size, min(cellW, cellH) * 0.8, 0.1); // grow to fit grid cell
  p.velocity.mult(0.7); // slow down as it moves to grid
  p.angle = lerp(p.angle, 0, 0.1); // reset rotation for better image display
  p.showImage = true; // set to project image
  p.enforceMainRect = false; // allow free movement when showing image
} 

function returnCubesToParticles() {
  for (let p of particles) {
    p.showImage = false; // revert to colored cubes
    p.enforceMainRect = true; // keep particles in main content box
    p.size = lerp(p.size, 10, 0.1); // shrink back to original size
  }
}

