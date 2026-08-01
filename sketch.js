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
let bioData;                        // loaded from assets/bio.json
let bioImage;                       // loaded from bioData.image path
let bioMode = false;                // true when the bio overlay is open
let bioScrollY = 0;
let bioOverlay;

let biohovered = false;

let linksMode = false;             // true when the links overlay is open
let linkshovered = false;
let linksPanel;                    // full-screen DOM overlay for the links list
let linksBox;                      // centered box inside linksPanel
let linksTitle;                    // "Links" heading div inside linksBox
let linkEls = [];                  // DOM anchors for the links (for responsive sizing)
let linksVisible = false;          // whether linksPanel is currently shown

let contactMode = false;             // true when the contact overlay is open
let contactForm;
let contacthovered = false;
let contactSubmitted = false;       // true after successful form submission

let galleryMode = false;
let exitHovered = false;
let historyPushed = false;          // true while the current non-default state is recorded in history
let hoveredProjectId = -1; // project index of the currently hovered cube
let projectMode = false;
let selectedProjectId = -1;
let projectScrollY = 0;
let projectOverlay;
let descFont;

let videoMode = false;          // true when a full-screen Vimeo is playing
let videoLoaded = false;        // true once the Vimeo video has started playing
let imageBounds = [];           // populated during project box render for click detection
let projectBackBtn = null;      // {x,y,w,h} of the gold "back" button in the project box
let projectBox = null;          // {x,y,w,h} of the project box (kept in sync for outside-click close)
let mainBox = { w: 0, h: 0 };   // main bio-blurb box dims, recomputed each frame in draw()

// description typography — change these ratios to resize the project body text
const DESC_TEXT_RATIO = 0.014;   // text size as fraction of screen width
const DESC_LINE_RATIO = 0.020;   // line height as fraction of screen width (larger than text size for readability)

// wind params
const WIND_SCALE = 0.002;
const WIND_STRENGTH = 0.08;
const WIND_TIME_SCALE = 0.0002;

// ── Contact form ─────────────────────────────────────────────
const FORMSPREE_ID = 'YOUR_FORM_ID'; // replace with your Formspree form ID
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

// ── Links overlay ────────────────────────────────────────────
const LINKS = [
  { label: 'Parallel Studio', url: 'https://parallel.studio' },
  { label: 'Instagram',       url: 'https://instagram.com/bananeurysm' },
  { label: 'GitHub',          url: 'https://github.com/jmej' },
  { label: 'Soundcloud',      url: 'https://soundcloud.com/losdatos' },
];

//cube rotation
let currentRot = { x: 0, y: 0 };
let targetRot = { x: 0, y: 0 };
let lastSwitch = 0;
const SWITCH_INTERVAL = 5000; // ms between rotation target changes

function preload() {
  console.log("preloading assets...");
  header = loadFont('assets/Team-Athletics-Freeware.ttf');
  descFont = loadFont('assets/SpaceGrotesk-VariableFont_wght.ttf');
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
  // load bio data and image
  loadJSON('assets/bio.json', data => { bioData = data; });
  bioImage = loadImage('assets/' + encodeURIComponent('P1140049.jpg'));
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
  bioOverlay = createGraphics(width, height); // 2D overlay for bio box
  bioOverlay.textFont(header);
  createContactForm(); // p5.js DOM overlay for the contact form
  createLinks();       // p5.js DOM overlay for the links list
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

  // Browser back button: reset to the default state when the app is showing
  // a gallery/project/overlay (we pushed an entry when it opened). If the app
  // is already in the default state, do nothing so the browser truly goes
  // back to the previous page.
  window.addEventListener('popstate', function () {
    if (!isDefaultState()) {
      resetToDefaultState();
      historyPushed = false;
    }
  });
}

