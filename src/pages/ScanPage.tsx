import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle, Search, FileCheck, ChevronDown, ChevronUp, Eye, Shield, Link as LinkIcon, Info } from 'lucide-react';
import { db } from '@doable/data';

const AZURE_VISION_KEY = 'Fl2AbOqkbelMbWe6oGbxZtDVhoND2XOf7o1lExllXkWY9PIYjLEaJQQJ99CGACGhslBXJ3w3AAAFACOGJv24';
const AZURE_VISION_ENDPOINT = 'https://internshipvisionapi.cognitiveservices.azure.com';

interface SchemeInfo {
  name: string;
  category: string;
  ministry: string;
  official_url: string;
  apply_url: string;
  eligibility: string;
  benefits: string;
  documents_required: string;
  how_to_apply: string;
  status: string;
  description: string;
  keywords: string[];
}

const KNOWN_SCHEMES: SchemeInfo[] = [
  {
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    category: 'housing',
    ministry: 'Ministry of Housing & Urban Affairs',
    official_url: 'https://pmaymis.gov.in',
    apply_url: 'https://pmaymis.gov.in/ApplyOnline.aspx',
    eligibility: 'Economically Weaker Section (EWS), Low Income Group (LIG), Middle Income Group (MIG) with no pucca house',
    benefits: 'Subsidy on home loan interest up to Rs.2.67 lakh, affordable housing construction',
    documents_required: 'Aadhaar Card, Income Certificate, Bank Account Details, Photograph, Caste Certificate',
    how_to_apply: 'Apply through PMAY-MIS portal, visit CSC center, or approach empanelled banks',
    status: 'Active',
    description: 'Flagship housing scheme providing affordable housing with interest subsidy on home loans to eligible beneficiaries.',
    keywords: ['pmay', 'pradhan mantri awas', 'housing for all', 'affordable housing', 'pucca house', 'home loan subsidy', 'gramin awas', 'urban housing']
  },
  {
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'agriculture',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    official_url: 'https://pmkisan.gov.in',
    apply_url: 'https://pmkisan.gov.in/RegisterFarmer.aspx',
    eligibility: 'Small and marginal farmers with cultivable land, subject to certain exclusions',
    benefits: 'Rs.6,000 per year in three equal installments directly to bank account',
    documents_required: 'Aadhaar Card, Bank Account Details, Land Records, Photograph, Mobile Number',
    how_to_apply: 'Register at PM-KISAN portal, visit nearest CSC/VLW office, or apply through state agriculture department',
    status: 'Active',
    description: 'Direct income support of Rs.6,000 per year to farmer families, transferred in three equal installments of Rs.2,000 each.',
    keywords: ['pmkisan', 'kisan samman', 'farmer income', 'kisan credit', 'agricultural scheme', 'farmer welfare', 'kisan registry']
  },
  {
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)',
    category: 'health',
    ministry: 'Ministry of Health & Family Welfare',
    official_url: 'https://pmjay.gov.in',
    apply_url: 'https://pmjay.gov.in/abhacheck',
    eligibility: 'Families identified based on SECC database - deprived rural families and identified urban occupational categories',
    benefits: 'Health insurance cover of Rs.5 lakh per family per year for secondary and tertiary care hospitalization',
    documents_required: 'Aadhaar Card, Ration Card, SECC identification, Bank Account Details',
    how_to_apply: 'Check eligibility at pmjay.gov.in, visit nearest CSC, or go to any empanelled hospital for enrollment',
    status: 'Active',
    description: "World's largest health insurance scheme providing Rs.5 lakh coverage per family per year for secondary and tertiary care hospitalization.",
    keywords: ['pmjay', 'ayushman bharat', 'jan arogya', 'health insurance', 'medical scheme', '5 lakh cover', 'hospitalization']
  },
  {
    name: 'Pradhan Mantri MUDRA Yojana',
    category: 'employment',
    ministry: 'Ministry of Finance',
    official_url: 'https://mudra.org.in',
    apply_url: 'https://mudra.org.in/applynow',
    eligibility: 'Non-corporate, non-farm small/micro enterprises, shopkeepers, vendors, artisans, truck operators',
    benefits: 'Loans up to Rs.10 lakh without collateral under Shishu, Kishore and Tarun categories',
    documents_required: 'Aadhaar Card, PAN Card, Business Plan, Bank Account, Address Proof',
    how_to_apply: 'Apply through MUDRA portal, approach any bank, NBFC, or MUDRA lending partner',
    status: 'Active',
    description: 'Loans up to Rs.10 lakh to non-corporate small businesses without requiring any collateral, supporting entrepreneurship.',
    keywords: ['mudra', 'mudra yojana', 'business loan', 'startup loan', 'small business', 'shishu kishore tarun', 'entrepreneur', 'self employment']
  },
  {
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    category: 'skill',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    official_url: 'https://pmkvyskills.in',
    apply_url: 'https://pmkvyskills.in/apply',
    eligibility: 'Youth seeking skill training, school/college dropouts, unemployed youth, migrants, factory workers',
    benefits: 'Free skill training, industry-recognized certification, placement assistance, monetary reward for some courses',
    documents_required: 'Aadhaar Card, Educational Documents, Bank Account, Photograph',
    how_to_apply: 'Register at PMKVY portal, visit nearest CSC, or contact nearest Skill India Center',
    status: 'Active',
    description: 'Skill development scheme providing free training, certification, and placement assistance to make youth industry-ready.',
    keywords: ['pmkvy', 'skill development', 'kaushal vikas', 'skill training', 'vocational training', 'job oriented', 'certification']
  },
  {
    name: 'Startup India',
    category: 'startup',
    ministry: 'Department for Promotion of Industry and Internal Trade',
    official_url: 'https://startupindia.gov.in',
    apply_url: 'https://startupindia.gov.in/register',
    eligibility: 'Entities incorporated not older than 10 years, turnover less than Rs.100 crore, working towards innovation',
    benefits: 'Tax exemptions for 3 years, easier compliance, access to funding, intellectual property support',
    documents_required: 'Certificate of Incorporation, PAN, Brief business plan, Details of founders',
    how_to_apply: 'Register on Startup India portal with required documents, get DPIIT recognition',
    status: 'Active',
    description: 'Comprehensive initiative to support startups with tax benefits, funding access, regulatory reforms, and mentorship.',
    keywords: ['startup india', 'start-up', 'entrepreneur', 'new business', 'dpiit', 'startup recognition', 'fund of funds']
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    category: 'financial',
    ministry: 'Ministry of Finance',
    official_url: 'https://www.indiapost.gov.in',
    apply_url: 'Visit nearest Post Office or authorized bank',
    eligibility: 'Parents/guardians of girl child below 10 years of age, maximum 2 girl children per family',
    benefits: 'Attractive interest rate, tax benefits under 80C, maturity amount for girl child education/marriage',
    documents_required: 'Girl child birth certificate, Aadhaar Card (of parent and child), Address Proof, Photograph',
    how_to_apply: 'Visit nearest Post Office with required documents, account can be opened in name of girl child',
    status: 'Active',
    description: 'Savings scheme for the girl child with attractive interest rates and tax benefits to secure her future.',
    keywords: ['sukanya', 'samriddhi', 'girl child', 'daughter', 'post office savings', 'education fund']
  },
  {
    name: 'Beti Bachao Beti Padhao',
    category: 'women',
    ministry: 'Ministry of Women & Child Development',
    official_url: 'https://wcd.nic.in',
    apply_url: 'Contact local ICDS/Anganwadi center or district office',
    eligibility: 'Girls from birth till class 12, pregnant and lactating mothers',
    benefits: 'Educational support, survival initiatives, safety and security programs, awareness campaigns',
    documents_required: 'Birth certificate, Aadhaar Card, School enrollment documents, Mother Child Protection Card',
    how_to_apply: 'Contact nearest Anganwadi center, district Women & Child office, or call helpline',
    status: 'Active',
    description: 'Scheme for survival, education and empowerment of the girl child with focus on improving child sex ratio.',
    keywords: ['beti bachao', 'beti padhao', 'girl child welfare', 'child sex ratio', 'empowerment', 'education']
  },
  {
    name: 'Janani Suraksha Yojana',
    category: 'health',
    ministry: 'Ministry of Health & Family Welfare',
    official_url: 'https://nhm.gov.in',
    apply_url: 'Visit nearest government hospital or health center',
    eligibility: 'Pregnant women from BPL families, all SC/ST pregnant women, institutional deliveries',
    benefits: 'Cash assistance of Rs.700-1400 for institutional delivery, free delivery services, transport support',
    documents_required: 'BPL Card/SC-ST Certificate, Bank Account, Aadhaar Card, Janani Suraksha Card',
    how_to_apply: 'Register at government hospital or health center during pregnancy, cash transferred after delivery',
    status: 'Active',
    description: 'Safe motherhood intervention program promoting institutional delivery to reduce maternal and infant mortality.',
    keywords: ['janani', 'maternal health', 'delivery', 'pregnancy', 'institutional delivery', 'maternity benefit', 'jsy']
  },
  {
    name: 'UDAN (Ude Desh ka Aam Naagrik)',
    category: 'general',
    ministry: 'Ministry of Civil Aviation',
    official_url: 'https://udanaaviator.com',
    apply_url: 'Book through airline websites or travel agents participating in UDAN',
    eligibility: 'All passengers flying on UDAN routes (specially priced routes)',
    benefits: 'Affordable air travel with fares capped at Rs.2,500 for 1 hour flights on RCS routes',
    documents_required: 'Valid ID proof (Aadhaar/Passport/Voter ID/PAN Card)',
    how_to_apply: 'Book flights on UDAN routes through airline websites or authorized travel agents',
    status: 'Active',
    description: 'Regional connectivity scheme making air travel affordable for common people by connecting underserved airports.',
    keywords: ['udan', 'cheap flight', 'air travel', 'regional connectivity', 'rcs', 'affordable aviation']
  },
  {
    name: 'Pradhan Mantri Jan Dhan Yojana',
    category: 'financial',
    ministry: 'Ministry of Finance',
    official_url: 'https://pmjdy.gov.in',
    apply_url: 'Visit any bank branch with zero balance account facility',
    eligibility: 'All Indian citizens without a bank account, one account per person',
    benefits: 'Zero balance bank account, RuPay debit card, Rs.2 lakh accidental insurance, Rs.30,000 life insurance',
    documents_required: 'Aadhaar Card, Photograph, Nominee details, Address Proof',
    how_to_apply: 'Visit any bank branch with Aadhaar Card, account opened same day with Rupay debit card',
    status: 'Active',
    description: 'National mission for financial inclusion providing universal access to banking services with insurance coverage.',
    keywords: ['jan dhan', 'bank account', 'zero balance', 'financial inclusion', 'rupay card', 'pmjdy']
  },
  {
    name: 'Kisan Credit Card',
    category: 'agriculture',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    official_url: 'https://pmkisan.gov.in',
    apply_url: 'Apply at nearest bank branch, PACS, or through KCC camp',
    eligibility: 'All farmers - individuals/joint owners, tenant farmers, sharecroppers, fishers, animal husbandry farmers',
    benefits: 'Credit up to Rs.3 lakh at subsidized interest rates, flexible repayment, crop insurance',
    documents_required: 'Land records, Aadhaar Card, Photograph, Bank Account, Caste Certificate',
    how_to_apply: 'Apply at bank branch with required documents or through Kisan Credit Card camp in village',
    status: 'Active',
    description: 'Easy credit access for farmers with flexible repayment options and insurance coverage for crops and livestock.',
    keywords: ['kisan credit card', 'kcc', 'farm credit', 'agricultural loan', 'crop loan', 'production credit']
  },
  {
    name: 'Swachh Bharat Mission',
    category: 'general',
    ministry: 'Ministry of Jal Shakti',
    official_url: 'https://swachhbharatmission.gov.in',
    apply_url: 'Contact local gram panchayat/municipality office',
    eligibility: 'Households without toilet facility in rural areas, urban households, schools, anganwadis',
    benefits: 'Subsidy for toilet construction (Rs.12,000 in rural areas), incentive for ODF compliance',
    documents_required: 'Aadhaar Card, Bank Account, Photographs of toilet construction, Gram Panchayat verification',
    how_to_apply: 'Contact Gram Panchayat or Municipal Corporation office, apply through SBM portal',
    status: 'Active',
    description: 'Sanitation mission eliminating open defecation and promoting hygiene through toilet construction and waste management.',
    keywords: ['swachh bharat', 'toilet', 'sanitation', 'odf', 'swachhta', 'ihhl', 'individual household latrine']
  },
  {
    name: 'National Scholarship Portal (NSP)',
    category: 'education',
    ministry: 'Ministry of Social Justice & Empowerment',
    official_url: 'https://scholarships.gov.in',
    apply_url: 'Apply through National Scholarship Portal',
    eligibility: 'Students from SC/OBC/NT/minority communities with family income below prescribed limit',
    benefits: 'Tuition fee reimbursement, maintenance allowance, book grant, scholarship to bank account',
    documents_required: 'Caste Certificate, Income Certificate, Previous year marksheet, Aadhaar Card, Bank Account',
    how_to_apply: 'Apply through National Scholarship Portal (NSP) before deadline, verify through institution',
    status: 'Active',
    description: 'One-stop portal for scholarships from various ministries providing financial assistance to eligible students.',
    keywords: ['national scholarship', 'post matric scholarship', 'pre matric scholarship', 'nsp', 'minority scholarship', 'central scholarship']
  },
  {
    name: 'DigiLocker',
    category: 'general',
    ministry: 'Ministry of Electronics & Information Technology',
    official_url: 'https://digitallocker.gov.in',
    apply_url: 'Register at digitallocker.gov.in or through mobile app',
    eligibility: 'All Indian citizens with valid Aadhaar Card',
    benefits: 'Free digital document storage, secure document sharing with agencies, access to government documents',
    documents_required: 'Aadhaar Card (mandatory for registration)',
    how_to_apply: 'Register online at DigiLocker website or download mobile app, link with Aadhaar',
    status: 'Active',
    description: 'Digital document wallet for storing and sharing official documents securely with government agencies.',
    keywords: ['digilocker', 'digital locker', 'document storage', 'digital documents', 'e document', 'paperless']
  },
  {
    name: 'UJALA (Energy Efficient Lighting)',
    category: 'general',
    ministry: 'Ministry of Power',
    official_url: 'https://www.energise.co.in',
    apply_url: 'Visit nearest DISCOM office or UJALA distribution center',
    eligibility: 'All domestic electricity consumers',
    benefits: 'Energy-efficient LED bulbs at highly subsidized rates, reduced electricity bills',
    documents_required: 'Electricity Bill, Aadhaar Card (for verification)',
    how_to_apply: 'Visit UJALA distribution center with electricity bill, purchase LED bulbs at subsidized rate',
    status: 'Active',
    description: 'Nationwide LED bulb distribution program for energy conservation reducing electricity consumption and bills.',
    keywords: ['ujala', 'led bulb', 'energy efficient', 'electricity saving', 'light bulb', 'energise']
  },
  {
    name: 'Pradhan Mantri Vaya Vandana Yojana',
    category: 'financial',
    ministry: 'Life Insurance Corporation of India',
    official_url: 'https://licindia.in',
    apply_url: 'Contact nearest LIC office or authorized LIC agent',
    eligibility: 'Senior citizens aged 60 years and above',
    benefits: 'Guaranteed return of 7.4% p.a., pension payments, maturity benefit, death benefit',
    documents_required: 'Aadhaar Card, PAN Card, Age Proof, Bank Account Details, Medical Certificate',
    how_to_apply: 'Visit LIC office with required documents, purchase pension policy',
    status: 'Active',
    description: 'Pension scheme exclusively for senior citizens with guaranteed returns and safety of investment.',
    keywords: ['vaya vandana', 'senior citizen', 'pension scheme', 'elderly', 'lic pension', 'retirement pension', 'pmvvy']
  },
  {
    name: 'Atal Innovation Mission (AIM)',
    category: 'education',
    ministry: 'NITI Aayog',
    official_url: 'https://aim.gov.in',
    apply_url: 'Apply through AIM portal or contact state nodal officer',
    eligibility: 'Schools, students, entrepreneurs, startups, tinkering labs',
    benefits: 'Setting up Atal Tinkering Labs in schools, incubation support, mentorship, innovation challenges',
    documents_required: 'School details, student enrollment, infrastructure documents, innovation proposal',
    how_to_apply: 'Apply through AIM portal for Atal Tinkering Lab or incubation programs',
    status: 'Active',
    description: 'Promoting innovation ecosystem through Atal Tinkering Labs in schools and incubation support for startups.',
    keywords: ['atal innovation', 'tinkering lab', 'atl', 'startup support', 'innovation mission', 'niti aayog']
  },
  {
    name: 'Prime Minister Employment Generation Programme (PMEGP)',
    category: 'employment',
    ministry: 'Ministry of Micro, Small and Medium Enterprises',
    official_url: 'https://kvic.nic.in',
    apply_url: 'Apply through KVIC portal or nearest bank',
    eligibility: 'Any individual above 18 years, existing entrepreneurs not eligible, minimum educational qualification for some categories',
    benefits: 'Margin money subsidy up to 35% of project cost (25% for women, SC/ST, OBC), remaining from bank as loan',
    documents_required: 'Aadhaar Card, Caste Certificate, Project report, Bank Account, Address Proof, Educational Certificate',
    how_to_apply: 'Apply online through KVIC portal or approach nearest bank with project proposal',
    status: 'Active',
    description: 'Credit-linked subsidy program for generating employment by setting up new micro-enterprises.',
    keywords: ['pmegp', 'employment generation', 'self employment', 'micro enterprise', 'kvic', 'bank loan', 'subsidy']
  }
];

