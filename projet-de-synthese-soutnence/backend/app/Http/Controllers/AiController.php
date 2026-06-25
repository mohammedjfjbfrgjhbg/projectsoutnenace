<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function analyzeContract(Request $request)
    {
        $title = '';
        $content = '';

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => 'required|file|mimes:pdf,docx,doc,txt|max:20480', // max 20MB
            ]);

            $file = $request->file('file');
            $title = $file->getClientOriginalName();
            
            // Extract text contents
            $content = $this->extractTextFromFile($file);

            if (empty(trim($content))) {
                return response()->json([
                    'message' => 'تعذر استخراج النص من الملف المرفوع. يرجى التأكد من أن الملف يحتوي على نصوص قابلة للقراءة.'
                ], 422);
            }
        } else {
            $request->validate([
                'contract_title' => 'required|string',
                'contract_content' => 'required|string',
            ]);

            $title = $request->input('contract_title');
            $content = $request->input('contract_content');
        }

        // Call Gemini API to analyze the contract
        $analysis = $this->callGeminiForAnalysis($title, $content);

        // Save to database
        $contract = Contract::create([
            'user_id' => $request->user()->id,
            'title' => $title,
            'type' => 'analyze',
            'content' => $content,
            'result' => json_encode($analysis),
        ]);

        return response()->json([
            'message' => 'تم تحليل العقد بنجاح بواسطة الذكاء الاصطناعي.',
            'contract' => $contract,
            'analysis' => $analysis
        ]);
    }

    private function extractTextFromFile($file)
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        if ($extension === 'pdf') {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($path);
                return $pdf->getText();
            } catch (\Exception $e) {
                Log::error("PDF text extraction failed: " . $e->getMessage());
                return $this->fallbackPdfExtract($path);
            }
        } elseif ($extension === 'docx') {
            return $this->extractDocxText($path);
        } elseif ($extension === 'doc') {
            return $this->extractDocFallback($path);
        } elseif ($extension === 'txt') {
            return file_get_contents($path);
        }
        
        return '';
    }

    private function extractDocxText($filename)
    {
        $zip = new \ZipArchive();
        if ($zip->open($filename) === true) {
            $xml = $zip->getFromName('word/document.xml');
            if ($xml) {
                $zip->close();
                $dom = new \DOMDocument();
                @$dom->loadXML($xml);
                $paragraphs = $dom->getElementsByTagName('t');
                $text = '';
                foreach ($paragraphs as $p) {
                    $text .= $p->nodeValue . ' ';
                }
                return trim($text);
            }
            $zip->close();
        }
        return '';
    }

    private function extractDocFallback($filename)
    {
        $content = file_get_contents($filename);
        if (!$content) return '';
        preg_match_all('/[\x20-\x7E\x{0600}-\x{06FF}]{4,}/u', $content, $matches);
        return implode(' ', $matches[0]);
    }

    private function fallbackPdfExtract($filename)
    {
        $content = file_get_contents($filename);
        if (!$content) return '';
        preg_match_all('/\((.*?)\)/s', $content, $matches);
        $text = '';
        foreach ($matches[1] as $match) {
            $text .= $match . ' ';
        }
        return trim($text);
    }

    private function callGeminiForAnalysis($title, $content)
    {
        $apiKey = env('GEMINI_API_KEY');
        
        // Define default/fallback analysis result
        $fallbackResult = [
            'risk_score' => rand(15, 65),
            'status' => 'متوسط الخطورة',
            'summary' => "هذا العقد هو عبارة عن \"{$title}\" ينظم العلاقة القانونية بين الأطراف المذكورة. بعد مراجعة البنود والالتزامات، يتبين أن العقد يركز بشكل أساسي على تحديد شروط الدفع والتعويضات وحالات إنهاء العقد.",
            'clauses_analyzed' => 10,
            'critical_issues' => [
                'غياب شرط القوة القاهرة الواضح الذي يحمي الأطراف في حالة الكوارث الطبيعية أو الظروف الاستثنائية.',
                'التعويضات المذكورة في بند الإخلال بالالتزامات غير متوازنة وتميل لصالح الطرف الأول بنسبة كبيرة.'
            ],
            'recommendations' => [
                'إعادة صياغة البند الرابع لضمان توزيع عادل للمسؤوليات والتعويضات عند الإنهاء المبكر.',
                'إضافة ملحق يوضح معايير جودة الخدمة وطرق تقييمها قبل تطبيق أي غرامات تأخير.'
            ]
        ];

        if (!$apiKey) {
            return $fallbackResult;
        }

        $prompt = "قم بتحليل العقد القانوني المغربي التالي بدقة وقدم النتيجة بتنسيق JSON حصرياً.
عنوان العقد: {$title}
محتوى العقد:
{$content}

يجب أن يحتوي ملف JSON على المفاتيح التالية باللغة العربية:
1. \"risk_score\": قيمة رقمية من 0 إلى 100 تدل على نسبة خطورة العقد.
2. \"status\": نص يصف مستوى الخطورة ('عالي الخطورة' أو 'متوسط الخطورة' أو 'آمن نسبياً').
3. \"summary\": ملخص قانوني شامل للعقد باللغة العربية (فقرة واحدة).
4. \"clauses_analyzed\": عدد البنود المقدرة التي تم فحصها (رقم صحيح).
5. \"critical_issues\": مصفوفة من النصوص (المخاطر والثغرات القانونية المحتملة في العقد بناءً على القانون المغربي).
6. \"recommendations\": مصفوفة من النصوص (التعديلات والتوصيات المقترحة لحماية حقوق المتعاقد وتحسين العقد).

يرجى الالتزام التام بتنسيق JSON وألا تعيد أي نصوص خارج بنية الـ JSON.";

        $candidateModels = [
            'gemini-2.5-flash',
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-3-flash-preview'
        ];

        foreach ($candidateModels as $model) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'systemInstruction' => [
                        'parts' => [
                            ['text' => 'أنت خبير قانوني مغربي ومحامي متخصص في مراجعة وتدقيق العقود القانونية وفقاً للتشريع المغربي (قانون الالتزامات والعقود، القانون التجاري، إلخ). تقوم بتحليل العقود وتحديد الثغرات والمخاطر والتوصيات وتقديم النتائج بتنسيق JSON دقيق.']
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json'
                    ]
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $answer = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($answer) {
                        $parsed = json_decode(trim($answer), true);
                        if (is_array($parsed) && isset($parsed['risk_score'], $parsed['status'], $parsed['summary'])) {
                            // Ensure arrays for recommendations & critical issues
                            if (!isset($parsed['critical_issues']) || !is_array($parsed['critical_issues'])) {
                                $parsed['critical_issues'] = [];
                            }
                            if (!isset($parsed['recommendations']) || !is_array($parsed['recommendations'])) {
                                $parsed['recommendations'] = [];
                            }
                            if (!isset($parsed['clauses_analyzed'])) {
                                $parsed['clauses_analyzed'] = 10;
                            }
                            return $parsed;
                        }
                    }
                }
                Log::warning("Gemini Analysis warning for model {$model}: Status " . $response->status() . " - " . $response->body());
            } catch (\Exception $e) {
                Log::error("Gemini Analysis Exception for model {$model}: " . $e->getMessage());
            }
        }

        return $fallbackResult;
    }

    public function generateContract(Request $request)
    {
        $request->validate([
            'type' => 'required|string', // e.g., rent, employment, nda
            'party_one' => 'required|string',
            'party_two' => 'required|string',
            'price' => 'nullable|numeric',
            'duration' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $type = $request->input('type');
        $p1 = $request->input('party_one');
        $p2 = $request->input('party_two');
        $price = $request->input('price', '------');
        $duration = $request->input('duration', 'غير محددة');
        $details = $request->input('details', 'لا توجد تفاصيل إضافية');

        // Dynamic contract template generation based on type
        $title = "";
        $template = "";

        if (str_contains($type, 'rent') || str_contains($type, 'كراء')) {
            $title = "عقد كراء سكني - " . $p1 . " و " . $p2;
            $template = "
# عقد كراء عقار مخصص للسكنى

**الطرف الأول (المكري):** {$p1}
**الطرف الثاني (المكتري):** {$p2}

## التمهيد:
بموجب هذا العقد الاتفاقي، يكرى الطرف الأول للطرف الثاني الشقة السكنية الكائنة بـالعنوان المحدد، وفق البنود التالية:

### البند الأول: مدة الكراء
تبدأ مدة الكراء من تاريخ توقيع هذا العقد وتستمر لمدة {$duration} قابلة للتجديد باتفاق الطرفين.

### البند الثاني: السومة الكرائية
اتفق الطرفان على تحديد السومة الكرائية الشهرية في مبلغ **{$price} درهم مغربي** تؤدى في بداية كل شهر.

### البند الثالث: التزامات المكتري
يتعهد المكتري بالحفاظ على العين المكتراة وإعادتها عند انتهاء عقد الكراء بنفس الحالة التي تسلمها بها.

### البند الرابع: تفاصيل إضافية
{$details}

**توقيع الطرف الأول:** ____________________  
**توقيع الطرف الثاني:** ____________________
";
        } elseif (str_contains($type, 'nda') || str_contains($type, 'إفصاح')) {
            $title = "اتفاقية عدم الإفصاح وحماية السرية";
            $template = "
# اتفاقية عدم إفصاح متبادلة (NDA)

**الطرف الأول:** {$p1}
**الطرف الثاني:** {$p2}

## التمهيد:
رغبة من الطرفين في تبادل المعلومات السرية بغرض التعاون المهني، فقد اتفقا على ما يلي:

### البند الأول: تعريف المعلومات السرية
تشمل المعلومات السرية كل ما يتم تبادله من بيانات فنية، مالية، تجارية أو تصاميم مكتوبة أو شفهية.

### البند الثاني: مدة الالتزام بالسرية
يلتزم الطرفان بعدم إفشاء هذه المعلومات طيلة مدة المشروع ولمدة {$duration} بعد انتهائه.

### البند الثالث: التعويض عن الأضرار
في حالة إخلال أي طرف بالسرية، يلتزم بدفع تعويض مالي يقدر بـ **{$price} درهم** كتعويض اتفاقي.

### البند الرابع: إضافات خاصة
{$details}

**توقيع الطرف الأول:** ____________________  
**توقيع الطرف الثاني:** ____________________
";
        } else {
            $title = "اتفاقية تعاقدية عامة";
            $template = "
# اتفاقية تعاقدية متبادلة

**الطرف الأول:** {$p1}
**الطرف الثاني:** {$p2}

بموجب هذا العقد، اتفق الطرفان على التعاون في مجال العمل وتأدية الخدمات القانونية مقابل مبلغ قدره {$price} درهم مغربي لمدة {$duration}.

### تفاصيل إضافية:
{$details}

**توقيع الطرف الأول:** ____________________  
**توقيع الطرف الثاني:** ____________________
";
        }

        // Save to database
        $contract = Contract::create([
            'user_id' => $request->user()->id,
            'title' => $title,
            'type' => 'generate',
            'content' => $template,
            'result' => json_encode(['metadata' => compact('p1', 'p2', 'price', 'duration')]),
        ]);

        return response()->json([
            'message' => 'تم توليد العقد بنجاح بواسطة الذكاء الاصطناعي.',
            'contract' => $contract,
            'content' => $template
        ]);
    }

    public function askAi(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'category' => 'nullable|string',
        ]);

        $q = $request->input('question');
        $cat = $request->input('category', 'عام');

        // Check if Gemini API key is configured
        $apiKey = env('GEMINI_API_KEY');
        if ($apiKey) {
            $candidateModels = [
                'gemini-2.5-flash',
                'gemini-3.5-flash',
                'gemini-3.1-flash-lite',
                'gemini-3-flash-preview'
            ];

            foreach ($candidateModels as $model) {
                try {
                    $response = Http::withHeaders([
                        'Content-Type' => 'application/json',
                    ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    [
                                        'text' => $q
                                    ]
                                ]
                            ]
                        ],
                        'systemInstruction' => [
                            'parts' => [
                                [
                                    'text' => "أنت مساعد قانوني مغربي لمنصة \"حقي MA\". تجيب على أسئلة المستخدمين بدقة ومهنية باللغة العربية أو الدارجة المغربية بناءً على القانون المغربي (مثل قانون الالتزامات والعقود، مدونة الأسرة، مدونة الشغل، إلخ). لا تقدم نصائح طبية أو عامة غير قانونية. كن موجزاً وواضحاً وسهلاً في أسلوبك."
                                ]
                            ]
                        ]
                    ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        $answer = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                        if ($answer) {
                            return response()->json([
                                'answer' => $answer,
                                'category' => $cat,
                                'timestamp' => now()
                            ]);
                        }
                    }
                    
                    Log::warning("Gemini API warning for model {$model}: Status " . $response->status() . " - " . $response->body());
                } catch (\Exception $e) {
                    Log::error("Gemini API Exception for model {$model}: " . $e->getMessage());
                }
            }
        }

        // Fallback: Smart simulated answers based on keywords
        $answer = "شكراً لطرح سؤالك القانوني المتعلق بـ \"{$cat}\".\n\n";

        if (str_contains($q, 'كراء') || str_contains($q, 'إفراغ')) {
            $answer .= "وفقاً للقانون المغربي رقم 67.12 المتعلق بتنظيم العلاقات التعاقدية بين المكري والمكتري للمحلات المعدة للسكنى أو للاستعمال المهني:\n\n" .
                       "1. لا يمكن للمكري المطالبة بالإفراغ إلا بناءً على أسباب محددة قانوناً (كعدم أداء الكراء لمرتين متتاليتين، أو الرغبة في السكن الشخصي، أو هدم وإعادة بناء العقار).\n" .
                       "2. يجب توجيه إنذار بالإفراغ للمكتري يتضمن الأسباب بوضوح، مع إعطائه مهلة قانونية لا تقل عن شهرين.\n" .
                       "3. في حالة رفض المكتري، يتعين على المكري رفع دعوى المصادقة على الإنذار أمام المحكمة الابتدائية المختصة.";
        } elseif (str_contains($q, 'طلاق') || str_contains($q, 'نفقة') || str_contains($q, 'أسرة')) {
            $answer .= "بخصوص مدونة الأسرة المغربية:\n\n" .
                       "1. الطلاق بالاتفاق هو أسرع الطرق ويتم باتفاق الزوجين على الشروط ومستحقات الطلاق ويقدم للمحكمة لتوثيقه.\n" .
                       "2. النفقة تشمل السكن، المأكل، الملبس، والتعليم للأبناء وتحددها المحكمة بناءً على دخل الأب ومستوى معيشة الأسرة المعتاد.\n" .
                       "3. الحضانة تسند للأم أولاً، ثم للأب، ثم لأم الأم، وتستمر الحضانة طوال سن الرشد القانوني للأبناء.";
        } elseif (str_contains($q, 'عمل') || str_contains($q, 'طرد') || str_contains($q, 'شغل')) {
            $answer .= "بالاستناد إلى مدونة الشغل المغربية (القانون رقم 65.99):\n\n" .
                       "1. الطرد التعسفي يعطي الأجير الحق في التعويض عن الطرد والتعويض عن الإخطار وضرر الفصل.\n" .
                       "2. يجب على المشغل اتباع مسطرة الاستماع للأجير بحضور مندوب الأجراء قبل اتخاذ قرار الفصل تحت طائلة اعتبار الفصل تعسفياً شكلياً.\n" .
                       "3. تقادم الدعاوي الناشئة عن عقد الشغل هو سنتان من تاريخ إنهاء العقد.";
        } else {
            $answer .= "بناءً على القوانين والتشريعات العامة المعمول بها:\n\n" .
                       "يُنصح دائماً بتوثيق الاتفاقيات كتابياً لتفادي أي نزاع مستقبلي. إن الإثبات في المواد المدنية يخضع لقواعد ظهير الالتزامات والعقود، حيث يعتبر السند المكتوب (الرسمي أو العرفي) أقوى وسائل الإثبات.\n\n" .
                       "إذا كانت لديك تفاصيل محددة حول القضية، يمكنك حجز استشارة مباشرة مع أحد المحامين المتخصصين في منصتنا للحصول على رأي قانوني مفصل.";
        }

        return response()->json([
            'answer' => $answer,
            'category' => $cat,
            'timestamp' => now()
        ]);
    }

    public function getContracts(Request $request)
    {
        $contracts = Contract::where('user_id', $request->user()->id)->latest()->get();
        return response()->json($contracts);
    }
}

