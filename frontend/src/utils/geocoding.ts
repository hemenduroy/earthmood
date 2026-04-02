// Simple reverse geocoding using OpenStreetMap Nominatim API
export async function getLocationName(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=en`,
    {
      headers: {
        'User-Agent': 'EarthMood/1.0',
        'Accept-Language': 'en'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Geocoding failed');
  }
  
  const data = await response.json();
  
  if (data.address) {
    const { city, town, village, state, country } = data.address;
    const location = city || town || village || '';
    const stateName = state || '';
    const countryName = normalizeCountryName(country || '');
    
    // Build location string, omitting missing parts
    const parts = [];
    if (location) parts.push(location);
    if (stateName) parts.push(stateName);
    if (countryName) parts.push(countryName);
    
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }
  
  return 'Unknown Location';
}

// Normalize country names to English equivalents
function normalizeCountryName(countryName: string): string {
  const countryMappings: Record<string, string> = {
    // Common non-English country names
    'Deutschland': 'Germany',
    'Allemagne': 'Germany',
    'Alemania': 'Germany',
    'Frankreich': 'France',
    'Francia': 'France',
    'España': 'Spain',
    'Italie': 'Italy',
    'Italia': 'Italy',
    'Nederland': 'Netherlands',
    'Holland': 'Netherlands',
    'België': 'Belgium',
    'Belgique': 'Belgium',
    'Schweiz': 'Switzerland',
    'Suisse': 'Switzerland',
    'Svizzera': 'Switzerland',
    'Österreich': 'Austria',
    'Sverige': 'Sweden',
    'Norge': 'Norway',
    'Danmark': 'Denmark',
    'Suomi': 'Finland',
    'Polska': 'Poland',
    'Česká republika': 'Czech Republic',
    'Magyarország': 'Hungary',
    'Slovensko': 'Slovakia',
    'Slovenija': 'Slovenia',
    'Hrvatska': 'Croatia',
    'Srbija': 'Serbia',
    'Bosna i Hercegovina': 'Bosnia and Herzegovina',
    'Crna Gora': 'Montenegro',
    'Shqipëria': 'Albania',
    'Makedonija': 'North Macedonia',
    'България': 'Bulgaria',
    'România': 'Romania',
    'Ελλάδα': 'Greece',
    'Türkiye': 'Turkey',
    'Україна': 'Ukraine',
    'Беларусь': 'Belarus',
    'Lietuva': 'Lithuania',
    'Latvija': 'Latvia',
    'Eesti': 'Estonia',
    'Россия': 'Russia',
    '日本': 'Japan',
    '대한민국': 'South Korea',
    '中国': 'China',
    '台灣': 'Taiwan',
    '香港': 'Hong Kong',
    '澳門': 'Macau',
    'Монгол': 'Mongolia',
    'Việt Nam': 'Vietnam',
    'ລາວ': 'Laos',
    'កម្ពុជា': 'Cambodia',
    'ประเทศไทย': 'Thailand',
    'မြန်မာ': 'Myanmar',
    'Malaysia': 'Malaysia', // Already English
    'Singapura': 'Singapore',
    'Indonesia': 'Indonesia', // Already English
    'Pilipinas': 'Philippines',
    'Brunei': 'Brunei', // Already English
    'Timor-Leste': 'East Timor',
    'भारत': 'India',
    'پاکستان': 'Pakistan',
    'বাংলাদেশ': 'Bangladesh',
    'இலங்கை': 'Sri Lanka',
    'नेपाल': 'Nepal',
    'འབྲུག་ཡུལ་': 'Bhutan',
    'ދިވެހިރާއްޖެ': 'Maldives',
    'افغانستان': 'Afghanistan',
    'ایران': 'Iran',
    'العراق': 'Iraq',
    'سوريا': 'Syria',
    'لبنان': 'Lebanon',
    'ישראל': 'Israel',
    'فلسطين': 'Palestine',
    'الأردن': 'Jordan',
    'السعودية': 'Saudi Arabia',
    'اليمن': 'Yemen',
    'عمان': 'Oman',
    'الإمارات': 'United Arab Emirates',
    'قطر': 'Qatar',
    'البحرين': 'Bahrain',
    'الكويت': 'Kuwait',
    'مصر': 'Egypt',
    'ليبيا': 'Libya',
    'تونس': 'Tunisia',
    'الجزائر': 'Algeria',
    'المغرب': 'Morocco',
    'الصحراء الغربية': 'Western Sahara',
    'موريتانيا': 'Mauritania',
    'Mali': 'Mali', // Already English
    'Niger': 'Niger', // Already English
    'تشاد': 'Chad',
    'السودان': 'Sudan',
    'جنوب السودان': 'South Sudan',
    'ኢትዮጵያ': 'Ethiopia',
    'إريتريا': 'Eritrea',
    'جيبوتي': 'Djibouti',
    'الصومال': 'Somalia',
    'Kenya': 'Kenya', // Already English
    'Uganda': 'Uganda', // Already English
    'Tanzania': 'Tanzania', // Already English
    'Rwanda': 'Rwanda', // Already English
    'Burundi': 'Burundi', // Already English
    'République démocratique du Congo': 'Democratic Republic of the Congo',
    'República del Congo': 'Republic of the Congo',
    'République centrafricaine': 'Central African Republic',
    'Cameroun': 'Cameroon',
    'Nigeria': 'Nigeria', // Already English
    'Gabon': 'Gabon', // Already English
    'Guinée équatoriale': 'Equatorial Guinea',
    'São Tomé e Príncipe': 'São Tomé and Príncipe',
    'Angola': 'Angola', // Already English
    'Zambia': 'Zambia', // Already English
    'Zimbabwe': 'Zimbabwe', // Already English
    'Botswana': 'Botswana', // Already English
    'Namibia': 'Namibia', // Already English
    'South Africa': 'South Africa', // Already English
    'Lesotho': 'Lesotho', // Already English
    'Eswatini': 'Eswatini', // Already English
    'Moçambique': 'Mozambique',
    'Madagasikara': 'Madagascar',
    'Comores': 'Comoros',
    'Seychelles': 'Seychelles', // Already English
    'Maurice': 'Mauritius',
    'Australia': 'Australia', // Already English
    'New Zealand': 'New Zealand', // Already English
    'Papua Niugini': 'Papua New Guinea',
    'Viti': 'Fiji',
    'Solomon Islands': 'Solomon Islands', // Already English
    'Vanuatu': 'Vanuatu', // Already English
    'Nouvelle-Calédonie': 'New Caledonia',
    'Brasil': 'Brazil',
    'Argentina': 'Argentina', // Already English
    'Chile': 'Chile', // Already English
    'Perú': 'Peru',
    'Bolivia': 'Bolivia', // Already English
    'Paraguay': 'Paraguay', // Already English
    'Uruguay': 'Uruguay', // Already English
    'Colombia': 'Colombia', // Already English
    'Venezuela': 'Venezuela', // Already English
    'Guyana': 'Guyana', // Already English
    'Suriname': 'Suriname', // Already English
    'Guyane française': 'French Guiana',
    'Ecuador': 'Ecuador', // Already English
    'México': 'Mexico',
    'Guatemala': 'Guatemala', // Already English
    'Belize': 'Belize', // Already English
    'El Salvador': 'El Salvador', // Already English
    'Honduras': 'Honduras', // Already English
    'Nicaragua': 'Nicaragua', // Already English
    'Costa Rica': 'Costa Rica', // Already English
    'Panamá': 'Panama',
    'Cuba': 'Cuba', // Already English
    'Jamaica': 'Jamaica', // Already English
    'Haïti': 'Haiti',
    'República Dominicana': 'Dominican Republic',
    'Puerto Rico': 'Puerto Rico', // Already English
    'Bahamas': 'Bahamas', // Already English
    'Barbados': 'Barbados', // Already English
    'Trinidad and Tobago': 'Trinidad and Tobago', // Already English
    'Grenada': 'Grenada', // Already English
    'Saint Vincent and the Grenadines': 'Saint Vincent and the Grenadines', // Already English
    'Saint Lucia': 'Saint Lucia', // Already English
    'Dominica': 'Dominica', // Already English
    'Antigua and Barbuda': 'Antigua and Barbuda', // Already English
    'Saint Kitts and Nevis': 'Saint Kitts and Nevis', // Already English
    'Ísland': 'Iceland',
  };
  
  return countryMappings[countryName] || countryName;
}

// Get country flag emoji from country name
export function getCountryFlag(countryName: string): string {
  // Normalize the country name to English first
  const normalizedCountryName = normalizeCountryName(countryName);
  
  const countryToFlag: Record<string, string> = {
    'United States': '🇺🇸',
    'Canada': '🇨🇦',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Poland': '🇵🇱',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Slovakia': '🇸🇰',
    'Slovenia': '🇸🇮',
    'Croatia': '🇭🇷',
    'Serbia': '🇷🇸',
    'Bosnia and Herzegovina': '🇧🇦',
    'Montenegro': '🇲🇪',
    'Albania': '🇦🇱',
    'North Macedonia': '🇲🇰',
    'Bulgaria': '🇧🇬',
    'Romania': '🇷🇴',
    'Greece': '🇬🇷',
    'Turkey': '🇹🇷',
    'Ukraine': '🇺🇦',
    'Belarus': '🇧🇾',
    'Lithuania': '🇱🇹',
    'Latvia': '🇱🇻',
    'Estonia': '🇪🇪',
    'Russia': '🇷🇺',
    'Kazakhstan': '🇰🇿',
    'Uzbekistan': '🇺🇿',
    'Kyrgyzstan': '🇰🇬',
    'Tajikistan': '🇹🇯',
    'Turkmenistan': '🇹🇲',
    'Azerbaijan': '🇦🇿',
    'Georgia': '🇬🇪',
    'Armenia': '🇦🇲',
    'Moldova': '🇲🇩',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'Taiwan': '🇹🇼',
    'Hong Kong': '🇭🇰',
    'Macau': '🇲🇴',
    'Mongolia': '🇲🇳',
    'North Korea': '🇰🇵',
    'Vietnam': '🇻🇳',
    'Laos': '🇱🇦',
    'Cambodia': '🇰🇭',
    'Thailand': '🇹🇭',
    'Myanmar': '🇲🇲',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Brunei': '🇧🇳',
    'East Timor': '🇹🇱',
    'India': '🇮🇳',
    'Pakistan': '🇵🇰',
    'Bangladesh': '🇧🇩',
    'Sri Lanka': '🇱🇰',
    'Nepal': '🇳🇵',
    'Bhutan': '🇧🇹',
    'Maldives': '🇲🇻',
    'Afghanistan': '🇦🇫',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Syria': '🇸🇾',
    'Lebanon': '🇱🇧',
    'Israel': '🇮🇱',
    'Palestine': '🇵🇸',
    'Jordan': '🇯🇴',
    'Saudi Arabia': '🇸🇦',
    'Yemen': '🇾🇪',
    'Oman': '🇴🇲',
    'United Arab Emirates': '🇦🇪',
    'Qatar': '🇶🇦',
    'Bahrain': '🇧🇭',
    'Kuwait': '🇰🇼',
    'Egypt': '🇪🇬',
    'Libya': '🇱🇾',
    'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿',
    'Morocco': '🇲🇦',
    'Western Sahara': '🇪🇭',
    'Mauritania': '🇲🇷',
    'Mali': '🇲🇱',
    'Niger': '🇳🇪',
    'Chad': '🇹🇩',
    'Sudan': '🇸🇩',
    'South Sudan': '🇸🇸',
    'Ethiopia': '🇪🇹',
    'Eritrea': '🇪🇷',
    'Djibouti': '🇩🇯',
    'Somalia': '🇸🇴',
    'Kenya': '🇰🇪',
    'Uganda': '🇺🇬',
    'Tanzania': '🇹🇿',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'Democratic Republic of the Congo': '🇨🇩',
    'Republic of the Congo': '🇨🇬',
    'Central African Republic': '🇨🇫',
    'Cameroon': '🇨🇲',
    'Nigeria': '🇳🇬',
    'Gabon': '🇬🇦',
    'Equatorial Guinea': '🇬🇶',
    'São Tomé and Príncipe': '🇸🇹',
    'Angola': '🇦🇴',
    'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼',
    'Botswana': '🇧🇼',
    'Namibia': '🇳🇦',
    'South Africa': '🇿🇦',
    'Lesotho': '🇱🇸',
    'Eswatini': '🇸🇿',
    'Mozambique': '🇲🇿',
    'Madagascar': '🇲🇬',
    'Comoros': '🇰🇲',
    'Seychelles': '🇸🇨',
    'Mauritius': '🇲🇺',
    'Australia': '🇦🇺',
    'New Zealand': '🇳🇿',
    'Papua New Guinea': '🇵🇬',
    'Fiji': '🇫🇯',
    'Solomon Islands': '🇸🇧',
    'Vanuatu': '🇻🇺',
    'New Caledonia': '🇳🇨',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Peru': '🇵🇪',
    'Bolivia': '🇧🇴',
    'Paraguay': '🇵🇾',
    'Uruguay': '🇺🇾',
    'Colombia': '🇨🇴',
    'Venezuela': '🇻🇪',
    'Guyana': '🇬🇾',
    'Suriname': '🇸🇷',
    'French Guiana': '🇬🇫',
    'Ecuador': '🇪🇨',
    'Mexico': '🇲🇽',
    'Guatemala': '🇬🇹',
    'Belize': '🇧🇿',
    'El Salvador': '🇸🇻',
    'Honduras': '🇭🇳',
    'Nicaragua': '🇳🇮',
    'Costa Rica': '🇨🇷',
    'Panama': '🇵🇦',
    'Cuba': '🇨🇺',
    'Jamaica': '🇯🇲',
    'Haiti': '🇭🇹',
    'Dominican Republic': '🇩🇴',
    'Puerto Rico': '🇵🇷',
    'Bahamas': '🇧🇸',
    'Barbados': '🇧🇧',
    'Trinidad and Tobago': '🇹🇹',
    'Grenada': '🇬🇩',
    'Saint Vincent and the Grenadines': '🇻🇨',
    'Saint Lucia': '🇱🇨',
    'Dominica': '🇩🇲',
    'Antigua and Barbuda': '🇦🇬',
    'Saint Kitts and Nevis': '🇰🇳',
    'Iceland': '🇮🇸',
    'Ireland': '🇮🇪',
    'Portugal': '🇵🇹',
    'Luxembourg': '🇱🇺',
    'Liechtenstein': '🇱🇮',
    'Monaco': '🇲🇨',
    'Andorra': '🇦🇩',
    'San Marino': '🇸🇲',
    'Vatican City': '🇻🇦',
    'Malta': '🇲🇹',
    'Cyprus': '🇨🇾',
  };
  
  return countryToFlag[normalizedCountryName] || '🌍';
} 