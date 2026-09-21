// ===== Grievance tracking helpers =====
let currentTrackingId = null;

function showTrackingId(trackingId) {
  if (!trackingId) return;
  currentTrackingId = trackingId;
  const box = document.getElementById("trackingBox");
  const text = document.getElementById("trackingIdText");
  const link = document.getElementById("trackingLink");
  if (!box || !text) return;
  text.textContent = trackingId;
  if (link) link.href = "track.html?id=" + encodeURIComponent(trackingId);
  box.classList.remove("hidden");
}

function copyTrackingId(btn) {
  if (!currentTrackingId) return;
  function flash() {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(function () { btn.textContent = original; }, 1500);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentTrackingId).then(flash).catch(function () {
      window.prompt("Copy your tracking ID:", currentTrackingId);
    });
  } else {
    window.prompt("Copy your tracking ID:", currentTrackingId);
  }
}

function hideTrackingId() {
  currentTrackingId = null;
  const box = document.getElementById("trackingBox");
  if (box) box.classList.add("hidden");
}

let recognition = null;
let isListening = false;

let selectedGender = "";
let selectedAge = 25;
let userLang = "en";
function selectLanguage(lang) {
  userLang = lang;

  if (lang === "en") {
    // Hide local language text for English
    document.getElementById("gender-local").textContent = "";
    document.getElementById("age-local").textContent = "";
    document.getElementById("grievance-local").textContent = "";
  } else {
    // Show local language for Hindi / Tamil
    document.getElementById("gender-local").textContent =
      textMap[lang].gender;
    document.getElementById("age-local").textContent =
      textMap[lang].age;
    document.getElementById("grievance-local").textContent =
      textMap[lang].grievance;
  }

  // Switch steps (unchanged)
  document.getElementById("step-language").classList.add("hidden");
  document.getElementById("step-gender").classList.remove("hidden");
}
/**************** NLP KEYWORD ENGINE ****************/

