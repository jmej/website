let bioBlurb = "Jesse Mejía is an artist, programmer and educator."
let images = [];
let particles = [];
let particleCount = 20;
let turquoise;
let magenta;
let gold;

let vimeoIframe;
let cnv;

const assetImageFiles = [
  'hopscotch1.jpg',
  'image-asset_027.webp',
  'interactivity-lab1.webp',
  'P1140049.webp',
  'exchange3.webp',
];

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
  // try to load listed asset files; push only successful loads
  for (let f of assetImageFiles) {
    loadImage('assets/' + f,
      img => images.push(img),
      err => { /* ignore missing files */ }
    );
  }
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('position', 'relative');
  cnv.style('z-index', '1'); // canvas above the video
  turquoise = color(64, 224, 208);
  magenta   = color(255, 0, 255);
  gold = color(255,200,87);
  for (let i = 0; i < particleCount; i++){
    particles.push(new Particle());
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
  rectMode(CENTER);
  rect(0, 0, width * 0.8, height * 0.8);
  fill(0); //text color
  textAlign(CENTER, CENTER)
  textSize(width * 0.1);
  textLeading(width * 0.1);        // line spacing
  textWrap(WORD);
  const textBoxW = width * 0.7;
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
    showVimeoBackground();
  } else {
    hideVimeo();
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
  constructor(){
    let loc = createVector(random(width), random(height));
    let vel = createVector(random(-1, 1), random(-1, 1));
    this.position = loc;
    this.velocity = vel;
    let pColor = color(random(255), random(255), random(255));
    this.pColor = pColor;
    this.birthTime = millis();
    this.age;
    this.turquoise = turquoise;
    this.magenta = magenta;
    this.gold = gold;
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.01, 0.01);
  }
  show(){
    let c = lerpColor(this.turquoise, this.magenta, this.age / 5000);
    fill(c);
    noStroke();
    push();
    translate(this.position.x - width / 2, this.position.y - height / 2);
    rotateX(this.angle);
    rotateY(this.angle);
    rotateZ(this.angle);
    box(10);
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

    // keep particles outside the main content rectangle
    enforceMainRect(this);

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
``}
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

  // tangent (perpendicular) gives perfect circular flow
  let tangent = createVector(-r.y, r.x).normalize();

  // optional slow precession of the whole field
  const spin = millis() * 0.0002; // tweak to speed up/down
  tangent.rotate(spin);

  // fade wind toward edges (optional)
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