// ── Contact form (p5.js DOM overlay, no separate CSS) ────────
function createContactForm() {
  // Full-screen backdrop
  contactForm = createDiv('');
  contactForm.style('position', 'fixed');
  contactForm.style('left', '0');
  contactForm.style('top', '0');
  contactForm.style('width', '100vw');
  contactForm.style('height', '100vh');
  contactForm.style('background', 'rgba(64,224,208,0.88)'); // tTurquoise
  contactForm.style('display', 'flex');
  contactForm.style('align-items', 'center');
  contactForm.style('justify-content', 'center');
  contactForm.style('z-index', '10000');
  contactForm.style('pointer-events', 'auto');

  // Centered box (80 % × 62 %) with magenta border and turquoise fill,
  // matching the project/bio/links boxes
  const box = createDiv('');
  box.parent(contactForm);
  box.style('width', '80vw');
  box.style('height', '62vh');
  box.style('border', '4px solid rgb(255,0,255)');         // magenta
  box.style('box-sizing', 'border-box');
  box.style('background', 'rgb(64,224,208)');               // turquoise
  box.style('display', 'flex');
  box.style('flex-direction', 'column');
  box.style('padding', '2vw');
  box.style('position', 'relative');
  box.style('overflow', 'auto');
  box.style('font-family', '"Space Grotesk", sans-serif');

  // Viewport-aware type scale (same as the project/bio boxes): below 1000px
  // wide the font holds its size instead of shrinking with the window.
  const typeScale = Math.max(window.innerWidth, 1000) / window.innerWidth;
  const vw = (base) => (base * typeScale) + 'vw';

  // "CONTACT" title (Team Athletics font) — bigger, like the project titles
  const title = createDiv('CONTACT');
  title.parent(box);
  title.style('color', 'rgb(255,200,87)');                  // gold
  title.style('font-family', '"Team Athletics Freeware", sans-serif');
  title.style('font-size', vw(4));
  title.style('line-height', vw(4));
  title.style('margin-bottom', '1.5vh');
  title.style('flex-shrink', '0');

  // Close "X" button (top-right corner of the box)
  const closeBtn = createDiv('✕');
  closeBtn.parent(box);
  closeBtn.style('position', 'absolute');
  closeBtn.style('top', '1vw');
  closeBtn.style('right', '1.5vw');
  closeBtn.style('font-size', vw(2.6));
  closeBtn.style('line-height', '1');
  closeBtn.style('cursor', 'pointer');
  closeBtn.style('color', '#000');
  closeBtn.style('font-family', 'sans-serif');
  closeBtn.style('user-select', 'none');
  closeBtn.mouseClicked(() => { contactMode = false; contactForm.hide(); });

  // Shared field styles: bold Team Athletics labels + big Space Grotesk inputs
  // with chunky borders, matching the rest of the site's aesthetic
  const fieldStyles = {
    'width': '100%',
    'box-sizing': 'border-box',
    'padding': '0.8vh 1vw',
    'margin-bottom': '1.5vh',
    'border': '3px solid rgba(0,0,0,0.55)',
    'border-radius': '0',
    'background': '#fff',
    'font-size': vw(1.8),
    'font-family': '"Space Grotesk", sans-serif',
  };

  function makeLabel(text) {
    const s = createSpan(text).parent(box);
    s.style('color', '#000');
    s.style('font-family', '"Team Athletics Freeware", sans-serif');
    s.style('font-size', vw(2.2));
    s.style('line-height', vw(2.2));
    s.style('margin-bottom', '0.3vh');
    s.style('flex-shrink', '0');
    return s;
  }

  // Name field
  makeLabel('Name');
  const nameInp = createInput('');
  nameInp.parent(box);
  nameInp.attribute('type', 'text');
  nameInp.attribute('name', 'name');
  nameInp.attribute('required', '');
  for (const [k, v] of Object.entries(fieldStyles)) nameInp.style(k, v);

  // Email field
  makeLabel('Email');
  const emailInp = createInput('');
  emailInp.parent(box);
  emailInp.attribute('type', 'email');
  emailInp.attribute('name', '_replyto');
  emailInp.attribute('required', '');
  for (const [k, v] of Object.entries(fieldStyles)) emailInp.style(k, v);

  // Message field
  makeLabel('Message');
  const msgInp = createElement('textarea');
  msgInp.parent(box);
  msgInp.attribute('name', 'message');
  msgInp.attribute('required', '');
  for (const [k, v] of Object.entries(fieldStyles)) msgInp.style(k, v);
  msgInp.style('min-height', '16vh');
  msgInp.style('resize', 'vertical');

  // Submit button — big gold button like the "back" buttons elsewhere
  const btn = createButton('SEND');
  btn.parent(box);
  btn.style('align-self', 'flex-end');
  btn.style('padding', '0.8vh 3vw');
  btn.style('background', 'rgb(255,200,87)');               // gold
  btn.style('color', '#000');
  btn.style('border', '3px solid rgb(0,0,0)');
  btn.style('border-radius', '0');
  btn.style('font-family', '"Team Athletics Freeware", sans-serif');
  btn.style('font-size', vw(2));
  btn.style('line-height', vw(2));
  btn.style('cursor', 'pointer');
  btn.mousePressed(submitContactForm);

  // Success message (hidden by default)
  const success = createDiv('Thanks — I\'ll get back to you soon!');
  success.parent(box);
  success.style('display', 'none');
  success.style('color', '#000');
  success.style('font-family', '"Team Athletics Freeware", sans-serif');
  success.style('font-size', vw(2));
  success.style('text-align', 'center');
  success.style('margin-top', 'auto');
  success.style('margin-bottom', 'auto');

  // Store references for show/hide/reset
  contactForm._box = box;
  contactForm._nameInp = nameInp;
  contactForm._emailInp = emailInp;
  contactForm._msgInp = msgInp;
  contactForm._btn = btn;
  contactForm._success = success;

  contactForm.hide();

  // Close only when clicking the backdrop itself (not the box or form fields).
  // p5.js mouseClicked() does not stop propagation, so use native listeners
  // with target checks instead.
  contactForm.elt.addEventListener('click', function (e) {
    if (e.target === contactForm.elt) {
      contactMode = false;
      contactForm.hide();
    }
  });
  // Prevent clicks inside the box from bubbling up to the backdrop
  box.elt.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

// ── Links overlay (p5.js DOM overlay, no separate CSS) ───────
// Mirrors createContactForm(): build the DOM once in setup(), then
// show/hide it from draw() based on linksMode. Real <a> anchors replace
// the old WEBGL-textured buffer + manual hit-testing that kept drifting.
function createLinks() {
  // Full-screen backdrop
  linksPanel = createDiv('');
  linksPanel.style('position', 'fixed');
  linksPanel.style('left', '0');
  linksPanel.style('top', '0');
  linksPanel.style('width', '100vw');
  linksPanel.style('height', '100vh');
  linksPanel.style('background', 'rgba(64,224,208,0.88)'); // tTurquoise
  linksPanel.style('display', 'flex');
  linksPanel.style('align-items', 'center');
  linksPanel.style('justify-content', 'center');
  linksPanel.style('z-index', '10000');
  linksPanel.style('pointer-events', 'auto');

  // Centered box (80 % × 62 %) with magenta border and turquoise fill,
  // matching the project/bio boxes
  linksBox = createDiv('');
  linksBox.parent(linksPanel);
  linksBox.style('width', '80vw');
  linksBox.style('height', '62vh');
  linksBox.style('border', '4px solid rgb(255,0,255)');     // magenta
  linksBox.style('box-sizing', 'border-box');
  linksBox.style('background', 'rgb(64,224,208)');          // turquoise
  linksBox.style('display', 'flex');
  linksBox.style('flex-direction', 'column');
  linksBox.style('padding', '2vw');
  linksBox.style('position', 'relative');
  linksBox.style('overflow', 'auto');
  linksBox.style('font-family', '"Team Athletics Freeware", sans-serif');

  // "Links" title (Team Athletics font, gold) — size set by sizeLinksToFill()
  linksTitle = createDiv('Links');
  linksTitle.parent(linksBox);
  linksTitle.style('color', 'rgb(255,200,87)');             // gold
  linksTitle.style('font-family', '"Team Athletics Freeware", sans-serif');
  linksTitle.style('line-height', '1.2');
  linksTitle.style('margin-bottom', '0.4em');
  linksTitle.style('flex-shrink', '0');

  // Close "X" button (top-right corner of the box)
  const closeBtn = createDiv('✕');
  closeBtn.parent(linksBox);
  closeBtn.style('position', 'absolute');
  closeBtn.style('top', '1vw');
  closeBtn.style('right', '1.5vw');
  closeBtn.style('font-size', '24px');
  closeBtn.style('cursor', 'pointer');
  closeBtn.style('color', '#000');
  closeBtn.style('font-family', 'sans-serif');
  closeBtn.style('line-height', '1');
  closeBtn.style('user-select', 'none');
  closeBtn.mouseClicked(() => { linksMode = false; });

  // Each link is a real <a> anchor: native navigation, gold hover, always
  // underlined — matching the old overlay's look. Font size is computed by
  // sizeLinksToFill() so the longest link fills the box's content width.
  for (const link of LINKS) {
    if (!link.url) continue;
    const a = createA(link.url, link.label, '_blank');
    a.parent(linksBox);
    a.attribute('rel', 'noopener');
    a.style('display', 'block');
    a.style('flex-shrink', '0'); // keep full size so the box scrolls instead
    a.style('color', '#000');
    a.style('text-decoration', 'underline');
    a.style('text-decoration-thickness', '1px');
    a.style('text-decoration-color', 'rgba(0,0,0,0.63)'); // old 160-alpha underline
    a.style('text-underline-offset', '0.25em');
    a.style('white-space', 'nowrap'); // links must not wrap when auto-sized
    a.style('cursor', 'pointer');
    linkEls.push(a);
    // Hover styling via JS listeners (no CSS file needed)
    a.elt.addEventListener('mouseenter', () => {
      a.style('color', 'rgb(255,200,87)');              // gold
      a.style('text-decoration-thickness', '3px');
      a.style('text-decoration-color', '#000');
    });
    a.elt.addEventListener('mouseleave', () => {
      a.style('color', '#000');
      a.style('text-decoration-thickness', '1px');
      a.style('text-decoration-color', 'rgba(0,0,0,0.63)');
    });
    // Close the overlay when a link is clicked (the new tab still opens
    // natively — this listener does not preventDefault).
    a.elt.addEventListener('click', () => { linksMode = false; });
  }

  sizeLinksToFill(); // size the links to fill the box's available width
  linksPanel.hide();
  linksVisible = false;

  // Close only when clicking the backdrop itself (not the box / links).
  linksPanel.elt.addEventListener('click', function (e) {
    if (e.target === linksPanel.elt) {
      linksMode = false;
    }
  });
  // Prevent clicks inside the box from bubbling up to the backdrop
  linksBox.elt.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

// Size the link text so the longest link fills the box's available content
// width (minus horizontal padding), and cap it so the whole list still fits
// vertically. Uses the p5 canvas's header font for measurement so it tracks
// the DOM's @font-face copy of the same TTF.
function sizeLinksToFill() {
  if (!linksBox || linkEls.length === 0) return;

  // measure the longest label at a 100px reference size
  projectOverlay.textFont(header);
  projectOverlay.textSize(100);
  let maxW = 0;
  for (const a of linkEls) {
    const w = projectOverlay.textWidth(a.elt.textContent);
    if (w > maxW) maxW = w;
  }
  if (maxW <= 0) return;

  // available content width: 80vw box minus 2vw padding on each side
  const contentW = 0.80 - 0.04;
  const widthFit = (contentW * window.innerWidth / maxW) * 100;

  // vertical fit: title (~1.2em + margin) plus each link at 1.5em line height,
  // all inside the 62vh box (minus top/bottom padding)
  const boxH = 0.62 * window.innerHeight;
  const padV = 0.02 * window.innerWidth; // 2vw padding
  const titleH = widthFit * (1.2 + 0.4);  // title line-height + 0.4em margin
  const heightFit = (boxH - padV * 2 - titleH) / (linkEls.length * 1.5);

  const fontSize = Math.max(10, Math.min(widthFit, heightFit));

  for (const a of linkEls) {
    a.style('font-size', fontSize + 'px');
    a.style('line-height', fontSize * 1.5 + 'px');
  }
  if (linksTitle) {
    linksTitle.style('font-size', fontSize + 'px');
    linksTitle.style('line-height', fontSize * 1.2 + 'px');
  }
}

function submitContactForm() {
  const cf = contactForm;
  if (!cf) return;
  const name = cf._nameInp.value();
  const email = cf._emailInp.value();
  const msg = cf._msgInp.value();
  if (!name || !email || !msg) return;

  // Disable button while sending
  cf._btn.attribute('disabled', '');
  cf._btn.html('SENDING…');

  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ name, _replyto: email, message: msg })
  }).then(res => {
    if (res.ok) {
      cf._box.style('display', 'none');
      cf._success.style('display', 'block');
      // Auto-close after 3 seconds
      setTimeout(() => {
        contactMode = false;
        contactForm.hide();
        cf._box.style('display', 'flex');   // restore for next open
        cf._success.style('display', 'none');
        cf._nameInp.value('');
        cf._emailInp.value('');
        cf._msgInp.value('');
      }, 3000);
    } else {
      alert('Something went wrong. Please try again or email me directly.');
    }
  }).catch(() => {
    alert('Network error. Please try again.');
  }).finally(() => {
    cf._btn.removeAttribute('disabled');
    cf._btn.html('SEND');
  });
}

