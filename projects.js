const projects = [
  {
    name: "Creative Coding and Interactivity Lab at PCC",
    description: "I co-designed and teach the Creative Coding Certificate and Degree programs at Portland Community College, Cascade. Part of this initiative was designing our Interactivity Lab that now serves as a hub for students working at these intersections of art and technology. PCC's Interactivity Lab is a maker space housed within the Music and Sonic Arts program in room 223 of the Moriarty Arts & Humanities Building. The Interactivity Lab supports our Creative Coding courses with 10 full electronics workbenches for work with sensors and microcontrollers, an 8′ by 10′ commercial LED wall, projectors, mappable objects, computer controllable lasers. The Interactivity Lab includes emerging technologies like VR/AR alongside established technologies such as Arduino, sensors, projection mapping and DMX light control. The lab is staffed by students who are learning and using all of these skills in and out of classes.",
    image: "P1140087.JPG"
  },
  {
    name: "unityGain",
    description: "I designed and built a High Density Loudspeaker Array (HDLA) at Portland Community College called unityGain. unityGain is a 32 channel Meyer speaker system driven by a rackmount PC, a 32 channel Orion interface and spatialization software that I wrote in Pure Data, with a Lemur front end. In creating this system I had three primary goals: 1) To build a high quality, excellent sounding system capable of ambisonic, vbap, and other spatialization techniques and experiments. 2) To create a platform making these exciting new surround sound formats accessible to artists outside of traditional research institutions or career paths. 3) To get students involved in every aspect of system design, implementation, and event production, with the assumption that any part of this production process could be a potential career path for some of these students. I wrote software in Pure Data that implements Vector Based Amplitude Panning (VBAP) algorithms to spatialize eight discrete hardware inputs to a circular speaker configuration of the system's 32 channels. I made a straightforward patch that has a 0-360 degree panner for each input, along with a distance/spread control, an auto-panner, preset management, and some simple options for random behavior. I then built a simple and intuitive UI for Lemur running on an iPad.",
    image: "unityGain1.JPG"
  },
  {
    name: "Semaphore",
    description: "a multi-layered collaborative project with Audra Wolowiec, the Jaramillo Neuroscience Lab at the University of Oregon, my project CHOIR, and typeface design by Maurann Stein. commissioned by the Oregon Arts Commission's Percent for Art in Public Places Program and supported by Third Culture Projects. In collaboration with the Neuroscience Lab of Santiago Jaramillo that studies how meaning, memory, and attention are assigned to sounds, Audra Wolowiec created a series of text-based scores as poetic translations of data gathered from the lab and worked with Portland-based Jesse Mejía to compose a vocal piece with his experimental group, CHOIR. The influential lecture by C. P. Snow, The Two Cultures, that attempts to mediate the divide between the arts and sciences, was used as an underlying structure, mining gaps and slippages to create a new, third space of communication. This took place in October 2016 at the University of Oregon in the Lewis Integrative Science Building (LISB), Eugene, OR and the Extradition Series, Portland, OR.",
    image: "semaphore_singers.jpg"
  },
  {
    name: "Midi2DMX",
    description: "MIDI2DMX provides a simple way to get total control over a wide variety of lights - using existing music software (Ableton Live, Logic, Bitwig, Garage Band, Pro Tools etc), as well as hardware midi sequencers like the Akai MPC series, the Elektron Octatrack, Alesis MMT-8, etc. It allows for easy interfacing with programming environments like Pure Data, MaxMSP, and Processing. This makes it easy to sequence lights for live music performances, do algorithmic light programming, map lights using sound analysis, data from the internet, or sensor data etc. It unlocks cheap DJ lights turning them into flexible and expressive tools/instruments. I designed a PCB to make the circuit easy to build, and have assembled quite a number of them with students in my interactivity courses at Portland Community College. There is no wiring, it's a quick project and costs around $40 total.",
    image: "FIE6B69IVO4MMC4.MEDIUM.jpg"
  },
  {
    name: "Exchange",
    description: "We created a public, interactive sound and light installation on Pioneer Square. It was up for a the weekend of June 24th - 26, 2016. Exchange is an interactive sound and light installation that draws people into an unusual musical experience. Frosted LED tubes illuminate and play an accompanying tone as individuals move around the sculptural form. The notes and lights layer and harmonically resonate as multiple peoples' motion trigger the piece simultaneously. This piece encourages interaction and inspiration between strangers using the language of musical experience. Supported in part by Houseguest, Pioneer Courthouse Square, Inc., Miller Foundation, and Oregon Community Foundation. As the co-designer/creator (with Ethan Rose), and sole programmer, I programmed microcontrollers to read 18 ultrasonic rangefinder sensors - which in turn triggered sound and light behavior designed and programmed in Pure Data. DMX is sent from Pure Data (using a MIDI2DMX) which we in turn wired to DMX relays and 72 tubes we filled with bright LED strips. I implemented the sound design in Pure Data using Karplus-Strong synthesis, and spatialized to 9 channels of audio in a circular array.",
    image: "exchange_2_opt.jpg"
  },
  {
    name: "Direct Path to Detour",
    description: "Direct Path to Detour is a new dance work by Portland-based choreographer Takahiro Yamamoto. Grounded in the idea that a sense of who we are is rooted in our embodied experiences, this dance evokes mental and physical states at the intersection of value systems, social pressures, expectations, and personal experiences of four dancers, all of whom have an intimate relationship with bridging multiple societies by birth, residence, upbringing and/or religion. Direct Path to Detour envelops the performers in a poetic, visceral experience of resistance, surrender, sincerity, and fiction. May 4-7, 2017 Portland Institute for Contemporary Art, Portland, OR [PREMIERE] Oct 27-29, 2017 DiverseWorks, Houston, TX Nov 9-10, 2017 Contemporary Art Center, Cincinnati, OH Direct Path to Detour is a National Performance Network (NPN) Creation Fund Project, co-commissioned by PICA in partnership with Contemporary Arts Center Cincinnati, DiverseWorks, and NPN.",
    image: "DirectPath_1_AnkeSchuettler.jpg"
  },
  {
    name: "Light Noise",
    description: "Light Noise was a collaboration between myself and Lu Yim, with dancers keyon gaskin, Taka Yamamoto, and Leah Wilmoth. It was performed at Disjecta August 23rd, 24th, and 25th of 2013. I wrote a blog entry about some of my technical process for Light Noise. An improvisation using the software I wrote (using Pure Data) for Light Noise is available, and can also be heard in the video below.",
    image: "LIGHTNOISE_23web_670.jpg"
  },
  {
    name: "OZO",
    description: "Parallel collaborated with Second Story to create a soundscape for the release of OZO, Nokia's new virtual reality camera. Using over 30 distinct channels of audio and a variety of speakers, Parallel's sonic design was integrated into the architectural layout of the entire 42,000 sq ft event space. Attendees entered the space through a winding corridor that continually swept sounds up and down the hallway, before emerging into the main event area where unique soundtracks were highlighting the bar, live feed, and keynote areas. Drawing from the surround sound capacities of OZO, Parallel created a soundscape that evoked a sense of motion, space, and wonder. I programmatically spatialized all of the audio in realtime using Pure Data - and programmed an interface so that we could do site-specific mixing and composition in the unique event space.",
    image: "ozo_1.jpg"
  },
  {
    name: "Elements",
    description: "Parallel was commissioned by Boora Architects to create a permanent sound installation in a newly constructed building on the Microsoft Campus in Redmond, WA. The resulting installation musically activates the interior space of the lobby by utilizing the weather conditions directly outside. A weather station, mounted onto the roof of the building, continuously captures changes in the weather. The resulting data stream, containing wind speed, temperature, precipitation, and sunlight, is parsed by a Node.JS server we wrote and output as OSC to a PureData patch, which subsequently triggers musical sounds that playback through around one hundred speakers mounted into the lobby's ceiling. In this way, the continually shifting nature of weather at the site is represented in real-time by a constantly changing musical composition.",
    image: "elements_3.jpg"
  },
  {
    name: "Light Wash",
    description: "LIGHT WASH was an immersive, interactive, site-specific audio-visual installation at Composition Gallery. 5 channels of generative, evolving sound and 6 channels of highly saturated colored light filled the gallery creating a space for reflection, reaction and restoration. 9 color temperatures slowly followed 9 vowels through minimal and endless combinations. On closing night of the installation, 6 sound artists including Mejía presented short audio-visual performances utilizing the installation as their instrument. Each artist was given the same limited toolset and will develop work and perform by communicating with the installation over WiFi using OSC (Open Sound Control).",
    image: "27_light_wash_lucy_small.jpg"
  },
  {
    name: "Serpentine Dance",
    description: "This is a video document of a collaboration with Jennifer West. Commissioned by PICA TBA Fest 2014, curated by Kristan Kennedy for visual arts exhibition, \"As round as an apple, as deep as a cup\" Performed live for two nights in September inside Jennifer West's \"Flashlight Filmstrip Projections\" installation. Original Score Composed by: Sue Harshe (2005). Score Re-interpreted by: Jesse Mejía and Mark Keppinger, 2014.",
    image: "Screen Shot 2017-04-10 at 10.39.34 PM.png"
  },
  {
    name: "CHOIR",
    description: "CHOIR is an ongoing community singing group focused on learning and performing choral music by composers such as Arvo Pårt and Ola Gjeilo. Led by Jesse Mejia. We hold rehearsals on Saturday afternoons, working through difficult but rewarding compositions to build an adventurous repertoire. CHOIR provides sheet music, space and a focused learning environment for singers of all skill levels. We also seek out opportunities to perform in unusual contexts such as art installations or multimedia performance pieces. CHOIR is an experiment in musical pedagogy, a DIY community group and a contemporary music performance ensemble. CHOIR was supported in part by the Regional Arts & Culture Council in 2017.",
    image: "25_dance+_1_small.jpg"
  }
];