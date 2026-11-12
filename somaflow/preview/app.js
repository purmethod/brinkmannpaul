// foyo club (forever young): the videos open the page, a tap or a scroll leads to the sessions,
// a name reserves one place (max 7), the thank-you page holds the whatsapp group and the cancel button.
// vanilla, no dependencies. sessions and places come from brinkmannpaul.com/api/soma.
(function () {
  "use strict";
  const T = {
    en: {
      cue: "tap or scroll", tag: "foyo club", h1: "feeling young is not a question of age.",
      lead: "at any age you should feel fit. at any age you should feel young.\ni found out how. without pills, without expensive programs. just breath, cold and microbiome.", retreat: "the retreat", invite: "i am a certified wim hof instructor. i am in tunis for a short time and warmly invite you to a breathing session.", incl: "included", fuel: "this breakfast is what i eat myself every day. i show you what to eat daily so your body works better and you feel better, physically and mentally.", items: ["a guided breathing session with the wim hof method", "a simple breakfast: oats, nuts, flaxseed, pomegranate and homemade kefir. it supports your microbiome.", "your kefir grains to take home\nmake your own real kefir at home"], priceFmt: "{p}\u00a0dinar", fullNotice: "the maximum number of participants has been reached. leave your name and whatsapp number: we'll let you know if someone cannot come.", phone: "your whatsapp number", joinWait: "join the waiting list", errPhone: "please write your whatsapp number.", waitThanks: "thank you, {name}. you are on the waiting list.", waitBody: "if someone cannot come, we'll let you know on whatsapp.", leaveWait: "leave the waiting list", only: "in this session: no ice baths, just breathing and breakfast.", limit: "places are limited: max 7 people.", nextName: "next session", nextPlace: "date and place follow in the whatsapp group", placeLater: "the place follows in the whatsapp group", nextReserved: "your place for the next session is reserved. date and place follow in the whatsapp group.",
      next: "choose your session", none: "the sessions could not be loaded. please reload the page.",
      full: "waiting list",
      name: "your name", reserve: "reserve my place", wait: "one moment…",
      errName: "please write your name.", errSession: "please choose a session.", errFull: "this session is full. please choose another one.", errAny: "that did not work. please try again.",
      thanks: "thank you, {name}. we are happy you are coming.", reserved: "your place is reserved.",
      r1: "places are limited: max 7 people.", r2: "if you cannot come, cancel in time, so someone else can take part.",
      group: "join our whatsapp group", follow: "follow on instagram", dateLater: "date and time are announced in the whatsapp group", joinHintDate: "sign up and join our whatsapp group. we announce the date and time there.", reservedNoDate: "your place is reserved. join our whatsapp group: we announce the date and time there.", timeLater: "the time is announced in the whatsapp group", joinHint: "sign up and join our whatsapp group. we announce the time there.", reservedNoTime: "your place is reserved. join our whatsapp group: we announce the time there.", placeIs: "the place:", cancel: "i cannot come, cancel my place", sure: "cancel your place?",
      cancelled: "your place is free again. thank you for letting us know.", again: "choose another session",
      loading: "loading the sessions…", test: "test session", mine: "your place is reserved", showMine: "show my reservation", toPage: "back to the page",
    },
    de: {
      cue: "tippen oder scrollen", tag: "foyo club", h1: "sich jung zu fühlen ist keine frage des alters.",
      lead: "in jedem alter solltest du dich fit fühlen. in jedem alter solltest du dich jung fühlen.\nich habe herausgefunden, wie das geht. ohne pillen, ohne teure programme. nur atem, kälte und mikrobiom.", retreat: "das retreat", invite: "ich bin zertifizierter wim hof instructor. ich bin gerade für kurze zeit in tunis und lade dich herzlich zu einer breathing session ein.", incl: "inklusive", fuel: "dieses frühstück esse ich selbst jeden tag. ich zeige dir, was du täglich essen solltest, damit dein körper besser funktioniert und du dich körperlich und mental besser fühlst.", items: ["eine geführte breathing session nach der wim hof methode", "ein einfaches frühstück: haferflocken, nüsse, leinsamen, granatapfel und hausgemachter kefir. es unterstützt dein mikrobiom.", "deine kefirkörner zum mitnehmen\nmach deinen echten kefir zu hause selbst"], priceFmt: "{p}\u00a0dinar", fullNotice: "die maximale teilnehmerzahl ist erreicht. hinterlass deinen namen und deine whatsapp-nummer: wir sagen dir bescheid, falls jemand nicht kommen kann.", phone: "deine whatsapp-nummer", joinWait: "auf die warteliste", errPhone: "bitte schreib deine whatsapp-nummer.", waitThanks: "danke, {name}. du stehst auf der warteliste.", waitBody: "falls jemand nicht kommen kann, sagen wir dir per whatsapp bescheid.", leaveWait: "von der warteliste nehmen", only: "in dieser session: keine eisbäder, nur atmen und frühstück.", limit: "die plätze sind begrenzt: maximal 7 personen.", nextName: "nächster termin", nextPlace: "datum und ort kommen in der whatsapp-gruppe", placeLater: "der ort kommt in der whatsapp-gruppe", nextReserved: "dein platz für den nächsten termin ist reserviert. datum und ort bekommst du in der whatsapp-gruppe.",
      next: "wähle deinen termin", none: "die termine konnten nicht geladen werden. bitte lade die seite neu.",
      full: "warteliste",
      name: "dein name", reserve: "platz reservieren", wait: "einen moment…",
      errName: "bitte schreib deinen namen.", errSession: "bitte wähle einen termin.", errFull: "dieser termin ist voll. bitte wähle einen anderen.", errAny: "das hat nicht geklappt. bitte versuch es noch einmal.",
      thanks: "danke, {name}. wir freuen uns, dass du kommst.", reserved: "dein platz ist reserviert.",
      r1: "die plätze sind begrenzt: maximal 7 personen.", r2: "wenn du nicht kommen kannst, sag rechtzeitig ab, damit andere teilnehmen können.",
      group: "tritt unserer whatsapp-gruppe bei", follow: "folge uns auf instagram", dateLater: "datum und uhrzeit geben wir in der whatsapp-gruppe bekannt", joinHintDate: "trag dich ein und tritt unserer whatsapp-gruppe bei. dort geben wir datum und uhrzeit bekannt.", reservedNoDate: "dein platz ist reserviert. tritt unserer whatsapp-gruppe bei: dort geben wir datum und uhrzeit bekannt.", timeLater: "die uhrzeit geben wir in der whatsapp-gruppe bekannt", joinHint: "trag dich ein und tritt unserer whatsapp-gruppe bei. dort geben wir die uhrzeit bekannt.", reservedNoTime: "dein platz ist reserviert. tritt unserer whatsapp-gruppe bei: dort geben wir die uhrzeit bekannt.", placeIs: "der ort:", cancel: "ich kann nicht kommen, platz absagen", sure: "deinen platz absagen?",
      cancelled: "dein platz ist wieder frei. danke, dass du abgesagt hast.", again: "anderen termin wählen",
      loading: "termine werden geladen…", test: "testtermin", mine: "dein platz ist reserviert", showMine: "meine reservierung zeigen", toPage: "zurück zur seite",
    },
    fr: {
      cue: "touche ou fais défiler", tag: "foyo club", h1: "se sentir jeune n'est pas une question d'âge.",
      lead: "à tout âge, tu devrais te sentir en forme. à tout âge, tu devrais te sentir jeune.\nj'ai trouvé comment. sans pilules, sans programmes coûteux. juste la respiration, le froid et le microbiome.", retreat: "la retraite", invite: "je suis instructeur certifié de la méthode wim hof. je suis à tunis pour peu de temps et je t'invite chaleureusement à une séance de respiration.", incl: "inclus", fuel: "ce petit-déjeuner, je le mange moi-même chaque jour. je te montre quoi manger chaque jour pour que ton corps fonctionne mieux et que tu te sentes mieux, physiquement et mentalement.", items: ["une séance de respiration guidée selon la méthode wim hof", "un petit-déjeuner simple : flocons d'avoine, noix, graines de lin, grenade et kéfir fait maison. il soutient ton microbiome.", "tes grains de kéfir à emporter\nfais ton vrai kéfir chez toi"], priceFmt: "{p}\u00a0dinars", fullNotice: "le nombre maximum de participants est atteint. laisse ton prénom et ton numéro whatsapp : nous te prévenons si quelqu'un ne peut pas venir.", phone: "ton numéro whatsapp", joinWait: "rejoindre la liste d'attente", errPhone: "écris ton numéro whatsapp, s'il te plaît.", waitThanks: "merci, {name}. tu es sur la liste d'attente.", waitBody: "si quelqu'un ne peut pas venir, nous te prévenons sur whatsapp.", leaveWait: "quitter la liste d'attente", only: "dans cette séance : pas de bain de glace, juste la respiration et le petit-déjeuner.", limit: "les places sont limitées : 7 personnes maximum.", nextName: "prochaine séance", nextPlace: "la date et le lieu arrivent dans le groupe whatsapp", placeLater: "le lieu arrive dans le groupe whatsapp", nextReserved: "ta place pour la prochaine séance est réservée. la date et le lieu arrivent dans le groupe whatsapp.",
      next: "choisis ta séance", none: "les séances n'ont pas pu être chargées. recharge la page.",
      full: "liste d'attente",
      name: "ton prénom", reserve: "réserver ma place", wait: "un instant…",
      errName: "écris ton prénom, s'il te plaît.", errSession: "choisis une séance, s'il te plaît.", errFull: "cette séance est complète. choisis-en une autre.", errAny: "ça n'a pas marché. réessaie.",
      thanks: "merci, {name}. nous sommes heureux que tu viennes.", reserved: "ta place est réservée.",
      r1: "les places sont limitées : 7 personnes maximum.", r2: "si tu ne peux pas venir, annule à temps pour que quelqu'un d'autre puisse participer.",
      group: "rejoins notre groupe whatsapp", follow: "suis-nous sur instagram", dateLater: "la date et l'heure sont annoncées dans le groupe whatsapp", joinHintDate: "inscris-toi et rejoins notre groupe whatsapp. nous y annonçons la date et l'heure.", reservedNoDate: "ta place est réservée. rejoins notre groupe whatsapp : nous y annonçons la date et l'heure.", timeLater: "l'heure est annoncée dans le groupe whatsapp", joinHint: "inscris-toi et rejoins notre groupe whatsapp. nous y annonçons l'heure.", reservedNoTime: "ta place est réservée. rejoins notre groupe whatsapp : nous y annonçons l'heure.", placeIs: "le lieu :", cancel: "je ne peux pas venir, annuler ma place", sure: "annuler ta place ?",
      cancelled: "ta place est de nouveau libre. merci de nous avoir prévenus.", again: "choisir une autre séance",
      loading: "chargement des séances…", test: "séance test", mine: "ta place est réservée", showMine: "voir ma réservation", toPage: "retour à la page",
    },
    es: {
      cue: "toca o desliza", tag: "foyo club", h1: "sentirse joven no es cuestión de edad.",
      lead: "a cualquier edad deberías sentirte en forma. a cualquier edad deberías sentirte joven.\ndescubrí cómo. sin pastillas, sin programas caros. solo respiración, frío y microbioma.", retreat: "el retiro", invite: "soy instructor certificado del método wim hof. estoy en túnez por poco tiempo y te invito de corazón a una sesión de respiración.", incl: "incluido", fuel: "este desayuno lo como yo mismo cada día. te muestro qué comer a diario para que tu cuerpo funcione mejor y te sientas mejor, física y mentalmente.", items: ["una sesión de respiración guiada con el método wim hof", "un desayuno sencillo: avena, frutos secos, semillas de lino, granada y kéfir casero. apoya tu microbioma.", "tus granos de kéfir para llevar\nhaz tu propio kéfir de verdad en casa"], priceFmt: "{p}\u00a0dinares", fullNotice: "se ha alcanzado el número máximo de participantes. deja tu nombre y tu número de whatsapp: te avisamos si alguien no puede venir.", phone: "tu número de whatsapp", joinWait: "apuntarme a la lista de espera", errPhone: "escribe tu número de whatsapp, por favor.", waitThanks: "gracias, {name}. estás en la lista de espera.", waitBody: "si alguien no puede venir, te avisamos por whatsapp.", leaveWait: "salir de la lista de espera", only: "en esta sesión: sin baños de hielo, solo respiración y desayuno.", limit: "las plazas son limitadas: máximo 7 personas.", nextName: "próxima sesión", nextPlace: "la fecha y el lugar llegan en el grupo de whatsapp", placeLater: "el lugar llega en el grupo de whatsapp", nextReserved: "tu plaza para la próxima sesión está reservada. la fecha y el lugar llegan en el grupo de whatsapp.",
      next: "elige tu sesión", none: "no se pudieron cargar las sesiones. vuelve a cargar la página.",
      full: "lista de espera",
      name: "tu nombre", reserve: "reservar mi plaza", wait: "un momento…",
      errName: "escribe tu nombre, por favor.", errSession: "elige una sesión, por favor.", errFull: "esta sesión está completa. elige otra.", errAny: "no ha funcionado. inténtalo de nuevo.",
      thanks: "gracias, {name}. nos alegra que vengas.", reserved: "tu plaza está reservada.",
      r1: "las plazas son limitadas: máximo 7 personas.", r2: "si no puedes venir, cancela a tiempo para que otra persona pueda participar.",
      group: "únete a nuestro grupo de whatsapp", follow: "síguenos en instagram", dateLater: "la fecha y la hora las anunciamos en el grupo de whatsapp", joinHintDate: "apúntate y únete a nuestro grupo de whatsapp. allí anunciamos la fecha y la hora.", reservedNoDate: "tu plaza está reservada. únete a nuestro grupo de whatsapp: allí anunciamos la fecha y la hora.", timeLater: "la hora la anunciamos en el grupo de whatsapp", joinHint: "apúntate y únete a nuestro grupo de whatsapp. allí anunciamos la hora.", reservedNoTime: "tu plaza está reservada. únete a nuestro grupo de whatsapp: allí anunciamos la hora.", placeIs: "el lugar:", cancel: "no puedo ir, cancelar mi plaza", sure: "¿cancelar tu plaza?",
      cancelled: "tu plaza vuelve a estar libre. gracias por avisar.", again: "elegir otra sesión",
      loading: "cargando las sesiones…", test: "sesión de prueba", mine: "tu plaza está reservada", showMine: "ver mi reserva", toPage: "volver a la página",
    },
    ar: {
      cue: "المس أو مرّر", tag: "foyo club", h1: "الشعور بالشباب ليس مسألة عمر.",
      lead: "في كل عمر يجب أن تشعر باللياقة. في كل عمر يجب أن تشعر بالشباب.\nاكتشفت كيف. بلا حبوب، بلا برامج باهظة. فقط التنفّس والبرد والميكروبيوم.", retreat: "الخلوة", invite: "أنا مدرّب معتمد لطريقة ويم هوف. أنا في تونس لفترة قصيرة، وأدعوك بكل سرور إلى جلسة تنفّس.", incl: "يشمل", fuel: "هذا الفطور أتناوله بنفسي كل يوم. أريك ما تأكله يوميًا ليعمل جسمك بشكل أفضل وتشعر بتحسّن جسديًا وذهنيًا.", items: ["جلسة تنفّس موجَّهة بطريقة ويم هوف", "فطور بسيط: شوفان ومكسرات وبذور كتان ورمّان وكفير محضّر في البيت. يدعم الميكروبيوم لديك.", "حبوب الكفير لتأخذها معك\nحضّر كفيرك الحقيقي في البيت"], priceFmt: "{p}\u00a0دينار", fullNotice: "تم بلوغ الحد الأقصى لعدد المشاركين. اترك اسمك ورقم واتساب الخاص بك: سنخبرك إذا لم يستطع أحد الحضور.", phone: "رقم واتساب الخاص بك", joinWait: "الانضمام إلى قائمة الانتظار", errPhone: "اكتب رقم واتساب الخاص بك من فضلك.", waitThanks: "شكرًا، {name}. أنت على قائمة الانتظار.", waitBody: "إذا لم يستطع أحد الحضور، سنخبرك عبر واتساب.", leaveWait: "الخروج من قائمة الانتظار", only: "في هذه الجلسة: لا حمّامات ثلج، فقط التنفّس والفطور.", limit: "الأماكن محدودة: 7 أشخاص كحد أقصى.", nextName: "الموعد القادم", nextPlace: "التاريخ والمكان في مجموعة واتساب", placeLater: "المكان في مجموعة واتساب", nextReserved: "مكانك في الموعد القادم محجوز. يصلك التاريخ والمكان في مجموعة واتساب.",
      next: "اختر موعدك", none: "تعذّر تحميل المواعيد. أعد تحميل الصفحة.",
      full: "قائمة الانتظار",
      name: "اسمك", reserve: "احجز مكاني", wait: "لحظة…",
      errName: "اكتب اسمك من فضلك.", errSession: "اختر موعدًا من فضلك.", errFull: "هذا الموعد مكتمل. اختر موعدًا آخر.", errAny: "لم ينجح ذلك. حاول مرة أخرى.",
      thanks: "شكرًا، {name}. يسعدنا أنك قادم.", reserved: "مكانك محجوز.",
      r1: "الأماكن محدودة: 7 أشخاص كحد أقصى.", r2: "إذا لم تستطع الحضور، ألغِ في الوقت المناسب ليتمكن شخص آخر من المشاركة.",
      group: "انضم إلى مجموعة واتساب الخاصة بنا", follow: "تابعنا على إنستغرام", dateLater: "نعلن عن التاريخ والوقت في مجموعة واتساب", joinHintDate: "سجّل وانضم إلى مجموعة واتساب الخاصة بنا. هناك نعلن عن التاريخ والوقت.", reservedNoDate: "مكانك محجوز. انضم إلى مجموعة واتساب الخاصة بنا: هناك نعلن عن التاريخ والوقت.", timeLater: "نعلن عن الوقت في مجموعة واتساب", joinHint: "سجّل وانضم إلى مجموعة واتساب الخاصة بنا. هناك نعلن عن الوقت.", reservedNoTime: "مكانك محجوز. انضم إلى مجموعة واتساب الخاصة بنا: هناك نعلن عن الوقت.", placeIs: "المكان:", cancel: "لا أستطيع الحضور، ألغِ مكاني", sure: "إلغاء مكانك؟",
      cancelled: "مكانك متاح من جديد. شكرًا لأنك أخبرتنا.", again: "اختر موعدًا آخر",
      loading: "جارٍ تحميل المواعيد…", test: "موعد تجريبي", mine: "مكانك محجوز", showMine: "عرض حجزي", toPage: "العودة إلى الصفحة",
    },
    ru: {
      cue: "коснись или прокрути", tag: "foyo club", h1: "ощущение молодости не зависит от возраста.",
      lead: "в любом возрасте стоит чувствовать себя бодрым. в любом возрасте стоит чувствовать себя молодым.\nя нашёл, как это сделать. без таблеток, без дорогих программ. только дыхание, холод и микробиом.", retreat: "ретрит", invite: "я сертифицированный инструктор метода вима хофа. я ненадолго в тунисе и сердечно приглашаю тебя на дыхательную сессию.", incl: "что включено", fuel: "этот завтрак я сам ем каждый день. я покажу, что есть ежедневно, чтобы тело работало лучше, а ты чувствовал себя лучше физически и ментально.", items: ["дыхательная сессия с инструктором по методу вима хофа", "простой завтрак: овсянка, орехи, семена льна, гранат и домашний кефир. он поддерживает твой микробиом.", "кефирные зёрна с собой\nготовь настоящий кефир дома"], priceFmt: "{p}\u00a0динаров", fullNotice: "достигнуто максимальное число участников. оставь имя и номер whatsapp: мы сообщим, если кто-то не сможет прийти.", phone: "твой номер whatsapp", joinWait: "в лист ожидания", errPhone: "пожалуйста, напиши свой номер whatsapp.", waitThanks: "спасибо, {name}. ты в листе ожидания.", waitBody: "если кто-то не сможет прийти, мы сообщим тебе в whatsapp.", leaveWait: "уйти из листа ожидания", only: "на этой сессии: без ледяных ванн, только дыхание и завтрак.", limit: "мест мало: максимум 7 человек.", nextName: "следующее занятие", nextPlace: "дата и место будут в группе whatsapp", placeLater: "место будет в группе whatsapp", nextReserved: "твоё место на следующем занятии забронировано. дату и место узнаешь в группе whatsapp.",
      next: "выбери занятие", none: "не удалось загрузить занятия. обнови страницу.",
      full: "лист ожидания",
      name: "твоё имя", reserve: "забронировать место", wait: "минуту…",
      errName: "пожалуйста, напиши своё имя.", errSession: "пожалуйста, выбери занятие.", errFull: "на это занятие мест нет. выбери другое.", errAny: "не получилось. попробуй ещё раз.",
      thanks: "спасибо, {name}. мы рады, что ты придёшь.", reserved: "твоё место забронировано.",
      r1: "мест мало: максимум 7 человек.", r2: "если не сможешь прийти, отмени заранее, чтобы пришёл кто-то другой.",
      group: "вступи в нашу группу whatsapp", follow: "подписывайся в instagram", dateLater: "дату и время сообщим в группе whatsapp", joinHintDate: "запишись и вступи в нашу группу whatsapp. там мы сообщим дату и время.", reservedNoDate: "твоё место забронировано. вступи в нашу группу whatsapp: там мы сообщим дату и время.", timeLater: "время сообщим в группе whatsapp", joinHint: "запишись и вступи в нашу группу whatsapp. там мы сообщим время.", reservedNoTime: "твоё место забронировано. вступи в нашу группу whatsapp: там мы сообщим время.", placeIs: "место:", cancel: "не смогу прийти, отменить место", sure: "отменить твоё место?",
      cancelled: "твоё место снова свободно. спасибо, что предупредил.", again: "выбрать другое занятие",
      loading: "загружаем занятия…", test: "тестовое занятие", mine: "твоё место забронировано", showMine: "показать мою бронь", toPage: "вернуться на страницу",
    },
  };
  // the wim hof method, before about paul: the three pillars and what they do, with the studies behind every number
  const WIM = {
    en: {
      tag: "the wim hof method",
      lead: "a breathing technique that changes your blood within minutes.",
      what: "the wim hof method rests on three pillars: breath, cold and commitment. together they work on your nervous system, your immune system and your mind.",
      facts: [["7.75", "blood ph (normal 7.35–7.45)"], ["~50 %", "oxygen while you hold your breath, ~10 s"], ["+194 %", "il-10, anti-inflammatory"], ["+250 %", "dopamine in cold water"]],
      pillars: [
        ["1 · the breath", "30 to 40 deep breaths, fully in, loosely out. then breathe out and hold, as long as it feels good. then one deep breath in and hold it for 15 seconds. three to four rounds, sitting or lying down.", [
          ["what it does to your blood", "with every deep breath you breathe out carbon dioxide. your blood becomes alkaline: in a study at radboud university the ph rose to as high as 7.75, normal is 7.35 to 7.45. while you hold your breath, oxygen saturation drops to around 50 % for about ten seconds, then it comes back. a short, controlled lack of oxygen. a few minutes after the breathing everything is back to normal.[1]"],
          ["adrenaline, like a bungee jump", "this signal wakes up your sympathetic nervous system. the trained participants had more adrenaline in their blood than people measured during a bungee jump.[1][2] only you decide when, and you stay calm."],
          ["adrenaline dampens inflammation", "adrenaline is one of the body's own anti-inflammatories: it slows the inflammatory messenger tnf-α and drives the anti-inflammatory il-10.[3] in the radboud study, 24 men received a bacterial toxin that normally causes fever and flu symptoms. those who had trained had 194 % more il-10, 53 % less tnf-α, 57 % less il-6, 51 % less il-8 and clearly fewer symptoms.[1] a follow-up study shows: the breathing alone already works, combined with cold training it works strongest.[4]"],
        ]],
        ["2 · the cold", "you start with cold showers: warm first, then 30 seconds cold, a little longer every week. then comes the ice bath. breathe calmly, do not fight the cold.", [
          ["what the cold triggers", "in cold water dopamine rises by 250 %, noradrenaline by 530 % and metabolism by 350 %.[5] noradrenaline sharpens focus, dopamine lifts mood and drive. in a trial with 3,018 people, those who ended their shower with 30 to 90 seconds of cold water called in sick 29 % less often.[6]"],
        ]],
        ["3 · commitment", "the third pillar is the mind: focus, patience, practice every day. you learn to stay calm in the cold and to steer your body instead of being steered by it.", [
          ["the mind steers the body", "wayne state university scanned wim hof's brain in the cold. he deliberately activated the periaqueductal gray, a region in the brainstem that dampens pain. the researchers assume that the body releases its own opioids and cannabinoids in the process.[8]"],
        ]],
      ],
      why: ["why it works: hormesis", "breath and cold are short, dosed stress. the body answers with adaptation and comes back stronger, like a muscle after training. science calls this hormesis.[7] not chronic stress that wears you down, but a short stimulus followed by recovery."],
      safe: "important: never practise the breathing in or near water, while driving or standing. sit or lie down. if you are pregnant, have epilepsy, heart problems or high blood pressure, talk to your doctor first.",
      src: "sources",
    },
    de: {
      tag: "die wim hof methode",
      lead: "eine atemtechnik, die dein blut in minuten verändert.",
      what: "die wim hof methode steht auf drei säulen: atmung, kälte und hingabe. zusammen wirken sie auf dein nervensystem, dein immunsystem und deinen kopf.",
      facts: [["7,75", "blut-ph (normal 7,35–7,45)"], ["~50 %", "sauerstoff beim luftanhalten, ~10 s"], ["+194 %", "il-10, entzündungshemmend"], ["+250 %", "dopamin im kalten wasser"]],
      pillars: [
        ["1 · die atmung", "30 bis 40 tiefe atemzüge, voll ein, locker aus. dann ausatmen und die luft anhalten, so lange es sich gut anfühlt. dann einmal tief einatmen und 15 sekunden halten. drei bis vier runden, im sitzen oder liegen.", [
          ["was sie mit deinem blut macht", "mit jedem tiefen atemzug atmest du kohlendioxid ab. dein blut wird basisch: in einer studie der radboud universität stieg der ph-wert auf bis zu 7,75, normal sind 7,35 bis 7,45. während du die luft anhältst, sinkt die sauerstoffsättigung für etwa zehn sekunden auf rund 50 %, dann steigt sie wieder. ein kurzer, kontrollierter sauerstoffmangel. wenige minuten nach der atmung ist alles wieder normal.[1]"],
          ["adrenalin wie beim bungee-sprung", "dieses signal weckt dein sympathisches nervensystem. die trainierten teilnehmer hatten mehr adrenalin im blut als menschen, die bei einem bungee-sprung gemessen wurden.[1][2] nur dass du entscheidest, wann, und dabei ruhig bleibst."],
          ["adrenalin hemmt entzündungen", "adrenalin ist ein körpereigener entzündungshemmer: es bremst den entzündungsbotenstoff tnf-α und treibt das entzündungshemmende il-10 an.[3] in der radboud-studie bekamen 24 männer ein bakteriengift, das normalerweise fieber und grippesymptome auslöst. wer trainiert hatte, hatte 194 % mehr il-10, 53 % weniger tnf-α, 57 % weniger il-6, 51 % weniger il-8 und deutlich weniger symptome.[1] eine folgestudie zeigt: schon die atmung allein wirkt, zusammen mit kältetraining am stärksten.[4]"],
        ]],
        ["2 · die kälte", "du beginnst mit kalten duschen: erst warm, dann 30 sekunden kalt, jede woche etwas länger. dann folgt das eisbad. ruhig atmen, nicht gegen die kälte kämpfen.", [
          ["was die kälte auslöst", "im kalten wasser steigt dopamin um 250 %, noradrenalin um 530 % und der stoffwechsel um 350 %.[5] noradrenalin schärft den fokus, dopamin hebt stimmung und antrieb. in einer studie mit 3.018 menschen meldeten sich die, die ihre dusche mit 30 bis 90 sekunden kaltem wasser beendeten, 29 % seltener krank.[6]"],
        ]],
        ["3 · hingabe", "die dritte säule ist der kopf: fokus, geduld, jeden tag üben. du lernst, in der kälte ruhig zu bleiben und deinen körper zu lenken, statt von ihm gelenkt zu werden.", [
          ["der kopf steuert den körper", "die wayne state university hat wim hofs gehirn in der kälte gescannt. er aktivierte gezielt das periaquäduktale grau, eine region im hirnstamm, die schmerz dämpft. die forscher vermuten, dass der körper dabei eigene opioide und cannabinoide freisetzt.[8]"],
        ]],
      ],
      why: ["warum es wirkt: hormesis", "atem und kälte sind kurzer, dosierter stress. der körper antwortet mit anpassung und wird stärker, wie ein muskel nach dem training. die wissenschaft nennt das hormesis.[7] kein dauerstress, der dich zermürbt, sondern ein kurzer reiz und danach erholung."],
      safe: "wichtig: die atmung nie im oder am wasser, beim autofahren oder im stehen üben. setz oder leg dich hin. wenn du schwanger bist, epilepsie, herzprobleme oder hohen blutdruck hast, sprich vorher mit deinem arzt.",
      src: "quellen",
    },
    fr: {
      tag: "la méthode wim hof",
      lead: "une technique de respiration qui change ton sang en quelques minutes.",
      what: "la méthode wim hof repose sur trois piliers : la respiration, le froid et l'engagement. ensemble, ils agissent sur ton système nerveux, ton système immunitaire et ton mental.",
      facts: [["7,75", "ph du sang (normal 7,35–7,45)"], ["~50 %", "oxygène pendant la rétention, ~10 s"], ["+194 %", "il-10, anti-inflammatoire"], ["+250 %", "dopamine dans l'eau froide"]],
      pillars: [
        ["1 · la respiration", "30 à 40 respirations profondes, inspirer pleinement, expirer sans forcer. puis expirer et retenir son souffle, aussi longtemps que c'est agréable. puis une grande inspiration, tenue 15 secondes. trois à quatre tours, assis ou allongé.", [
          ["ce qu'elle fait à ton sang", "à chaque respiration profonde, tu expires du dioxyde de carbone. ton sang devient alcalin : dans une étude de l'université radboud, le ph est monté jusqu'à 7,75, la normale est de 7,35 à 7,45. pendant la rétention, la saturation en oxygène descend à environ 50 % pendant une dizaine de secondes, puis remonte. un manque d'oxygène bref et contrôlé. quelques minutes après la respiration, tout est revenu à la normale.[1]"],
          ["de l'adrénaline, comme un saut à l'élastique", "ce signal réveille ton système nerveux sympathique. les participants entraînés avaient plus d'adrénaline dans le sang que des personnes mesurées lors d'un saut à l'élastique.[1][2] sauf que c'est toi qui décides quand, et tu restes calme."],
          ["l'adrénaline freine l'inflammation", "l'adrénaline est un anti-inflammatoire naturel du corps : elle freine le messager inflammatoire tnf-α et stimule l'il-10 anti-inflammatoire.[3] dans l'étude radboud, 24 hommes ont reçu une toxine bactérienne qui provoque normalement fièvre et symptômes grippaux. ceux qui s'étaient entraînés avaient 194 % d'il-10 en plus, 53 % de tnf-α, 57 % d'il-6 et 51 % d'il-8 en moins, et nettement moins de symptômes.[1] une étude suivante le montre : la respiration seule agit déjà, combinée à l'entraînement au froid elle agit le plus fort.[4]"],
        ]],
        ["2 · le froid", "tu commences par des douches froides : d'abord chaud, puis 30 secondes froid, un peu plus longtemps chaque semaine. ensuite vient le bain de glace. respirer calmement, ne pas lutter contre le froid.", [
          ["ce que déclenche le froid", "dans l'eau froide, la dopamine augmente de 250 %, la noradrénaline de 530 % et le métabolisme de 350 %.[5] la noradrénaline aiguise la concentration, la dopamine élève l'humeur et l'élan. dans un essai avec 3 018 personnes, celles qui finissaient leur douche par 30 à 90 secondes d'eau froide se sont absentées pour maladie 29 % moins souvent.[6]"],
        ]],
        ["3 · l'engagement", "le troisième pilier, c'est le mental : concentration, patience, pratique chaque jour. tu apprends à rester calme dans le froid et à diriger ton corps au lieu d'être dirigé par lui.", [
          ["le mental dirige le corps", "l'université wayne state a scanné le cerveau de wim hof dans le froid. il activait volontairement la substance grise périaqueducale, une région du tronc cérébral qui atténue la douleur. les chercheurs supposent que le corps libère alors ses propres opioïdes et cannabinoïdes.[8]"],
        ]],
      ],
      why: ["pourquoi ça marche : l'hormèse", "la respiration et le froid sont un stress court et dosé. le corps répond en s'adaptant et devient plus fort, comme un muscle après l'entraînement. la science appelle cela l'hormèse.[7] pas un stress chronique qui t'use, mais un stimulus court suivi de récupération."],
      safe: "important : ne pratique jamais la respiration dans l'eau ou près de l'eau, en conduisant ou debout. assieds-toi ou allonge-toi. si tu es enceinte, épileptique, si tu as des problèmes cardiaques ou une tension élevée, parles-en d'abord à ton médecin.",
      src: "sources",
    },
    es: {
      tag: "el método wim hof",
      lead: "una técnica de respiración que cambia tu sangre en minutos.",
      what: "el método wim hof se basa en tres pilares: respiración, frío y compromiso. juntos actúan sobre tu sistema nervioso, tu sistema inmunitario y tu mente.",
      facts: [["7,75", "ph de la sangre (normal 7,35–7,45)"], ["~50 %", "oxígeno al retener el aire, ~10 s"], ["+194 %", "il-10, antiinflamatoria"], ["+250 %", "dopamina en agua fría"]],
      pillars: [
        ["1 · la respiración", "de 30 a 40 respiraciones profundas, inspirar a fondo, soltar el aire sin esfuerzo. luego exhalar y retener el aire mientras te sientas bien. después una inspiración profunda, sostenida 15 segundos. tres o cuatro rondas, sentado o tumbado.", [
          ["lo que hace con tu sangre", "con cada respiración profunda exhalas dióxido de carbono. tu sangre se vuelve alcalina: en un estudio de la universidad radboud el ph subió hasta 7,75; lo normal es de 7,35 a 7,45. mientras retienes el aire, la saturación de oxígeno baja a alrededor del 50 % durante unos diez segundos y luego vuelve a subir. una falta de oxígeno breve y controlada. pocos minutos después de respirar, todo vuelve a la normalidad.[1]"],
          ["adrenalina, como en un salto de puenting", "esta señal despierta tu sistema nervioso simpático. los participantes entrenados tenían más adrenalina en la sangre que personas medidas durante un salto de puenting.[1][2] solo que tú decides cuándo, y te mantienes en calma."],
          ["la adrenalina frena la inflamación", "la adrenalina es un antiinflamatorio propio del cuerpo: frena el mensajero inflamatorio tnf-α e impulsa la il-10 antiinflamatoria.[3] en el estudio de radboud, 24 hombres recibieron una toxina bacteriana que normalmente provoca fiebre y síntomas de gripe. quienes habían entrenado tenían un 194 % más de il-10, un 53 % menos de tnf-α, un 57 % menos de il-6, un 51 % menos de il-8 y muchos menos síntomas.[1] un estudio posterior lo muestra: la respiración sola ya funciona; combinada con entrenamiento en frío, funciona con más fuerza.[4]"],
        ]],
        ["2 · el frío", "empiezas con duchas frías: primero caliente, luego 30 segundos fría, cada semana un poco más. después llega el baño de hielo. respira con calma, no luches contra el frío.", [
          ["lo que provoca el frío", "en agua fría la dopamina sube un 250 %, la noradrenalina un 530 % y el metabolismo un 350 %.[5] la noradrenalina agudiza la concentración, la dopamina eleva el ánimo y el impulso. en un ensayo con 3.018 personas, quienes terminaban la ducha con 30 a 90 segundos de agua fría faltaron al trabajo por enfermedad un 29 % menos.[6]"],
        ]],
        ["3 · compromiso", "el tercer pilar es la mente: enfoque, paciencia, práctica diaria. aprendes a mantener la calma en el frío y a dirigir tu cuerpo en lugar de que él te dirija.", [
          ["la mente dirige el cuerpo", "la universidad wayne state escaneó el cerebro de wim hof en el frío. activaba de forma deliberada la sustancia gris periacueductal, una región del tronco cerebral que atenúa el dolor. los investigadores suponen que el cuerpo libera así sus propios opioides y cannabinoides.[8]"],
        ]],
      ],
      why: ["por qué funciona: hormesis", "la respiración y el frío son un estrés breve y dosificado. el cuerpo responde adaptándose y se vuelve más fuerte, como un músculo después del entrenamiento. la ciencia lo llama hormesis.[7] no es el estrés crónico que te desgasta, sino un estímulo corto seguido de recuperación."],
      safe: "importante: nunca practiques la respiración en el agua o cerca de ella, conduciendo o de pie. siéntate o túmbate. si estás embarazada, tienes epilepsia, problemas cardíacos o presión alta, habla antes con tu médico.",
      src: "fuentes",
    },
    ar: {
      tag: "طريقة ويم هوف",
      lead: "تقنية تنفّس تغيّر دمك في دقائق.",
      what: "تقوم طريقة ويم هوف على ثلاث ركائز: التنفّس والبرد والالتزام. معًا تؤثر في جهازك العصبي وجهازك المناعي وذهنك.",
      facts: [["7.75", "ph الدم (الطبيعي 7.35–7.45)"], ["~50 %", "الأكسجين أثناء حبس النفَس، ~10 ث"], ["+194 %", "il-10، مضاد للالتهاب"], ["+250 %", "الدوبامين في الماء البارد"]],
      pillars: [
        ["1 · التنفّس", "من 30 إلى 40 نفَسًا عميقًا، شهيق كامل وزفير مسترخٍ. ثم ازفر واحبس نفَسك ما دام ذلك مريحًا. ثم خذ نفَسًا عميقًا واحبسه 15 ثانية. ثلاث إلى أربع جولات، جالسًا أو مستلقيًا.", [
          ["ماذا يفعل بدمك", "مع كل نفَس عميق تُخرج ثاني أكسيد الكربون. يصبح دمك قلويًا: في دراسة بجامعة رادباود ارتفع الرقم الهيدروجيني (ph) حتى 7.75، والطبيعي من 7.35 إلى 7.45. وأثناء حبس النفَس تنخفض نسبة تشبّع الأكسجين إلى نحو 50 % لمدة عشر ثوانٍ تقريبًا ثم تعود. نقص قصير ومضبوط في الأكسجين. وبعد التنفّس بدقائق قليلة يعود كل شيء إلى طبيعته.[1]"],
          ["أدرينالين كما في القفز بالحبل المطاطي", "هذه الإشارة توقظ جهازك العصبي الودي. كان لدى المشاركين المدرَّبين أدرينالين في الدم أكثر مما قيس لدى أشخاص أثناء القفز بالحبل المطاطي.[1][2] لكنك أنت من يقرر متى، وتبقى هادئًا."],
          ["الأدرينالين يكبح الالتهاب", "الأدرينالين مضاد التهاب ينتجه الجسم نفسه: يكبح الناقل الالتهابي tnf-α ويحفّز il-10 المضاد للالتهاب.[3] في دراسة رادباود تلقّى 24 رجلًا سمًّا بكتيريًا يسبب عادةً الحمّى وأعراض الإنفلونزا. من تدرّب كان لديه il-10 أكثر بنسبة 194 %، وtnf-α أقل بنسبة 53 %، وil-6 أقل بنسبة 57 %، وil-8 أقل بنسبة 51 %، وأعراض أقل بوضوح.[1] وتُظهر دراسة لاحقة أن التنفّس وحده يؤثر، ومع التدريب على البرد يكون الأثر أقوى.[4]"],
        ]],
        ["2 · البرد", "تبدأ بالاستحمام بالماء البارد: دافئ أولًا، ثم 30 ثانية بارد، وأطول قليلًا كل أسبوع. ثم يأتي حمّام الثلج. تنفّس بهدوء ولا تقاوم البرد.", [
          ["ماذا يُطلق البرد", "في الماء البارد يرتفع الدوبامين بنسبة 250 %، والنورأدرينالين بنسبة 530 %، والأيض بنسبة 350 %.[5] النورأدرينالين يشحذ التركيز، والدوبامين يرفع المزاج والدافع. وفي تجربة شملت 3018 شخصًا، تغيّب من أنهوا استحمامهم بماء بارد لمدة 30 إلى 90 ثانية عن العمل بسبب المرض أقل بنسبة 29 %.[6]"],
        ]],
        ["3 · الالتزام", "الركيزة الثالثة هي الذهن: التركيز والصبر والممارسة كل يوم. تتعلّم أن تبقى هادئًا في البرد وأن توجّه جسدك بدل أن يوجّهك.", [
          ["الذهن يقود الجسد", "صوّرت جامعة واين ستيت دماغ ويم هوف في البرد. كان ينشّط عمدًا المادة الرمادية حول المسال، وهي منطقة في جذع الدماغ تخفّف الألم. ويرجّح الباحثون أن الجسم يطلق عندها مواده الأفيونية والقنّبينية الذاتية.[8]"],
        ]],
      ],
      why: ["لماذا ينجح: الهورميسيس", "التنفّس والبرد إجهاد قصير ومحسوب. يردّ الجسم بالتكيّف ويصبح أقوى، كالعضلة بعد التمرين. يسمّي العلم ذلك الهورميسيس.[7] ليس إجهادًا مزمنًا يستنزفك، بل محفّز قصير تليه راحة."],
      safe: "مهم: لا تمارس التنفّس أبدًا في الماء أو بالقرب منه، أو أثناء القيادة، أو وأنت واقف. اجلس أو استلقِ. إذا كنتِ حاملًا أو لديك صرع أو مشكلات في القلب أو ارتفاع في ضغط الدم، فاستشر طبيبك أولًا.",
      src: "المصادر",
    },
    ru: {
      tag: "метод вима хофа",
      lead: "дыхательная техника, которая меняет твою кровь за минуты.",
      what: "метод вима хофа стоит на трёх опорах: дыхание, холод и настрой. вместе они действуют на нервную систему, иммунитет и голову.",
      facts: [["7,75", "ph крови (норма 7,35–7,45)"], ["~50 %", "кислород при задержке дыхания, ~10 с"], ["+194 %", "il-10, противовоспалительный"], ["+250 %", "дофамин в холодной воде"]],
      pillars: [
        ["1 · дыхание", "30–40 глубоких вдохов, полный вдох, свободный выдох. затем выдохни и задержи дыхание, пока это комфортно. потом один глубокий вдох и задержка на 15 секунд. три-четыре раунда, сидя или лёжа.", [
          ["что оно делает с твоей кровью", "с каждым глубоким вдохом ты выдыхаешь углекислый газ. кровь становится щелочной: в исследовании университета радбауд ph поднимался до 7,75, норма 7,35–7,45. пока ты задерживаешь дыхание, насыщение крови кислородом примерно на десять секунд падает до 50 %, затем восстанавливается. короткая, контролируемая нехватка кислорода. через несколько минут после дыхания всё возвращается к норме.[1]"],
          ["адреналин, как при прыжке с тарзанки", "этот сигнал будит твою симпатическую нервную систему. у тренированных участников адреналина в крови было больше, чем у людей, которых измеряли при прыжке с тарзанки.[1][2] только ты сам решаешь когда и остаёшься спокойным."],
          ["адреналин гасит воспаление", "адреналин: собственное противовоспалительное средство организма. он тормозит воспалительный сигнал tnf-α и усиливает противовоспалительный il-10.[3] в исследовании радбауда 24 мужчинам ввели бактериальный токсин, который обычно вызывает жар и симптомы гриппа. у тех, кто тренировался, il-10 был на 194 % выше, tnf-α на 53 % ниже, il-6 на 57 % ниже, il-8 на 51 % ниже, а симптомов заметно меньше.[1] последующее исследование показывает: уже одно дыхание действует, а вместе с тренировкой холодом сильнее всего.[4]"],
        ]],
        ["2 · холод", "начинаешь с холодного душа: сначала тёплый, потом 30 секунд холодный, каждую неделю немного дольше. потом ледяная ванна. дыши спокойно, не борись с холодом.", [
          ["что запускает холод", "в холодной воде дофамин растёт на 250 %, норадреналин на 530 %, обмен веществ на 350 %.[5] норадреналин обостряет концентрацию, дофамин поднимает настроение и мотивацию. в исследовании с 3018 участниками те, кто заканчивал душ 30–90 секундами холодной воды, брали больничный на 29 % реже.[6]"],
        ]],
        ["3 · настрой", "третья опора: голова. фокус, терпение, практика каждый день. ты учишься оставаться спокойным в холоде и управлять телом, а не позволять ему управлять тобой.", [
          ["голова управляет телом", "университет уэйна сканировал мозг вима хофа в холоде. он намеренно активировал околоводопроводное серое вещество, область ствола мозга, которая приглушает боль. исследователи предполагают, что организм при этом выделяет собственные опиоиды и каннабиноиды.[8]"],
        ]],
      ],
      why: ["почему это работает: гормезис", "дыхание и холод: короткий, дозированный стресс. организм отвечает адаптацией и становится сильнее, как мышца после тренировки. наука называет это гормезисом.[7] не хронический стресс, который тебя изматывает, а короткий стимул и затем восстановление."],
      safe: "важно: никогда не практикуй дыхание в воде или рядом с ней, за рулём или стоя. сядь или ляг. если ты беременна, у тебя эпилепсия, проблемы с сердцем или высокое давление, сначала поговори с врачом.",
      src: "источники",
    },
  };
  // the studies, numbered as in the texts above
  const SOURCES = [
    ["Kox M, et al. Voluntary activation of the sympathetic nervous system and attenuation of the innate immune response in humans. PNAS 2014;111(20):7379–84.", "https://doi.org/10.1073/pnas.1322174111"],
    ["van Westerloo DJ, et al. Acute stress elicited by bungee jumping suppresses human innate immunity. Mol Med 2011;17(3–4):180–8.", "https://doi.org/10.2119/molmed.2010.00204"],
    ["van der Poll T, et al. Epinephrine inhibits tumor necrosis factor-α and potentiates interleukin 10 production during human endotoxemia. J Clin Invest 1996;97(3):713–9.", "https://www.jci.org/articles/view/118469"],
    ["Zwaag J, et al. The effects of cold exposure training and a breathing exercise on the inflammatory response in humans: a pilot study. Psychosom Med 2022;84(4):457–67.", "https://pubmed.ncbi.nlm.nih.gov/35213875/"],
    ["Šrámek P, et al. Human physiological responses to immersion into water of different temperatures. Eur J Appl Physiol 2000;81(5):436–42.", "https://pubmed.ncbi.nlm.nih.gov/10751106/"],
    ["Buijze GA, et al. The effect of cold showering on health and work: a randomized controlled trial. PLoS One 2016;11(9):e0161749.", "https://doi.org/10.1371/journal.pone.0161749"],
    ["Mattson MP. Hormesis defined. Ageing Res Rev 2008;7(1):1–7.", "https://doi.org/10.1016/j.arr.2007.08.007"],
    ["Muzik O, Reilly KT, Diwadkar VA. \"Brain over body\": a study on the willful regulation of autonomic function during cold exposure. NeuroImage 2018;172:632–41.", "https://doi.org/10.1016/j.neuroimage.2018.01.067"],
  ];
  // about paul, under the sign-up: the wim hof texts of brinkmannpaul.com and paul's own story
  const ABOUT = {
   "en": {
    "tag": "about paul",
    "lead": "fifteen years of breath.",
    "bio": "i have been practising breathwork for 15 years and guiding people through breathing sessions and the cold. i am a certified wim hof method instructor and a friend of wim.",
    "cap": "at wim's house · poland",
    "s1": "a few years ago, overwork and stress inflamed my joints. i could not move. i could not even get up from a chair.",
    "s3": "what i discovered, i want to give to everyone. i want to show people that it also works without medication.",
    "s4": "i am not against conventional medicine, not against medication. but we have to understand that we need to combine them: healing does not come from medication alone. you have to take your health into your own hands.",
    "s5": "and how that works, i show you in my courses. i give you the key, i show you the door and how to walk through it. walking through is up to you. but the guidance, how it works, i show you.",
    "fin": "with the right food, breath and cold i healed myself, freed myself from pain and got moving again. and you can too.",
    "kefir": "in my breathing sessions i give you real kefir. we have breakfast together: oats, nuts, flaxseed, fruit of the season and kefir. it supports the microbiome. included: you can take the kefir home. if you want it, bring a new, unopened pack of whole milk."
   },
   "de": {
    "tag": "über paul",
    "lead": "fünfzehn jahre atem.",
    "bio": "seit 15 jahren praktiziere ich atemarbeit und begleite menschen durch atemsessions und die kälte. ich bin zertifizierter wim hof methode instructor und mit wim befreundet.",
    "cap": "bei wim zu hause · polen",
    "s1": "vor ein paar jahren haben sich durch überarbeitung und stress meine gelenke entzündet. ich konnte mich nicht bewegen. ich konnte nicht einmal vom stuhl aufstehen.",
    "s3": "was ich entdeckt habe, möchte ich allen menschen zur verfügung stellen. ich möchte zeigen, dass es auch ohne medikamente geht.",
    "s4": "ich bin nicht gegen die schulmedizin, nicht gegen medikamente. aber wir müssen verstehen, dass wir beides kombinieren müssen: heilung entsteht nicht nur durch medikamente. du musst deine gesundheit selbst in die hand nehmen.",
    "s5": "und wie das geht, zeige ich dir in meinen kursen. ich gebe dir den schlüssel, ich zeige dir die tür und wie du hindurchgehst. hindurchgehen musst du selbst. aber die anleitung, wie es funktioniert, die zeige ich dir.",
    "fin": "mit der richtigen ernährung, mit atem und kälte habe ich mich selbst kuriert, mich von schmerzen befreit und bin wieder in bewegung gekommen. und das kannst du auch.",
    "kefir": "in meinen breathing sessions gebe ich dir echten kefir mit. wir frühstücken gemeinsam: haferflocken, nüsse, leinsamen, früchte der saison und kefir. das unterstützt das mikrobiom. inklusive: du kannst den kefir mitnehmen. wenn du kefir möchtest, bring eine neue, ungeöffnete packung vollmilch mit."
   },
   "fr": {
    "tag": "à propos de paul",
    "lead": "quinze ans de souffle.",
    "bio": "je pratique le travail du souffle depuis 15 ans et j'accompagne des personnes dans des séances de respiration et dans le froid. je suis instructeur certifié de la méthode wim hof et un ami de wim.",
    "cap": "chez wim · pologne",
    "s1": "il y a quelques années, le surmenage et le stress ont enflammé mes articulations. je ne pouvais plus bouger. je ne pouvais même pas me lever d'une chaise.",
    "s3": "ce que j'ai découvert, je veux le mettre à la disposition de tous. je veux montrer que c'est possible aussi sans médicaments.",
    "s4": "je ne suis pas contre la médecine conventionnelle, ni contre les médicaments. mais nous devons comprendre qu'il faut les combiner : la guérison ne vient pas seulement des médicaments. tu dois prendre ta santé en main.",
    "s5": "et comment faire, je te le montre dans mes cours. je te donne la clé, je te montre la porte et comment la franchir. la franchir, c'est à toi. mais le mode d'emploi, je te le montre.",
    "fin": "avec la bonne alimentation, la respiration et le froid, je me suis guéri moi-même, libéré de la douleur et je me suis remis en mouvement. et tu peux le faire aussi.",
    "kefir": "dans mes séances de respiration, je te donne du vrai kéfir. nous prenons le petit-déjeuner ensemble : flocons d'avoine, noix, graines de lin, fruits de saison et kéfir. cela soutient le microbiome. inclus : tu peux emporter le kéfir. si tu en veux, apporte une brique de lait entier neuve et non ouverte."
   },
   "es": {
    "tag": "sobre paul",
    "lead": "quince años de respiración.",
    "bio": "practico el trabajo respiratorio desde hace 15 años y guío a personas en sesiones de respiración y en el frío. soy instructor certificado del método wim hof y amigo de wim.",
    "cap": "en casa de wim · polonia",
    "s1": "hace unos años, el exceso de trabajo y el estrés inflamaron mis articulaciones. no podía moverme. ni siquiera podía levantarme de una silla.",
    "s3": "lo que descubrí quiero ponerlo al alcance de todos. quiero mostrar que también es posible sin medicamentos.",
    "s4": "no estoy en contra de la medicina convencional ni de los medicamentos. pero tenemos que entender que hay que combinarlos: la curación no viene solo de los medicamentos. tienes que tomar tu salud en tus manos.",
    "s5": "y cómo se hace, te lo muestro en mis cursos. te doy la llave, te muestro la puerta y cómo cruzarla. cruzarla te toca a ti. pero las instrucciones de cómo funciona, esas te las muestro.",
    "fin": "con la alimentación adecuada, la respiración y el frío me curé a mí mismo, me liberé del dolor y volví a moverme. y tú también puedes.",
    "kefir": "en mis sesiones de respiración te doy kéfir de verdad. desayunamos juntos: copos de avena, frutos secos, linaza, fruta de temporada y kéfir. eso apoya el microbioma. incluido: puedes llevarte el kéfir. si lo quieres, trae un brik de leche entera nuevo y sin abrir."
   },
   "ar": {
    "tag": "عن paul",
    "lead": "خمسة عشر عامًا من النَّفَس.",
    "bio": "أمارس تمارين التنفس منذ 15 عامًا وأرافق الناس في جلسات التنفس وفي مواجهة البرد. أنا مدرّب معتمد لطريقة ويم هوف وصديق لويم.",
    "cap": "في بيت ويم · بولندا",
    "s1": "قبل بضع سنوات، التهبت مفاصلي بسبب الإرهاق والضغط. لم أستطع الحركة. لم أستطع حتى النهوض من الكرسي.",
    "s3": "ما اكتشفته أريد أن أضعه في متناول الجميع. أريد أن أُري الناس أن الأمر ممكن أيضًا من دون أدوية.",
    "s4": "لست ضد الطب التقليدي ولا ضد الأدوية. لكن علينا أن نفهم أننا نحتاج إلى الجمع بينهما: الشفاء لا يأتي من الأدوية وحدها. عليك أن تأخذ صحتك بيدك.",
    "s5": "وكيف يكون ذلك، أريك إياه في دوراتي. أعطيك المفتاح، وأريك الباب وكيف تعبره. العبور عليك أنت. لكن الطريقة، كيف يعمل ذلك، أريك إياها.",
    "fin": "بالتغذية الصحيحة والتنفّس والبرد شفيت نفسي، وتحرّرت من الألم، وعدت إلى الحركة. وأنت تستطيع ذلك أيضًا.",
    "kefir": "في جلسات التنفّس أعطيك كفيرًا حقيقيًا. نتناول الفطور معًا: شوفان، مكسرات، بذور الكتان، فواكه الموسم والكفير. هذا يدعم الميكروبيوم. مشمول: يمكنك أن تأخذ الكفير معك. إذا أردته، أحضر علبة حليب كامل الدسم جديدة ومغلقة."
   },
   "ru": {
    "tag": "о paul",
    "lead": "пятнадцать лет дыхания.",
    "bio": "я занимаюсь дыхательными практиками 15 лет и провожу людей через дыхательные сессии и холод. я сертифицированный инструктор метода вима хофа и друг вима.",
    "cap": "в доме вима · польша",
    "s1": "несколько лет назад из-за переутомления и стресса у меня воспалились суставы. я не мог двигаться. я не мог даже встать со стула.",
    "s3": "то, что я открыл, я хочу сделать доступным для всех. я хочу показать, что это возможно и без лекарств.",
    "s4": "я не против традиционной медицины и не против лекарств. но нужно понять, что их надо сочетать: исцеление приходит не только от лекарств. своё здоровье нужно взять в свои руки.",
    "s5": "а как это сделать, я показываю на своих курсах. я даю тебе ключ, показываю дверь и как через неё пройти. пройти через неё можешь только ты. но инструкцию, как это работает, я тебе покажу.",
    "fin": "правильным питанием, дыханием и холодом я вылечил себя сам, избавился от боли и снова начал двигаться. и ты тоже сможешь.",
    "kefir": "на своих дыхательных сессиях я даю тебе настоящий кефир. мы завтракаем вместе: овсяные хлопья, орехи, льняное семя, сезонные фрукты и кефир. это поддерживает микробиом. включено: кефир можно забрать с собой. если хочешь, принеси новый, закрытый пакет цельного молока."
   }
  };



  // the club: different teachers, one goal. the team shows one circle per teacher; a teacher not yet
  // announced is an empty circle. a teacher's page lives at /<id>
  const CLUB = {
    en: { nafisa: "yoga · breath · mobility", igNafisa: "nafisa on instagram", h1: "stay young and chilled.\nthe rest is bs.", quote: "the goal is to become healthy, strong and happy. the rest is bullshit.", lead: "breathing, cold, yoga and real food.\nsmall steps, every day.\nno overthinking, no overoptimizing, no pills, no expensive programs. just enjoy your life.", team: "the team", soon: "soon", paul: "breath · cold · microbiome", with: "with paul brinkmann", sessions: "sessions with paul", back: "all teachers" },
    de: { nafisa: "yoga · atem · mobilität", igNafisa: "nafisa auf instagram", h1: "bleib jung und entspannt.\nder rest ist bullshit.", quote: "das ziel ist, gesund, stark und glücklich zu werden. der rest ist bullshit.", lead: "atmen, kälte, yoga und echtes essen.\nkleine schritte, jeden tag.\nkein overthinking, keine überoptimierung, keine pillen, keine teuren programme. einfach das leben genießen.", team: "das team", soon: "bald", paul: "atem · kälte · mikrobiom", with: "mit paul brinkmann", sessions: "sessions mit paul", back: "alle lehrer" },
    fr: { nafisa: "yoga · souffle · mobilité", igNafisa: "nafisa sur instagram", h1: "reste jeune et détendu.\nle reste, c’est du bullshit.", quote: "le but, c’est d’être en bonne santé, fort et heureux. le reste, c’est du bullshit.", lead: "respiration, froid, yoga et vraie nourriture.\nde petits pas, chaque jour.\npas de prise de tête, pas de suroptimisation, pas de pilules, pas de programmes coûteux. juste profiter de la vie.", team: "l’équipe", soon: "bientôt", paul: "souffle · froid · microbiome", with: "avec paul brinkmann", sessions: "les sessions avec paul", back: "tous les professeurs" },
    es: { nafisa: "yoga · respiración · movilidad", igNafisa: "nafisa en instagram", h1: "mantente joven y relajado.\nlo demás es bullshit.", quote: "el objetivo es estar sano, fuerte y feliz. lo demás es bullshit.", lead: "respiración, frío, yoga y comida de verdad.\npasos pequeños, cada día.\nsin pensar de más, sin sobreoptimizar, sin pastillas, sin programas caros. solo disfrutar la vida.", team: "el equipo", soon: "pronto", paul: "respiración · frío · microbioma", with: "con paul brinkmann", sessions: "sesiones con paul", back: "todos los profesores" },
    ar: { nafisa: "يوغا · تنفّس · حركة", igNafisa: "nafisa على إنستغرام", h1: "ابقَ شابًا ومرتاحًا.\nوالباقي كلام فارغ.", quote: "الهدف أن تصبح بصحة جيدة، قويًا وسعيدًا. والباقي كلام فارغ.", lead: "تنفّس، برد، يوغا وأكل حقيقي.\nخطوات صغيرة، كل يوم.\nبلا تفكير زائد، بلا مبالغة في التحسين، بلا حبوب، بلا برامج باهظة. فقط استمتع بحياتك.", team: "الفريق", soon: "قريبًا", paul: "التنفّس · البرد · الميكروبيوم", with: "مع paul brinkmann", sessions: "الجلسات مع paul", back: "كل المعلّمين" },
    ru: { nafisa: "йога · дыхание · мобильность", igNafisa: "nafisa в instagram", h1: "оставайся молодым и спокойным.\nвсё остальное — фигня.", quote: "цель — стать здоровым, сильным и счастливым. всё остальное — фигня.", lead: "дыхание, холод, йога и настоящая еда.\nмаленькие шаги, каждый день.\nбез лишних мыслей, без сверхоптимизации, без таблеток, без дорогих программ. просто наслаждайся жизнью.", team: "команда", soon: "скоро", paul: "дыхание · холод · микробиом", with: "с паулем бринкманом", sessions: "сессии с паулем", back: "все учителя" },
  };
  // nafisa, from her own profile: who she is, her training, what she teaches, her five elements, her words
  const NAFISA = {
    en: { tag: "about nafisa", lead: "move better. breathe deeper. feel at home in your body.",
      bio: "nafisa is a registered advanced yoga teacher (ryt 500), movement practitioner and breathwork facilitator. she brings together yoga, breath, mobility, flexibility, strength and recovery.",
      train: "she trained 500 hours in india: 300 hours advanced at samyukta yoga institute in mysore, 200 hours at the yoga institute in mumbai. she also teaches aerial yoga and has trained in massage, cupping and acupressure. she has taught in india and thailand.",
      help: "she works with people who feel stiff or limited in how they move, and helps them find ease, mobility and confidence in their body. no comparison, no perfection: feel stronger, move better, enjoy the process.",
      teachesH: "what she teaches", teaches: "hatha · ashtanga · vinyasa · aerial yoga · yin & restorative · breathwork & meditation · mobility & flexibility · strength",
      wayH: "her way", way: "move · breathe · restore · connect · grow",
      quote: "wellness isn’t about becoming someone else. it’s about understanding yourself, finding balance, becoming stronger and creating a life in which you feel good in your own body." },
    de: { tag: "über nafisa", lead: "besser bewegen. tiefer atmen. dich in deinem körper zu hause fühlen.",
      bio: "nafisa ist registrierte advanced yoga teacher (ryt 500), bewegungs-praktikerin und begleitet atemarbeit. sie verbindet yoga, atem, mobilität, beweglichkeit, kraft und regeneration.",
      train: "sie hat 500 stunden in indien gelernt: 300 stunden advanced am samyukta yoga institute in mysore, 200 stunden am yoga institute in mumbai. dazu unterrichtet sie aerial yoga und ist in massage, schröpfen und akupressur ausgebildet. sie hat in indien und thailand unterrichtet.",
      help: "sie arbeitet mit menschen, die sich steif oder eingeschränkt fühlen, und hilft ihnen, leichtigkeit, beweglichkeit und vertrauen in ihren körper zu finden. kein vergleichen, kein perfektionismus: stärker fühlen, besser bewegen, den weg genießen.",
      teachesH: "was sie unterrichtet", teaches: "hatha · ashtanga · vinyasa · aerial yoga · yin & restorative · atemarbeit & meditation · mobilität & beweglichkeit · kraft",
      wayH: "ihr weg", way: "bewegen · atmen · erholen · verbinden · wachsen",
      quote: "bei wellness geht es nicht darum, jemand anderes zu werden. es geht darum, dich selbst zu verstehen, balance zu finden, stärker zu werden und ein leben zu schaffen, in dem du dich in deinem körper wohlfühlst." },
    fr: { tag: "à propos de nafisa", lead: "mieux bouger. respirer plus profondément. te sentir chez toi dans ton corps.",
      bio: "nafisa est professeure de yoga avancée certifiée (ryt 500), praticienne du mouvement et facilitatrice de respiration. elle relie le yoga, le souffle, la mobilité, la souplesse, la force et la récupération.",
      train: "elle s’est formée 500 heures en inde : 300 heures avancées au samyukta yoga institute de mysore, 200 heures au yoga institute de mumbai. elle enseigne aussi le yoga aérien et s’est formée au massage, aux ventouses et à l’acupression. elle a enseigné en inde et en thaïlande.",
      help: "elle travaille avec des personnes qui se sentent raides ou limitées dans leurs mouvements, et les aide à trouver aisance, mobilité et confiance dans leur corps. pas de comparaison, pas de perfection : se sentir plus fort, mieux bouger, profiter du chemin.",
      teachesH: "ce qu’elle enseigne", teaches: "hatha · ashtanga · vinyasa · yoga aérien · yin & restauratif · respiration & méditation · mobilité & souplesse · force",
      wayH: "sa voie", way: "bouger · respirer · récupérer · relier · grandir",
      quote: "le bien-être, ce n’est pas devenir quelqu’un d’autre. c’est te comprendre, trouver l’équilibre, devenir plus fort et créer une vie dans laquelle tu te sens bien dans ton corps." },
    es: { tag: "sobre nafisa", lead: "moverte mejor. respirar más hondo. sentirte en casa en tu cuerpo.",
      bio: "nafisa es profesora de yoga avanzada registrada (ryt 500), practicante de movimiento y facilitadora de respiración. une yoga, respiración, movilidad, flexibilidad, fuerza y recuperación.",
      train: "se formó 500 horas en india: 300 horas avanzadas en el samyukta yoga institute de mysore y 200 horas en the yoga institute de mumbai. además enseña yoga aéreo y se formó en masaje, ventosas y acupresión. ha enseñado en india y tailandia.",
      help: "trabaja con personas que se sienten rígidas o limitadas al moverse y las ayuda a encontrar soltura, movilidad y confianza en su cuerpo. sin comparaciones, sin perfección: sentirte más fuerte, moverte mejor, disfrutar el proceso.",
      teachesH: "lo que enseña", teaches: "hatha · ashtanga · vinyasa · yoga aéreo · yin y restaurativo · respiración y meditación · movilidad y flexibilidad · fuerza",
      wayH: "su camino", way: "moverse · respirar · recuperarse · conectar · crecer",
      quote: "el bienestar no consiste en convertirte en otra persona. consiste en entenderte, encontrar el equilibrio, hacerte más fuerte y crear una vida en la que te sientas bien en tu propio cuerpo." },
    ar: { tag: "عن nafisa", lead: "تحرّك أفضل. تنفّس أعمق. اشعر أنك في بيتك داخل جسدك.",
      bio: "nafisa معلّمة يوغا متقدّمة معتمدة (ryt 500)، وممارِسة للحركة وميسِّرة لتمارين التنفّس. تجمع بين اليوغا والتنفّس والحركة والمرونة والقوة والتعافي.",
      train: "تدرّبت 500 ساعة في الهند: 300 ساعة متقدّمة في معهد samyukta لليوغا في ميسور، و200 ساعة في the yoga institute في مومباي. وتدرّس أيضًا اليوغا الهوائية، وتدرّبت على التدليك والحجامة والضغط الإبري. درّست في الهند وتايلاند.",
      help: "تعمل مع من يشعرون بتيبّس أو محدودية في الحركة، وتساعدهم على إيجاد السهولة والمرونة والثقة في أجسادهم. بلا مقارنة، بلا كمال: أن تشعر بقوة أكبر، وتتحرّك أفضل، وتستمتع بالطريق.",
      teachesH: "ما تدرّسه", teaches: "هاثا · أشتانغا · فينياسا · اليوغا الهوائية · يين واسترخاء · التنفّس والتأمّل · الحركة والمرونة · القوة",
      wayH: "طريقتها", way: "تحرّك · تنفّس · استرح · تواصل · انمُ",
      quote: "العافية لا تعني أن تصبح شخصًا آخر. إنها أن تفهم نفسك، وتجد توازنك، وتصبح أقوى، وتصنع حياة تشعر فيها بالراحة في جسدك." },
    ru: { tag: "о nafisa", lead: "двигаться лучше. дышать глубже. чувствовать себя дома в своём теле.",
      bio: "nafisa — сертифицированный преподаватель йоги продвинутого уровня (ryt 500), практик движения и ведущая дыхательных практик. она соединяет йогу, дыхание, мобильность, гибкость, силу и восстановление.",
      train: "она обучалась 500 часов в индии: 300 часов продвинутого курса в samyukta yoga institute в майсуре и 200 часов в the yoga institute в мумбаи. также преподаёт воздушную йогу, обучалась массажу, баночному массажу и акупрессуре. преподавала в индии и таиланде.",
      help: "она работает с людьми, которые чувствуют скованность или ограничения в движении, и помогает им обрести лёгкость, подвижность и уверенность в своём теле. без сравнений, без перфекционизма: чувствовать себя сильнее, двигаться лучше, получать удовольствие от процесса.",
      teachesH: "что она преподаёт", teaches: "хатха · аштанга · виньяса · воздушная йога · инь и восстановительная · дыхание и медитация · мобильность и гибкость · сила",
      wayH: "её путь", way: "двигаться · дышать · восстанавливаться · соединяться · расти",
      quote: "здоровье — это не стать кем-то другим. это понять себя, найти баланс, стать сильнее и создать жизнь, в которой тебе хорошо в своём теле." },
  };
  const TEAM = [
    { id: "paul", name: "paul brinkmann", role: "paul", img: "/photos/foyo-old-snow.webp", alt: "paul brinkmann meditating bare-chested in the snow",
      proof: "/photos/foyo-old-wimhof.webp", proofAlt: "paul brinkmann and wim hof shaking hands in poland" },
    { id: "nafisa", name: "nafisa", role: "nafisa", img: "/photos/foyo-nafisa.webp", alt: "nafisa in a standing split, eyes closed, by the sea",
      proof: "/photos/foyo-nafisa-full.webp", proofAlt: "nafisa holding her leg in a standing split against the sky", proofW: "900", proofH: "1599",
      ig: "https://www.instagram.com/yogawithnafisa/", bio: NAFISA },
    { soon: true },
  ];

  const LANGS = Object.keys(T);
  const KEY = "soma-flow-club";
  const TEST = new URLSearchParams(location.search).get("test") === "1";
  const IG = "https://www.instagram.com/foyoclub/";
  // straight to brinkmannpaul.com (not through a myfoyo.com rewrite), so the sign-up limit sees each visitor
  const API = "https://brinkmannpaul.com/api/soma" + (TEST ? "?test=1" : "");
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
    sessions: null, max: 7, pick: null, name: "", busy: false, error: "",
    booking: saved.booking || null, cancelled: false, showDone: false,
  };
  const app = document.getElementById("book");
  const c = (k) => (CLUB[st.lang] || CLUB.en)[k] || CLUB.en[k];
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
  if (!clip) { /* a teacher's page has no opening video */ }
  else if (still) { clip.removeAttribute("autoplay"); clip.pause(); }
  else {
    const play = () => clip.play().catch(() => {});
    play();
    // some phones block autoplay until the first touch; low power mode too
    document.addEventListener("touchstart", play, { once: true, passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  }
  if (flow) flow.addEventListener("click", () => {
    document.getElementById("top").scrollIntoView({ behavior: still ? "auto" : "smooth" });
  });

  // bring the start of the page (the thank-you, after signing up) right under the sticky header
  function showBook() {
    const nav = document.getElementById("top");
    const y = app.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0);
    window.scrollTo({ top: Math.max(0, y), behavior: still ? "auto" : "smooth" });
  }

  // ---------- language ----------
  function setLang(l) {
    st.lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.querySelectorAll(".lb").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    const cue = document.getElementById("cue");
    if (cue) cue.textContent = t("cue");
    renderWim();
    renderAbout();
    renderTeacher();
    if (app) render();
  }
  document.querySelectorAll(".lb").forEach((b) => b.addEventListener("click", () => {
    try { sessionStorage.setItem(KEY + "-lang", b.dataset.lang); } catch { /* private mode */ }
    setLang(b.dataset.lang);
  }));

  // ---------- the wim hof method ----------
  // "[1]" in a text becomes a small link to that source
  const cite = (text) => text.split(/\[(\d)\]/).map((x, i) => (i % 2 ? el("sup", {}, el("a", { href: "#src-" + x, "aria-label": "source " + x }, x)) : x));
  function renderWim() {
    const box = document.getElementById("wim");
    if (!box) return;
    const w = WIM[st.lang] || WIM.en;
    box.replaceChildren(...[
      el("p", { class: "tag" }, w.tag),
      el("p", { class: "lead" }, w.lead),
      el("p", {}, w.what),
      el("dl", { class: "facts" }, w.facts.map(([n, label]) => el("div", {}, el("dt", { dir: "ltr" }, n), el("dd", {}, label)))),
      w.pillars.map(([h, how, parts]) => [el("h3", { class: "pillar" }, h), el("p", {}, how), parts.map(([ph, text]) => [el("h2", {}, ph), el("p", {}, cite(text))])]),
      el("h2", { class: "why" }, w.why[0]), el("p", {}, cite(w.why[1])),
      el("p", { class: "fine safe" }, w.safe),
      el("h2", {}, w.src),
      el("ol", { class: "src", dir: "ltr" }, SOURCES.map(([ref, url], i) => el("li", { id: "src-" + (i + 1) }, ref + " ", el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, url.replace(/^https:\/\/(www\.)?/, "")))))].flat(4));
  }

  // ---------- about paul ----------
  function renderAbout() {
    const box = document.getElementById("about");
    if (!box) return;
    const a = ABOUT[st.lang] || ABOUT.en;
    const photo = (src, alt, cap) => el("figure", { class: "photo" }, el("span", { class: "photo-circle" }, el("img", { src, alt, width: "720", height: "720", loading: "lazy", decoding: "async" })), cap ? el("figcaption", {}, cap) : null);
    // six photos, one after each paragraph; only wim's house has a caption
    box.replaceChildren(
      el("p", { class: "tag" }, a.tag),
      el("p", { class: "lead" }, a.lead),
      el("p", {}, a.bio),
      photo("/photos/foyo-old-snow.webp", "paul brinkmann meditating bare-chested in the snow above the mountains"),
      el("p", {}, a.s1),
      el("p", {}, a.s3),
      photo("/photos/foyo-icebath.webp", "paul guiding someone through an ice bath in a forest"),
      el("p", {}, a.s4),
      photo("/photos/foyo-trail.webp", "paul leading a group bare-chested along a forest trail"),
      el("p", {}, a.s5),
      photo("/photos/foyo-old-climb.webp?v=2", "a line of people walking bare-chested through the snow on a mountain path"),
      el("p", {}, a.fin),
      photo("/photos/foyo-kefir.webp", "a bowl of homemade kefir with pomegranate above the sea of sidi bou said"),
      el("p", {}, a.kefir),
      photo("/photos/foyo-old-group.webp", "a group, bare-chested, together in the snow on a mountain top"));
  }

  // ---------- the team ----------
  const team = () => el("div", { class: "team" }, TEAM.map((m) => m.soon
    ? el("div", { class: "member soon", "aria-hidden": "true" }, el("span", { class: "ring" }), el("span", { class: "nm" }, c("soon")))
    : el("a", { class: "member", href: "/" + m.id },
      el("span", { class: "ring" }, el("img", { src: m.img, alt: m.alt, width: "720", height: "720", loading: "lazy", decoding: "async" })),
      el("span", { class: "nm" }, m.name, el("span", { class: "rl" }, c(m.role))))));
  // who leads the session
  const host = (m) => el("a", { class: "with", href: "/" + m.id }, el("img", { src: m.img, alt: "", width: "68", height: "68", loading: "lazy", decoding: "async" }), c("with"));
  // a teacher's own page: the circle, the name, what they teach, the way to their sessions
  function renderTeacher() {
    const box = document.getElementById("teacher");
    if (!box) return;
    const m = TEAM.find((x) => x.id === box.dataset.teacher);
    if (!m) return;
    box.replaceChildren(
      el("a", { class: "back", href: "/preview/" }, "← " + c("back")),
      el("figure", { class: "photo" }, el("span", { class: "photo-circle" }, el("img", { src: m.img, alt: m.alt, width: "720", height: "720", decoding: "async" }))),
      el("h1", {}, m.name),
      el("p", { class: "rl" }, c(m.role)),
      m.proof ? el("figure", { class: "proof" }, el("img", { src: m.proof, alt: m.proofAlt, width: m.proofW || "720", height: m.proofH || "720", decoding: "async" }), m.id === "paul" ? el("figcaption", {}, (ABOUT[st.lang] || ABOUT.en).cap) : null) : null,
      el("div", { class: "acts" }, m.ig
        ? el("a", { class: "btn", href: m.ig, target: "_blank", rel: "noopener noreferrer" }, c("ig" + m.id[0].toUpperCase() + m.id.slice(1)))
        : el("a", { class: "btn", href: "/preview/#book" }, c("sessions"))));
    renderBio(m);
  }
  // a teacher's own words, the same shape for everyone: a lead, who they are, their path, what they teach, their line
  function renderBio(m) {
    const box = document.getElementById("bio");
    if (!box || !m.bio) return;
    const b = m.bio[st.lang] || m.bio.en;
    box.replaceChildren(
      el("p", { class: "tag" }, b.tag),
      el("p", { class: "lead" }, b.lead),
      el("p", {}, b.bio),
      el("p", {}, b.train),
      el("p", {}, b.help),
      el("h2", {}, b.teachesH), el("p", {}, b.teaches),
      el("h2", {}, b.wayH), el("p", {}, b.way),
      el("blockquote", { class: "quote" }, el("p", {}, b.quote), el("cite", {}, "— " + m.name)));
  }

  // ---------- the page ----------
  // append, skipping the parts that are not there (a bare null would show as the word "null")
  const put = (...kids) => app.append(...kids.flat().filter((k) => k != null && k !== false));
  function render() {
    app.replaceChildren();
    if (st.booking && st.showDone) return renderDone();
    put(
      // no "foyo club" line here: the logo above already says it
      // foyo's line in two lines, calm, not shouting
      el("h1", { class: "claim" }, c("h1").split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line]))),
      // what you get, then how it feels
      el("p", { class: "lead" }, c("lead").split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line]))),
      // wim hof on x, 2017: the line foyo's own line echoes; it stays in his words
      el("blockquote", { class: "quote" }, el("p", {}, c("quote")), el("cite", {}, "— wim hof")),
      el("h2", {}, c("team")),
      team(),
      el("h2", {}, t("retreat")),
      host(TEAM[0]),
      el("p", {}, t("invite")),
      wide("/photos/foyo-session-circle.webp", "paul with a group sitting on mats in an open wooden hall among palm trees", 1200, 900),
      wide("/photos/foyo-session-rest.webp", "the group lying on mats after the breathing, the sea behind the curtains", 1200, 900),
      included(true),
      el("p", { class: "fine" }, t("limit")),
      st.cancelled ? el("p", { class: "fine", role: "status" }, t("cancelled")) : null,
      el("h2", {}, t("next")));
    // already signed up: the reservation in one line instead of the form
    if (st.booking) return put(mine());
    if (!st.sessions) return put(el("p", { class: "fine" }, t("loading")));
    if (!st.sessions.length) return put(el("p", {}, t("none")));
    const rows = el("div", { class: "rows", role: "radiogroup", "aria-label": t("next") });
    for (const s of st.sessions) {
      const full = s.left <= 0;
      rows.append(el("button", {
        class: "slot", type: "button", role: "radio",
        "aria-checked": String(st.pick === s.id),
        onclick: () => { st.pick = s.id; st.error = ""; render(); },
      },
        el("span", { class: "dot", "aria-hidden": "true" }),
        el("span", {}, when(s) + (s.price ? " ·\u00a0" + t("priceFmt", { p: s.price }) : ""), dayOnly(s) ? el("span", { class: "place" }, t("timeLater")) : null, s.map ? null : el("span", { class: "place" }, place(s))),
        // no counter, ever: only a full session says so (and offers the waiting list)
        el("span", { class: "left" }, full ? t("full") : "")));
      if (s.map) rows.append(where(s));
    }
    const input = el("input", { type: "text", id: "nm", autocomplete: "given-name", maxlength: "60", value: st.name });
    input.addEventListener("input", () => { st.name = input.value; });
    // the chosen session is full: a waiting list with the whatsapp number, never a no
    const chosen = st.sessions.find((x) => x.id === st.pick);
    const waiting = Boolean(chosen && chosen.left <= 0);
    const tel = el("input", { type: "tel", id: "ph", autocomplete: "tel", maxlength: "24", value: st.phone || "", inputmode: "tel" });
    tel.addEventListener("input", () => { st.phone = tel.value; });
    const form = el("form", { class: "form", novalidate: true, onsubmit: (e) => { e.preventDefault(); reserve(form); } },
      st.sessions.some((x) => !x.when && x.place) ? el("p", { class: "hint" }, t("joinHintDate")) : st.sessions.some(dayOnly) ? el("p", { class: "hint" }, t("joinHint")) : null,
      waiting ? el("p", { class: "hint" }, t("fullNotice")) : null,
      el("label", { for: "nm" }, t("name")), input,
      waiting ? el("label", { for: "ph" }, t("phone")) : null, waiting ? tel : null,
      el("div", { class: "hp", "aria-hidden": "true" }, el("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off" })),
      el("div", {}, el("button", { class: "btn", type: "submit", disabled: st.busy }, st.busy ? t("wait") : waiting ? t("joinWait") : t("reserve"))),
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null);
    put(rows, form);
  }

  // the price never breaks apart: "50 dinar" stays on one line (no-break spaces in priceFmt)
  // what the session holds: on the start page and again on the thank-you page
  // a photo in its full frame, nothing cut off (the circles are for about paul)
  const wide = (src, alt, w, h) => el("figure", { class: "wide" }, el("img", { src, alt, width: String(w), height: String(h), loading: "lazy", decoding: "async" }));
  const included = (pics) => [
    el("h2", {}, t("incl")),
    el("ul", { class: "rules offer" }, (T[st.lang].items || T.en.items).map((x) => el("li", {}, x.split("\n").flatMap((line, i) => (i ? [el("br"), line] : [line]))))),
    // the breakfast paul eats every day
    el("p", {}, t("fuel")),
    pics ? wide("/photos/foyo-breakfast.webp", "the breakfast: kefir with pomegranate, flaxseed and dates above the sea of sidi bou said", 1200, 1600) : null,
    el("p", { class: "fine" }, t("only")),
  ];

  const mine = () => el("div", { class: "mine" },
    el("p", {}, (st.booking.wait ? t("waitThanks", { name: st.booking.name }) : t("mine")) + (st.booking.when ? " · " + when(st.booking) : "")),
    el("button", { class: "ghost", type: "button", onclick: () => { st.showDone = true; render(); showBook(); } }, t("showMine")));
  const toPage = () => el("div", { class: "acts" }, el("button", { class: "ghost", type: "button", onclick: () => { st.showDone = false; render(); window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" }); } }, t("toPage")));
  function renderDone() {
    const b = st.booking;
    if (b.wait) {
      return put(el("section", { class: "done", "aria-live": "polite" },
        el("p", { class: "tag" }, t("tag")),
        el("h1", {}, t("waitThanks", { name: b.name })),
        el("p", { class: "when" }, when(b)),
        el("p", { class: "lead" }, t("waitBody")),
        toPage(),
        el("div", { class: "acts leave" }, el("button", { class: "ghost", type: "button", onclick: cancel }, t("leaveWait"))),
        st.error ? el("p", { class: "err", role: "alert" }, st.error) : null));
    }
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
      b.price ? el("p", { class: "fine" }, t("priceFmt", { p: b.price })) : null,
      included(),
      el("ul", { class: "rules" }, ["r1", "r2"].map((k) => el("li", {}, t(k)))),
      acts,
      toPage(),
      leave,
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null));
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      const d = await r.json();
      st.sessions = d.sessions || [];
      st.max = d.places || 7;
      const open = st.sessions.filter((s) => s.left > 0);
      if (!st.pick && open.length === 1) st.pick = open[0].id;
      if (!st.pick && st.sessions.length === 1) st.pick = st.sessions[0].id;
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
    const chosen = st.sessions.find((x) => x.id === st.pick);
    const wait = Boolean(chosen && chosen.left <= 0);
    if (wait && String(st.phone || "").replace(/\D/g, "").length < 6) { st.error = t("errPhone"); return render(); }
    st.busy = true; render();
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: st.pick, name, wait, phone: wait ? st.phone : undefined, company: form.company ? form.company.value : "" }) });
      const d = await r.json().catch(() => ({}));
      st.busy = false;
      if (r.status === 409) { await load(); st.error = t("fullNotice"); return render(); }
      if (!r.ok || !d.id) { st.error = t("errAny"); return render(); }
      st.booking = { id: d.id, name, when: d.when, place: d.place, map: d.map || "", price: d.price || 0, group: d.group || "", wait: Boolean(d.waitlist) };
      st.cancelled = false;
      st.showDone = true;
      store.set({ ...store.get(), booking: st.booking });
      render();
      app.focus({ preventScroll: true });
      showBook();
    } catch { st.busy = false; st.error = t("errAny"); render(); }
  }

  async function cancel() {
    if (!st.booking || (!st.booking.wait && !window.confirm(t("sure")))) return;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancel: st.booking.id }) });
      if (!r.ok) throw new Error("cancel");
      st.booking = null; st.cancelled = true; st.error = ""; st.pick = null;
      store.set({ ...store.get(), booking: null });
      await load();
    } catch { st.error = t("errAny"); render(); }
  }

  setLang(st.lang);
  if (app) load();
})();
