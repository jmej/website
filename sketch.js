let bioBlurb = "Jesse Mejía is an artist, programmer and educator."
let projects = []; // populated in preload from projectData.json
let projectData;
let projectImages = [];
let projectMoreImages = [];
let particles = []; //for now seperating movement logic from project data
let turquoise;
let tTurquoise;
let magenta;
let gold;

let vimeoIframe;
let cnv;

let contentG;
let cubeSize;

let wHovered = false;
let biohovered = false;

let galleryMode = false;
let exitHovered = false;
let hoveredProjectId = -1; // project index of the currently hovered cube
let projectMode = false;
let selectedProjectId = -1;
let projectScrollY = 0;
let projectOverlay;
let descFont;

let videoMode = false;          // true when a full-screen Vimeo is playing
let videoLoaded = false;        // true once the Vimeo video has started playing
let imageBounds = [];           // populated during project box render for click detection

// description typography — change these ratios to resize the project body text
const DESC_TEXT_RATIO = 0.014;   // text size as fraction of screen width
const DESC_LINE_RATIO = 0.020;   // line height as fraction of screen width (larger than text size for readability)

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
  console.log("preloading assets...");
  header = loadFont('assets/Team-Athletics-Freeware.ttf');
  descFont = loadFont('assets/Roboto-VariableFont_wdth,wght.ttf');
  //needed a callback to make the map work since loadJSON is async
  loadJSON('assets/projectData.json', data => {
    projects = Object.values(data).map(Project.fromJSON);
    console.log(data);
    for (let i = 0; i < projects.length; i++) {
      if(projects[i].mainImage){
        projectImages[i] = loadImage("assets/" + encodeURIComponent(projects[i].mainImage))
        console.log("loading an image for project " + projects[i].name);
      }
      projectMoreImages[i] = [];
      for (let imgPath of projects[i].moreImages) {
        projectMoreImages[i].push(loadImage("assets/" + encodeURIComponent(imgPath)));
      }
    }
  });
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('position', 'relative');
  cnv.style('z-index', '1'); // canvas above the video
  turquoise = color(64, 224, 208);
  tTurquoise = color(64, 224, 208, 230); //same turquoise with some transparency
  magenta   = color(255, 0, 255);
  gold = color(255,200,87);
  for (let i = 0; i < projects.length; i++){ //create a particle for each project
    particles.push(new Particle(i)); //pass i for project id
  }
  textFont(header);
  projectOverlay = createGraphics(width, height); // 2D overlay for project box
  projectOverlay.textFont(header);
  createVimeoIframe(); // create iframe (hidden by default)

  // Listen for Vimeo's postMessage "play" event to dismiss the loading text.
  window.addEventListener('message', function (e) {
    try {
      const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && typeof d.event === 'string' && d.event === 'play') {
        videoLoaded = true;
        showVimeoBackground();
      }
    } catch (_) { /* ignore */ }
  });
}

