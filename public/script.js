// Language translations
const translations = {
    sl: {
        heroTitle: 'Najdemo pravi del zate',
        heroDesc: 'Pošlji nam sliko ali opis in mi poiščemo najboljšo ceno zate.',
        b2cTitle: 'Za posameznike',
        b2cDesc: 'Potrebuješ en del za dom? Pošlji povpraševanje.',
        b2cBtn: 'Pošlji povpraševanje →',
        b2bTitle: 'Za podjetja',
        b2bDesc: 'Potrebuješ dele za svoje podjetje? Pošlji povpraševanje.',
        b2bBtn: 'Pošlji povpraševanje →',
        f1Title: 'Naloži sliko',
        f1Desc: 'Slikaj del, ki ga potrebuješ.',
        f2Title: 'Mi poiščemo',
        f2Desc: 'Najdemo najcenejšo opcijo zate.',
        f3Title: 'Prihraniš denar',
        f3Desc: 'Dobiš najboljšo ceno brez iskanja.',
        formTitle: 'Pošlji povpraševanje',
        formDesc: 'Izpolni obrazec in mi najdemo pravi del zate.',
        labelName: 'Ime in priimek *',
        labelPhone: 'Telefonska številka *',
        labelEmail: 'Email (po želji)',
        labelCompany: 'Ime podjetja *',
        labelVat: 'ID za DDV',
        labelQuantity: 'Količina',
        labelFrequency: 'Pogostost',
        labelDesc: 'Opis potrebnega dela *',
        labelImage: 'Naloži sliko',
        imageHint: 'Podprite formati: JPG, PNG, GIF (maks. 5MB)',
        submitBtn: 'Pošlji povpraševanje',
        success: '✅ Povpraševanje poslano!',
        successDesc: 'Kmalu te bomo kontaktirali s ponudbo.'
    },
    en: {
        heroTitle: 'We find the right part for you',
        heroDesc: 'Send us a photo or description and we\'ll find the best price for you.',
        b2cTitle: 'For Individuals',
        b2cDesc: 'Need one part for your home? Submit an inquiry.',
        b2cBtn: 'Submit inquiry →',
        b2bTitle: 'For Businesses',
        b2bDesc: 'Need parts for your business? Submit an inquiry.',
        b2bBtn: 'Submit inquiry →',
        f1Title: 'Upload photo',
        f1Desc: 'Take a photo of the part you need.',
        f2Title: 'We search',
        f2Desc: 'We find the cheapest option for you.',
        f3Title: 'Save money',
        f3Desc: 'Get the best price without searching.',
        formTitle: 'Submit inquiry',
        formDesc: 'Fill out the form and we\'ll find the right part for you.',
        labelName: 'Full name *',
        labelPhone: 'Phone number *',
        labelEmail: 'Email (optional)',
        labelCompany: 'Company name *',
        labelVat: 'VAT ID',
        labelQuantity: 'Quantity',
        labelFrequency: 'Frequency',
        labelDesc: 'Description of needed part *',
        labelImage: 'Upload image',
        imageHint: 'Supported formats: JPG, PNG, GIF (max 5MB)',
        submitBtn: 'Submit inquiry',
        success: '✅ Inquiry sent!',
        successDesc: 'We will contact you soon with an offer.'
    }
};

let currentLang = 'sl';

function switchLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    document.querySelectorAll('.lang-switch button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(lang === 'sl' ? 'langSl' : 'langEn').classList.add('active');

    document.querySelectorAll('[id]').forEach(el => {
        const id = el.id;
        if (t[id] !== undefined) {
            el.textContent = t[id];
        }
    });
}

// Handle form submission (works on both form.html pages)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inquiryForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Pošiljanje...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                form.style.display = 'none';
                const success = document.getElementById('successMessage');
                if (success) success.style.display = 'block';
            } else {
                alert('Napaka pri pošiljanju. Poskusi ponovno.');
            }
        } catch (error) {
            alert('Napaka pri pošiljanju. Poskusi ponovno.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