// Render a 2D overlay buffer as a full-screen textured plane at exactly 1:1.
// The default p5 WEBGL camera places the eye at z=800, so a plane drawn at
// z=250 is only 550 world units away — perspective magnifies it by 800/550
// (~1.45x) and shifts it, breaking every mouse hit-test on overlay content
// (back button, video thumbnails, etc.). Drawing the plane under an
// orthographic projection maps buffer pixels 1:1 to screen pixels.
function drawOverlayPlane(g) {
  push();
  ortho(-width / 2, width / 2, -height / 2, height / 2, 0, width + height + 800);
  translate(0, 0, 250); // keep z=250 for depth layering above the cubes
  texture(g);
  noStroke();
  plane(width, height);
  pop();
  perspective(); // restore the default perspective camera for the 3D scene
}

// Count how many lines `str` wraps to inside a maxW-wide box, using the
// currently set font/size on the main canvas. Same WORD-wrap logic as p5's
// textWrap(WORD) used when the blurb is drawn.
function wrappedLineCount(str, maxW) {
  if (!str.trim()) return 0;
  let lines = 0;
  for (const ln of str.split('\n')) {
    if (!ln.trim()) continue;
    const words = ln.split(' ');
    let lineCount = 1;
    let lineW = 0;
    for (const word of words) {
      const wordW = textWidth(word + ' ');
      if (lineW + wordW > maxW && lineW > 0) {
        lineCount++;
        lineW = wordW;
      } else {
        lineW += wordW;
      }
    }
    lines += lineCount;
  }
  return lines;
}