function draw() {
  background(0);

  // When a full-screen video is playing, show loading text or keep canvas black
  if (videoMode) {
    if (!videoLoaded) {
      fill(255, 0, 255); // magenta
      noStroke();
      textFont(header);
      textAlign(CENTER, CENTER);
      textSize(min(width * 0.08, 80));
      text('LOADING', 0, 0);
    }
    return;
  }

  lights();
  particles.forEach(e => {
    e.update();
    e.show();
  });
  
  //checkForMouseHoverOvercube();

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
  const workCenterX = width * 0.10;
  const workCenterY = height * 0.10;
  const workW = width * 0.15;
  const workH = height * 0.15;
  const wleft = workCenterX - workW * 0.5;
  const wright = workCenterX + workW * 0.5;
  const wtop = workCenterY - workH * 0.5;
  const wbottom = workCenterY + workH * 0.5;
  wHovered = mouseX >= wleft && mouseX <= wright && mouseY >= wtop && mouseY <= wbottom;
  push();
  // translate from center for webgl
  translate(-width/2 + workCenterX, -height/2 + workCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);

  if (wHovered || galleryMode) {
    changeCubesToImages(true); //change cube faces to project images
    expandCubesToGrid(); //expand cubes into grid layout
    galleryMode = true;
    //showVimeoBackground();

    // hover enlargement on cubes in gallery mode (disabled while project is open)
    if (!projectMode) {
      let hoveredP = null;
      let hoveredDist = Infinity;
      for (let p of particles) {
        const d = dist(p.position.x, p.position.y, mouseX, mouseY);
        if (d < p.size * 0.7 && d < hoveredDist) {
          hoveredDist = d;
          hoveredP = p;
        }
      }
      if (hoveredP) {
        hoveredProjectId = hoveredP.projectId;
        const cols = ceil(sqrt(particles.length));
        const cellW = (width * 0.9) / cols;
        const cellH = (height * 0.9) / cols;
        const cellSize = min(cellW, cellH) * 0.8;
        hoveredP.size = lerp(hoveredP.size, cellSize * 1.4, 0.15);
      } else {
        hoveredProjectId = -1;
      }
    }
  }else{
    returnCubesToParticles(); // continuously shrink cubes back to original size
  }

  if (wHovered && !galleryMode) {
    fill(gold);
  } else {
    fill(turquoise);
  }

   rect(0, 0, workW, workH);
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
  const bioCenterX = width - width *0.10;
  const bioCenterY = height - height * 0.10;
  const bioW = width * 0.15;
  const bioH = height * 0.15;
  const bleft = bioCenterX - bioW * 0.5;
  const bright = bioCenterX + bioW * 0.5;
  const btop = bioCenterY - bioH * 0.5;
  const bbottom = bioCenterY + bioH * 0.5;
  biohovered = mouseX >= bleft && mouseX <= bright && mouseY >= btop && mouseY <= bbottom;
  push();
  // draw in WEBGL space (translate from center)
  translate(-width/2 + bioCenterX, -height/2 + bioCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);
  if (biohovered) {
    fill(gold);
  } else {
    fill(turquoise);
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

  // exit button (appears centered when in gallery mode)
  if (galleryMode) {
    const exitBtnW = width * 0.1;
    const exitBtnH = height * 0.08;
    const exitX = width / 2;
    const exitY = height * 0.1;
    const eLeft = exitX - exitBtnW * 0.5;
    const eRight = exitX + exitBtnW * 0.5;
    const eTop = exitY - exitBtnH * 0.5;
    const eBottom = exitY + exitBtnH * 0.5;
    exitHovered = mouseX >= eLeft && mouseX <= eRight && mouseY >= eTop && mouseY <= eBottom;

    push();
    translate(-width/2 + exitX, -height/2 + exitY, 50); // z=50 to appear above everything
    strokeWeight(4);
    stroke(turquoise);
    rectMode(CENTER);
    if (exitHovered) {
      fill(gold);
    } else {
      fill(turquoise);
    }
    rect(0, 0, exitBtnW, exitBtnH);

    // label
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(width * 0.05);
    text("back", 0, 0);
    pop();
  } else {
    exitHovered = false;
  }

  //project box (drawn via 2D overlay for reliable positioning)
  if (projectMode && selectedProjectId >= 0) {
    imageBounds = []; // reset for this frame
    const proj = projects[selectedProjectId];
    const boxW = width * 0.6;
    const boxH = height * 0.6;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;
    const margin = width * 0.04;
    const descMargin = width * 0.07; // bigger margin for description

    const g = projectOverlay;
    g.clear();

    // dimmed backdrop covering entire screen
    g.noStroke();
    g.fill(tTurquoise);
    g.rect(0, 0, width, height);

    // centered border
    g.strokeWeight(4);
    g.stroke(magenta);
    g.noFill();
    g.rect(boxX, boxY, boxW, boxH);

    // project name (uses regular margin)
    g.fill(gold);
    g.noStroke();
    g.textAlign(LEFT, TOP);
    g.textSize(width * 0.03);
    g.textLeading(width * 0.035);
    const titleY = boxY + margin;
    g.text(proj.name, boxX + margin, titleY, boxW - margin * 2);

    // description area (uses bigger descMargin)
    g.fill(0);
    g.textSize(width * DESC_TEXT_RATIO);
    g.textLeading(width * DESC_LINE_RATIO);
    const descX = boxX + descMargin;
    const descW = boxW - descMargin * 2;
    const descTopY = titleY + width * 0.05;
    const descBottomY = boxY + boxH - margin;
    const descH = descBottomY - descTopY;

    // estimate total text height for scroll bounds
    g.textFont(descFont);
    const lineH = width * DESC_LINE_RATIO;
    const paraGap = lineH * 0.6;
    const imageMaxH = height * 0.3;
    const imageGap = width * 0.01;     // gap between images in a row
    const markerRe = /^\[(image|videothumb):([\d,]+)\]$/;  // "[image:0,1]" or "[videothumb:0]"
    const splitRe = /(\[(?:image|videothumb):[\d,]+\])/;
    const sentenceRe = /(?<=\.)\s+(?=[A-Z0-9])/; // split after period + space + capital/digit

    // Count wrapped lines (handles \n hard breaks inside text too)
    function countWrappedLines(str, maxW) {
      if (!str.trim()) return 0;
      const rawLines = str.split('\n');
      let total = 0;
      for (const ln of rawLines) {
        if (!ln.trim()) continue;
        const words = ln.split(' ');
        let lineCount = 1;
        let lineW = 0;
        for (const word of words) {
          const wordW = g.textWidth(word + ' ');
          if (lineW + wordW > maxW && lineW > 0) {
            lineCount++;
            lineW = wordW;
          } else {
            lineW += wordW;
          }
        }
        total += lineCount;
      }
      return total;
    }

    // Draw a play-button overlay (white circle + black triangle) centered at (cx, cy).
    function drawPlayButton(g, cx, cy, diameter) {
      if (diameter <= 0) return;
      const r = diameter / 2;
      // translucent white circle
      g.fill(255, 255, 255, 235);
      g.noStroke();
      g.ellipse(cx, cy, diameter);
      // black play triangle pointing right
      g.fill(0);
      const s = r * 0.55;
      g.triangle(
        cx - s * 0.35, cy - s * 0.55,
        cx - s * 0.35, cy + s * 0.55,
        cx + s * 0.65, cy
      );
    }

    // parse paragraphs from description (split on blank lines)
    const paragraphs = proj.description.split('\n\n').filter(s => s.trim());

    // ── measurement pass ──────────────────────────────────────
    let totalTextH = 0;

    // primary (main) image at the top of the description area
    // (skip if the project has a video — the user handles those manually)
    const mainImg = (!proj.video) ? projectImages[selectedProjectId] : null;
    let mainImgH = 0;
    if (mainImg && mainImg.width > 0) {
      mainImgH = Math.min(descW / (mainImg.width / mainImg.height), imageMaxH);
      totalTextH += mainImgH + paraGap;
    }

    for (let para of paragraphs) {
      const parts = para.split(splitRe);
      for (let part of parts) {
        if (!part || !part.trim()) continue;
        const m = part.match(markerRe);
        if (m) {
          const indices = m[2].split(',').map(s => parseInt(s.trim()));
          const imgCount = indices.length;
          if (imgCount === 0) continue;
          const totalGap = imageGap * (imgCount - 1);
          const colW = (descW - totalGap) / imgCount;
          let rowH = 0;
          for (let idx of indices) {
            const img = projectMoreImages[selectedProjectId]?.[idx];
            if (img && img.width > 0) {
              const aspect = img.width / img.height;
              rowH = Math.max(rowH, Math.min(colW / aspect, imageMaxH));
            }
          }
          totalTextH += rowH + paraGap;
        } else {
          // text — split into sentences so each starts on its own line
          const sentences = part.split(sentenceRe);
          for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i].trim();
            if (!s) continue;
            totalTextH += countWrappedLines(s, descW) * lineH;
            totalTextH += paraGap; // double break after every period
          }
        }
      }
    }
    const scrollMax = Math.max(0, totalTextH - descH);
    projectScrollY = constrain(projectScrollY, 0, scrollMax);

    // ── render pass ──────────────────────────────────────────
    g.push();
    g.drawingContext.save();
    g.drawingContext.beginPath();
    g.drawingContext.rect(descX, descTopY, descW, descH);
    g.drawingContext.clip();

    let drawY = descTopY - projectScrollY;
    g.textFont(descFont);
    g.textSize(width * DESC_TEXT_RATIO);
    g.textLeading(lineH);

    // primary (main) image
    if (mainImg && mainImg.width > 0) {
      const aspect = mainImg.width / mainImg.height;
      const displayH = Math.min(descW / aspect, imageMaxH);
      const displayW = displayH * aspect;
      const imgX = descX + (descW - displayW) / 2;
      g.image(mainImg, imgX, drawY, displayW, displayH);
      drawY += displayH + paraGap;
    }

    for (let para of paragraphs) {
      const parts = para.split(splitRe);
      for (let part of parts) {
        if (!part) continue;
        const m = part.match(markerRe);
        if (m) {
          const markerType = m[1]; // "image" or "videothumb"
          const indices = m[2].split(',').map(s => parseInt(s.trim()));
          const imgCount = indices.length;
          if (imgCount === 0) continue;
          const totalGap = imageGap * (imgCount - 1);
          const colW = (descW - totalGap) / imgCount;
          // First pass: collect loaded images and compute row height
          const loaded = [];
          let rowH = 0;
          for (let idx of indices) {
            const img = projectMoreImages[selectedProjectId]?.[idx];
            if (img && img.width > 0) {
              const aspect = img.width / img.height;
              const displayH = Math.min(colW / aspect, imageMaxH);
              loaded.push({ img, displayH, aspect });
              rowH = Math.max(rowH, displayH);
            }
          }
          // Second pass: render side-by-side, centered vertically
          if (loaded.length > 0) {
            for (let colIdx = 0; colIdx < loaded.length; colIdx++) {
              const { img, displayH, aspect } = loaded[colIdx];
              const displayW = displayH * aspect;
              const imgX = descX + colIdx * (colW + imageGap) + (colW - displayW) / 2;
              const imgY = drawY + (rowH - displayH) / 2;
              g.image(img, imgX, imgY, displayW, displayH);
              if (markerType === 'videothumb') {
                const d = min(displayW, displayH) * 0.45;
                drawPlayButton(g, imgX + displayW / 2, imgY + displayH / 2, d);
              }
              imageBounds.push({ x: imgX, y: imgY, w: displayW, h: displayH, type: markerType });
            }
            drawY += rowH + paraGap;
          }
        } else if (part.trim()) {
          // text — split into sentences, each on its own line
          g.fill(0);
          const sentences = part.split(sentenceRe);
          for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (!sentence) continue;
            const sLines = countWrappedLines(sentence, descW);
            g.text(sentence, descX, drawY, descW);
            drawY += sLines * lineH;
            drawY += paraGap; // double break after every period
          }
        }
      }
    }

    g.drawingContext.restore();
    g.pop();

    // scroll indicators (minimal triangles)
    const indicatorSize = width * 0.02;
    const indicatorRight = boxX + boxW - margin * 0.5;
    const indicatorCenterY = (descTopY + descBottomY) / 2;

    if (projectScrollY > 0) {
      g.fill(0);
      g.noStroke();
      g.triangle(
        indicatorRight, indicatorCenterY - indicatorSize * 2.5,
        indicatorRight - indicatorSize * 1.5, indicatorCenterY - indicatorSize * 1,
        indicatorRight + indicatorSize * 1.5, indicatorCenterY - indicatorSize * 1
      );
    }
    if (projectScrollY < scrollMax) {
      g.fill(0);
      g.noStroke();
      g.triangle(
        indicatorRight, indicatorCenterY + indicatorSize * 2.5,
        indicatorRight - indicatorSize * 1.5, indicatorCenterY + indicatorSize * 1,
        indicatorRight + indicatorSize * 1.5, indicatorCenterY + indicatorSize * 1
      );
    }

    // render the overlay as a textured plane in WEBGL, centered on screen
    push();
    translate(0, 0, 250);
    texture(g);
    noStroke();
    plane(width, height);
    pop();
  }
}