const NLP_KEYWORDS = {

  /*  AGRICULTURE, RURAL & ENVIRONMENT */
  AGRICULTURE_SERVICE_REQUEST: [
  "farming problem","farm", "crop issue", "crop loss", "crop damage",
  "agriculture help", "farmer support", "farmer problem",
  "seed problem", "fertilizer issue", "irrigation problem",
  "kisan scheme", "pm kisan","kisaan",
  "कृषि समस्या", "फसल खराब", "किसान मदद", "बीज समस्या","खेती",
  "विवசாய பிரச்சனை", "பயிர் சேதம்", "விவசாய உதவி",

 
  "crop failure", "farm loss", "harvest problem",
  "fertilizer shortage", "pesticide problem",
  "कृषि", "खेती समस्या", "फसल नुकसान",
  "விவசாயம்", "பயிர் பிரச்சனை"
],

/*  BUSINESS & ENTREPRENEURSHIP */
BUSINESS_SERVICE_REQUEST: [
  "business loan", "startup help", "startup funding",
  "small business", "msme loan", "mudra loan",
  "business registration", "shop license",
  "उद्योग", "व्यवसाय", "स्टार्टअप", "मुद्रा लोन",
  "தொழில்", "வணிக கடன்", "ஸ்டார்ட்அப்",

 
  "shop problem", "trade license",
  "व्यापार", "दुकान लोन",
  "சிறு தொழில்"
],

/*  EDUCATION & LEARNING */
EDUCATION_SERVICE_REQUEST: [
  "school admission", "college admission", "education help",
  "scholarship", "fee problem", "hostel issue",
  "exam issue", "certificate problem",
  "पढ़ाई", "शिक्षा", "छात्रवृत्ति", "स्कूल दाखिला",
  "கல்வி", "படிப்பு", "உதவித்தொகை",

  
  "exam result", "marksheet problem",
  "कॉलेज", "फीस समस्या",
  "மாணவர்", "பள்ளி சேர்க்கை"
],

/*  HEALTH & WELLNESS */
HEALTH_SERVICE_REQUEST: [
  "hospital problem", "medical help", "health issue",
  "free treatment", "ayushman", "health card",
  "medicine not available", "doctor not available",
  "इलाज", "स्वास्थ्य", "अस्पताल ", "आयुष्मान",
  "மருத்துவ", "ஆஸ்பத்திரி", "சிகிச்சை",


  "emergency treatment", "clinic problem",
  "दवा नहीं", "डॉक्टर नहीं",
  "மருந்து இல்லை"
],

/*  HOUSING & SHELTER */
HOUSING_SERVICE_REQUEST: [
  "no house", "housing problem", "need shelter",
  "house allotment", "pm awas", "housing scheme",
  "घर नहीं", "मकान समस्या", "आवास योजना",
  "வீடு இல்லை", "வீட்டு பிரச்சனை",

  
  "house repair", "roof leaking",
  "घर की समस्या",
  "வீட்டு பழுது"
],

/*  LAW, PUBLIC SAFETY & JUSTICE */
LAW_JUSTICE_SERVICE_REQUEST: [
  "police complaint", "legal help", "court case",
  "case delay", "fir not filed",
  "कानूनी", "पुलिस शिकायत", "न्याय",
  "நீதிமன்ற", "போலீஸ் புகார்",


  "law issue", "justice delayed",
  "एफआईआर नहीं",
  "சட்ட உதவி"
],

/*  SCIENCE, IT & COMMUNICATION */
SCIENCE_IT_SERVICE_REQUEST: [
  "internet issue", "network problem", "digital service",
  "online service not working", "technology problem",
  "डिजिटल", "इंटरनेट समस्या",
  "இணையம்", "டிஜிட்டல் சேவை",

  
  "mobile network", "sim problem",
  "नेटवर्क नहीं",
  "இணைய பிரச்சனை"
],

/*  SKILLS & EMPLOYMENT */
SKILL_EMPLOYMENT_SERVICE_REQUEST: [
  "job problem", "jobless", "employment issue",
  "skill training", "training scheme",
  "job card", "mnrega",
  "नौकरी", "रोजगार", "कौशल प्रशिक्षण",
  "வேலை", "திறன் பயிற்சி",


  "unemployed", "job search",
  "बेरोजगार",
  "வேலை இல்லை"
],

/*  SPORTS & CULTURE */
SPORTS_CULTURE_SERVICE_REQUEST: [
  "sports", "sports quota", "sports training",
  "stadium access", "cultural support",
  "खेल", "खेल कोटा",
  "விளையாட்டு", "விளையாட்டு ஒதுக்கீடு",


  "play sports", "sports facility",
  "खेल प्रशिक्षण",
  "விளையாட்டு பயிற்சி"
],

/*  TRANSPORT & INFRASTRUCTURE */
TRANSPORT_SERVICE_REQUEST: [
  "road problem", "road damage", "transport issue",
  "bus service", "bus not available",
  "सड़क", "सड़क खराब", "बस सेवा",
  "போக்குவரத்து", "சாலை சேதம்",

 
  "bridge damaged", "traffic problem",
  "सड़क मरम्मत",
  "பாலம் சேதம்"
],

/*  TRAVEL & TOURISM */
TOURISM_SERVICE_REQUEST: [
  "tourism support", "travel issue", "tourist help",
  "tourism scheme",
  "पर्यटन", "यात्रा",
  "சுற்றுலா", "பயணம்",

  "tourist problem",
  "पर्यटक सहायता",
  "சுற்றுலா உதவி"
],

/*  WOMEN & CHILD */
WOMEN_CHILD_SERVICE_REQUEST: [
  "women safety", "child welfare", "women help",
  "child education", "child nutrition",
  "महिला", "महिला सुरक्षा", "बच्चों की मदद",
  "பெண்கள்", "பெண் பாதுகாப்பு", "குழந்தை நலன்",


  "women support", "child care",
  "महिला सहायता",
  "குழந்தை பாதுகாப்பு"
],

/*  FOOD / RATION */
FOOD_SERVICE_REQUEST: [
  "need food", "food required", "ration needed",
  "food not available", "ration not received",
  "no food", "hungry",
  "भोजन चाहिए", "राशन नहीं",
  "உணவு தேவை", "ரேஷன் இல்லை",

 
  "no ration", "ration problem",
  "खाने को नहीं",
  "சாப்பாடு இல்லை"
],

/* ELECTRICITY */
ELECTRICITY_SERVICE_REQUEST: [
  "no electricity", "power cut", "current not coming",
  "meter not working", "electricity problem",
  "बिजली नहीं", "करंट नहीं",
  "மின்சாரம் இல்லை", "கரண்ட் இல்லை",

 
  "light not working",
  "बिजली कटौती",
  "மின்தடை"
],

/*  WATER */
WATER_SERVICE_REQUEST: [
  "no water", "water problem", "drinking water issue",
  "water supply stopped",
  "पानी नहीं", "जल समस्या",
  "தண்ணீர் இல்லை", "குடிநீர் பிரச்சனை",

  
  "water shortage",
  "पानी की कमी",
  "நீர் பற்றாக்குறை"
],

/* PENSION */
PENSION_SERVICE_REQUEST: [
  "need pension", "pension not received",
  "pension delayed", "old age pension",
  "no pension",
  "पेंशन नहीं", "वृद्धावस्था पेंशन",
  "ஓய்வூதியம் இல்லை", "முதியோர் ஓய்வூதியம்",

  
  "senior citizen pension",
  "पेंशन रुकी",
  "ஓய்வூதியம் தாமதம்"
]

,
  FOOD_SERVICE_REQUEST: [
  // English (formal)
  "need food",
  "food required",
  "ration needed",
  "food not available",
  "ration not received",
  "need rice",

  // English (real-world / short)
  "no food",
  "not getting food",
  "food issue",
  "no ration",
  "ration problem",
  "family has no food",
  "hungry",

  // Hindi
  "भोजन चाहिए",
  "भोजन नहीं",
  "राशन चाहिए",
  "राशन नहीं मिला",
  "राशन नहीं",
  "खाने को नहीं",

  // Tamil
  "உணவு தேவை",
  "உணவு கிடைக்கவில்லை",
  "ரேஷன் தேவை",
  "ரேஷன் இல்லை",
  "சாப்பாடு இல்லை"
],

  ELECTRICITY_SERVICE_REQUEST: [
  // English (formal)
  "need electricity",
  "electricity required",
  "no power supply",
  "power cut",
  "current not coming",
  "meter not working",

  // English (real-world / short)
  "no electricity",
  "no current",
  "power issue",
  "electricity problem",
  "light not working",
  "no light",

  // Hindi
  "बिजली चाहिए",
  "बिजली नहीं",
  "करंट नहीं",
  "लाइट नहीं",
  "बिजली कट",

  // Tamil
  "மின்சாரம் தேவை",
  "மின்சாரம் இல்லை",
  "கரண்ட் இல்லை",
  "மின்தடை",
  "விளக்கு வேலை செய்யவில்லை"
]
,WATER_SERVICE_REQUEST: [
  // English
  "no water",
  "water problem",
  "water issue",
  "no water supply",
  "drinking water problem",
  "water not available",
  "dont have water",
  "do not have water",
  "i need water",

  // Hindi
  "पानी नहीं",
  "पानी की समस्या",
  "पीने का पानी नहीं",
  "जल समस्या",

  // Tamil
  "தண்ணீர் இல்லை",
  "குடிநீர் இல்லை",
  "தண்ணீர் பிரச்சனை",
  "நீர் கிடைக்கவில்லை"
]
,

  PENSION_SERVICE_REQUEST: [
  "need pension",
  "pension not received",
  "pension delayed",
  "pension stopped",
  "old age pension needed",
  "i need money",


  
  "no pension",
  "not getting pension",
  "pension not coming",
  "pension issue",

  "पेंशन चाहिए",
  "पेंशन नहीं मिली",
  "पेंशन बंद",
  "पेंशन नहीं",

  "ஓய்வூதியம் தேவை",
  "ஓய்வூதியம் கிடைக்கவில்லை",
  "ஓய்வூதியம் இல்லை"
]

};
const CATEGORY_EMOJI_MAP = {
  WATER_SERVICE_REQUEST: "💧",
  ELECTRICITY_SERVICE_REQUEST: "⚡",
  FOOD_SERVICE_REQUEST: "🍚",
  HEALTH_SERVICE_REQUEST: "🏥",
  EDUCATION_SERVICE_REQUEST: "🎓",
  AGRICULTURE_SERVICE_REQUEST: "🚜",
  HOUSING_SERVICE_REQUEST: "🏠",
  PENSION_SERVICE_REQUEST: "👵",
  LAW_JUSTICE_SERVICE_REQUEST: "👮",
  SPORTS_CULTURE_SERVICE_REQUEST: "🏟️",
  TRANSPORT_SERVICE_REQUEST: "🚌",
  SKILL_EMPLOYMENT_SERVICE_REQUEST: "💼",
  BUSINESS_SERVICE_REQUEST: "🏭",
  WOMEN_CHILD_SERVICE_REQUEST: "👩‍👧",
  GENERAL_GRIEVANCE: "📄"
};