// Compute the main bio-blurb box so its height hugs the wrapped text instead
// of being a fixed fraction of the viewport. The text size scales with width,
// so the box automatically scales up/down with the viewport.
function getMainBox() {
  const w = width * 0.8;
  const textSizeV = width * 0.1;
  const lineH = width * 0.1;           // textLeading
  const textBoxW = width * 0.7;        // box the text is wrapped in
  textFont(header);
  textSize(textSizeV);
  const lines = wrappedLineCount(bioBlurb, textBoxW);
  const textH = lines * lineH;
  // height = text height + padding, but keep a sane minimum and never exceed
  // the old fixed 0.8*height box
  const h = constrain(textH + lineH * 0.6, height * 0.3, height * 0.8);
  return { w, h };
}

function draw() {
  background(0);
  mainBox = getMainBox(); // recompute before the particle bounce pass uses it

  // Browser back-button support: whenever the page leaves its default state,
  // record a history entry so a popstate (back press) resets the page instead
  // of leaving. Runs before the videoMode early-return so it tracks every frame.
  if (!isDefaultState()) {
    if (!historyPushed) {
      history.pushState({ p5back: true }, '');
      historyPushed = true;
    }
  } else if (historyPushed) {
    historyPushed = false;
    // If we're back in the default state while a pushed entry is still current
    // (e.g. the on-canvas "back" button was pressed), drop that stale entry so
    // the browser back button truly leaves from the default state.
    if (history.state && history.state.p5back) {
      history.go(-1);
    }
  }

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
  //main content box (height hugs the wrapped blurb; see getMainBox())
  push();
  strokeWeight(4);
  noStroke();
  fill(magenta);
  rectMode(CENTER);
  rect(0, 0, mainBox.w, mainBox.h);
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

  if (wHovered) {
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

  //bio box (top-right, symmetric to WORK at top-left)
  const bioCenterX = width - width * 0.10;
  const bioCenterY = height * 0.10;
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

  //links box (bottom-right)
  const linksCenterX = width - width * 0.10;
  const linksCenterY = height - height * 0.10;
  const linksW = width * 0.15;
  const linksH = height * 0.15;
  const lleft = linksCenterX - linksW * 0.5;
  const lright = linksCenterX + linksW * 0.5;
  const ltop = linksCenterY - linksH * 0.5;
  const lbottom = linksCenterY + linksH * 0.5;
  linkshovered = mouseX >= lleft && mouseX <= lright && mouseY >= ltop && mouseY <= lbottom;
  push();
  translate(-width/2 + linksCenterX, -height/2 + linksCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);
  if (linkshovered) {
    fill(gold);
  } else {
    fill(turquoise);
  }
  rect(0, 0, linksW, linksH);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(width * 0.05);
  textLeading(width * 0.05);
  textWrap(WORD);
  text("LINKS", 0, 0, linksW);
  pop();

  //contact box (bottom-left, symmetric to LINKS at bottom-right)
  const contactCenterX = width * 0.10;
  const contactCenterY = height - height * 0.10;
  const contactW = width * 0.15;
  const contactH = height * 0.15;
  const cleft = contactCenterX - contactW * 0.5;
  const cright = contactCenterX + contactW * 0.5;
  const ctop = contactCenterY - contactH * 0.5;
  const cbottom = contactCenterY + contactH * 0.5;
  contacthovered = mouseX >= cleft && mouseX <= cright && mouseY >= ctop && mouseY <= cbottom;
  push();
  translate(-width/2 + contactCenterX, -height/2 + contactCenterY, 20);
  strokeWeight(4);
  stroke(turquoise);
  rectMode(CENTER);
  if (contacthovered) {
    fill(gold);
  } else {
    fill(turquoise);
  }
  rect(0, 0, contactW, contactH);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(width * 0.05);
  textLeading(width * 0.05);
  textWrap(WORD);
  text("email", 0, 0, contactW);
  pop();

  // exit button (appears centered when gallery/bio/links/contact mode is active,
  // but never over an open project — the project window has its own gold back button)
  if ((galleryMode || bioMode || linksMode || contactMode) && !projectMode) {
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
    // Render under an orthographic projection so the button is exactly 1:1 with
    // its hit box. z=400 keeps it in front of the overlay planes (z=250) and
    // inside the camera frustum; under perspective, z=400 magnifies the button
    // 2x (eye at z=800), making its hit box half the visual size.
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, width + height + 800);
    translate(-width/2 + exitX, -height/2 + exitY, 400);
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
    perspective(); // restore the default perspective camera for the 3D scene
  } else {
    exitHovered = false;
  }

  // ── links overlay (p5.js DOM) — keep DOM visibility in sync with linksMode ──
  if (linksMode) {
    if (!linksVisible) {
      linksVisible = true;
      linksBox.elt.scrollTop = 0;   // restart at the top like the old overlay
      linksPanel.style('display', 'flex'); // flex (not .show()) so centering works
    }
  } else if (linksVisible) {
    linksVisible = false;
    linksPanel.hide();
  }

  //project box (drawn via 2D overlay for reliable positioning)
  if (projectMode && selectedProjectId >= 0) {
    imageBounds = []; // reset for this frame
    const proj = projects[selectedProjectId];
    const boxW = width * 0.8;    // a bit wider than the old 0.6
    const boxH = height * 0.62;  // slightly taller so the larger text fits
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;
    // Scale all project-window typography by the box's width change, so the
    // text grows automatically if the window is ever widened further.
    const boxScale = boxW / (width * 0.6);
    // Viewport-aware type scale: below 1000px wide, don't let the font shrink
    // proportionally with the window — hold it at the size it would be at
    // 1000px so text stays readable on small screens. At >= 1000px it's 1,
    // so larger viewports are completely unchanged.
    const typeScale = Math.max(width, 1000) / width;
    const margin = width * 0.04 * boxScale;
    const descMargin = width * 0.07 * boxScale; // bigger margin for description
    projectBox = { x: boxX, y: boxY, w: boxW, h: boxH };

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

    // gold "back" button — styled like the WORK/BIO/LINKS/email corner buttons
    // (hard corners, header font, turquoise outline), straddling the box's
    // top-left border so it slightly overlaps the window edge
    const backBtnW = width * 0.06 * boxScale * typeScale;
    const backBtnH = height * 0.035 * boxScale * typeScale;
    const backOverhang = width * 0.0075 * boxScale * typeScale; // how far the button pokes past the border
    const backBtnX = boxX - backOverhang;
    const backBtnY = boxY - backOverhang;
    const backHovered = mouseX >= backBtnX && mouseX <= backBtnX + backBtnW &&
                        mouseY >= backBtnY && mouseY <= backBtnY + backBtnH;
    projectBackBtn = { x: backBtnX, y: backBtnY, w: backBtnW, h: backBtnH };

    g.strokeWeight(4);
    g.stroke(turquoise);
    g.rectMode(CORNER);
    if (backHovered) {
      g.fill(255, 224, 122); // lighter gold on hover
    } else {
      g.fill(gold);
    }
    g.rect(backBtnX, backBtnY, backBtnW, backBtnH);
    g.noStroke();
    g.fill(0);
    g.textFont(header);
    g.textAlign(CENTER, CENTER);
    g.textSize(width * 0.015 * boxScale * typeScale);
    g.textLeading(width * 0.015 * boxScale * typeScale);
    // no max-width here: with textAlign CENTER, p5 shifts x by +w/2 when a
    // width is given (unless rectMode is CENTER), which would push the label
    // off-center — so draw it exactly at the button's center instead
    g.text('back', backBtnX + backBtnW / 2, backBtnY + backBtnH / 2);

    // project name — centered in the box (drawn line-by-line so each line is
    // truly centered; p5 can't center wrapped text with a maxWidth reliably)
    g.fill(gold);
    g.noStroke();
    const titleSize = width * 0.036 * boxScale * typeScale;
    const titleLineH = width * 0.042 * boxScale * typeScale;
    g.textFont(header);
    g.textSize(titleSize);
    g.textLeading(titleLineH);
    const titleY = backBtnY + backBtnH + width * 0.02 * boxScale * typeScale;
    const titleLines = wrapLines(proj.name, boxW - margin * 2);
    g.textAlign(CENTER, TOP);
    for (let i = 0; i < titleLines.length; i++) {
      g.text(titleLines[i], boxX + boxW / 2, titleY + i * titleLineH);
    }

    // description area (uses bigger descMargin)
    g.fill(0);
    g.textSize(width * DESC_TEXT_RATIO * boxScale * typeScale);
    g.textLeading(width * DESC_LINE_RATIO * boxScale * typeScale);
    const descX = boxX + descMargin;
    const descW = boxW - descMargin * 2;
    // description starts below the (possibly multi-line) title + a gap
    const descTopY = titleY + titleLines.length * titleLineH + width * 0.03 * boxScale * typeScale;
    const descBottomY = boxY + boxH - margin;
    const descH = descBottomY - descTopY;

    // estimate total text height for scroll bounds
    g.textFont(descFont);
    const lineH = width * DESC_LINE_RATIO * boxScale * typeScale;
    const paraGap = lineH * 0.6;
    const imageMaxH = height * 0.3 * boxScale;
    const imageGap = width * 0.01 * boxScale; // gap between images in a row
    const markerRe = /^\[(image|videothumb):([\d,]+)\]$/;  // "[image:0,1]" or "[videothumb:0]"
    const splitRe = /(\[(?:image|videothumb):[\d,]+\])/;
    const sentenceRe = /(?<=\.)\s+(?=[A-Z0-9])/; // split after period + space + capital/digit

    // Count wrapped lines (handles \n hard breaks inside text too)
    function countWrappedLines(str, maxW) {
      return wrapLines(str, maxW).length;
    }

    // Word-wrap `str` into lines that fit inside maxW (using the overlay's
    // current font/size). Handles \n hard breaks inside the text.
    function wrapLines(str, maxW) {
      const out = [];
      if (!str.trim()) return out;
      for (const ln of str.split('\n')) {
        if (!ln.trim()) continue;
        const words = ln.split(' ');
        let line = words[0];
        let lineW = g.textWidth(line + ' ');
        for (let i = 1; i < words.length; i++) {
          const wordW = g.textWidth(words[i] + ' ');
          if (lineW + wordW > maxW && lineW > 0) {
            out.push(line);
            line = words[i];
            lineW = wordW;
          } else {
            line += ' ' + words[i];
            lineW += wordW;
          }
        }
        out.push(line);
      }
      return out;
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
    g.textSize(width * DESC_TEXT_RATIO * boxScale * typeScale);
    g.textLeading(lineH);
    g.textAlign(LEFT, TOP); // description text is left-aligned

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
    const indicatorSize = width * 0.02 * boxScale * typeScale;
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
    drawOverlayPlane(g);
  }

  // ── bio box (same layout as project box) ────────────────────
  if (bioMode && bioData) {
    // Same responsive treatment as the project box: wider window, and a
    // viewport-aware type scale that keeps text readable on small screens
    // while leaving larger viewports unchanged.
    const boxW = width * 0.8;
    const boxH = height * 0.62;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;
    const boxScale = boxW / (width * 0.6);
    const typeScale = Math.max(width, 1000) / width;
    const margin = width * 0.04 * boxScale;
    const descMargin = width * 0.07 * boxScale;

    const g = bioOverlay;
    g.clear();

    // dimmed backdrop
    g.noStroke();
    g.fill(tTurquoise);
    g.rect(0, 0, width, height);

    // centered border with title
    g.strokeWeight(4);
    g.stroke(magenta);
    g.noFill();
    g.rect(boxX, boxY, boxW, boxH);

    g.fill(gold);
    g.noStroke();
    g.textAlign(LEFT, TOP);
    g.textSize(width * 0.03 * boxScale * typeScale);
    g.textLeading(width * 0.035 * boxScale * typeScale);
    const titleY = boxY + margin;
    g.text('About', boxX + margin, titleY, boxW - margin * 2);

    // content area
    g.fill(0);
    g.textSize(width * DESC_TEXT_RATIO * boxScale * typeScale);
    g.textLeading(width * DESC_LINE_RATIO * boxScale * typeScale);
    const contentX = boxX + descMargin;
    const contentW = boxW - descMargin * 2;
    const contentTopY = titleY + width * 0.05 * boxScale * typeScale;
    const contentBottomY = boxY + boxH - margin;
    const contentH = contentBottomY - contentTopY;

    g.textFont(descFont);
    const lineH = width * DESC_LINE_RATIO * boxScale * typeScale;
    const paraGap = lineH * 0.6;
    const imageMaxH = height * 0.3 * boxScale;
    const sentenceRe = /(?<=\.)\s+(?=[A-Z0-9])/;

    // same line counter used by the project box
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

    // ── measurement pass ──
    let totalH = 0;

    // bio image
    let bioImgH = 0;
    if (bioImage && bioImage.width > 0) {
      bioImgH = Math.min(contentW / (bioImage.width / bioImage.height), imageMaxH);
      totalH += bioImgH + paraGap;
    }

    // bio body text (split into sentences)
    const body = bioData.body || '';
    const sentences = body.split(sentenceRe);
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i].trim();
      if (!s) continue;
      totalH += countWrappedLines(s, contentW) * lineH;
      totalH += paraGap;
    }

    const scrollMax = Math.max(0, totalH - contentH);
    bioScrollY = constrain(bioScrollY, 0, scrollMax);

    // ── render pass ──
    g.push();
    g.drawingContext.save();
    g.drawingContext.beginPath();
    g.drawingContext.rect(contentX, contentTopY, contentW, contentH);
    g.drawingContext.clip();

    let drawY = contentTopY - bioScrollY;
    g.textFont(descFont);
    g.textSize(width * DESC_TEXT_RATIO * boxScale * typeScale);
    g.textLeading(lineH);

    // bio image
    if (bioImage && bioImage.width > 0) {
      const aspect = bioImage.width / bioImage.height;
      const displayH = Math.min(contentW / aspect, imageMaxH);
      const displayW = displayH * aspect;
      const imgX = contentX + (contentW - displayW) / 2;
      g.image(bioImage, imgX, drawY, displayW, displayH);
      drawY += displayH + paraGap;
    }

    // bio body text
    g.fill(0);
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      const sLines = countWrappedLines(s, contentW);
      g.text(s, contentX, drawY, contentW);
      drawY += sLines * lineH + paraGap;
    }

    g.drawingContext.restore();
    g.pop();

    // scroll indicators
    const indicatorSize = width * 0.02 * boxScale * typeScale;
    const indicatorRight = boxX + boxW - margin * 0.5;
    const indicatorCenterY = (contentTopY + contentBottomY) / 2;

    if (bioScrollY > 0) {
      g.fill(0);
      g.noStroke();
      g.triangle(indicatorRight, indicatorCenterY - indicatorSize * 2.5,
        indicatorRight - indicatorSize * 1.5, indicatorCenterY - indicatorSize * 1,
        indicatorRight + indicatorSize * 1.5, indicatorCenterY - indicatorSize * 1);
    }
    if (bioScrollY < scrollMax) {
      g.fill(0);
      g.noStroke();
      g.triangle(indicatorRight, indicatorCenterY + indicatorSize * 2.5,
        indicatorRight - indicatorSize * 1.5, indicatorCenterY + indicatorSize * 1,
        indicatorRight + indicatorSize * 1.5, indicatorCenterY + indicatorSize * 1);
    }

    // render as textured plane
    drawOverlayPlane(g);
  }

}