function mouseClicked() {
  // If a full-screen video is playing, clicking anywhere dismisses it
  if (videoMode) {
    hideVimeo();
    return;
  }

  if(wHovered && galleryMode){ //a way to get out of gallery mode
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
  }
  if(wHovered && !galleryMode){
    galleryMode = true;
  }
  
  if(exitHovered && galleryMode){
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
  }

  if(biohovered){
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false); //revert to cubes
    returnCubesToParticles(); //move cubes back to particle positions
  }

  // click on an image inside a project box
  // [videothumb:N] launches the project video; [image:N] is reserved for future expand
  // (check BEFORE the "close box when clicking outside" else-if)
  if (projectMode && selectedProjectId >= 0) {
    const proj = projects[selectedProjectId];
    for (let b of imageBounds) {
      if (mouseX >= b.x && mouseX <= b.x + b.w &&
          mouseY >= b.y && mouseY <= b.y + b.h) {
        if (b.type === 'videothumb' && proj && proj.video) {
          projectMode = false;
          showProjectVideo(proj.video);
          return;
        }
        // regular [image:N] image clicked — nothing yet (future: expand)
        break;
      }
    }
  }

  // cube clicks are disabled while a project is open
  if (galleryMode && !projectMode && hoveredProjectId >= 0) {
    if (selectedProjectId !== hoveredProjectId) {
      projectScrollY = 0; // reset scroll for new project
    }
    selectedProjectId = hoveredProjectId;
    projectMode = true;
  } else if (galleryMode && projectMode && !exitHovered) {
    // close project box only when clicking outside the box area
    const pw = width * 0.6;
    const ph = height * 0.6;
    const px = (width - pw) / 2;
    const py = (height - ph) / 2;
    const outside = mouseX < px || mouseX > px + pw || mouseY < py || mouseY > py + ph;
    if (outside) {
      projectMode = false;
    }
  }
}