const CORE_KEYWORD_INTENT_MAP = {
  // HEALTH
  medical: "HEALTH_SERVICE_REQUEST",
  hospital: "HEALTH_SERVICE_REQUEST",
  doctor: "HEALTH_SERVICE_REQUEST",
  treatment: "HEALTH_SERVICE_REQUEST",
  medicine: "HEALTH_SERVICE_REQUEST",

  // EDUCATION
  education: "EDUCATION_SERVICE_REQUEST",
  school: "EDUCATION_SERVICE_REQUEST",
  college: "EDUCATION_SERVICE_REQUEST",
  scholarship: "EDUCATION_SERVICE_REQUEST",
  study:"EDUCATION_SERVICE_REQUEST",
  studies:"EDUCATION_SERVICE_REQUEST",
  graduation:"EDUCATION_SERVICE_REQUEST",

  // AGRICULTURE
  agriculture: "AGRICULTURE_SERVICE_REQUEST",
  farming: "AGRICULTURE_SERVICE_REQUEST",
  farmer: "AGRICULTURE_SERVICE_REQUEST",
  crop: "AGRICULTURE_SERVICE_REQUEST",
  seeds:"AGRICULTURE_SERVICE_REQUEST",
  seed:"AGRICULTURE_SERVICE_REQUEST",
  irrigation:"AGRICULTURE_SERVICE_REQUEST",

  // SPORTS
  sports: "SPORTS_CULTURE_SERVICE_REQUEST",
  quota: "SPORTS_CULTURE_SERVICE_REQUEST",
  stadium: "SPORTS_CULTURE_SERVICE_REQUEST",
  cricket:"SPORTS_CULTURE_SERVICE_REQUEST",
  football:"SPORTS_CULTURE_SERVICE_REQUEST",
  hockey:"SPORTS_CULTURE_SERVICE_REQUEST",


  // TRANSPORT
  transport: "TRANSPORT_SERVICE_REQUEST",
  road: "TRANSPORT_SERVICE_REQUEST",
  bus: "TRANSPORT_SERVICE_REQUEST",
  train:"TRANSPORT_SERVICE_REQUEST",
  metro:"TRANSPORT_SERVICE_REQUEST",
  aeroplane:"TRANSPORT_SERVICE_REQUEST",


  // EMPLOYMENT
  job: "SKILL_EMPLOYMENT_SERVICE_REQUEST",
  employment: "SKILL_EMPLOYMENT_SERVICE_REQUEST",
  training: "SKILL_EMPLOYMENT_SERVICE_REQUEST",
  placement:"SKILL_EMPLOYMENT_SERVICE_REQUEST",

  // BUSINESS
  business: "BUSINESS_SERVICE_REQUEST",
  startup: "BUSINESS_SERVICE_REQUEST",
  loan: "BUSINESS_SERVICE_REQUEST",

  // WOMEN & CHILD
  women: "WOMEN_CHILD_SERVICE_REQUEST",
  child: "WOMEN_CHILD_SERVICE_REQUEST",
  girl: "WOMEN_CHILD_SERVICE_REQUEST",
  lady:"WOMEN_CHILD_SERVICE_REQUEST"
};