// ── Browser back-button support ──────────────────────────────
// The app pushes a history entry each time it leaves its default state
// (particle field). When the browser back button is pressed, popstate resets
// the page to the default state; from the default state back truly leaves.

function isDefaultState() {
  return !galleryMode && !projectMode && !bioMode && !linksMode && !contactMode && !videoMode;
}

function resetToDefaultState() {
  galleryMode = false;
  projectMode = false;
  bioMode = false;
  linksMode = false;
  contactMode = false;
  selectedProjectId = -1;
  projectScrollY = 0;
  bioScrollY = 0;
  if (videoMode) hideVimeo();
  if (contactForm) contactForm.hide();
  changeCubesToImages(false); // revert to cubes
  returnCubesToParticles();   // move cubes back to particle positions
}

function mouseClicked() {
  // If a full-screen video is playing, clicking anywhere dismisses it
  if (videoMode) {
    hideVimeo();
    return;
  }


  if(wHovered && galleryMode && !bioMode && !linksMode){ //a way to get out of gallery mode
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
  }
  if(wHovered && !galleryMode && !bioMode && !linksMode){
    galleryMode = true;
    bioMode = false;
    linksMode = false;
    if (contactMode) { contactMode = false; contactForm.hide(); }
  }
  
  if(exitHovered && galleryMode){
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
    bioMode = false;
    linksMode = false;
    if (contactMode) { contactMode = false; contactForm.hide(); }
  }
  if(exitHovered && bioMode){
    bioMode = false;
  }
  if(exitHovered && linksMode){
    linksMode = false;
  }
  if(exitHovered && contactMode){
    contactMode = false;
    contactForm.hide();
  }

  if(biohovered && !linksMode){
    galleryMode = false;
    projectMode = false;
    changeCubesToImages(false); //revert to cubes
    returnCubesToParticles(); //move cubes back to particle positions
    if (contactMode) { contactMode = false; contactForm.hide(); }
    bioMode = true;
    bioScrollY = 0;
    return;
  }

  if(linkshovered && !bioMode){
    galleryMode = false;
    projectMode = false;
    bioMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
    if (contactMode) { contactMode = false; contactForm.hide(); }
    linksMode = true;
    return;
  }

  if(contacthovered && !bioMode && !linksMode){
    galleryMode = false;
    projectMode = false;
    bioMode = false;
    linksMode = false;
    changeCubesToImages(false);
    returnCubesToParticles();
    contactMode = true;
    contactForm.style('display', 'flex'); // show with flex (not block) so centering works
    return;
  }

  // click on an image inside a project box
  // [videothumb:N] launches the project video; [image:N] is reserved for future expand
  // (check BEFORE the "close box when clicking outside" else-if)
  if (projectMode && selectedProjectId >= 0) {
    // clicking the gold "back" button in the box's upper-left corner closes it
    if (projectBackBtn &&
        mouseX >= projectBackBtn.x && mouseX <= projectBackBtn.x + projectBackBtn.w &&
        mouseY >= projectBackBtn.y && mouseY <= projectBackBtn.y + projectBackBtn.h) {
      projectMode = false;
      return;
    }
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
    // close project box only when clicking outside the box area (uses the
    // live projectBox rect from the render pass so it matches the drawn box)
    const b = projectBox;
    if (b) {
      const outside = mouseX < b.x || mouseX > b.x + b.w || mouseY < b.y || mouseY > b.y + b.h;
      if (outside) {
        projectMode = false;
      }
    }
  } else if (bioMode && !exitHovered) {
    // close bio box when clicking outside (keep in sync with the drawn box)
    const bw = width * 0.8;
    const bh = height * 0.62;
    const bx = (width - bw) / 2;
    const by = (height - bh) / 2;
    if (mouseX < bx || mouseX > bx + bw || mouseY < by || mouseY > by + bh) {
      bioMode = false;
    }
  }
}

