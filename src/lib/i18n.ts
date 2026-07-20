// Internationalization and translations for Bharat Lens
// Supports: English, Hindi, Tamil, Telugu, Bengali, Marathi

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
];

type TranslationKey = string;

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.scan': 'Scan',
    'nav.chat': 'Chat',
    'nav.vault': 'Vault',
    'nav.schemes': 'Schemes',
    'nav.apps': 'Applications',
    'nav.reminders': 'Reminders',
    'nav.scam': 'Scam Shield',
    'nav.family': 'Family',
    'nav.settings': 'Settings',
    
    // Home
    'home.greeting': 'Namaste',
    'home.goodMorning': 'Good Morning',
    'home.goodAfternoon': 'Good Afternoon',
    'home.goodEvening': 'Good Evening',
    'home.upcomingReminders': 'Upcoming Reminders',
    'home.recommendedSchemes': 'Schemes For You',
    'home.quickActions': 'Quick Actions',
    'home.noReminders': 'No upcoming reminders',
    'home.noSchemes': 'Complete your profile to see relevant schemes',
    'home.viewAll': 'View All',
    'home.addReminder': 'Add a reminder',
    'home.myApplications': 'My Applications',
    'home.trackProgress': 'Track your progress',
    'home.scamShield': 'Scam Shield',
    'home.checkMessages': 'Check suspicious messages',
    'home.familyMode': 'Family Mode',
    'home.manageDocs': 'Manage family documents',
    'home.settings': 'Settings',
    'home.languageNotifications': 'Language, notifications',
    'home.today': 'Today',
    'home.tomorrow': 'Tomorrow',
    'home.days': 'days',
    'home.verified': '✓ Verified',
    
    // Scan
    'scan.title': 'Scan Document',
    'scan.takePhoto': 'Take Photo',
    'scan.uploadFile': 'Upload File',
    'scan.processing': 'Processing...',
    'scan.saveToVault': 'Save to Vault',
    'scan.createChecklist': 'Create Checklist',
    'scan.explainMore': 'Explain This',
    
    // Chat
    'chat.title': 'Bharat Lens AI',
    'chat.placeholder': 'Ask about government schemes...',
    'chat.speak': 'Speak',
    'chat.send': 'Send',
    'chat.newChat': 'New Chat',
    'chat.generating': 'Generating answer',
    'chat.pleaseWait': 'Please wait — reading government sources...',
    'chat.howCanIHelp': 'How can I help you?',
    'chat.askAbout': 'Ask me about government schemes, document requirements, application processes, or anything else!',
    'chat.listen': '🔊 Listen',
    'chat.stop': '🔊 Stop',
    'chat.aiGuidance': 'AI responses are for guidance only. Always verify with official sources.',
    'chat.replyIn': 'Ask in {lang} or any language • Replying in {lang} + English',
    'chat.suggestion1': 'Find schemes for farmers',
    'chat.suggestion2': 'What documents for passport?',
    'chat.suggestion3': 'Check a suspicious message',
    
    // Vault
    'vault.title': 'Document Vault',
    'vault.empty': 'No documents saved yet',
    'vault.expiry': 'Expires in',
    'vault.days': 'days',
    'vault.expired': 'Expired',
    'vault.delete': 'Delete',
    'vault.confirmDelete': 'Are you sure you want to delete this document?',
    
    // Schemes
    'schemes.title': 'Government Schemes',
    'schemes.forYou': 'For You',
    'schemes.all': 'All Schemes',
    'schemes.verified': 'Verified',
    'schemes.liveResult': 'Live Result',
    'schemes.lastChecked': 'Last checked',
    'schemes.openOfficial': 'Open Official Site',
    'schemes.documentsNeeded': 'Documents typically needed',
    'schemes.eligibility': 'Who can apply',
    
    // Applications
    'apps.title': 'My Applications',
    'apps.notStarted': 'Not Started',
    'apps.inProgress': 'In Progress',
    'apps.submitted': 'Submitted',
    'apps.approved': 'Approved',
    'apps.rejected': 'Rejected',
    'apps.newApplication': 'New Application',
    'apps.progress': 'Progress',
    
    // Reminders
    'reminders.title': 'Reminders',
    'reminders.add': 'Add Reminder',
    'reminders.calendar': 'Calendar',
    'reminders.list': 'List',
    'reminders.dueDate': 'Due Date',
    'reminders.markComplete': 'Mark Complete',
    
    // Scam
    'scam.title': 'Scam Shield',
    'scam.subtitle': 'Check if a message or link is safe',
    'scam.pasteText': 'Paste message or link',
    'scam.uploadImage': 'Upload Image',
    'scam.checking': 'Checking...',
    'scam.safe': 'Appears Safe',
    'scam.suspicious': 'Suspicious',
    'scam.danger': 'Likely Scam',
    'scam.needsReview': 'Needs Manual Verification',
    'scam.disclaimer': 'This is AI guidance, not a legal verdict.',
    
    // Family
    'family.title': 'Family Mode',
    'family.addMember': 'Add Family Member',
    'family.invite': 'Invite Member',
    'family.switchUser': 'Switch User',
    
    // Settings
    'settings.title': 'Settings',
    'settings.customize': 'Customize your Bharat Lens experience',
    'settings.language': 'Language',
    'settings.simpleMode': 'Simple Mode',
    'settings.simpleModeDesc': 'Larger text and icons for easier use',
    'settings.notifications': 'Notifications',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushNotificationsDesc': 'Reminders and updates',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailNotificationsDesc': 'Weekly summary and alerts',
    'settings.exportData': 'Export My Data',
    'settings.deleteAccount': 'Delete Account',
    'settings.logout': 'Log Out',
    'settings.dataPrivacy': 'Data & Privacy',
    'settings.accessibility': 'Accessibility',
    'settings.profile': 'Profile',
    'settings.notSet': 'Not set',
    'settings.deleteConfirmTitle': 'Delete Account?',
    'settings.deleteConfirmMsg': 'This will permanently delete all your data including documents, applications, reminders, and chat history. This action cannot be undone.',
    'settings.cancel': 'Cancel',
    'settings.delete': 'Delete',
    
    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.continue': 'Continue',
    'auth.skip': 'Skip for now',
    
    // Onboarding
    'onboard.welcome': 'Welcome to Bharat Lens',
    'onboard.subtitle': 'Your AI guide to government services',
    'onboard.name': 'What should we call you?',
    'onboard.state': 'Select your state',
    'onboard.occupation': 'What is your occupation?',
    'onboard.language': 'Choose your language',
    'onboard.next': 'Next',
    'onboard.done': 'Get Started',
    
    // Occupations
    'occupation.student': 'Student',
    'occupation.farmer': 'Farmer',
    'occupation.professional': 'Professional',
    'occupation.entrepreneur': 'Entrepreneur',
    'occupation.senior': 'Senior Citizen',
    'occupation.other': 'Other',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.viewAll': 'View All',
    
    // Disclaimer
    'disclaimer.text': 'Bharat Lens provides AI-assisted guidance and is not affiliated with the Government of India. Always verify critical actions through official sources.',
  },
  
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.scan': 'स्कैन',
    'nav.chat': 'चैट',
    'nav.vault': 'दस्तावेज़',
    'nav.schemes': 'योजनाएं',
    'nav.apps': 'आवेदन',
    'nav.reminders': 'रिमाइंडर',
    'nav.scam': 'स्कैम शील्ड',
    'nav.family': 'परिवार',
    'nav.settings': 'सेटिंग्स',
    
    // Home
    'home.greeting': 'नमस्ते',
    'home.goodMorning': 'सुप्रभात',
    'home.goodAfternoon': 'शुभ दोपहर',
    'home.goodEvening': 'शुभ संध्या',
    'home.upcomingReminders': 'आगामी रिमाइंडर',
    'home.recommendedSchemes': 'आपके लिए योजनाएं',
    'home.quickActions': 'त्वरित कार्य',
    'home.noReminders': 'कोई आगामी रिमाइंडर नहीं',
    'home.noSchemes': 'प्रासंगिक योजनाएं देखने के लिए अपनी प्रोफ़ाइल पूरी करें',
    'home.viewAll': 'सभी देखें',
    'home.addReminder': 'रिमाइंडर जोड़ें',
    'home.myApplications': 'मेरे आवेदन',
    'home.trackProgress': 'अपनी प्रगति ट्रैक करें',
    'home.scamShield': 'स्कैम शील्ड',
    'home.checkMessages': 'संदिग्ध संदेश जांचें',
    'home.familyMode': 'परिवार मोड',
    'home.manageDocs': 'परिवार के दस्तावेज़ प्रबंधित करें',
    'home.settings': 'सेटिंग्स',
    'home.languageNotifications': 'भाषा, सूचनाएं',
    'home.today': 'आज',
    'home.tomorrow': 'कल',
    'home.days': 'दिन',
    'home.verified': '✓ सत्यापित',
    
    // Scan
    'scan.title': 'दस्तावेज़ स्कैन करें',
    'scan.takePhoto': 'फोटो लें',
    'scan.uploadFile': 'फाइल अपलोड करें',
    'scan.processing': 'प्रोसेस हो रहा है...',
    'scan.saveToVault': 'वॉल्ट में सेव करें',
    'scan.createChecklist': 'चेकलिस्ट बनाएं',
    'scan.explainMore': 'इसकी व्याख्या करें',
    
    // Chat
    'chat.title': 'भारत लेंस AI',
    'chat.placeholder': 'सरकारी योजनाओं के बारे में पूछें...',
    'chat.speak': 'बोलें',
    'chat.send': 'भेजें',
    'chat.newChat': 'नई चैट',
    'chat.generating': 'जवाब बना रहा हूं',
    'chat.pleaseWait': 'कृपया प्रतीक्षा करें — सरकारी स्रोत पढ़ रहा हूं...',
    'chat.howCanIHelp': 'मैं आपकी कैसे मदद कर सकता हूं?',
    'chat.askAbout': 'सरकारी योजनाओं, दस्तावेज़ आवश्यकताओं, आवेदन प्रक्रियाओं या किसी और चीज़ के बारे में पूछें!',
    'chat.listen': '🔊 सुनें',
    'chat.stop': '🔊 रोकें',
    'chat.aiGuidance': 'AI उत्तर केवल मार्गदर्शन के लिए हैं। हमेशा आधिकारिक स्रोतों से सत्यापित करें।',
    'chat.replyIn': '{lang} या किसी भी भाषा में पूछें • {lang} + English में जवाब',
    'chat.suggestion1': 'किसानों के लिए योजनाएं खोजें',
    'chat.suggestion2': 'पासपोर्ट के लिए कौन से दस्तावेज़?',
    'chat.suggestion3': 'संदिग्ध संदेश जांचें',
    
    // Vault
    'vault.title': 'दस्तावेज़ वॉल्ट',
    'vault.empty': 'अभी तक कोई दस्तावेज़ सेव नहीं',
    'vault.expiry': 'समाप्ति में',
    'vault.days': 'दिन',
    'vault.expired': 'समाप्त',
    'vault.delete': 'हटाएं',
    'vault.confirmDelete': 'क्या आप वाकई इस दस्तावेज़ को हटाना चाहते हैं?',
    
    // Schemes
    'schemes.title': 'सरकारी योजनाएं',
    'schemes.forYou': 'आपके लिए',
    'schemes.all': 'सभी योजनाएं',
    'schemes.verified': 'सत्यापित',
    'schemes.liveResult': 'लाइव परिणाम',
    'schemes.lastChecked': 'अंतिम जांच',
    'schemes.openOfficial': 'आधिकारिक साइट खोलें',
    'schemes.documentsNeeded': 'आमतौर पर आवश्यक दस्तावेज़',
    'schemes.eligibility': 'कौन आवेदन कर सकता है',
    
    // Applications
    'apps.title': 'मेरे आवेदन',
    'apps.notStarted': 'शुरू नहीं हुआ',
    'apps.inProgress': 'प्रगति में',
    'apps.submitted': 'जमा किया',
    'apps.approved': 'स्वीकृत',
    'apps.rejected': 'अस्वीकृत',
    'apps.newApplication': 'नया आवेदन',
    'apps.progress': 'प्रगति',
    
    // Reminders
    'reminders.title': 'रिमाइंडर',
    'reminders.add': 'रिमाइंडर जोड़ें',
    'reminders.calendar': 'कैलेंडर',
    'reminders.list': 'सूची',
    'reminders.dueDate': 'नियत तारीख',
    'reminders.markComplete': 'पूर्ण चिह्नित करें',
    
    // Scam
    'scam.title': 'स्कैम शील्ड',
    'scam.subtitle': 'संदेश या लिंक सुरक्षित है या नहीं जांचें',
    'scam.pasteText': 'संदेश या लिंक चिपकाएं',
    'scam.uploadImage': 'छवि अपलोड करें',
    'scam.checking': 'जांच रहा है...',
    'scam.safe': 'सुरक्षित लगता है',
    'scam.suspicious': 'संदिग्ध',
    'scam.danger': 'संभवतः स्कैम',
    'scam.needsReview': 'मैन्युअल सत्यापन आवश्यक',
    'scam.disclaimer': 'यह AI मार्गदर्शन है, कानूनी फैसला नहीं।',
    
    // Family
    'family.title': 'परिवार मोड',
    'family.addMember': 'परिवार का सदस्य जोड़ें',
    'family.invite': 'सदस्य आमंत्रित करें',
    'family.switchUser': 'उपयोगकर्ता बदलें',
    
    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.customize': 'अपना Bharat Lens अनुभव अनुकूलित करें',
    'settings.language': 'भाषा',
    'settings.simpleMode': 'सरल मोड',
    'settings.simpleModeDesc': 'आसान उपयोग के लिए बड़े टेक्स्ट और आइकन',
    'settings.notifications': 'सूचनाएं',
    'settings.pushNotifications': 'पुश नोटिफिकेशन',
    'settings.pushNotificationsDesc': 'रिमाइंडर और अपडेट',
    'settings.emailNotifications': 'ईमेल नोटिफिकेशन',
    'settings.emailNotificationsDesc': 'साप्ताहिक सारांश और अलर्ट',
    'settings.exportData': 'मेरा डेटा निर्यात करें',
    'settings.deleteAccount': 'खाता हटाएं',
    'settings.logout': 'लॉग आउट',
    'settings.dataPrivacy': 'डेटा और गोपनीयता',
    'settings.accessibility': 'पहुंच',
    'settings.profile': 'प्रोफ़ाइल',
    'settings.notSet': 'सेट नहीं',
    'settings.deleteConfirmTitle': 'खाता हटाएं?',
    'settings.deleteConfirmMsg': 'यह आपके सभी डेटा को स्थायी रूप से हटा देगा जिसमें दस्तावेज़, आवेदन, रिमाइंडर और चैट इतिहास शामिल हैं। यह क्रिया पूर्ववत नहीं की जा सकती।',
    'settings.cancel': 'रद्द करें',
    'settings.delete': 'हटाएं',
    
    // Auth
    'auth.login': 'लॉग इन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.continue': 'जारी रखें',
    'auth.skip': 'अभी छोड़ें',
    
    // Onboarding
    'onboard.welcome': 'भारत लेंस में आपका स्वागत है',
    'onboard.subtitle': 'सरकारी सेवाओं के लिए आपका AI गाइड',
    'onboard.name': 'हमें आपको क्या कहना चाहिए?',
    'onboard.state': 'अपना राज्य चुनें',
    'onboard.occupation': 'आपका व्यवसाय क्या है?',
    'onboard.language': 'अपनी भाषा चुनें',
    'onboard.next': 'अगला',
    'onboard.done': 'शुरू करें',
    
    // Occupations
    'occupation.student': 'छात्र',
    'occupation.farmer': 'किसान',
    'occupation.professional': 'पेशेवर',
    'occupation.entrepreneur': 'उद्यमी',
    'occupation.senior': 'वरिष्ठ नागरिक',
    'occupation.other': 'अन्य',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हुआ',
    'common.retry': 'पुनः प्रयास करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.close': 'बंद करें',
    'common.search': 'खोजें',
    'common.viewAll': 'सभी देखें',
    
    // Disclaimer
    'disclaimer.text': 'भारत लेंस AI-सहायता प्रदान करता है और भारत सरकार से संबद्ध नहीं है। हमेशा आधिकारिक स्रोतों से महत्वपूर्ण कार्यों को सत्यापित करें।',
  },
  
  ta: {
    // Navigation
    'nav.home': 'முகப்பு',
    'nav.scan': 'ஸ்கேன்',
    'nav.chat': 'அரட்டை',
    'nav.vault': 'ஆவணங்கள்',
    'nav.schemes': 'திட்டங்கள்',
    'nav.apps': 'விண்ணப்பங்கள்',
    'nav.reminders': 'நினைவூற்றல்கள்',
    'nav.scam': 'மோசடி கேட',
    'nav.family': 'குடும்பம்',
    'nav.settings': 'அமைப்புகள்',
    
    // Home
    'home.greeting': 'வணக்கம்',
    'home.goodMorning': 'காலை வணக்கம்',
    'home.goodAfternoon': 'மதிய வணக்கம்',
    'home.goodEvening': 'மாலை வணக்கம்',
    'home.upcomingReminders': 'வரவிருக்கும் நினைவூற்றல்கள்',
    'home.recommendedSchemes': 'உங்களுக்கான திட்டங்கள்',
    'home.quickActions': 'விரைவான செயல்கள்',
    'home.noReminders': 'வரவிருக்கும் நினைவூற்றல்கள் இல்லை',
    'home.noSchemes': 'பொருத்தமான திட்டங்களைக் காண உங்கள் சுயவிவரத்தை முடிக்கவும்',
    'home.viewAll': 'அனைத்தையும் காண்க',
    'home.addReminder': 'நினைவூற்றல் சேர்',
    'home.myApplications': 'என் விண்ணப்பங்கள்',
    'home.trackProgress': 'உங்கள் முன்னேற்றத்தைக் கண்காணிக்கவும்',
    'home.scamShield': 'மோசடி கேட',
    'home.checkMessages': 'சந்தேகத்திற்குரிய செய்திகளைச் சரிபார்க்கவும்',
    'home.familyMode': 'குடும்ப முறை',
    'home.manageDocs': 'குடும்ப ஆவணங்களை நிர்வகிக்கவும்',
    'home.settings': 'அமைப்புகள்',
    'home.languageNotifications': 'மொழி, அறிவிப்புகள்',
    'home.today': 'இன்று',
    'home.tomorrow': 'நாளை',
    'home.days': 'நாட்கள்',
    'home.verified': '✓ சரிபார்க்கப்பட்டது',
    
    // Scan
    'scan.title': 'ஆவணத்தை ஸ்கேன் செய்க',
    'scan.takePhoto': 'புகைப்படம் எடுக்க',
    'scan.uploadFile': 'கோப்பை பதிவேற்றவும்',
    'scan.processing': 'செயலாக்குகிறது...',
    'scan.saveToVault': 'வால்ட்டில் சேமி',
    'scan.createChecklist': 'சோதனை பட்டியல் உருவாக்கு',
    'scan.explainMore': 'இதை விளக்கவும்',
    
    // Chat
    'chat.title': 'பாரத லென்ஸ் AI',
    'chat.placeholder': 'அரசு திட்டங்களைப் பற்றி கேளுங்கள்...',
    'chat.speak': 'பேசுங்கள்',
    'chat.send': 'அனுப்பு',
    'chat.newChat': 'புதிய அரட்டை',
    'chat.generating': 'பதில் உருவாக்குகிறேன்',
    'chat.pleaseWait': 'தயவுசெய்து காத்திருங்கள் — அரசு ஆதாரங்களைப் படிக்கிறேன்...',
    'chat.howCanIHelp': 'நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    'chat.askAbout': 'அரசு திட்டங்கள், ஆவண தேவைகள், விண்ணப்ப நடைமுறைகள் அல்லது வேறு எதையும் பற்றி கேளுங்கள்!',
    'chat.listen': '🔊 கேட்க',
    'chat.stop': '🔊 நிறுத்து',
    'chat.aiGuidance': 'AI பதில்கள் வழிகாட்டுதல்களுக்காக மட்டும் உள்ளன. எப்போதும் அதிகாரப்பூர்வ மூலங்களைச் சரிபார்க்கவும்.',
    'chat.replyIn': '{lang} அல்லது எந்த மொழியிலும் கேளுங்கள் • {lang} + English இல் பதில்',
    'chat.suggestion1': 'விவசாயிகளுக்கான திட்டங்களைக் கண்டறியவும்',
    'chat.suggestion2': 'பாஸ்போர்ட்டுக்கான ஆவணங்கள் என்ன?',
    'chat.suggestion3': 'சந்தேகத்திற்குரிய செய்தியைச் சரிபார்க்கவும்',
    
    // Vault
    'vault.title': 'ஆவண கதுப்பு',
    'vault.empty': 'இன்னும் ஆவணங்கள் சேமிக்கப்படவில்லை',
    'vault.expiry': 'காலாவதியில்',
    'vault.days': 'நாட்கள்',
    'vault.expired': 'காலாவதியான',
    'vault.delete': 'நீக்கு',
    'vault.confirmDelete': 'இந்த ஆவணத்தை நீக்க விரும்புகிறீர்களா?',
    
    // Schemes
    'schemes.title': 'அரசு திட்டங்கள்',
    'schemes.forYou': 'உங்களுக்காக',
    'schemes.all': 'அனைத்து திட்டங்கள்',
    'schemes.verified': 'சரிபார்க்கப்பட்ட',
    'schemes.liveResult': 'நேரடி முடிவு',
    'schemes.lastChecked': 'கடைசியாக சரிபார்க்கப்பட்டது',
    'schemes.openOfficial': 'அதிகாரப்பூர்வ தளத்தைத் திறக்கவும்',
    'schemes.documentsNeeded': 'வழக்கமாக தேவையான ஆவணங்கள்',
    'schemes.eligibility': 'யார் விண்ணப்பிக்கலாம்',
    
    // Applications
    'apps.title': 'என் விண்ணப்பங்கள்',
    'apps.notStarted': 'தொடங்கவில்லை',
    'apps.inProgress': 'செயலில் உள்ளது',
    'apps.submitted': 'சமர்ப்பிக்கப்பட்டது',
    'apps.approved': 'அங்கீகரிக்கப்பட்ட',
    'apps.rejected': 'நிராகரிக்கப்பட்ட',
    'apps.newApplication': 'புதிய விண்ணப்பம்',
    'apps.progress': 'முன்னேற்றம்',
    
    // Reminders
    'reminders.title': 'நினைவூற்றல்கள்',
    'reminders.add': 'நினைவூற்றல் சேர்',
    'reminders.calendar': 'கேலண்டர்',
    'reminders.list': 'பட்டியல்',
    'reminders.dueDate': 'கெடு',
    'reminders.markComplete': 'முழுமையானதாகக் குறி',
    
    // Scam
    'scam.title': 'மோசடி கேட',
    'scam.subtitle': 'செய்தி அல்லது இணைப்பு பாதுகாப்பானதா எனச் சரிபார்க்கவும்',
    'scam.pasteText': 'செய்தி அல்லது இணைப்பை ஒட்டவும்',
    'scam.uploadImage': 'படத்தை பதிவேற்றவும்',
    'scam.checking': 'சரிபார்க்கிறது...',
    'scam.safe': 'பாதுகாப்பானதாகத் தெரிகிறது',
    'scam.suspicious': 'சந்தேகத்திற்குரிய',
    'scam.danger': 'வாய்ப்புள்ள மோசடி',
    'scam.needsReview': 'கைமுறை சரிபார்ப்பு தேவை',
    'scam.disclaimer': 'இது AI வழிகாட்டல், சட்ட நீதிபதி அல்ல.',
    
    // Family
    'family.title': 'குடும்ப முறை',
    'family.addMember': 'குடும்ப உறுப்பினரைச் சேர்',
    'family.invite': 'உறுப்பினரை அழைக்கவும்',
    'family.switchUser': 'பயனரை மாற்றவும்',
    
    // Settings
    'settings.title': 'அமைப்புகள்',
    'settings.customize': 'உங்கள் பாரத லென்ஸ் அனுபவத்தைத் தனிப்பயனாக்கவும்',
    'settings.language': 'மொழி',
    'settings.simpleMode': 'எளிய முறை',
    'settings.simpleModeDesc': 'எளிதாகப் பயன்படுத்த பெரிய உரை மற்றும் சின்னங்கள்',
    'settings.notifications': 'அறிவிப்புகள்',
    'settings.pushNotifications': 'புஷ் அறிவிப்புகள்',
    'settings.pushNotificationsDesc': 'நினைவூற்றல்கள் மற்றும் புதுப்பிப்புகள்',
    'settings.emailNotifications': 'மின்னஞ்சல் அறிவிப்புகள்',
    'settings.emailNotificationsDesc': 'வாராந்திர சுருக்கம் மற்றும் எச்சரிக்கைகள்',
    'settings.exportData': 'எனது தரவை ஏற்றுக',
    'settings.deleteAccount': 'கணக்கை நீக்கு',
    'settings.logout': 'வெளியேறு',
    'settings.dataPrivacy': 'தரவு மற்றும் தனியுரிமை',
    'settings.accessibility': 'அணுகல்',
    'settings.profile': 'சுயவிவரம்',
    'settings.notSet': 'அமைக்கப்படவில்லை',
    'settings.deleteConfirmTitle': 'கணக்கை நீக்கவா?',
    'settings.deleteConfirmMsg': 'இது ஆவணங்கள், விண்ணப்பங்கள், நினைவூற்றல்கள் மற்றும் அரட்டை வரலாறு உட்பட உங்கள் எல்லா தரவையும் நிரந்தரமாக நீக்கும். இந்த செயலை செயல்தவிர்க்க முடியாது.',
    'settings.cancel': 'ரத்து',
    'settings.delete': 'நீக்கு',
    
    // Auth
    'auth.login': 'உள்நுழைய',
    'auth.signup': 'பதிவு செய்க',
    'auth.email': 'மின்னஞ்சல்',
    'auth.password': 'கடவுச்சொல்',
    'auth.name': 'முழு பெயர்',
    'auth.continue': 'தொடர்க',
    'auth.skip': 'இப்போதைக் கிடக்கட்டும்',
    
    // Onboarding
    'onboard.welcome': 'பாரத லென்ஸுக்கு வரவேற்கிறோம்',
    'onboard.subtitle': 'அரசு சேவைகளுக்கான உங்கள் AI வழிகாட்டி',
    'onboard.name': 'நாங்கள் உங்களை என்ன அழைக்க வேண்டும்?',
    'onboard.state': 'உங்கள் மாநிலத்தைத் தேர்வுசெய்க',
    'onboard.occupation': 'உங்கள் பணி என்ன?',
    'onboard.language': 'உங்கள் மொழியைத் தேர்வுசெய்க',
    'onboard.next': 'அடுத்து',
    'onboard.done': 'தொடங்குங்கள்',
    
    // Occupations
    'occupation.student': 'மாணவர்',
    'occupation.farmer': 'விவசாயி',
    'occupation.professional': 'தொழில்முறை',
    'occupation.entrepreneur': 'தொழிலதிபர்',
    'occupation.senior': 'மூத்த குடிமக்கள்',
    'occupation.other': 'மற்றவை',
    
    // Common
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'ஏதோ தவறு ஏற்பட்டது',
    'common.retry': 'மீண்டும் முயற்சிக்க',
    'common.cancel': 'ரத்து',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.close': 'மூடு',
    'common.search': 'தேடு',
    'common.viewAll': 'அனைத்தையும் காண்க',
    
    // Disclaimer
    'disclaimer.text': 'பாரத லென்ஸ் AI-உதவியை வழங்குகிறது மற்றும் இந்திய அரசுடன் தொடர்பற்றது. முக்கியமான செயல்களை எப்போதும் அதிகாரப்பூர்வ ஆதாரங்களால் சரிபார்க்கவும்.',
  },
  
  te: {
    // Navigation
    'nav.home': 'హోమ్',
    'nav.scan': 'స్కాన్',
    'nav.chat': 'చాట్',
    'nav.vault': 'పత్రాలు',
    'nav.schemes': 'పథకాలు',
    'nav.apps': 'దరఖాస్తులు',
    'nav.reminders': 'రిమైండర్లు',
    'nav.scam': 'మోసపు రక్షణ',
    'nav.family': 'కుటుంబం',
    'nav.settings': 'సెట్టింగులు',
    
    // Home
    'home.greeting': 'నమస్కారం',
    'home.goodMorning': 'శుభోదయం',
    'home.goodAfternoon': 'శుభ మధ్యాహ్నం',
    'home.goodEvening': 'శుభ సాయంత్రం',
    'home.upcomingReminders': 'రాబోయే రిమైండర్లు',
    'home.recommendedSchemes': 'మీకు అనువైన పథకాలు',
    'home.quickActions': 'త్వరిత చర్యలు',
    'home.noReminders': 'రాబోయే రిమైండర్లు లేవు',
    'home.noSchemes': 'తగిన పథకాలను చూడటానికి మీ ప్రొఫైల్‌ను పూర్తి చేయండి',
    'home.viewAll': 'అన్నీ చూడండి',
    'home.addReminder': 'రిమైండర్ జోడించు',
    'home.myApplications': 'నా దరఖాస్తులు',
    'home.trackProgress': 'మీ పురోగతిని ట్రాక్ చేయండి',
    'home.scamShield': 'మోసపు రక్షణ',
    'home.checkMessages': 'శంకించదగిన messagesని తనిఖీ చేయండి',
    'home.familyMode': 'కుటుంబ మోడ్',
    'home.manageDocs': 'కుటుంబ పత్రాలను నిర్వహించండి',
    'home.settings': 'సెట్టింగులు',
    'home.languageNotifications': 'భాష, నోటిఫికేషన్లు',
    'home.today': 'ఈ రోజు',
    'home.tomorrow': 'రేపు',
    'home.days': 'రోజులు',
    'home.verified': '✓ ధృవీకరించబడింది',
    
    // Scan
    'scan.title': 'పత్రం స్కాన్ చేయండి',
    'scan.takePhoto': 'ఫోటో తీయండి',
    'scan.uploadFile': 'ఫైల్ అప్లోడ్ చేయండి',
    'scan.processing': 'ప్రాసెస్ చేయబడుతోంది...',
    'scan.saveToVault': 'వాల్ట్‌లో సేవ్ చేయండి',
    'scan.createChecklist': 'చెక్‌లిస్ట్ తయారు చేయండి',
    'scan.explainMore': 'దీనిని వివరించండి',
    
    // Chat
    'chat.title': 'భారత్ లెన్స్ AI',
    'chat.placeholder': 'ప్రభుత్వ పథకాల గురించి అడగండి...',
    'chat.speak': 'మాట్లాడు',
    'chat.send': 'పంపు',
    'chat.newChat': 'కొత్త చాట్',
    'chat.generating': ' సమాధానం తయారు చేస్తున్నాను',
    'chat.pleaseWait': 'దయచేసి వేచి ఉండండి — ప్రభుత్వ వనరులను చదువుతున్నాను...',
    'chat.howCanIHelp': 'నేను మీకు ఎలా సహాయపడగలను?',
    'chat.askAbout': 'ప్రభుత్వ పథకాలు, పత్ర అవసరాలు, దరఖాస్తు ప్రక్రియల గురించి లేదా ఏదైనా ఇతర విషయాల గురించి అడగండి!',
    'chat.listen': '🔊 విను',
    'chat.stop': '🔊 ఆపు',
    'chat.aiGuidance': 'AI సమాధానాలు మార్గదర్శకత్వం కోసం మాత్రమే. ఎల్లప్పుడూ అధికారిక వనరులను ధృవీకరించండి.',
    'chat.replyIn': '{lang} లేదా ఏ భాషలోనైనా అడగండి • {lang} + Englishలో సమాధానం',
    'chat.suggestion1': 'రైతుల కోసం పథకాలను కనుగొనండి',
    'chat.suggestion2': 'పాస్‌పోర్ట్‌కు ఏ పత్రాలు కావుంది?',
    'chat.suggestion3': 'శంకించదగిన సందేశాన్ని తనిఖీ చేయండి',
    
    // Vault
    'vault.title': 'పత్ర భాండాగారం',
    'vault.empty': 'ఇంకా పత్రాలు సేవ్ చేయబడలేదు',
    'vault.expiry': 'గడువు',
    'vault.days': 'రోజులు',
    'vault.expired': 'గడువు ముగిసింది',
    'vault.delete': 'తొలగించు',
    'vault.confirmDelete': 'మీరు ఈ పత్రంను తొలగించాలనుకుంటున్నారా?',
    
    // Schemes
    'schemes.title': 'ప్రభుత్వ పథకాలు',
    'schemes.forYou': 'మీకోసం',
    'schemes.all': 'అన్ని పథకాలు',
    'schemes.verified': 'ధృవీకరించబడింది',
    'schemes.liveResult': 'లైవ్ ఫలితం',
    'schemes.lastChecked': 'చివరిసారిగా తనిఖీ చేయబడింది',
    'schemes.openOfficial': 'అధికారిక సైట్ తెరవండి',
    'schemes.documentsNeeded': 'సాధారణంగా అవసరమైన పత్రాలు',
    'schemes.eligibility': 'ఎవరు దరఖాస్తు చేయవచ్చు',
    
    // Applications
    'apps.title': 'నా దరఖాస్తులు',
    'apps.notStarted': 'ప్రారంభం కాలేదు',
    'apps.inProgress': 'పురోగతిలో ఉంది',
    'apps.submitted': 'సబ్మిట్ చేయబడింది',
    'apps.approved': 'ఆమోదించబడింది',
    'apps.rejected': 'తిరస్కరించబడింది',
    'apps.newApplication': 'కొత్త దరఖాస్తు',
    'apps.progress': 'పురోగతి',
    
    // Reminders
    'reminders.title': 'రిమైండర్లు',
    'reminders.add': 'రిమైండర్ జోడించు',
    'reminders.calendar': 'క్యాలెండర్',
    'reminders.list': 'జాబితా',
    'reminders.dueDate': 'గడువు',
    'reminders.markComplete': 'పూర్తయిందిగా గుర్తుంచు',
    
    // Scam
    'scam.title': 'మోసపు రక్షణ',
    'scam.subtitle': 'సందేశం లేదా లింక్ సురక్షితమా తనిఖీ చేయండి',
    'scam.pasteText': 'సందేశం లేదా లింక్ అతికించు',
    'scam.uploadImage': 'చిత్రం అప్లోడ్ చేయండి',
    'scam.checking': 'తనిఖీ చేస్తోంది...',
    'scam.safe': 'సురక్షితంగా కనిపిస్తుంది',
    'scam.suspicious': 'శంకించదగిన',
    'scam.danger': 'ఒకటి కావచ్చు',
    'scam.needsReview': 'మాన్యువల్ ధృవీకరణ అవసరం',
    'scam.disclaimer': 'ఇది AI మార్గదర్శకత్వం, చట్టపరమైన తీర్పు కాదు.',
    
    // Family
    'family.title': 'కుటుంబ మోడ్',
    'family.addMember': 'కుటుంబ సభ్యుడిని జోడించు',
    'family.invite': 'సభ్యుడిని ఆహ్వానించు',
    'family.switchUser': 'వినియోగదారిని మార్చు',
    
    // Settings
    'settings.title': 'సెట్టింగులు',
    'settings.customize': 'మీ భారత్ లెన్స్ అనుభవాన్ని అనుకూలీకరించండి',
    'settings.language': 'భాష',
    'settings.simpleMode': 'సాధారణ మోడ్',
    'settings.simpleModeDesc': 'ఈజీగా ఉపయోగించడానికి పెద్ద టెక్స్ట్ మరియు ఐకన్లు',
    'settings.notifications': 'నోటిఫికేషన్లు',
    'settings.pushNotifications': 'పుష్ నోటిఫికేషన్లు',
    'settings.pushNotificationsDesc': 'రిమైండర్లు మరియు అప్‌డేట్లు',
    'settings.emailNotifications': 'ఇమెయిల్ నోటిఫికేషన్లు',
    'settings.emailNotificationsDesc': 'వారపు సారాంశం మరియు హెచ్చరికలు',
    'settings.exportData': 'నా డేటా ఎగుమతి చేయండి',
    'settings.deleteAccount': 'ఖాతా తొలగించు',
    'settings.logout': 'లాగ్అవుట్',
    'settings.dataPrivacy': 'డేటా మరియు గోప్యత',
    'settings.accessibility': 'అందుబాటు',
    'settings.profile': 'ప్రొఫైల్',
    'settings.notSet': 'సెట్ చేయలేదు',
    'settings.deleteConfirmTitle': 'ఖాతా తొలగించాలా?',
    'settings.deleteConfirmMsg': 'ఇది మీ అన్ని డేటాను శాశ్వతంగా తొలగిస్తుంది — పత్రాలు, దరఖాస్తులు, రిమైండర్లు మరియు చాట్ చరిత్రతో సహా. ఈ చర్య రద్దు చేయలేము.',
    'settings.cancel': 'రద్దు చేయండి',
    'settings.delete': 'తొలగించు',
    
    // Auth
    'auth.login': 'లాగిన్',
    'auth.signup': 'సైన్ అప్',
    'auth.email': 'ఇమెయిల్',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.name': 'పూర్తి పేరు',
    'auth.continue': 'కొనసాగించు',
    'auth.skip': 'ఇప్పుడు వదలు',
    
    // Onboarding
    'onboard.welcome': 'భారత్ లెన్స్‌కు స్వాగతం',
    'onboard.subtitle': 'ప్రభుత్వ సేవలకు మీ AI గైడ్',
    'onboard.name': 'మిమ్మల్ని ఏమని పిలవాలి?',
    'onboard.state': 'మీ రాష్ట్రం ఎంచుకోండి',
    'onboard.occupation': 'మీ వృత్తి ఏమిటి?',
    'onboard.language': 'మీ భాషను ఎంచుకోండి',
    'onboard.next': 'తరువాత',
    'onboard.done': 'ప్రారంభించండి',
    
    // Occupations
    'occupation.student': 'విద్యార్థి',
    'occupation.farmer': 'రైతు',
    'occupation.professional': 'నిపుణుడు',
    'occupation.entrepreneur': 'వ్యవస్థాపకుడు',
    'occupation.senior': 'పెద్ద పౌరుడు',
    'occupation.other': 'ఇతర',
    
    // Common
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'ఏదో తప్పు జరిగింది',
    'common.retry': 'మళ్ళీ ప్రయత్నించు',
    'common.cancel': 'రద్దు',
    'common.save': 'సేవ్',
    'common.delete': 'తొలగించు',
    'common.edit': 'సవరించు',
    'common.close': 'మూసు',
    'common.search': 'వెతుకు',
    'common.viewAll': 'అన్నీ చూడండి',
    
    // Disclaimer
    'disclaimer.text': 'భారత్ లెన్స్ AI-అసిస్టెన్స్ అందిస్తుంది మరియు భారత ప్రభుత్వంతో అనుబంధం లేదు. కీలకమైన చర్యలను ఎల్లప్పుడూ అధికారిక వనరుల నుండి ధృవీకరించండి.',
  },
  
  bn: {
    // Navigation
    'nav.home': 'হোম',
    'nav.scan': 'স্ক্যান',
    'nav.chat': 'চ্যাট',
    'nav.vault': 'ডকুমেন্ট',
    'nav.schemes': 'প্রকল্প',
    'nav.apps': 'আবেদন',
    'nav.reminders': 'রিমাইন্ডার',
    'nav.scam': 'প্রতারণা স্ক্যান',
    'nav.family': 'পরিবার',
    'nav.settings': 'সেটিংস',
    
    // Home
    'home.greeting': 'নমস্কার',
    'home.goodMorning': 'সুপ্রভাত',
    'home.goodAfternoon': 'শুভ মধ্যাহ্ন',
    'home.goodEvening': 'শুভ সন্ধ্যা',
    'home.upcomingReminders': 'আসন্ন রিমাইন্ডার',
    'home.recommendedSchemes': 'আপনার জন্য প্রকল্প',
    'home.quickActions': 'দ্রুত কাজ',
    'home.noReminders': 'কোনো আসন্ন রিমাইন্ডার নেই',
    'home.noSchemes': 'প্রাসঙ্গিক প্রকল্প দেখতে আপনার প্রোফাইল সম্পূর্ণ করুন',
    'home.viewAll': 'সব দেখুন',
    'home.addReminder': 'রিমাইন্ডার যোগ করুন',
    'home.myApplications': 'আমার আবেদন',
    'home.trackProgress': 'আপনার অগ্রগতি ট্র্যাক করুন',
    'home.scamShield': 'প্রতারণা স্ক্যান',
    'home.checkMessages': 'সন্দেহজনক বার্তা পরীক্ষা করুন',
    'home.familyMode': 'পরিবার মোড',
    'home.manageDocs': 'পরিবারের নথি পরিচালনা করুন',
    'home.settings': 'সেটিংস',
    'home.languageNotifications': 'ভাষা, বিজ্ঞপ্তি',
    'home.today': 'আজ',
    'home.tomorrow': 'আগামীকাল',
    'home.days': 'দিন',
    'home.verified': '✓ যাচাইকৃত',
    
    // Scan
    'scan.title': 'ডকুমেন্ট স্ক্যান করুন',
    'scan.takePhoto': 'ফটো তুলুন',
    'scan.uploadFile': 'ফাইল আপলোড করুন',
    'scan.processing': 'প্রসেসিং...',
    'scan.saveToVault': 'ভল্টে সেভ করুন',
    'scan.createChecklist': 'চেকলিস্ট তৈরি করুন',
    'scan.explainMore': 'এটি ব্যাখ্যা করুন',
    
    // Chat
    'chat.title': 'ভারত লেন্স AI',
    'chat.placeholder': 'সরকারি প্রকল্প সম্পর্কে জিজ্ঞাসা করুন...',
    'chat.speak': 'বলুন',
    'chat.send': 'পাঠান',
    'chat.newChat': 'নতুন চ্যাট',
    'chat.generating': 'উত্তর তৈরি করছি',
    'chat.pleaseWait': 'অনুগ্রহ করে অপেক্ষা করুন — সরকারি উৎস পড়ছি...',
    'chat.howCanIHelp': 'আমি কীভাবে আপনাকে সাহায্য করতে পারি?',
    'chat.askAbout': 'সরকারি প্রকল্প, নথি প্রয়োজনীয়তা, আবেদন প্রক্রিয়া বা অন্য কিছু সম্পর্কে জিজ্ঞাসা করুন!',
    'chat.listen': '🔊 শুনুন',
    'chat.stop': '🔊 থামুন',
    'chat.aiGuidance': 'AI প্রতিক্রিয়াগুলো শুধুমাত্র নির্দেশিকার জন্য। সর্বদা অফিসিয়াল উৎস থেকে যাচাই করুন।',
    'chat.replyIn': '{lang} বা যেকোনো ভাষায় জিজ্ঞাসা করুন • {lang} + English-এ উত্তর দিচ্ছি',
    'chat.suggestion1': 'কৃষকদের জন্য প্রকল্প খুঁজুন',
    'chat.suggestion2': 'পাসপোর্টের জন্য কী কী ডকুমেন্ট লাগে?',
    'chat.suggestion3': 'সন্দেহজনক বার্তা পরীক্ষা করুন',
    
    // Vault
    'vault.title': 'ডকুমেন্ট ভল্ট',
    'vault.empty': 'এখনও কোনো নথি সেভ করা হয়নি',
    'vault.expiry': 'মেয়াদ শেষ',
    'vault.days': 'দিন',
    'vault.expired': 'মেয়াদ উত্তীর্ণ',
    'vault.delete': 'মুছুন',
    'vault.confirmDelete': 'আপনি কি এই নথিটি মুছতে চান?',
    
    // Schemes
    'schemes.title': 'সরকারি প্রকল্প',
    'schemes.forYou': 'আপনার জন্য',
    'schemes.all': 'সব প্রকল্প',
    'schemes.verified': 'যাচাইকৃত',
    'schemes.liveResult': 'সরাসরি ফলাফল',
    'schemes.lastChecked': 'সর্বশেষ পরীক্ষিত',
    'schemes.openOfficial': 'অফিসিয়াল সাইট খুলুন',
    'schemes.documentsNeeded': 'সাধারণত প্রয়োজনীয় নথি',
    'schemes.eligibility': 'কে আবেদন করতে পারবে',
    
    // Applications
    'apps.title': 'আমার আবেদন',
    'apps.notStarted': 'শুরু হয়নি',
    'apps.inProgress': 'চলমান',
    'apps.submitted': 'জমা দেওয়া হয়েছে',
    'apps.approved': 'অনুমোদিত',
    'apps.rejected': 'বাতিল',
    'apps.newApplication': 'নতুন আবেদন',
    'apps.progress': 'অগ্রগতি',
    
    // Reminders
    'reminders.title': 'রিমাইন্ডার',
    'reminders.add': 'রিমাইন্ডার যোগ করুন',
    'reminders.calendar': 'ক্যালেন্ডার',
    'reminders.list': 'তালিকা',
    'reminders.dueDate': 'শেষ তারিখ',
    'reminders.markComplete': 'সম্পূর্ণ চিহ্নিত করুন',
    
    // Scam
    'scam.title': 'প্রতারণা স্ক্যান',
    'scam.subtitle': 'বার্তা বা লিংক নিরাপদ কিনা পরীক্ষা করুন',
    'scam.pasteText': 'বার্তা বা লিংক পেস্ট করুন',
    'scam.uploadImage': 'ছবি আপলোড করুন',
    'scam.checking': 'পরীক্ষা করছি...',
    'scam.safe': 'নিরাপদ মনে হচ্ছে',
    'scam.suspicious': 'সন্দেহজনক',
    'scam.danger': 'সম্ভাব্য প্রতারণা',
    'scam.needsReview': 'ম্যানুয়াল যাচাই প্রয়োজন',
    'scam.disclaimer': 'এটি AI নির্দেশিকা, আইনি রায় নয়।',
    
    // Family
    'family.title': 'পরিবার মোড',
    'family.addMember': 'পরিবারের সদস্য যোগ করুন',
    'family.invite': 'সদস্য আমন্ত্রণ করুন',
    'family.switchUser': 'ব্যবহারকারী পরিবর্তন করুন',
    
    // Settings
    'settings.title': 'সেটিংস',
    'settings.customize': 'আপনার ভারত লেন্স অভিজ্ঞতা কাস্টমাইজ করুন',
    'settings.language': 'ভাষা',
    'settings.simpleMode': 'সহজ মোড',
    'settings.simpleModeDesc': 'সহজ ব্যবহারের জন্য বড় টেক্সট এবং আইকন',
    'settings.notifications': 'বিজ্ঞপ্তি',
    'settings.pushNotifications': 'পুশ নোটিফিকেশন',
    'settings.pushNotificationsDesc': 'রিমাইন্ডার এবং আপডেট',
    'settings.emailNotifications': 'ইমেইল নোটিফিকেশন',
    'settings.emailNotificationsDesc': 'সাপ্তাহিক সারাংশ এবং সতর্কতা',
    'settings.exportData': 'আমার ডেটা এক্সপোর্ট করুন',
    'settings.deleteAccount': 'অ্যাকাউন্ট মুছুন',
    'settings.logout': 'লগ আউট',
    'settings.dataPrivacy': 'ডেটা ও গোপনীয়তা',
    'settings.accessibility': 'অ্যাক্সেসিবিলিটি',
    'settings.profile': 'প্রোফাইল',
    'settings.notSet': 'সেট করা হয়নি',
    'settings.deleteConfirmTitle': 'অ্যাকাউন্ট মুছবেন?',
    'settings.deleteConfirmMsg': 'এটি আপনার সমস্ত ডেটা স্থায়ীভাবে মুছে দেবে — নথি, আবেদন, রিমাইন্ডার এবং চ্যাট ইতিহাস সহ। এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না।',
    'settings.cancel': 'বাতিল',
    'settings.delete': 'মুছুন',
    
    // Auth
    'auth.login': 'লগইন',
    'auth.signup': 'সাইন আপ',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.name': 'পূর্ণ নাম',
    'auth.continue': 'চালিয়ে যান',
    'auth.skip': 'এড়িয়ে যান',
    
    // Onboarding
    'onboard.welcome': 'ভারত লেন্সে স্বাগতম',
    'onboard.subtitle': 'সরকারি পরিষেবার জন্য আপনার AI গাইড',
    'onboard.name': 'আমাদের আপনাকে কী বলা উচিত?',
    'onboard.state': 'আপনার রাজ্য নির্বাচন করুন',
    'onboard.occupation': 'আপনার পেশা কী?',
    'onboard.language': 'আপনার ভাষা বেছে নিন',
    'onboard.next': 'পরবর্তী',
    'onboard.done': 'শুরু করুন',
    
    // Occupations
    'occupation.student': 'ছাত্র',
    'occupation.farmer': 'কৃষক',
    'occupation.professional': 'পেশাদার',
    'occupation.entrepreneur': 'উদ্যোক্তা',
    'occupation.senior': 'প্রবীণ নাগরিক',
    'occupation.other': 'অন্যান্য',
    
    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'কিছু ভুল হয়েছে',
    'common.retry': 'আবার চেষ্টা করুন',
    'common.cancel': 'বাতিল',
    'common.save': 'সেভ করুন',
    'common.delete': 'মুছুন',
    'common.edit': 'সম্পাদনা',
    'common.close': 'বন্ধ করুন',
    'common.search': 'অনুসন্ধান',
    'common.viewAll': 'সব দেখুন',
    
    // Disclaimer
    'disclaimer.text': 'ভারত লেন্স AI-সহায়তা প্রদান করে এবং ভারত সরকারের সাথে সম্পর্কিত নয়। গুরুত্বপূর্ণ কার্যক্রম সর্বদা অফিসিয়াল উৎস থেকে যাচাই করুন।',
  },
  
  mr: {
    // Navigation
    'nav.home': 'होम',
    'nav.scan': 'स्कॅन',
    'nav.chat': 'चॅट',
    'nav.vault': 'दस्तऐवज',
    'nav.schemes': 'योजना',
    'nav.apps': 'अर्ज',
    'nav.reminders': 'स्मरणपत्र',
    'nav.scam': 'घोळ्यांचे संरक्षण',
    'nav.family': 'कुटुंब',
    'nav.settings': 'सेटिंग्ज',
    
    // Home
    'home.greeting': 'नमस्कार',
    'home.goodMorning': 'सुप्रभात',
    'home.goodAfternoon': 'शुभ दिवस',
    'home.goodEvening': 'शुभ संध्याकाळ',
    'home.upcomingReminders': 'आगामी स्मरणपत्रे',
    'home.recommendedSchemes': 'आपल्यासाठी योजना',
    'home.quickActions': 'जलद कार्ये',
    'home.noReminders': 'कोणतीही आगामी स्मरणपत्रे नाहीत',
    'home.noSchemes': 'संबंधित योजना पाहण्यासाठी आपले प्रोफाइल पूर्ण करा',
    'home.viewAll': 'सर्व पाहा',
    'home.addReminder': 'स्मरणपत्र जोडा',
    'home.myApplications': 'माझे अर्ज',
    'home.trackProgress': 'आपली प्रगती ट्रॅक करा',
    'home.scamShield': 'घोळ्यांपासून संरक्षण',
    'home.checkMessages': 'संशयास्पद संदेश तपासा',
    'home.familyMode': 'कुटुंब मोड',
    'home.manageDocs': 'कुटुंबीय दस्तऐवज व्यवस्थापित करा',
    'home.settings': 'सेटिंग्ज',
    'home.languageNotifications': 'भाषा, सूचना',
    'home.today': 'आज',
    'home.tomorrow': 'उद्या',
    'home.days': 'दिवस',
    'home.verified': '✓ सत्यापित',
    
    // Scan
    'scan.title': 'दस्तऐवज स्कॅन करा',
    'scan.takePhoto': 'फोटो काढा',
    'scan.uploadFile': 'फाइल अपलोड करा',
    'scan.processing': 'प्रक्रिया होत आहे...',
    'scan.saveToVault': 'वॉल्टमध्ये सेव करा',
    'scan.createChecklist': 'चेकलिस्ट तयार करा',
    'scan.explainMore': 'याचे स्पष्टीकरण द्या',
    
    // Chat
    'chat.title': 'भारत लेन्स AI',
    'chat.placeholder': 'सरकारी योजनांबद्दल विचारा...',
    'chat.speak': 'बोला',
    'chat.send': 'पाठवा',
    'chat.newChat': 'नवीन चॅट',
    'chat.generating': 'उत्तर तयार करत आहे',
    'chat.pleaseWait': 'कृपया प्रतीक्षा करा — सरकारी स्रोत वाचत आहे...',
    'chat.howCanIHelp': 'मी आपली कशी मदत करू शकतो?',
    'chat.askAbout': 'सरकारी योजना, दस्तऐवज आवश्यकता, अर्ज प्रक्रिया किंवा इतर कोणत्याही गोष्टी विचारा!',
    'chat.listen': '🔊 ऐका',
    'chat.stop': '🔊 थांबा',
    'chat.aiGuidance': 'AI प्रतिसाद हे केवळ मार्गदर्शनासाठी आहेत. नेहमी अधिकृत स्रोतांकडून पडताळा.',
    'chat.replyIn': '{lang} किंवा कोणत्याही भाषेत विचारा • {lang} + English मध्ये उत्तर देत आहे',
    'chat.suggestion1': 'शेतकऱ्यांसाठी योजना शोधा',
    'chat.suggestion2': 'पासपोर्टसाठी कोणते दस्तऐवज लागतात?',
    'chat.suggestion3': 'संशयास्पद संदेश तपासा',
    
    // Vault
    'vault.title': 'दस्तऐवज तिजोरी',
    'vault.empty': 'अद्याप कोणतेही दस्तऐवज सेव केलेले नाहीत',
    'vault.expiry': 'कालबाह्य होत आहे',
    'vault.days': 'दिवस',
    'vault.expired': 'कालबाह्य',
    'vault.delete': 'हटवा',
    'vault.confirmDelete': 'तुम्ही हा दस्तऐवज हटवू इच्छिता?',
    
    // Schemes
    'schemes.title': 'सरकारी योजना',
    'schemes.forYou': 'तुमच्यासाठी',
    'schemes.all': 'सर्व योजना',
    'schemes.verified': 'सत्यापित',
    'schemes.liveResult': 'लाइव्ह परिणाम',
    'schemes.lastChecked': 'शेवटची तपासणी',
    'schemes.openOfficial': 'अधिकृत साइट उघडा',
    'schemes.documentsNeeded': 'सामान्यतः आवश्यक दस्तऐवज',
    'schemes.eligibility': 'कोणी अर्ज करू शकतो',
    
    // Applications
    'apps.title': 'माझे अर्ज',
    'apps.notStarted': 'सुरू झाले नाही',
    'apps.inProgress': 'प्रगतीवर',
    'apps.submitted': 'सबमिट केले',
    'apps.approved': 'मंजूर',
    'apps.rejected': 'नाकारले',
    'apps.newApplication': 'नवीन अर्ज',
    'apps.progress': 'प्रगती',
    
    // Reminders
    'reminders.title': 'स्मरणपत्रे',
    'reminders.add': 'स्मरणपत्र जोडा',
    'reminders.calendar': 'कॅलेंडर',
    'reminders.list': 'यादी',
    'reminders.dueDate': 'शेवटची तारीख',
    'reminders.markComplete': 'पूर्ण केले म्हणून चिन्हांकित करा',
    
    // Scam
    'scam.title': 'घोळ्यांपासून संरक्षण',
    'scam.subtitle': 'संदेश किंवा लिंक सुरक्षित आहे की नाही तपासा',
    'scam.pasteText': 'संदेश किंवा लिंक पेस्ट करा',
    'scam.uploadImage': 'प्रतिमा अपलोड करा',
    'scam.checking': 'तपासत आहे...',
    'scam.safe': 'सुरक्षित दिसते',
    'scam.suspicious': 'संशयास्पद',
    'scam.danger': 'शक्यतो घोळा',
    'scam.needsReview': 'मॅन्युअल पडताळणी आवश्यक',
    'scam.disclaimer': 'हे AI मार्गदर्शन आहे, कायदेशीर निर्णय नाही.',
    
    // Family
    'family.title': 'कुटुंब मोड',
    'family.addMember': 'कुटुंब सदस्य जोडा',
    'family.invite': 'सदस्य आमंत्रित करा',
    'family.switchUser': 'वापरकर्ता बदला',
    
    // Settings
    'settings.title': 'सेटिंग्ज',
    'settings.customize': 'तुमचा भारत लेन्स अनुभव सानुकूलित करा',
    'settings.language': 'भाषा',
    'settings.simpleMode': 'सोपा मोड',
    'settings.simpleModeDesc': 'सुलभ वापरासाठी मोठे मजकूर आणि चिन्हे',
    'settings.notifications': 'सूचना',
    'settings.pushNotifications': 'पुश सूचना',
    'settings.pushNotificationsDesc': 'स्मरणपत्रे आणि अपडेट',
    'settings.emailNotifications': 'ईमेल सूचना',
    'settings.emailNotificationsDesc': 'साप्ताहिक सारांश आणि इशारा',
    'settings.exportData': 'माझा डेटा निर्यात करा',
    'settings.deleteAccount': 'खाते हटवा',
    'settings.logout': 'लॉग आउट',
    'settings.dataPrivacy': 'डेटा आणि गोपनीयता',
    'settings.accessibility': 'सुलभता',
    'settings.profile': 'प्रोफाइल',
    'settings.notSet': 'सेट केले नाही',
    'settings.deleteConfirmTitle': 'खाते हटवायचे?',
    'settings.deleteConfirmMsg': 'हे तुमचा सर्व डेटा कायमस्वरूपी हटवेल — दस्तऐवज, अर्ज, स्मरणपत्रे आणि चॅट इतिहासासहित. ही क्रिया पूर्ववत करता येणार नाही.',
    'settings.cancel': 'रद्द करा',
    'settings.delete': 'हटवा',
    
    // Auth
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूर्ण नाव',
    'auth.continue': 'सुरू ठेवा',
    'auth.skip': 'सध्या वगळा',
    
    // Onboarding
    'onboard.welcome': 'भारत लेन्समध्ये स्वागत आहे',
    'onboard.subtitle': 'सरकारी सेवांसाठी तुमचे AI मार्गदर्शन',
    'onboard.name': 'आम्ही तुम्हाला काय म्हणू?',
    'onboard.state': 'तुमचे राज्य निवडा',
    'onboard.occupation': 'तुमचे व्यवसाय काय आहे?',
    'onboard.language': 'तुमची भाषा निवडा',
    'onboard.next': 'पुढे',
    'onboard.done': 'सुरू करा',
    
    // Occupations
    'occupation.student': 'विद्यार्थी',
    'occupation.farmer': 'शेतकरी',
    'occupation.professional': 'व्यावसायिक',
    'occupation.entrepreneur': 'उद्योजक',
    'occupation.senior': 'ज्येष्ठ नागरिक',
    'occupation.other': 'इतर',
    
    // Common
    'common.loading': 'लोड होत आहे...',
    'common.error': 'काहीतरी चूक झाली',
    'common.retry': 'पुन्हा प्रयत्न करा',
    'common.cancel': 'रद्द करा',
    'common.save': 'सेव करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादित करा',
    'common.close': 'बंद करा',
    'common.search': 'शोधा',
    'common.viewAll': 'सर्व पाहा',
    
    // Disclaimer
    'disclaimer.text': 'भारत लेन्स AI-सहायता प्रदान करते आणि भारत सरकारीशी संबंधित नाही. महत्वाच्या कार्यांसाठी नेहमी अधिकृत स्रोतांकडून पडताळा घ्या.',
  },
};

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Helper to get greeting based on time of day
export function getGreeting(lang: Language): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.goodMorning', lang);
  if (hour < 17) return t('home.goodAfternoon', lang);
  return t('home.goodEvening', lang);
}

// Helper to format translation with variables
export function tf(key: TranslationKey, lang: Language, vars: Record<string, string>): string {
  let text = t(key, lang);
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

export function getLanguageName(code: Language): string {
  return LANGUAGES.find(l => l.code === code)?.nativeName || code;
}