const URGENCY_KEYWORDS = [
  "urgent", "emergency", "critical", "repeated", "long time",
  "तुरंत", "आपातकाल", "गंभीर",
  "அவசரம்", "அவசர", "நீண்ட காலமாக"
];
/**************** POPULATION AFFECTED KEYWORDS ****************/

const POPULATION_KEYWORDS = {
  INDIVIDUAL: [
    // English
    "my house", "my family", "single household", "personal",
    // Hindi
    "मेरा घर", "मेरा परिवार", "एक घर", "व्यक्तिगत",
    // Tamil
    "என் வீடு", "என் குடும்பம்", "ஒரு வீடு", "தனிப்பட்ட"
  ],

  LOCAL: [
  // English
  "our street",
  "my area",
  "area",
  "neighborhood",
  "local area",
  "village",
  "colony",
  "ward",
  "locality",

  // Hindi
  "हमारी गली",
  "हमारा इलाका",
  "इलाका",
  "मोहल्ला",
  "गाँव",
  "कॉलोनी",
  "वार्ड",

  // Tamil
  "எங்கள் பகுதி",
  "என் பகுதி",
  "பகுதி",
  "கிராமம்",
  "குடியிருப்பு",
  "வார்டு"
]
,

  MASS: [
    // English
    "entire area", "whole village", "many people",
    "thousands affected", "public", "residents",
    // Hindi
    "पूरा इलाका", "पूरा गाँव", "कई लोग", "हजारों प्रभावित", "जनता", "निवासी",
    // Tamil
    "முழு பகுதி", "முழு கிராமம்", "பலர்", "ஆயிரக்கணக்கானோர்", "பொதுமக்கள்"
  ]
};
function extractJoinedWords(text) {
  // matches patterns like: s p o r t s
  const matches = text.match(/\b(?:[a-z]\s){2,}[a-z]\b/g);
  if (!matches) return [];

  return matches.map(m => m.replace(/\s+/g, ""));
}