function mouseWheel(event) {
  if (projectMode) {
    projectScrollY += event.delta;
    return false; // prevent page scroll
  }
  if (bioMode) {
    bioScrollY += event.delta;
    return false;
  }
}

// Touch (mobile) scrolling for the scrollable overlays.
// Dragging up moves content up (scrolls forward), matching natural touch scroll.
function touchMoved() {
  if (projectMode) {
    projectScrollY += (pmouseY - mouseY);
    return false; // prevent the page from scrolling
  }
  if (bioMode) {
    bioScrollY += (pmouseY - mouseY);
    return false;
  }
}

function touchStarted() {
  // NOTE: intentionally return nothing (no preventDefault). p5 fires mouseClicked()
  // from the browser's native "click" event, and on mobile the browser only
  // synthesizes that click if touchstart was NOT preventDefault'd — so returning
  // false here broke tapping video thumbnails and the back button on phones.
  // Page scroll/zoom is already handled by p5's touch-action:none on the canvas
  // plus the touchMoved() handler below.
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
  if (keyCode === ESCAPE && bioMode) {
    bioMode = false;
  }
  if (keyCode === ESCAPE && linksMode) {
    linksMode = false;
  }
  if (keyCode === ESCAPE && contactMode) {
    contactMode = false;
    contactForm.hide();
  }
}

