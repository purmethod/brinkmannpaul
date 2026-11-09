// foyo club (forever young): the videos open the page, a tap or a scroll leads to the sessions,
// a name reserves one place (max 15), the thank-you page holds the whatsapp group and the cancel button.
// vanilla, no dependencies. sessions and places come from /api/soma.
(function () {
  "use strict";
  const T = {
    en: {
      cue: "tap or scroll", tag: "foyo club", h1: "feel indescribably good.",
      lead: "forever young.\nyou want to feel indescribably good, indescribably fit.\ni found out how. without pills, without expensive programs. just breath, cold and microbiome.", retreat: "the retreat", invite: "i am a certified wim hof instructor and warmly invite you to a retreat:", items: ["a breathing session", "ice baths [coming soon]", "a wonderful breakfast with homemade, real kefir", "included: your kefir grains to take home\nmake your own real kefir at home"], limit: "places are limited: max 15 people.", nextName: "next session", nextPlace: "date and place follow in the whatsapp group", placeLater: "the place follows in the whatsapp group", nextReserved: "your place for the next session is reserved. date and place follow in the whatsapp group.",
      next: "choose your session", none: "the sessions could not be loaded. please reload the page.",
      left: "{n} of {max} places free", full: "full",
      name: "your name", reserve: "reserve my place", wait: "one moment…",
      errName: "please write your name.", errSession: "please choose a session.", errFull: "this session is full. please choose another one.", errAny: "that did not work. please try again.",
      thanks: "thank you, {name}. we are happy you are coming.", reserved: "your place is reserved.",
      r1: "places are limited: max 15 people.", r2: "if you cannot come, cancel in time, so someone else can take part.",
      group: "join our whatsapp group", follow: "follow on instagram", dateLater: "date and time are announced in the whatsapp group", joinHintDate: "sign up and join our whatsapp group. we announce the date and time there.", reservedNoDate: "your place is reserved. join our whatsapp group: we announce the date and time there.", timeLater: "the time is announced in the whatsapp group", joinHint: "sign up and join our whatsapp group. we announce the time there.", reservedNoTime: "your place is reserved. join our whatsapp group: we announce the time there.", placeIs: "the place:", cancel: "i cannot come, cancel my place", sure: "cancel your place?",
      cancelled: "your place is free again. thank you for letting us know.", again: "choose another session",
      loading: "loading the sessions…", test: "test session",
    },
    de: {
      cue: "tippen oder scrollen", tag: "foyo club", h1: "fühl dich unbeschreiblich gut.",
      lead: "forever young.\ndu willst dich unbeschreiblich gut fühlen, unbeschreiblich fit.\nich habe herausgefunden, wie das geht. ohne pillen, ohne teure programme. nur atem, kälte und mikrobiom.", retreat: "das retreat", invite: "ich bin zertifizierter wim hof instructor und lade dich herzlich ein zu einem retreat:", items: ["eine breathing session", "eisbäder [coming soon]", "ein wundervolles frühstück mit hausgemachtem, echtem kefir", "inklusive: deine kefirkörner zum mitnehmen\nmach deinen echten kefir zu hause selbst"], limit: "die plätze sind begrenzt: maximal 15 personen.", nextName: "nächster termin", nextPlace: "datum und ort kommen in der whatsapp-gruppe", placeLater: "der ort kommt in der whatsapp-gruppe", nextReserved: "dein platz für den nächsten termin ist reserviert. datum und ort bekommst du in der whatsapp-gruppe.",
      next: "wähle deinen termin", none: "die termine konnten nicht geladen werden. bitte lade die seite neu.",
      left: "{n} von {max} plätzen frei", full: "voll",
      name: "dein name", reserve: "platz reservieren", wait: "einen moment…",
      errName: "bitte schreib deinen namen.", errSession: "bitte wähle einen termin.", errFull: "dieser termin ist voll. bitte wähle einen anderen.", errAny: "das hat nicht geklappt. bitte versuch es noch einmal.",
      thanks: "danke, {name}. wir freuen uns, dass du kommst.", reserved: "dein platz ist reserviert.",
      r1: "die plätze sind begrenzt: maximal 15 personen.", r2: "wenn du nicht kommen kannst, sag rechtzeitig ab, damit andere teilnehmen können.",
      group: "tritt unserer whatsapp-gruppe bei", follow: "folge uns auf instagram", dateLater: "datum und uhrzeit geben wir in der whatsapp-gruppe bekannt", joinHintDate: "trag dich ein und tritt unserer whatsapp-gruppe bei. dort geben wir datum und uhrzeit bekannt.", reservedNoDate: "dein platz ist reserviert. tritt unserer whatsapp-gruppe bei: dort geben wir datum und uhrzeit bekannt.", timeLater: "die uhrzeit geben wir in der whatsapp-gruppe bekannt", joinHint: "trag dich ein und tritt unserer whatsapp-gruppe bei. dort geben wir die uhrzeit bekannt.", reservedNoTime: "dein platz ist reserviert. tritt unserer whatsapp-gruppe bei: dort geben wir die uhrzeit bekannt.", placeIs: "der ort:", cancel: "ich kann nicht kommen, platz absagen", sure: "deinen platz absagen?",
      cancelled: "dein platz ist wieder frei. danke, dass du abgesagt hast.", again: "anderen termin wählen",
      loading: "termine werden geladen…", test: "testtermin",
    },
    fr: {
      cue: "touche ou fais défiler", tag: "foyo club", h1: "sens-toi incroyablement bien.",
      lead: "forever young.\ntu veux te sentir incroyablement bien, incroyablement en forme.\nj'ai trouvé comment. sans pilules, sans programmes coûteux. juste la respiration, le froid et le microbiome.", retreat: "la retraite", invite: "je suis instructeur certifié de la méthode wim hof et je t'invite chaleureusement à une retraite :", items: ["une séance de respiration", "bains de glace [bientôt]", "un merveilleux petit-déjeuner avec du vrai kéfir fait maison", "inclus : tes grains de kéfir à emporter\nfais ton vrai kéfir chez toi"], limit: "les places sont limitées : 15 personnes maximum.", nextName: "prochaine séance", nextPlace: "la date et le lieu arrivent dans le groupe whatsapp", placeLater: "le lieu arrive dans le groupe whatsapp", nextReserved: "ta place pour la prochaine séance est réservée. la date et le lieu arrivent dans le groupe whatsapp.",
      next: "choisis ta séance", none: "les séances n'ont pas pu être chargées. recharge la page.",
      left: "{n} places libres sur {max}", full: "complet",
      name: "ton prénom", reserve: "réserver ma place", wait: "un instant…",
      errName: "écris ton prénom, s'il te plaît.", errSession: "choisis une séance, s'il te plaît.", errFull: "cette séance est complète. choisis-en une autre.", errAny: "ça n'a pas marché. réessaie.",
      thanks: "merci, {name}. nous sommes heureux que tu viennes.", reserved: "ta place est réservée.",
      r1: "les places sont limitées : 15 personnes maximum.", r2: "si tu ne peux pas venir, annule à temps pour que quelqu'un d'autre puisse participer.",
      group: "rejoins notre groupe whatsapp", follow: "suis-nous sur instagram", dateLater: "la date et l'heure sont annoncées dans le groupe whatsapp", joinHintDate: "inscris-toi et rejoins notre groupe whatsapp. nous y annonçons la date et l'heure.", reservedNoDate: "ta place est réservée. rejoins notre groupe whatsapp : nous y annonçons la date et l'heure.", timeLater: "l'heure est annoncée dans le groupe whatsapp", joinHint: "inscris-toi et rejoins notre groupe whatsapp. nous y annonçons l'heure.", reservedNoTime: "ta place est réservée. rejoins notre groupe whatsapp : nous y annonçons l'heure.", placeIs: "le lieu :", cancel: "je ne peux pas venir, annuler ma place", sure: "annuler ta place ?",
      cancelled: "ta place est de nouveau libre. merci de nous avoir prévenus.", again: "choisir une autre séance",
      loading: "chargement des séances…", test: "séance test",
    },
    es: {
      cue: "toca o desliza", tag: "foyo club", h1: "siéntete increíblemente bien.",
      lead: "forever young.\nquieres sentirte increíblemente bien, increíblemente en forma.\ndescubrí cómo. sin pastillas, sin programas caros. solo respiración, frío y microbioma.", retreat: "el retiro", invite: "soy instructor certificado del método wim hof y te invito de corazón a un retiro:", items: ["una sesión de respiración", "baños de hielo [muy pronto]", "un desayuno maravilloso con kéfir casero de verdad", "incluido: tus granos de kéfir para llevar\nhaz tu propio kéfir de verdad en casa"], limit: "las plazas son limitadas: máximo 15 personas.", nextName: "próxima sesión", nextPlace: "la fecha y el lugar llegan en el grupo de whatsapp", placeLater: "el lugar llega en el grupo de whatsapp", nextReserved: "tu plaza para la próxima sesión está reservada. la fecha y el lugar llegan en el grupo de whatsapp.",
      next: "elige tu sesión", none: "no se pudieron cargar las sesiones. vuelve a cargar la página.",
      left: "{n} de {max} plazas libres", full: "completo",
      name: "tu nombre", reserve: "reservar mi plaza", wait: "un momento…",
      errName: "escribe tu nombre, por favor.", errSession: "elige una sesión, por favor.", errFull: "esta sesión está completa. elige otra.", errAny: "no ha funcionado. inténtalo de nuevo.",
      thanks: "gracias, {name}. nos alegra que vengas.", reserved: "tu plaza está reservada.",
      r1: "las plazas son limitadas: máximo 15 personas.", r2: "si no puedes venir, cancela a tiempo para que otra persona pueda participar.",
      group: "únete a nuestro grupo de whatsapp", follow: "síguenos en instagram", dateLater: "la fecha y la hora las anunciamos en el grupo de whatsapp", joinHintDate: "apúntate y únete a nuestro grupo de whatsapp. allí anunciamos la fecha y la hora.", reservedNoDate: "tu plaza está reservada. únete a nuestro grupo de whatsapp: allí anunciamos la fecha y la hora.", timeLater: "la hora la anunciamos en el grupo de whatsapp", joinHint: "apúntate y únete a nuestro grupo de whatsapp. allí anunciamos la hora.", reservedNoTime: "tu plaza está reservada. únete a nuestro grupo de whatsapp: allí anunciamos la hora.", placeIs: "el lugar:", cancel: "no puedo ir, cancelar mi plaza", sure: "¿cancelar tu plaza?",
      cancelled: "tu plaza vuelve a estar libre. gracias por avisar.", again: "elegir otra sesión",
      loading: "cargando las sesiones…", test: "sesión de prueba",
    },
    ar: {
      cue: "المس أو مرّر", tag: "foyo club", h1: "اشعر بشعور رائع لا يوصف.",
      lead: "forever young.\nتريد أن تشعر بشعور رائع لا يوصف، وبلياقة لا توصف.\nاكتشفت كيف. بلا حبوب، بلا برامج باهظة. فقط التنفّس والبرد والميكروبيوم.", retreat: "الخلوة", invite: "أنا مدرّب معتمد لطريقة ويم هوف، وأدعوك بكل سرور إلى خلوة:", items: ["جلسة تنفّس", "حمّامات ثلج [قريبًا]", "فطور رائع مع كفير حقيقي محضّر في البيت", "مشمول: حبوب الكفير لتأخذها معك\nحضّر كفيرك الحقيقي في البيت"], limit: "الأماكن محدودة: 15 شخصًا كحد أقصى.", nextName: "الموعد القادم", nextPlace: "التاريخ والمكان في مجموعة واتساب", placeLater: "المكان في مجموعة واتساب", nextReserved: "مكانك في الموعد القادم محجوز. يصلك التاريخ والمكان في مجموعة واتساب.",
      next: "اختر موعدك", none: "تعذّر تحميل المواعيد. أعد تحميل الصفحة.",
      left: "{n} من {max} أماكن متاحة", full: "مكتمل",
      name: "اسمك", reserve: "احجز مكاني", wait: "لحظة…",
      errName: "اكتب اسمك من فضلك.", errSession: "اختر موعدًا من فضلك.", errFull: "هذا الموعد مكتمل. اختر موعدًا آخر.", errAny: "لم ينجح ذلك. حاول مرة أخرى.",
      thanks: "شكرًا، {name}. يسعدنا أنك قادم.", reserved: "مكانك محجوز.",
      r1: "الأماكن محدودة: 15 شخصًا كحد أقصى.", r2: "إذا لم تستطع الحضور، ألغِ في الوقت المناسب ليتمكن شخص آخر من المشاركة.",
      group: "انضم إلى مجموعة واتساب الخاصة بنا", follow: "تابعنا على إنستغرام", dateLater: "نعلن عن التاريخ والوقت في مجموعة واتساب", joinHintDate: "سجّل وانضم إلى مجموعة واتساب الخاصة بنا. هناك نعلن عن التاريخ والوقت.", reservedNoDate: "مكانك محجوز. انضم إلى مجموعة واتساب الخاصة بنا: هناك نعلن عن التاريخ والوقت.", timeLater: "نعلن عن الوقت في مجموعة واتساب", joinHint: "سجّل وانضم إلى مجموعة واتساب الخاصة بنا. هناك نعلن عن الوقت.", reservedNoTime: "مكانك محجوز. انضم إلى مجموعة واتساب الخاصة بنا: هناك نعلن عن الوقت.", placeIs: "المكان:", cancel: "لا أستطيع الحضور، ألغِ مكاني", sure: "إلغاء مكانك؟",
      cancelled: "مكانك متاح من جديد. شكرًا لأنك أخبرتنا.", again: "اختر موعدًا آخر",
      loading: "جارٍ تحميل المواعيد…", test: "موعد تجريبي",
    },
    ru: {
      cue: "коснись или прокрути", tag: "foyo club", h1: "почувствуй себя невероятно хорошо.",
      lead: "forever young.\nты хочешь чувствовать себя невероятно хорошо, невероятно бодро.\nя нашёл, как это сделать. без таблеток, без дорогих программ. только дыхание, холод и микробиом.", retreat: "ретрит", invite: "я сертифицированный инструктор метода вима хофа и сердечно приглашаю тебя на ретрит:", items: ["дыхательная сессия", "ледяные ванны [скоро]", "прекрасный завтрак с настоящим домашним кефиром", "включено: кефирные зёрна с собой\nготовь настоящий кефир дома"], limit: "мест мало: максимум 15 человек.", nextName: "следующее занятие", nextPlace: "дата и место будут в группе whatsapp", placeLater: "место будет в группе whatsapp", nextReserved: "твоё место на следующем занятии забронировано. дату и место узнаешь в группе whatsapp.",
      next: "выбери занятие", none: "не удалось загрузить занятия. обнови страницу.",
      left: "свободно {n} из {max} мест", full: "мест нет",
      name: "твоё имя", reserve: "забронировать место", wait: "минуту…",
      errName: "пожалуйста, напиши своё имя.", errSession: "пожалуйста, выбери занятие.", errFull: "на это занятие мест нет. выбери другое.", errAny: "не получилось. попробуй ещё раз.",
      thanks: "спасибо, {name}. мы рады, что ты придёшь.", reserved: "твоё место забронировано.",
      r1: "мест мало: максимум 15 человек.", r2: "если не сможешь прийти, отмени заранее, чтобы пришёл кто-то другой.",
      group: "вступи в нашу группу whatsapp", follow: "подписывайся в instagram", dateLater: "дату и время сообщим в группе whatsapp", joinHintDate: "запишись и вступи в нашу группу whatsapp. там мы сообщим дату и время.", reservedNoDate: "твоё место забронировано. вступи в нашу группу whatsapp: там мы сообщим дату и время.", timeLater: "время сообщим в группе whatsapp", joinHint: "запишись и вступи в нашу группу whatsapp. там мы сообщим время.", reservedNoTime: "твоё место забронировано. вступи в нашу группу whatsapp: там мы сообщим время.", placeIs: "место:", cancel: "не смогу прийти, отменить место", sure: "отменить твоё место?",
      cancelled: "твоё место снова свободно. спасибо, что предупредил.", again: "выбрать другое занятие",
      loading: "загружаем занятия…", test: "тестовое занятие",
    },
  };
  // about paul, under the sign-up: the wim hof texts of brinkmannpaul.com and paul's own story
  const ABOUT = {
   "en": {
    "tag": "about paul",
    "lead": "fifteen years of breath.",
    "bio": "i have been practising breathwork for 15 years and guiding people through breathing sessions and the cold. i am a certified wim hof method instructor and a friend of wim.",
    "cap": "at wim's house · poland",
    "s1": "a few years ago, overwork and stress inflamed my joints. i could not move. i could not even get up from a chair.",
    "s2": "i healed it all with the right food, with breath and with the cold.",
    "s3": "what i discovered, i want to give to everyone. i want to show people that it also works without medication.",
    "s4": "i am not against conventional medicine, not against medication. but we have to understand that we need to combine them: healing does not come from medication alone. you have to take your health into your own hands.",
    "s5": "and how that works, i show you in my courses. i give you the key, i show you the door and how to walk through it. walking through is up to you. but the guidance, how it works, i show you."
   },
   "de": {
    "tag": "über paul",
    "lead": "fünfzehn jahre atem.",
    "bio": "seit 15 jahren praktiziere ich atemarbeit und begleite menschen durch atemsessions und die kälte. ich bin zertifizierter wim hof methode instructor und mit wim befreundet.",
    "cap": "bei wim zu hause · polen",
    "s1": "vor ein paar jahren haben sich durch überarbeitung und stress meine gelenke entzündet. ich konnte mich nicht bewegen. ich konnte nicht einmal vom stuhl aufstehen.",
    "s2": "das habe ich alles kuriert, mit der richtigen ernährung, mit atem und mit der kälte.",
    "s3": "was ich entdeckt habe, möchte ich allen menschen zur verfügung stellen. ich möchte zeigen, dass es auch ohne medikamente geht.",
    "s4": "ich bin nicht gegen die schulmedizin, nicht gegen medikamente. aber wir müssen verstehen, dass wir beides kombinieren müssen: heilung entsteht nicht nur durch medikamente. du musst deine gesundheit selbst in die hand nehmen.",
    "s5": "und wie das geht, zeige ich dir in meinen kursen. ich gebe dir den schlüssel, ich zeige dir die tür und wie du hindurchgehst. hindurchgehen musst du selbst. aber die anleitung, wie es funktioniert, die zeige ich dir."
   },
   "fr": {
    "tag": "à propos de paul",
    "lead": "quinze ans de souffle.",
    "bio": "je pratique le travail du souffle depuis 15 ans et j'accompagne des personnes dans des séances de respiration et dans le froid. je suis instructeur certifié de la méthode wim hof et un ami de wim.",
    "cap": "chez wim · pologne",
    "s1": "il y a quelques années, le surmenage et le stress ont enflammé mes articulations. je ne pouvais plus bouger. je ne pouvais même pas me lever d'une chaise.",
    "s2": "j'ai tout guéri avec la bonne alimentation, avec la respiration et avec le froid.",
    "s3": "ce que j'ai découvert, je veux le mettre à la disposition de tous. je veux montrer que c'est possible aussi sans médicaments.",
    "s4": "je ne suis pas contre la médecine conventionnelle, ni contre les médicaments. mais nous devons comprendre qu'il faut les combiner : la guérison ne vient pas seulement des médicaments. tu dois prendre ta santé en main.",
    "s5": "et comment faire, je te le montre dans mes cours. je te donne la clé, je te montre la porte et comment la franchir. la franchir, c'est à toi. mais le mode d'emploi, je te le montre."
   },
   "es": {
    "tag": "sobre paul",
    "lead": "quince años de respiración.",
    "bio": "practico el trabajo respiratorio desde hace 15 años y guío a personas en sesiones de respiración y en el frío. soy instructor certificado del método wim hof y amigo de wim.",
    "cap": "en casa de wim · polonia",
    "s1": "hace unos años, el exceso de trabajo y el estrés inflamaron mis articulaciones. no podía moverme. ni siquiera podía levantarme de una silla.",
    "s2": "lo curé todo con la alimentación adecuada, con la respiración y con el frío.",
    "s3": "lo que descubrí quiero ponerlo al alcance de todos. quiero mostrar que también es posible sin medicamentos.",
    "s4": "no estoy en contra de la medicina convencional ni de los medicamentos. pero tenemos que entender que hay que combinarlos: la curación no viene solo de los medicamentos. tienes que tomar tu salud en tus manos.",
    "s5": "y cómo se hace, te lo muestro en mis cursos. te doy la llave, te muestro la puerta y cómo cruzarla. cruzarla te toca a ti. pero las instrucciones de cómo funciona, esas te las muestro."
   },
   "ar": {
    "tag": "عن paul",
    "lead": "خمسة عشر عامًا من النَّفَس.",
    "bio": "أمارس تمارين التنفس منذ 15 عامًا وأرافق الناس في جلسات التنفس وفي مواجهة البرد. أنا مدرّب معتمد لطريقة ويم هوف وصديق لويم.",
    "cap": "في بيت ويم · بولندا",
    "s1": "قبل بضع سنوات، التهبت مفاصلي بسبب الإرهاق والضغط. لم أستطع الحركة. لم أستطع حتى النهوض من الكرسي.",
    "s2": "وشُفيت من كل ذلك بالتغذية الصحيحة، وبالتنفّس، وبالبرد.",
    "s3": "ما اكتشفته أريد أن أضعه في متناول الجميع. أريد أن أُري الناس أن الأمر ممكن أيضًا من دون أدوية.",
    "s4": "لست ضد الطب التقليدي ولا ضد الأدوية. لكن علينا أن نفهم أننا نحتاج إلى الجمع بينهما: الشفاء لا يأتي من الأدوية وحدها. عليك أن تأخذ صحتك بيدك.",
    "s5": "وكيف يكون ذلك، أريك إياه في دوراتي. أعطيك المفتاح، وأريك الباب وكيف تعبره. العبور عليك أنت. لكن الطريقة، كيف يعمل ذلك، أريك إياها."
   },
   "ru": {
    "tag": "о paul",
    "lead": "пятнадцать лет дыхания.",
    "bio": "я занимаюсь дыхательными практиками 15 лет и провожу людей через дыхательные сессии и холод. я сертифицированный инструктор метода вима хофа и друг вима.",
    "cap": "в доме вима · польша",
    "s1": "несколько лет назад из-за переутомления и стресса у меня воспалились суставы. я не мог двигаться. я не мог даже встать со стула.",
    "s2": "всё это я вылечил правильным питанием, дыханием и холодом.",
    "s3": "то, что я открыл, я хочу сделать доступным для всех. я хочу показать, что это возможно и без лекарств.",
    "s4": "я не против традиционной медицины и не против лекарств. но нужно понять, что их надо сочетать: исцеление приходит не только от лекарств. своё здоровье нужно взять в свои руки.",
    "s5": "а как это сделать, я показываю на своих курсах. я даю тебе ключ, показываю дверь и как через неё пройти. пройти через неё можешь только ты. но инструкцию, как это работает, я тебе покажу."
   }
  };
  const LANGS = Object.keys(T);
  const KEY = "soma-flow-club";
  const TEST = new URLSearchParams(location.search).get("test") === "1";
  const IG = "https://www.instagram.com/foyoclub/";
  const API = "/api/soma" + (TEST ? "?test=1" : "");
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const saved = store.get();
  // the page opens in the visitor's own language (the device's list, in order); a choice made here
  // holds for this visit only, so the next visit opens in their language again
  const device = () => {
    for (const tag of navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]) {
      const l = String(tag).toLowerCase().slice(0, 2);
      if (LANGS.includes(l)) return l;
    }
    return "en";
  };
  let chosen = null;
  try { chosen = sessionStorage.getItem(KEY + "-lang"); } catch { /* private mode */ }
  const st = {
    lang: LANGS.includes(chosen) ? chosen : device(),
    sessions: null, max: 15, pick: null, name: "", busy: false, error: "",
    booking: saved.booking || null, cancelled: false,
  };
  const app = document.getElementById("book");
  const t = (k, v) => String(T[st.lang][k] || T.en[k]).replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null ? v[x] : ""));
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  }
  // the session time is the local time at the place, so it is shown exactly as written
  // a date without a time (YYYY-MM-DD): the day only, the time is announced in the group
  const dayOnly = (s) => Boolean(s.when) && s.when.length === 10;
  function when(s) {
    if (!s.when) return t("nextName");
    const d = new Date((dayOnly(s) ? s.when + "T12:00" : s.when) + ":00Z");
    const tag = { ar: "ar-TN", en: "en-US" }[st.lang] || st.lang;
    const opts = dayOnly(s) ? { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" } : { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC" };
    try { return new Intl.DateTimeFormat(tag, opts).format(d); } catch { return s.when.replace("T", " · "); }
  }
  // no date yet: date and place follow in the group; a date without a place: the place follows there
  // "the place: creative hub, sidi bou said · google maps"
  const where = (s) => el("p", { class: "where" }, t("placeIs") + " " + s.place + " · ",
    el("a", { href: s.map, target: "_blank", rel: "noopener" }, "google maps"));
  const place = (s) => (s.place === "test" ? t("test") : s.place || (s.when ? t("placeLater") : t("nextPlace")));

  // ---------- the opening ----------
  const flow = document.getElementById("flow");
  const clip = document.getElementById("clip");
  const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) { clip.removeAttribute("autoplay"); clip.pause(); }
  else {
    const play = () => clip.play().catch(() => {});
    play();
    // some phones block autoplay until the first touch; low power mode too
    document.addEventListener("touchstart", play, { once: true, passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  }
  flow.addEventListener("click", () => {
    document.getElementById("top").scrollIntoView({ behavior: still ? "auto" : "smooth" });
  });

  // ---------- language ----------
  function setLang(l) {
    st.lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.querySelectorAll(".lb").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    document.getElementById("cue").textContent = t("cue");
    renderAbout();
    render();
  }
  document.querySelectorAll(".lb").forEach((b) => b.addEventListener("click", () => {
    try { sessionStorage.setItem(KEY + "-lang", b.dataset.lang); } catch { /* private mode */ }
    setLang(b.dataset.lang);
  }));

  // ---------- about paul ----------
  function renderAbout() {
    const box = document.getElementById("about");
    if (!box) return;
    const a = ABOUT[st.lang] || ABOUT.en;
    const photo = (src, alt, cap) => el("figure", { class: "photo" }, el("span", { class: "photo-circle" }, el("img", { src, alt, width: "720", height: "720", loading: "lazy", decoding: "async" })), cap ? el("figcaption", {}, cap) : null);
    box.replaceChildren(
      el("p", { class: "tag" }, a.tag),
      el("p", { class: "lead" }, a.lead),
      el("p", {}, a.bio),
      photo("/photos/photo-wim-hof.webp", "paul brinkmann and wim hof shaking hands in poland", a.cap),
      el("p", {}, a.s1),
      photo("/photos/photo-snow.webp", "paul brinkmann meditating bare-chested in the snow above the mountains"),
      el("p", {}, a.s2),
      el("p", {}, a.s3),
      photo("/photos/photo-climb.webp", "a line of people walking bare-chested through the snow on a mountain path"),
      el("p", {}, a.s4),
      el("p", {}, a.s5),
      photo("/photos/photo-group.webp", "a group, bare-chested, together in the snow on a mountain top"),
      el("p", { class: "sign" }, "paul brinkmann"));
  }

  // ---------- the page ----------
  // append, skipping the parts that are not there (a bare null would show as the word "null")
  const put = (...kids) => app.append(...kids.flat().filter((k) => k != null && k !== false));
  function render() {
    app.replaceChildren();
    if (st.booking) return renderDone();
    put(
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("h1")),
      // each sentence of the lead on its own line: the retreat, then "you have earned it."
      // the lead line by line: forever young, the wish, the discovery
      el("p", { class: "lead" }, t("lead").split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line]))),
      el("h2", {}, t("retreat")),
      el("p", {}, t("invite")),
      el("ul", { class: "rules offer" }, (T[st.lang].items || T.en.items).map((x) => el("li", {}, x.split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line]))))),
      el("p", { class: "fine" }, t("limit")),
      st.cancelled ? el("p", { class: "fine", role: "status" }, t("cancelled")) : null,
      el("h2", {}, t("next")));
    if (!st.sessions) return put(el("p", { class: "fine" }, t("loading")));
    if (!st.sessions.length) return put(el("p", {}, t("none")));
    const rows = el("div", { class: "rows", role: "radiogroup", "aria-label": t("next") });
    for (const s of st.sessions) {
      const full = s.left <= 0;
      rows.append(el("button", {
        class: "slot", type: "button", role: "radio", disabled: full,
        "aria-checked": String(st.pick === s.id),
        onclick: () => { st.pick = s.id; st.error = ""; render(); },
      },
        el("span", { class: "dot", "aria-hidden": "true" }),
        el("span", {}, when(s), dayOnly(s) ? el("span", { class: "place" }, t("timeLater")) : null, s.map ? null : el("span", { class: "place" }, place(s))),
        el("span", { class: "left" }, full ? t("full") : t("left", { n: s.left, max: st.max }))));
      if (s.map) rows.append(where(s));
    }
    const input = el("input", { type: "text", id: "nm", autocomplete: "given-name", maxlength: "60", value: st.name });
    input.addEventListener("input", () => { st.name = input.value; });
    const form = el("form", { class: "form", novalidate: true, onsubmit: (e) => { e.preventDefault(); reserve(form); } },
      st.sessions.some((x) => !x.when && x.place) ? el("p", { class: "hint" }, t("joinHintDate")) : st.sessions.some(dayOnly) ? el("p", { class: "hint" }, t("joinHint")) : null,
      el("label", { for: "nm" }, t("name")), input,
      el("div", { class: "hp", "aria-hidden": "true" }, el("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off" })),
      el("div", {}, el("button", { class: "btn", type: "submit", disabled: st.busy }, st.busy ? t("wait") : t("reserve"))),
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null);
    put(rows, form);
  }

  function renderDone() {
    const b = st.booking;
    const acts = el("div", { class: "acts" });
    if (b.group) acts.append(el("a", { class: "btn", href: b.group, target: "_blank", rel: "noopener" }, t("group")));
    acts.append(el("a", { class: "ghost", href: IG, target: "_blank", rel: "noopener" }, t("follow")));
    if (b.map) acts.append(el("a", { class: "ghost", href: b.map, target: "_blank", rel: "noopener" }, b.place.split(",")[0] + " · google maps"));
    const leave = el("div", { class: "acts leave" }, el("button", { class: "ghost", type: "button", onclick: cancel }, t("cancel")));
    put(el("section", { class: "done", "aria-live": "polite" },
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("thanks", { name: b.name })),
      el("p", { class: "when" }, when(b)),
      b.map ? where(b) : b.when ? el("p", { class: "fine" }, place(b)) : null,
      el("p", { class: "lead" }, !b.when ? (b.place ? t("reservedNoDate") : t("nextReserved")) : dayOnly(b) ? t("reservedNoTime") : t("reserved")),
      el("ul", { class: "rules" }, ["r1", "r2"].map((k) => el("li", {}, t(k)))),
      acts,
      leave,
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null));
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      const d = await r.json();
      st.sessions = d.sessions || [];
      st.max = d.places || 15;
      const open = st.sessions.filter((s) => s.left > 0);
      if (!st.pick && open.length === 1) st.pick = open[0].id;
    } catch { st.sessions = []; }
    // a reservation for a session that has passed is forgotten
    if (st.booking && st.booking.when && (dayOnly(st.booking) ? st.booking.when + "T23:59" : st.booking.when) < new Date().toISOString().slice(0, 16)) { st.booking = null; store.set({ ...store.get(), booking: null }); }
    render();
  }

  async function reserve(form) {
    if (st.busy) return;
    st.error = "";
    const name = st.name.trim();
    if (name.length < 2) { st.error = t("errName"); return render(); }
    if (!st.pick) { st.error = t("errSession"); return render(); }
    st.busy = true; render();
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: st.pick, name, company: form.company ? form.company.value : "" }) });
      const d = await r.json().catch(() => ({}));
      st.busy = false;
      if (r.status === 409) { st.error = t("errFull"); await load(); return; }
      if (!r.ok || !d.id) { st.error = t("errAny"); return render(); }
      st.booking = { id: d.id, name, when: d.when, place: d.place, map: d.map || "", group: d.group || "" };
      st.cancelled = false;
      store.set({ ...store.get(), booking: st.booking });
      render();
      app.focus({ preventScroll: true });
      document.getElementById("top").scrollIntoView();
    } catch { st.busy = false; st.error = t("errAny"); render(); }
  }

  async function cancel() {
    if (!st.booking || !window.confirm(t("sure"))) return;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancel: st.booking.id }) });
      if (!r.ok) throw new Error("cancel");
      st.booking = null; st.cancelled = true; st.error = ""; st.pick = null;
      store.set({ ...store.get(), booking: null });
      await load();
    } catch { st.error = t("errAny"); render(); }
  }

  setLang(st.lang);
  load();
})();