function analyzeGrievanceText(text) {


  const lowerText = normalizeText(text);
const noSpaceText = lowerText.replace(/\s+/g, "");
const joinedWords = extractJoinedWords(lowerText);
  let detectedIntent = "GENERAL_GRIEVANCE";
  let urgency = "Medium";

// 1️⃣ Full phrase matching
for (const intent in NLP_KEYWORDS) {
  for (const keyword of NLP_KEYWORDS[intent]) {
    if (lowerText.includes(keyword)) {
      detectedIntent = intent;
      break;
    }
  }
  if (detectedIntent !== "GENERAL_GRIEVANCE") break;
}






// 🔴 HIGH URGENCY
if (
  lowerText.includes("urgent") ||
  lowerText.includes("emergency") ||
  lowerText.includes("immediate") ||
  lowerText.includes("critical") ||
  lowerText.includes("life threatening") ||
  lowerText.includes("very serious") ||

  // Hindi
  lowerText.includes("तुरंत") ||
  lowerText.includes("आपातकाल") ||
  lowerText.includes("गंभीर") ||

  // Tamil
  lowerText.includes("அவசரம்") ||
  lowerText.includes("அவசர") ||
  lowerText.includes("மிக முக்கிய")
) {
  urgency = "High";
}

// 🟢 LOW URGENCY
else if (
  lowerText.includes("request") ||
  lowerText.includes("please") ||
  lowerText.includes("when possible") ||
  lowerText.includes("not urgent") ||

  // Hindi
  lowerText.includes("अनुरोध") ||
  lowerText.includes("कृपया") ||
  lowerText.includes("तुरंत नहीं") ||

  // Tamil
  lowerText.includes("கோரிக்கை") ||
  lowerText.includes("தயவுசெய்து") ||
  lowerText.includes("அவசரம் இல்லை")
) {
  urgency = "Low";
}

// 🟠 MEDIUM stays default (delayed, pending, long time, etc.)

  // 🔁 Smart fallback using core words
// 🔁 Smart fallback using core stems (broken-word safe)
// 🔁 Smart fallback using core stems + no-space text
if (detectedIntent === "GENERAL_GRIEVANCE") {

  // 🧓 PENSION
  if (
    lowerText.includes("pens") ||
    noSpaceText.includes("pension") ||   // pen sion
    lowerText.includes("पेंश") ||
    lowerText.includes("ஓய்வு")
  ) {
    detectedIntent = "PENSION_SERVICE_REQUEST";
  }

  // 🍚 FOOD
  else if (
    lowerText.includes("food") ||
    noSpaceText.includes("food") ||       // f o o d
    lowerText.includes("ration") ||
    noSpaceText.includes("ration") ||     // ra tion
    lowerText.includes("hungr") ||
    lowerText.includes("भोजन") ||
    lowerText.includes("राशन") ||
    lowerText.includes("உணவு")
  ) {
    detectedIntent = "FOOD_SERVICE_REQUEST";
  }

  // ⚡ ELECTRICITY
  else if (
    lowerText.includes("elect") ||
    noSpaceText.includes("electricity") || // e lec tric ity
    lowerText.includes("power") ||
    noSpaceText.includes("power") ||
    lowerText.includes("curr") ||
    lowerText.includes("बिजल") ||
    lowerText.includes("கரண்ட்") ||
    lowerText.includes("மின்ச")
  ) {
    detectedIntent = "ELECTRICITY_SERVICE_REQUEST";
  }

  // 💧 WATER
  else if (
    lowerText.includes("water") ||
    lowerText.includes("wat") ||
    noSpaceText.includes("water") ||      // wa ter
    lowerText.includes("पानी") ||
    lowerText.includes("जल") ||
    lowerText.includes("தண்ண") ||
    lowerText.includes("நீர்")
  ) {
    detectedIntent = "WATER_SERVICE_REQUEST";
  }
}
// 🔥 CORE KEYWORD JUMP (single-word support)
if (detectedIntent === "GENERAL_GRIEVANCE") {
  const words = lowerText.split(" ");

  for (const word of words) {
    if (CORE_KEYWORD_INTENT_MAP[word]) {
      detectedIntent = CORE_KEYWORD_INTENT_MAP[word];
      break;
    }
  }
}

  /* POPULATION AFFECTED DETECTION */
  // 👥 POPULATION / AREA AFFECTED DETECTION
let populationAffected = "INDIVIDUAL";

// Normalize once
const words = lowerText.split(" ");

// 🔴 MASS population
if (
  lowerText.includes("entire") ||
  lowerText.includes("whole") ||
  lowerText.includes("many people") ||
  lowerText.includes("thousands") ||
  lowerText.includes("public") ||
  lowerText.includes("residents") ||
  lowerText.includes("पूरा") ||
  lowerText.includes("जनता") ||
  lowerText.includes("முழு") ||
  lowerText.includes("பலர்")
) {
  populationAffected = "MASS";
}

// 🟠 LOCAL population
else if (
  words.includes("area") ||
  words.includes("street") ||
  words.includes("neighborhood") ||
  words.includes("locality") ||
  words.includes("village") ||
  words.includes("colony") ||
  words.includes("ward") ||

  // Hindi
  lowerText.includes("इलाका") ||
  lowerText.includes("गली") ||
  lowerText.includes("गाँव") ||
  lowerText.includes("क्षेत्र") ||
  lowerText.includes("इलाका") ||
  lowerText.includes("मोहल्ला") ||
  

  // Tamil
  lowerText.includes("பகுதி") ||
  lowerText.includes("தெரு") ||
  lowerText.includes("கிராமம்")
) {
  populationAffected = "LOCAL";
}

// 🟢 INDIVIDUAL (explicit personal)
else if (
  lowerText.includes("my house") ||
  lowerText.includes("my home") ||
  lowerText.includes("my family") ||
  lowerText.includes("personal") ||
  lowerText.includes("मेरा घर") ||
  lowerText.includes("என் வீடு")
) {
  populationAffected = "INDIVIDUAL";
}
// 🔥 LETTER-SPACED WORD DETECTION (s p o r t s → sports)
if (detectedIntent === "GENERAL_GRIEVANCE") {
  for (const word of joinedWords) {

    // SPORTS
    if (word.includes("sport")) {
      detectedIntent = "SPORTS_CULTURE_SERVICE_REQUEST";
      break;
    }

    // WATER
    if (word.includes("water")) {
      detectedIntent = "WATER_SERVICE_REQUEST";
      break;
    }

    // ELECTRICITY
    if (word.includes("electric")) {
      detectedIntent = "ELECTRICITY_SERVICE_REQUEST";
      break;
    }

    // HEALTH
    if (word.includes("medical") || word.includes("health")) {
      detectedIntent = "HEALTH_SERVICE_REQUEST";
      break;
    }

    // EDUCATION
    if (word.includes("education") || word.includes("school")) {
      detectedIntent = "EDUCATION_SERVICE_REQUEST";
      break;
    }
  }
}




  return { detectedIntent, urgency, populationAffected };
}
function getRecommendedAction(intent) {
  switch (intent) {
    case "FOOD_SERVICE_REQUEST":
      return "Refer to Public Distribution System (PDS). Immediate ration support required.";

    case "ELECTRICITY_SERVICE_REQUEST":
      return "Forward to State Electricity Board. Emergency power restoration needed.";

    case "PENSION_SERVICE_REQUEST":
      return "Escalate to Social Welfare Department. Pension eligibility verification required.";
    
default:
  return "Route grievance to concerned department for review.";

  }
}
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097F\u0B80-\u0BFF\s]/g, "") // remove symbols
    .replace(/\s+/g, " ") // remove extra spaces
    .trim();
}