class Particle{
  constructor(id){
    let loc = createVector(random(width), random(height));
    let vel = createVector(random(-1, 1), random(-1, 1));
    this.position = loc;
    this.velocity = vel;
    this.size = width/20;
    this.zOff = 0; // z offset for drawing; lerped between modes in update()
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
    // zOff is -size while bouncing (keeps the cube behind the z=20 corner
    // buttons) and 0 in gallery mode; lerped in update() for smooth transitions.
    translate(this.position.x - width / 2, this.position.y - height / 2, this.zOff);
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

    // z offset: bouncing mode pushes the cube back by one size so it stays
    // behind the corner buttons; gallery mode sits at 0 (grid flush, like
    // before). Lerp so the fly-in/out to the grid stays smooth.
    this.zOff = lerp(this.zOff, this.showImage ? 0 : -this.size, 0.1);

    // bounce off the canvas walls when the cube's EDGE touches (not the center)
    const half = this.size / 2;
    if (this.position.x > width - half || this.position.x < half) {
      this.position.x = constrain(this.position.x, half, width - half);
      this.velocity.x *= -1;
      this.birthTime = millis(); //reborn when it hits the wall
    }
    if (this.position.y > height - half || this.position.y < half) {
      this.position.y = constrain(this.position.y, half, height - half);
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
    // Collision happens when the cubes' EDGES touch: centers closer than
    // half(a) + half(b). (Old code used a fixed radius of 10, so larger cubes
    // passed through each other before bouncing.)
    const minDist = (a.size + b.size) / 2;
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
  // use the same live box dims as the drawn rect (height hugs the blurb text)
  const rectHalfW = mainBox.w * 0.5;
  const rectHalfH = mainBox.h * 0.5;
  const half = p.size / 2; // half of the cube's edge (not a hardcoded 5)
  // local position relative to rect center
  const localX = p.position.x - width / 2;
  const localY = p.position.y - height / 2;

  // The cube's EDGE must stay clear of the rectangle, so the CENTER must stay
  // outside the rectangle inflated by half the cube size.
  const boundX = rectHalfW + half;
  const boundY = rectHalfH + half;

  // cube edge touching / penetrating the rectangle?
  if (abs(localX) <= boundX && abs(localY) <= boundY) {
    // distance from center to the nearest inflated boundary
    const penX = boundX - abs(localX);
    const penY = boundY - abs(localY);

    if (penX < penY) {
      // reflect off the vertical face
      const side = localX >= 0 ? 1 : -1;
      p.position.x = width / 2 + side * boundX;
      p.velocity.x = -p.velocity.x * 0.8; // reflect + damp
    } else {
      // reflect off the horizontal face
      const side = localY >= 0 ? 1 : -1;
      p.position.y = height / 2 + side * boundY;
      p.velocity.y = -p.velocity.y * 0.8; // reflect + damp
    }
    p.birthTime = millis();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // resize 2D overlays so text/image hit-testing stays aligned with the canvas
  projectOverlay = createGraphics(width, height);
  projectOverlay.textFont(header);
  bioOverlay = createGraphics(width, height);
  bioOverlay.textFont(header);
  sizeLinksToFill(); // re-size the links to fill the new box width
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
    p.size = lerp(p.size, width/20, 0.1); // shrink back to original size
  }
}