function mouseWheel(event) {
  if (projectMode) {
    projectScrollY += event.delta;
    return false; // prevent page scroll
  }
}

function keyPressed() {
  if (keyCode === ESCAPE && videoMode) {
    hideVimeo();
    return;
  }
  if (keyCode === ESCAPE && galleryMode) {
    if (projectMode) {
      projectMode = false;
    } else {
      galleryMode = false;
      changeCubesToImages(false);
      returnCubesToParticles();
    }
  }
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
  // resize 2D overlay for project box
  projectOverlay = createGraphics(width, height);
  projectOverlay.textFont(header);
  // update iframe sizing if visible
  if (vimeoIframe && vimeoIframe.elt && vimeoIframe.elt.style.display !== 'none') {
    showVimeoBackground();
  }
  for (let p of particles) {
    p.position.x = constrain(p.position.x, 0, width);
    p.position.y = constrain(p.position.y, 0, height);
  }
}

function createVimeoIframe() {
  // Create the iframe once; src is set in showProjectVideo (from click handler)
  vimeoIframe = createElement('iframe');
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

// Convert a vimeo.com URL to a player.vimeo.com embed URL
function vimeoPlayerUrl(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) {
    return `https://player.vimeo.com/video/${m[1]}?autoplay=1&loop=1&autopause=0`;
  }
  return url; // not a Vimeo URL, use as-is
}

