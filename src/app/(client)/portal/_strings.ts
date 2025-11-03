// Client portal localization strings
export const clientStrings = {
  // Navigation
  navigation: {
    portal: 'Můj portál',
    backToPortal: 'Zpět na portál',
    detailCleaning: 'Detail úklidu',
    detailProperty: 'Detail objektu'
  },

  // Headers
  headers: {
    welcome: 'Vítejte v portálu pro správu vašich objektů a úklidů',
    myProperties: 'Moje objekty',
    recentCleanings: 'Poslední úklidy',
    cleaningDetail: 'Detail úklidu',
    propertyDetail: 'Detail objektu',
    cleaningProgress: 'Průběh úklidu',
    photos: 'Fotografie',
    cleaningHistory: 'Historie úklidů',
    nextCleaning: 'Další plánovaný úklid',
    recentSupplies: 'Co se doplnilo naposledy'
  },

  // Status labels
  status: {
    completed: 'Dokončeno',
    inProgress: 'Probíhá',
    scheduled: 'Naplánováno',
    cancelled: 'Zrušeno',
    ongoing: 'Probíhá'
  },

  // Phase labels
  phases: {
    before: 'Před úklidem',
    after: 'Po úklidu',
    other: 'Během úklidu'
  },

  // Event labels
  events: {
    cleaningStart: 'Začátek úklidu',
    note: 'Poznámka',
    supplyOut: 'Doplnění zásob',
    linenUsed: 'Výměna prádla',
    photo: 'Fotografie',
    done: 'Dokončeno',
    event: 'Událost'
  },

  // Quick stats
  stats: {
    totalProperties: 'Celkem objektů',
    monthlyCleanings: 'Úklidy tento měsíc',
    lastCleaning: 'Poslední úklid',
    cleaningDuration: 'Délka úklidu',
    photosCount: 'Fotografií',
    eventsCount: 'Událostí',
    totalCleanings: 'Celkem úklidů',
    thisMonth: 'Tento měsíc',
    avgDuration: 'Průměrná délka'
  },

  // Property info
  property: {
    type: 'Typ',
    address: 'Adresa',
    noCleaning: 'Žádný úklid',
    lastCleaning: 'Poslední úklid'
  },

  // Cleaning info
  cleaning: {
    time: 'Čas',
    duration: 'Délka',
    status: 'Stav',
    object: 'Objekt',
    date: 'Datum',
    action: 'Akce'
  },

  // Filters
  filters: {
    period: 'Období',
    week: 'Týden',
    month: 'Měsíc',
    custom: 'Vlastní'
  },

  // Actions
  actions: {
    viewDetail: 'Zobrazit detail',
    close: 'Zavřít',
    tryAgain: 'Zkusit znovu',
    detail: 'Detail'
  },

  // Messages
  messages: {
    noProperties: 'Žádné objekty k zobrazení',
    noCleanings: 'Žádné úklidy k zobrazení',
    noEvents: 'Žádné události k zobrazení',
    noPhotos: 'Žádné fotografie k zobrazení',
    noSupplies: 'Žádné nedávné doplnění zásob',
    noCleaningsInPeriod: 'Žádné úklidy v zvoleném období',
    loading: 'Načítání...',
    loadingProperties: 'Načítání objektů...',
    loadingCleanings: 'Načítání úklidů...',
    loadingTimeline: 'Načítání timeline...',
    loadingPhotos: 'Načítání fotek...',
    loadingSupplies: 'Načítání zásob...',
    loadingPhoto: 'Načítání fotografie...',
    photoLoadError: 'Nepodařilo se načíst fotografii',
    photoLoadErrorRetry: 'Chyba při načítání fotografie',
    photoExpired: 'Fotografie se automaticky obnoví za 48 hodin',
    imageLoadError: 'Chyba při načítání obrázku'
  },

  // Info text
  info: {
    showingCleanings: 'Zobrazuje posledních {count} úklidů',
    showingSupplies: 'Zobrazuje posledních {count} doplnění zásob',
    showingFiltered: 'Zobrazuje {filtered} úklidů z {total} celkem',
    totalEvents: 'Celkem {count} událostí',
    recentPhotos: 'Nedávné fotky',
    recentEvents: 'Nové události se zobrazí automaticky'
  },

  // Error messages
  errors: {
    cleaningNotFound: 'Úklid nenalezen',
    propertyNotFound: 'Objekt nenalezen',
    accessDenied: 'Požadovaný úklid neexistuje nebo nemáte oprávnění k jeho zobrazení.',
    propertyAccessDenied: 'Požadovaný objekt neexistuje nebo nemáte oprávnění k jeho zobrazení.'
  },

  // Accessibility
  accessibility: {
    photoModal: 'Zobrazení fotografie',
    closePhoto: 'Zavřít',
    photoThumb: 'Foto z {phase} fáze'
  }
};

// Helper function to format strings with placeholders
export function formatString(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

// Helper function to get localized string
export function getClientString(path: string): string {
  const keys = path.split('.');
  let value: any = clientStrings;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      return path; // Return path if not found
    }
  }
  
  return typeof value === 'string' ? value : path;
}