const textMap = {
  en: {
    gender: "Select Your Gender",
    age: "Select Your Age",
    grievance: "Write Your Grievance"
  },
  hi: {
    gender: "अपना लिंग चुनें",
    age: "अपनी आयु चुनें",
    grievance: "अपनी शिकायत लिखें"
  },
  ta: {
    gender: "உங்கள் பாலினத்தை தேர்ந்தெடுக்கவும்",
    age: "உங்கள் வயதை தேர்ந்தெடுக்கவும்",
    grievance: "உங்கள் புகாரை எழுதுங்கள்"
  }
};
const statesMap = [
  { en: "Andhra Pradesh", hi: "आंध्र प्रदेश", ta: "ஆந்திரப் பிரதேசம்" },
  { en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश", ta: "அருணாசலப் பிரதேசம்" },
  { en: "Assam", hi: "असम", ta: "அசாம்" },
  { en: "Bihar", hi: "बिहार", ta: "பீகார்" },
  { en: "Chhattisgarh", hi: "छत्तीसगढ़", ta: "சத்தீஸ்கர்" },
  { en: "Goa", hi: "गोवा", ta: "கோவா" },
  { en: "Gujarat", hi: "गुजरात", ta: "குஜராத்" },
  { en: "Haryana", hi: "हरियाणा", ta: "ஹரியானா" },
  { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश", ta: "ஹிமாசலப் பிரதேசம்" },
  { en: "Jharkhand", hi: "झारखंड", ta: "ஜார்க்கண்ட்" },
  { en: "Karnataka", hi: "कर्नाटक", ta: "கர்நாடகா" },
  { en: "Kerala", hi: "केरल", ta: "கேரளா" },
  { en: "Madhya Pradesh", hi: "मध्य प्रदेश", ta: "மத்தியப் பிரதேசம்" },
  { en: "Maharashtra", hi: "महाराष्ट्र", ta: "மகாராஷ்டிரா" },
  { en: "Manipur", hi: "मणिपुर", ta: "மணிப்பூர்" },
  { en: "Meghalaya", hi: "मेघालय", ta: "மேகாலயா" },
  { en: "Mizoram", hi: "मिज़ोरम", ta: "மிசோரம்" },
  { en: "Nagaland", hi: "नागालैंड", ta: "நாகாலாந்து" },
  { en: "Odisha", hi: "ओडिशा", ta: "ஒடிசா" },
  { en: "Punjab", hi: "पंजाब", ta: "பஞ்சாப்" },
  { en: "Rajasthan", hi: "राजस्थान", ta: "ராஜஸ்தான்" },
  { en: "Sikkim", hi: "सिक्किम", ta: "சிக்கிம்" },
  { en: "Tamil Nadu", hi: "तमिलनाडु", ta: "தமிழ்நாடு" },
  { en: "Telangana", hi: "तेलंगाना", ta: "தெலங்கானா" },
  { en: "Tripura", hi: "त्रिपुरा", ta: "திரிபுரா" },
  { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", ta: "உத்தரப் பிரதேசம்" },
  { en: "Uttarakhand", hi: "उत्तराखंड", ta: "உத்தரகாண்ட்" },
  { en: "West Bengal", hi: "पश्चिम बंगाल", ta: "மேற்கு வங்காளம்" }
];


const speechLangMap = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN"
};

function populateStates() {
  const select = document.getElementById("stateSelect");
  select.innerHTML = '<option value="">-- Select State --</option>';

  statesMap.forEach(state => {
    const option = document.createElement("option");
    option.value = state.en;

    if (userLang === "en") {
      option.textContent = state.en;
    } else {
      option.textContent = `${state.en} — ${state[userLang]}`;
    }

    select.appendChild(option);
  });
}

// STEP 1: Gender selection
function selectGender(gender) {
  selectedGender = gender;

  document.getElementById("step-gender").classList.add("hidden");
  document.getElementById("step-age").classList.remove("hidden");

  populateStates();
}

// STEP 2: Age slider
function updateAge() {
  const ageRange = document.getElementById("ageRange");
  selectedAge = ageRange.value;
  document.getElementById("ageValue").textContent = selectedAge;
}

function goToGrievance() {
  document.getElementById("step-age").classList.add("hidden");
  document.getElementById("step-grievance").classList.remove("hidden");
}
const CATEGORY_REDIRECT_MAP = {
  FOOD_SERVICE_REQUEST:
  "https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation",

WATER_SERVICE_REQUEST:
  "https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation",

ELECTRICITY_SERVICE_REQUEST:
  "https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation",

PENSION_SERVICE_REQUEST:
  "https://www.myscheme.gov.in/search/category/Banking,Financial%20Services%20and%20Insurance",

  AGRICULTURE_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment",

  BANKING_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Banking,Financial%20Services%20and%20Insurance",

  BUSINESS_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Business%20&%20Entrepreneurship",

  EDUCATION_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Education%20&%20Learning",

  HEALTH_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Health%20&%20Wellness",

  HOUSING_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Housing%20&%20Shelter",

  LAW_JUSTICE_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Public%20Safety,Law%20&%20Justice",

  SCIENCE_IT_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Science,%20IT%20&%20Communications",

  SKILL_EMPLOYMENT_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Skills%20&%20Employment",

  SOCIAL_WELFARE_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Social%20welfare%20&%20Empowerment",

  SPORTS_CULTURE_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Sports%20&%20Culture",

  TRANSPORT_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Transport%20&%20Infrastructure",

  TOURISM_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Travel%20&%20Tourism",

  UTILITY_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Utility%20&%20Sanitation",

  WOMEN_CHILD_SERVICE_REQUEST:
    "https://www.myscheme.gov.in/search/category/Women%20and%20Child"
};
// STEP 3: Submit grievance
async function submitGrievance() {
  const grievance = document.getElementById("grievanceText").value;

  const resultBox = document.getElementById("resultBox");
  const statusText = document.getElementById("statusText");
  const categoryText = document.getElementById("categoryText");
  const urgencyText = document.getElementById("urgencyText");
  const actionText = document.getElementById("actionText");
  const populationText = document.getElementById("populationText");


  if (!grievance.trim()) {
    alert("Please write your grievance");
    return;
  }

  resultBox.classList.remove("hidden");
  statusText.textContent = "Analyzing grievance...";
  statusText.classList.add("loading");

  categoryText.textContent = "-";
  urgencyText.textContent = "-";
  actionText.textContent = "-";

  // 🔍 FRONTEND NLP ANALYSIS
  const analysis = analyzeGrievanceText(grievance);

  statusText.textContent = "Grievance analyzed successfully";
  statusText.classList.remove("loading");

  const emoji = CATEGORY_EMOJI_MAP[analysis.detectedIntent] || "📄";
categoryText.textContent = `${emoji} ${analysis.detectedIntent}`;

  urgencyText.textContent = analysis.urgency;
   // Reset urgency classes
urgencyText.classList.remove(
  "urgency-high",
  "urgency-medium",
  "urgency-low"
);

// Apply urgency color
if (analysis.urgency === "High") {
  urgencyText.classList.add("urgency-high");
} else if (analysis.urgency === "Medium") {
  urgencyText.classList.add("urgency-medium");
} else if (analysis.urgency === "Low") {
  urgencyText.classList.add("urgency-low");
}




  actionText.textContent = getRecommendedAction(analysis.detectedIntent);
  populationText.textContent = analysis.populationAffected;
    // 💾 PERSIST TO BACKEND (CivicConnect API)
    // 💾 PERSIST TO BACKEND (CivicConnect API)
  try {
    const saveRes = await fetch("https://civiconnect1.onrender.com/api/grievances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: userLang,
        gender: selectedGender,
        age: selectedAge,
        grievanceText: grievance,
        category: analysis.detectedIntent,
        urgency: analysis.urgency,
        populationAffected: analysis.populationAffected,
      }),
    });

    if (saveRes.ok) {
      const saved = await saveRes.json();
      showTrackingId(saved.trackingId);
    }
  } catch (err) {
    console.warn("Could not save grievance to backend:", err.message);
  }

  // Save detected grievance category for schemes page
localStorage.setItem(
  "grievanceCategory",
  analysis.detectedIntent
);
const redirectURL =
  CATEGORY_REDIRECT_MAP[analysis.detectedIntent] || "schemes.html";

const timerEl = document.getElementById("redirectTimer");

let seconds = 7;
timerEl.textContent = `Redirecting to relevant government schemes in ${seconds} seconds...`;

const countdown = setInterval(() => {
  seconds--;
  timerEl.textContent = `Redirecting to relevant government schemes in ${seconds} seconds...`;

  if (seconds <= 0) {
    clearInterval(countdown);
    window.location.href = redirectURL;
  }
}, 1000);



}


// Reset flow
function resetForm() {
  if (recognition && isListening) {
    hideTrackingId();
    recognition.stop();
    isListening = false;
  }

  document.getElementById("grievanceText").value = "";
  document.getElementById("resultBox").classList.add("hidden");

  document.getElementById("step-grievance").classList.add("hidden");
  document.getElementById("step-gender").classList.remove("hidden");
}

// Voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice input not supported. Please use Google Chrome.");
    return;
  }

  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = speechLangMap[userLang];


  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("grievanceText").value = transcript;
  };

  recognition.onend = () => {
    isListening = false;
  };

  recognition.start();
}