interface AnalysisResult {
  is_scam: boolean;
  scam_score: number;
  document_type: string;
  extracted_text: string;
  summary: string;
  scam_warnings: string[];
  schemes_found: SchemeInfo[];
  recommendations: string[];
}

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [stage, setStage] = useState('');
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();

  async function extractTextWithAzure(imageData: string): Promise<string> {
    const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });

    try {
      const readResponse = await fetch(AZURE_VISION_ENDPOINT + '/vision/v3.2/read/analyze?language=en', {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
          'Content-Type': 'application/octet-stream'
        },
        body: imageBlob
      });

      if (readResponse.ok) {
        const operationLocation = readResponse.headers.get('Operation-Location');
        if (operationLocation) {
          for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const statusResponse = await fetch(operationLocation, {
              headers: { 'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY }
            });
            const statusData = await statusResponse.json();
            if (statusData.status === 'succeeded') {
              const lines = statusData.analyzeResult?.readResults?.map((r: any) => 
                r.lines?.map((l: any) => l.text).join('\n') || ''
              ).join('\n') || '';
              return lines.trim();
            } else if (statusData.status === 'failed') {
              break;
            }
          }
        }
      }
    } catch (e) {
      console.log('Read API failed, trying OCR...');
    }

    const ocrResponse = await fetch(AZURE_VISION_ENDPOINT + '/vision/v3.2/ocr?language=unk&detectOrientation=true', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBlob
    });

    if (!ocrResponse.ok) {
      throw new Error('Azure OCR failed: ' + ocrResponse.status);
    }

    const ocrResult = await ocrResponse.json();
    let extractedText = '';
    
    if (ocrResult.regions) {
      for (const region of ocrResult.regions) {
        for (const line of region.lines) {
          for (const word of line.words) {
            extractedText += word.text + ' ';
          }
          extractedText += '\n';
        }
      }
    }
    
    return extractedText.trim();
  }

  function detectScamPatterns(text: string): { isScam: boolean; score: number; warnings: string[] } {
    const warnings: string[] = [];
    let score = 0;
    const lowerText = text.toLowerCase();

    const scamPatterns = [
      { pattern: /guaranteed\s*(income|loan|approval|success)/i, warning: 'Uses "guaranteed" promises - common scam tactic', weight: 2 },
      { pattern: /no\s*(document|proof|verification|eligibility)/i, warning: 'Claims no documents needed - legitimate schemes always require verification', weight: 2 },
      { pattern: /pay\s*(money|charges?|fees?|advance)/i, warning: 'Requests payment upfront - government schemes are FREE', weight: 3 },
      { pattern: /limited\s*(time|offer|slots?|spots?)/i, warning: 'Creates false urgency with limited time offers', weight: 1 },
      { pattern: /100[%]\s*(success|approval|guarantee)/i, warning: 'Promises 100% success rate - unrealistic claim', weight: 2 },
      { pattern: /urgent\s*(action|notice|response|contact)/i, warning: 'Uses urgent language to pressure quick decisions', weight: 1 },
      { pattern: /prize|lottery|winner|luck/i, warning: 'Lottery/prize claims are almost always scams', weight: 3 },
      { pattern: /bank\s*(details?|account|transfer)/i, warning: 'Requests bank details - risk of financial fraud', weight: 3 },
      { pattern: /aadhaar\s*(link|update|verify).*charge/i, warning: 'Aadhaar-related charges are suspicious - UIDAI does not charge', weight: 3 },
      { pattern: /subscribe|subscribe.*now|whatsapp.*group/i, warning: 'Promotional subscription or group joining pattern detected', weight: 1 },
      { pattern: /telegram.*group|whatsapp.*broadcast/i, warning: 'Unofficial communication channels - government uses only official portals', weight: 2 },
      { pattern: /share.*this|forward.*this|referral.*bonus/i, warning: 'Referral/multiplier schemes are often fraudulent', weight: 2 },
      { pattern: /investment.*return|double.*money|money.*grow/i, warning: 'Investment return promises are typical of Ponzi schemes', weight: 3 },
      { pattern: /click\s*here|register\s*now|act\s*fast/i, warning: 'Pressuring action language typical of scams', weight: 1 },
      { pattern: /govt?\s*(approval|official).*(fee|charge)/i, warning: 'Government never charges fees for official schemes', weight: 3 },
    ];

    scamPatterns.forEach(({ pattern, warning, weight }) => {
      if (pattern.test(text)) {
        warnings.push(warning);
        score += weight;
      }
    });

    const officialDomains = ['gov.in', 'india.gov.in', 'pmindia.gov.in', 'ncsc.nic.in', 'digilocker.gov.in', 'pmjay.gov.in', 'pmkisan.gov.in'];
    const hasOfficialSource = officialDomains.some(domain => lowerText.includes(domain));
    if (hasOfficialSource) {
      score = Math.max(0, score - 3);
    }

    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];
    urls.forEach(url => {
      const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'wa.me', 'teleg', 'shorturl'];
      if (suspiciousDomains.some(d => url.toLowerCase().includes(d))) {
        warnings.push('Contains shortened/suspicious URL links');
        score += 2;
      }
    });

    return {
      isScam: score >= 5,
      score: Math.min(10, score),
      warnings: [...new Set(warnings)]
    };
  }

  function findSchemesInText(text: string): SchemeInfo[] {
    const foundSchemes: SchemeInfo[] = [];
    const lowerText = text.toLowerCase();
    
    KNOWN_SCHEMES.forEach(scheme => {
      const keywordMatches = scheme.keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
      if (keywordMatches.length > 0) {
        if (!foundSchemes.some(s => s.name === scheme.name)) {
          foundSchemes.push(scheme);
        }
      }
    });

    return foundSchemes;
  }

  async function analyzeContent(imageData: string | null, textData: string) {
    setProcessing(true);
    setError('');
    setResult(null);
    setExtractedText('');
    setExpandedScheme(null);

    try {
      let extractedText = textData;

      if (imageData) {
        setStage('Extracting text with Azure Vision...');
        extractedText = await extractTextWithAzure(imageData);
        setExtractedText(extractedText);

        if (!extractedText) {
          setResult({
            is_scam: false,
            scam_score: 0,
            document_type: 'image',
            extracted_text: '',
            summary: 'No readable text found in the image.',
            scam_warnings: [],
            schemes_found: [],
            recommendations: [
              'Try uploading a clearer, well-lit image',
              'Ensure the text in the document is legible',
              'Avoid blurry or low-resolution photos'
            ]
          });
          setProcessing(false);
          return;
        }
      }

      setStage('Analyzing document...');
      const scamAnalysis = detectScamPatterns(extractedText);

      setStage('Searching government schemes...');
      const schemesFound = findSchemesInText(extractedText);

      setStage('Generating results...');
      
      let summary = '';
      if (scamAnalysis.isScam) {
        summary = 'WARNING: This document shows ' + scamAnalysis.score + '/10 scam indicators!';
      } else if (scamAnalysis.score > 2) {
        summary = 'CAUTION: This document shows ' + scamAnalysis.score + '/10 warning signs. Review carefully.';
      } else if (schemesFound.length > 0) {
        summary = 'Found ' + schemesFound.length + ' government scheme(s)!';
      } else {
        summary = 'No specific government schemes detected in this document.';
      }

      const recommendations: string[] = [];
      
      if (schemesFound.length > 0) {
        recommendations.push('Matched schemes: ' + schemesFound.map(s => s.name.replace('Pradhan Mantri ', 'PM ')).join(', '));
        recommendations.push('Click on any scheme below to view complete details and official apply links.');
      }
      
      if (!scamAnalysis.isScam && scamAnalysis.score <= 2) {
        recommendations.push('Document appears legitimate based on text analysis.');
      }
      
      if (scamAnalysis.warnings.length > 0) {
        recommendations.push('Review the warning indicators above carefully.');
        recommendations.push('Always verify on official government portals before applying.');
      }

      if (schemesFound.length === 0 && !scamAnalysis.isScam) {
        recommendations.push('Try entering a scheme name directly like "PM Kisan" or "Ayushman Bharat"');
      }

      setResult({
        is_scam: scamAnalysis.isScam,
        scam_score: scamAnalysis.score,
        document_type: imageData ? 'Scanned Document' : 'Text Input',
        extracted_text: extractedText,
        summary,
        scam_warnings: scamAnalysis.warnings,
        schemes_found: schemesFound,
        recommendations
      });

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError('Analysis failed: ' + (err.message || 'Please check your internet connection and try again.'));
      setResult({
        is_scam: false,
        scam_score: 0,
        document_type: 'error',
        extracted_text: '',
        summary: 'Failed to complete analysis.',
        scam_warnings: [],
        schemes_found: [],
        recommendations: ['Please try again or contact support if the problem persists.']
      });
    }

    setProcessing(false);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target?.result as string);
    reader.onerror = () => setError('Failed to load image');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (mode === 'image' && !image) {
      setError('Please upload an image first');
      return;
    }
    if (mode === 'text' && !textInput.trim()) {
      setError('Please enter some text first');
      return;
    }
    setError('');
    analyzeContent(mode === 'image' ? image : null, mode === 'text' ? textInput : '');
  };

  const handleSave = async () => {
    if (!result) {
      setError('Nothing to save');
      return;
    }
    setSaving(true);
    setError('');
    setSaveSuccess('');
    try {
      const metadata = {
        extracted_text: result.extracted_text || '',
        schemes_found: result.schemes_found || [],
        scam_warnings: result.scam_warnings || [],
        recommendations: result.recommendations || [],
        document_type: result.document_type || 'unknown',
        is_scam: result.is_scam || false,
      };
      const r = await db.query(
        `INSERT INTO vault_items (title, description, category, item_type, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          result.summary || 'Scanned Document',
          result.extracted_text?.substring(0, 200) || '',
          result.document_type || 'document',
          'scan_result',
          JSON.stringify(metadata)
        ]
      );
      if (r.ok) {
        setSaveSuccess('Saved successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setError('Save failed: ' + (r.error?.message || 'Database error'));
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      setError('Save failed: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const getScamScoreColor = (score: number) => {
    if (score >= 7) return 'text-red-600 bg-red-100';
    if (score >= 4) return 'text-amber-600 bg-amber-100';
    if (score >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      education: 'bg-blue-100 text-blue-600',
      health: 'bg-red-100 text-red-600',
      housing: 'bg-purple-100 text-purple-600',
      employment: 'bg-orange-100 text-orange-600',
      agriculture: 'bg-emerald-100 text-emerald-600',
      women: 'bg-pink-100 text-pink-600',
      financial: 'bg-green-100 text-green-600',
      skill: 'bg-cyan-100 text-cyan-600',
      startup: 'bg-indigo-100 text-indigo-600',
      general: 'bg-gray-100 text-gray-600'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan and Analyze</h1>
            <p className="text-sm text-gray-500 mt-1">Azure Vision OCR + 20+ Government Schemes</p>
          </div>
          <button onClick={() => navigate('/chat')} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border hover:bg-gray-50">
            <MessageCircle className="w-5 h-5" /> AI Chat
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-1.5 mb-4 flex">
          <button onClick={() => setMode('image')} className={'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium ' + (mode === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
            <Camera className="w-5 h-5" /> Image
          </button>
          <button onClick={() => setMode('text')} className={'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium ' + (mode === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
            <FileText className="w-5 h-5" /> Text
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          {mode === 'image' ? (
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {image ? (
                <div className="relative">
                  <img src={image} alt="Uploaded" className="max-h-64 mx-auto rounded-lg shadow-md" />
                  <button onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); setError(''); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your image here</h3>
                  <p className="text-gray-500 text-sm">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">Powered by Azure Computer Vision OCR</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste text about government schemes... Try 'PM Kisan', 'Ayushman Bharat', or any scheme details" className="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> Works with one-line mentions too - e.g., just type "PM Kisan" or paste full scheme details</p>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={processing} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2">
            {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> {stage || 'Analyzing...'}</> : <><Sparkles className="w-5 h-5" /> Analyze {mode === 'image' ? 'Image' : 'Text'}</>}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium text-sm">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess || (saving ? 'Saving...' : 'Save to Vault')}
              </button>
            </div>

            {result.scam_score > 0 && (
              <div className={'p-4 rounded-xl border ' + (result.is_scam ? 'bg-red-50 border-red-300' : result.scam_score >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200')}>
                <div className="flex items-start gap-4">
                  {result.is_scam ? <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" /> : <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{result.is_scam ? 'SCAM DETECTED!' : 'Document Analysis'}</h3>
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' + getScamScoreColor(result.scam_score)}>
                        Score: {result.scam_score}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{result.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {result.scam_warnings.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5" /> Warning Signs Detected</h4>
                <ul className="space-y-2">
                  {result.scam_warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-600 mt-0.5">-</span>
                      {warning}
                    </li>
                  ))}
                </ul>
                {result.is_scam && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
                    <p className="text-red-800 font-medium text-sm">This document appears to be a SCAM! Do NOT share personal information or make payments. Report to cyber crime helpline: 1930</p>
                  </div>
                )}
              </div>
            )}

            {result.extracted_text && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Eye className="w-5 h-5" /> Extracted Text <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Azure OCR</span></h4>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto border">
                  {result.extracted_text}
                </div>
              </div>
            )}

            {result.schemes_found.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Search className="w-5 h-5" /> Government Schemes Detected ({result.schemes_found.length}) <span className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-700">Official Links</span></h4>
                <div className="space-y-4">
                  {result.schemes_found.map((scheme, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors">
                      <button onClick={() => setExpandedScheme(expandedScheme === index ? null : index)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + getCategoryColor(scheme.category)}>
                            <FileCheck className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h5 className="font-bold text-gray-900">{scheme.name}</h5>
                            <p className="text-sm text-gray-500">{scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)} - {scheme.ministry}</p>
                          </div>
                        </div>
                        {expandedScheme === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </button>
                      {expandedScheme === index && (
                        <div className="p-5 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 space-y-4">
                          {scheme.description && (
                            <div>
                              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Description</span>
                              <p className="text-sm text-gray-700 mt-1">{scheme.description}</p>
                            </div>
                          )}
                          {scheme.eligibility && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Eligibility Criteria</span>
                              <p className="text-sm text-gray-700 mt-1">{scheme.eligibility}</p>
                            </div>
                          )}
                          {scheme.benefits && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Benefits</span>
                              <p className="text-sm text-gray-700 mt-1">{scheme.benefits}</p>
                            </div>
                          )}
                          {scheme.documents_required && (
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Documents Required</span>
                              <p className="text-sm text-gray-700 mt-1">{scheme.documents_required}</p>
                            </div>
                          )}
                          {scheme.how_to_apply && (
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">How to Apply</span>
                              <p className="text-sm text-gray-700 mt-1">{scheme.how_to_apply}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-3 pt-2">
                            {scheme.official_url && (
                              <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                                <Shield className="w-4 h-4" /> Official Website <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {scheme.apply_url && (
                              <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                                <LinkIcon className="w-4 h-4" /> Apply Now <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.schemes_found.length === 0 && !result.is_scam && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">No Government Schemes Detected</h4>
                <p className="text-sm text-gray-500 max-w-md mx-auto">Try entering a scheme name like "PM Kisan" or "Ayushman" directly in the text input.</p>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">OK</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/schemes')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md text-left transition-shadow">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3"><FileCheck className="w-5 h-5 text-indigo-600" /></div>
              <h4 className="font-semibold text-gray-900">Browse All Schemes</h4>
              <p className="text-sm text-gray-500">Explore government programs</p>
            </button>
            <button onClick={() => navigate('/chat')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md text-left transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3"><MessageCircle className="w-5 h-5 text-green-600" /></div>
              <h4 className="font-semibold text-gray-900">Ask AI Assistant</h4>
              <p className="text-sm text-gray-500">Get personalized help</p>
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><Info className="w-5 h-5" /> What can I scan?</h4>
          <ul className="text-sm text-blue-800 space-y-1 ml-7 list-disc">
            <li>Government scheme posters, flyers, or screenshots</li>
            <li>One-line mentions like "PM Kisan" or "Ayushman Bharat"</li>
            <li>Official government notifications or announcements</li>
            <li>Welfare program details from newspapers or pamphlets</li>
          </ul>
          <p className="text-xs text-blue-600 mt-3 ml-7">Detects 20+ government schemes with official apply links</p>
        </div>
      </div>
    </div>
  );
}
