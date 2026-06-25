const legalFieldsData = {
  "الجنائي": {
    icon: "⚖️",
    descriptionKey: "criminalFieldDesc",
    description: "كل ما يتعلق بالمسطرة الجنائية، الجنح، الجنايات، وحقوق الدفاع في القانون المغربي.",
    lawyers: [
      { id: 1, name: "ذ. كريم التازي", experience: "20 سنة", cases: "800+", rating: "4.9", avatar: "ك" },
      { id: 2, name: "ذت. سناء الناصري", experience: "12 سنة", cases: "340+", rating: "4.7", avatar: "س" }
    ],
    topics: [
      { titleKey: "topicCriminal1", title: "حقوق المتهم أثناء الحراسة النظرية", views: "25K", duration: "8:15" },
      { titleKey: "topicCriminal2", title: "الفرق بين الجنحة والجناية في المغرب", views: "18K", duration: "6:30" },
      { titleKey: "topicCriminal3", title: "مسطرة تقديم شكاية لوكيل الملك", views: "30K", duration: "10:00" }
    ],
    prompts: ["الحراسة النظرية", "تقديم شكاية", "إطلاق سراح مؤقت"],
    promptsKeys: ["promptCriminal1", "promptCriminal2", "promptCriminal3"]
  },
  "العقار": {
    icon: "🏠",
    descriptionKey: "realEstateFieldDesc",
    description: "قوانين التحفيظ العقاري، الملكية المشتركة، النزاعات العقارية وعقود البيع والشراء.",
    lawyers: [
      { id: 1, name: "ذت. نجوى بنسالم", experience: "15 سنة", cases: "430+", rating: "4.8", avatar: "ن" },
      { id: 2, name: "ذ. عادل الفاسي", experience: "18 سنة", cases: "520+", rating: "4.9", avatar: "ع" }
    ],
    topics: [
      { titleKey: "topicRealEstate1", title: "كيفاش تحمي راسك قبل ما تشري بقعة؟", views: "45K", duration: "12:00" },
      { titleKey: "topicRealEstate2", title: "مشاكل السانديك والملكية المشتركة", views: "22K", duration: "7:45" },
      { titleKey: "topicRealEstate3", title: "مسطرة التحفيظ العقاري في المغرب", views: "19K", duration: "9:20" }
    ],
    prompts: ["التحفيظ العقاري", "عقد بيع", "الشفعة"],
    promptsKeys: ["promptRealEstate1", "promptRealEstate2", "promptRealEstate3"]
  },
  "الأعمال": {
    icon: "🏢",
    descriptionKey: "businessFieldDesc",
    description: "قانون الشركات، العقود التجارية، الإفلاس، والمنازعات بين الشركاء.",
    lawyers: [
      { id: 1, name: "ذ. عمر الحسيني", experience: "22 سنة", cases: "1200+", rating: "5.0", avatar: "ع" },
      { id: 2, name: "ذت. سمية أوحمو", experience: "10 سنوات", cases: "290+", rating: "4.6", avatar: "س" }
    ],
    topics: [
      { titleKey: "topicBusiness1", title: "خطوات تأسيس شركة SARL في المغرب", views: "38K", duration: "15:20" },
      { titleKey: "topicBusiness2", title: "كيفية صياغة اتفاقية الشركاء", views: "15K", duration: "11:10" },
      { titleKey: "topicBusiness3", title: "حقوق المسير في الشركة المحدودة", views: "12K", duration: "8:45" }
    ],
    prompts: ["تأسيس شركة", "صعوبات المقاولة", "العلامة التجارية"],
    promptsKeys: ["promptBusiness1", "promptBusiness2", "promptBusiness3"]
  },
  "الشغل": {
    icon: "💼",
    descriptionKey: "workFieldDesc",
    description: "عقود الشغل، الطرد التعسفي، حوادث الشغل، ومستحقات نهاية الخدمة.",
    lawyers: [
      { id: 1, name: "ذ. يوسف البقالي", experience: "14 سنة", cases: "600+", rating: "4.9", avatar: "ي" },
      { id: 2, name: "ذت. ليلى العلمي", experience: "9 سنوات", cases: "215+", rating: "4.7", avatar: "ل" }
    ],
    topics: [
      { titleKey: "topicLabor1", title: "حساب تعويضات الطرد التعسفي", views: "60K", duration: "14:30" },
      { titleKey: "topicLabor2", title: "حقوقك في حالة الاستقالة", views: "28K", duration: "9:15" },
      { titleKey: "topicLabor3", title: "واجبات المشغل بخصوص CNSS", views: "34K", duration: "12:45" }
    ],
    prompts: ["طرد تعسفي", "عقد CDD", "الراحة الأسبوعية"],
    promptsKeys: ["promptLabor1", "promptLabor2", "promptLabor3"]
  },
  "الأسرة": {
    icon: "👨‍👩‍👧",
    descriptionKey: "familyFieldDesc",
    description: "الزواج، الطلاق، النفقة، الحضانة، والإرث وفق مدونة الأسرة المغربية.",
    lawyers: [
      { id: 1, name: "ذت. فاطمة الزهراء", experience: "16 سنة", cases: "720+", rating: "4.8", avatar: "ف" },
      { id: 2, name: "ذ. حمزة الإدريسي", experience: "11 سنة", cases: "310+", rating: "4.7", avatar: "ح" }
    ],
    topics: [
      { titleKey: "topicFamily1", title: "مسطرة طلاق الشقاق في المغرب", views: "90K", duration: "18:00" },
      { titleKey: "topicFamily2", title: "كيفاش تطلب النفقة والحضانة؟", views: "55K", duration: "13:40" },
      { titleKey: "topicFamily3", title: "تقسيم الإرث: القواعد الأساسية", views: "42K", duration: "20:00" }
    ],
    prompts: ["طلاق الشقاق", "إثبات الزواج", "الحضانة"],
    promptsKeys: ["promptFamily1", "promptFamily2", "promptFamily3"]
  }
};

export default legalFieldsData;