// Show a Vimeo video full-screen (src is set here, inside the click handler,
// so the browser treats it as a user-gesture-initiated autoplay with sound)
function showProjectVideo(vimeoUrl) {
  if (!vimeoIframe) return;
  // Stop gallery rendering and show the loading text FIRST,
  // then load the video — this prevents the "play" event arriving
  // before the loading text is up.
  videoMode = true;
  videoLoaded = false;

  const playerUrl = vimeoPlayerUrl(vimeoUrl);
  vimeoIframe.attribute('src', playerUrl);

  // Keep the iframe hidden until the video is actually ready, so the
  // loading text (drawn on the canvas at z-index 1) isn't covered by
  // the Vimeo iframe (z-index 9999) with its controls visible.
  const revealVideo = function () {
    if (videoLoaded) return; // already revealed
    videoLoaded = true;
    showVimeoBackground();
  };

  // fallback: reveal after 6 s even if Vimeo never fires "play"
  setTimeout(revealVideo, 6000);

  // Use the official Vimeo Player API to reliably detect when playback starts
  if (typeof Vimeo !== 'undefined' && Vimeo.Player) {
    // Wait for the iframe to finish loading before creating the Player
    const onLoad = function () {
      vimeoIframe.elt.removeEventListener('load', onLoad);
      try {
        const player = new Vimeo.Player(vimeoIframe.elt);
        // Both 'play' and 'loaded' dismiss the loading text and reveal the video
        player.on('play', revealVideo);
        player.on('loaded', revealVideo);
      } catch (e) {
        // API failed, fallback to the 6 s timeout above
      }
    };
    vimeoIframe.elt.addEventListener('load', onLoad);
  }
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
  vimeoIframe.attribute('src', 'about:blank'); // unload the video so audio stops
  vimeoIframe.hide();
  videoMode = false;
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

//yanked for now - do something else with hover

// function checkForMouseHoverOvercube(){
//   let hoveringAny = false;
//   for (let p of particles) {
//     const screenPos = createVector(p.position.x - width / 2, p.position.y - height / 2);
//     const d = dist(screenPos.x, screenPos.y, mouseX - width / 2, mouseY - height / 2);
//     if (d < p.size/2) {
//       // moveOneCubeToGrid(p); // mouse is hovering over this cube
//       changeCubesToImages(true); // show images when hovering any cube
//       expandCubesToGrid();
//       hoveringAny = true; 
//     }
//   }
//   if (!hoveringAny) {
//     changeCubesToImages(false); // revert to cubes when not hovering any
//     returnCubesToParticles(); // move cubes back to particle positions
//   }
// }

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

