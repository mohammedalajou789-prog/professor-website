# MN Syntax — v1.2
### لغة كتابة شيتات الرياضيات لموقع Prof. Ahmad El-Ajou

> **MN = Math Notes.** ملف نصي واحد (`.mn`) يكتبه الدكتور أو يولّده الذكاء الاصطناعي، ثم يُرفع من لوحة التحكم فيتحوّل إلى شيت بنفس تصميم شيتات الدكتور (ألوان الصناديق نفسها مأخوذة من ملف Chapter 1 الأصلي) مع رسومات تفاعلية وحركة.
>
> **قاعدة ذهبية:** ملف واحد ⇐ نسختان.
> - **Doctor sheet:** كل شيء ظاهر (الحلول، إجابات MCQ، ملاحظات الدكتور).
> - **Student sheet:** الحلول تتحوّل لمساحة كتابة مسطّرة، وأسئلة MCQ تصبح تفاعلية، وملاحظات الدكتور تختفي.
>
> رفع ملف منفصل للنسخة المحلولة اختياري.
>
> **مرجع حيّ:** لوحة التحكم ← MN guide (فيها Lecture 1 كاملة بهذه اللغة، ومعرض لكل أنواع الرسومات). الملفات المصدرية موجودة في `docs/mn/lecture-01.mn` و `docs/mn/python-figures.mn` و `docs/mn/showcase.mn`.

---

## 1. البنية العامة

```
---
course: Methods of Applied Mathematics
chapter: 1
chapter_title: Matrix Methods for Linear Systems
lecture: 1
title: Linear Systems in Normal Form & Matrix Review I
duration: 75
lang: en            # en | ar   (ar = اتجاه من اليمين لليسار؛ الرياضيات تبقى LTR)
author: Prof. Ahmad El-Ajou
---

::: outcomes
- Recognise a first-order linear system.
- Write a linear system in matrix form.
:::

::: timeplan
0-10  | Linear systems; terminology
10-25 | Matrix form; @ex:matrix-form
:::

## Linear Systems in Normal Form
...
```

| العنصر | الكتابة | الناتج |
|---|---|---|
| رأس الملف | `--- … ---` | شريط المحاضرة الأزرق + رأس الصفحة + التذييل |
| `outcomes` يليه `timeplan` | كتلتان متتاليتان | صندوق واحد بعمودين (كما في الـ PDF) |
| قسم | `## Title` | عنوان أزرق بخط سفلي + يدخل في الفهرس الجانبي |
| قسم فرعي | `### Title` | عنوان أحمر |
| غامق / مائل | `**bold**` / `*italic*` | |
| مصطلح مُعرَّف | `[[eigenvalue]]` | أحمر غامق (يقبل رياضيات داخله) |
| تمييز | `!!if and only if!!` | أحمر غامق |
| رابط | `[text](https://…)` | |
| فاصل صفحة للطباعة | `---page---` | |
| خط فاصل | `---` | |

**القوائم:** `- ` نقطة · `1. ` أرقام · `(1) ` أو `(a) ` أقواس · `i. ` أرقام رومانية · `► ` أسهم.
السطر التابع لعنصر القائمة يُزاح بمسافتين على الأقل (يمكن أن يحتوي معادلة `$$` أو قائمة داخلية).

---

## 2. الرياضيات (LaTeX عبر KaTeX — تُرسم على السيرفر، سريعة جداً)

| الكتابة | الاستخدام |
|---|---|
| `$x^2+1$` | داخل السطر |
| `$$ … $$` | معادلة مستقلة (يمكن أن تمتد على عدة أسطر) |
| `$$ … $$ {#eq:normal}` | معادلة **مرقّمة تلقائياً** (1.2) |
| `(@eq:normal)` | إشارة لها ← تظهر "(1.2)" كرابط |
| `$$ … $$ {tag=*}` | رقم يدوي |
| `\boxed{…}` | إطار النتيجة |

**ماكروز جاهزة:** `\X \A \B \K \F \I` (حروف غامقة) · `\vb{v}` · `\R \C \N \Z \Q` · `\abs{x}` · `\norm{x}` · `\diag` · `\tr` · `\rank` · `\T` (أُس T) · `\D{\alpha}` = $D^\alpha$ · `\Lap` = ℒ · `\dd` · `\e`.
كل بيئات KaTeX مدعومة: `pmatrix`, `vmatrix`, `bmatrix`, `cases`, `aligned`, `array`, `\color{#C0392B}{…}`.

---

## 3. الصناديق

```
::: نوع "عنوان اختياري" {#label} خصائص
المحتوى (نص، معادلات، رسومات، صناديق داخلية)
:::
```
الترقيم تلقائي حسب رقم المحاضرة (Definition 1.1، Example 4.2 …). الإشارة: `@label` ← "Example 4.2" كرابط.

| النوع | الشكل | ملاحظات |
|---|---|---|
| `definition` | شريط أخضر غامق | مرقّم |
| `theorem` `lemma` `corollary` `proposition` | شريط أحمر نبيذي | مرقّمة (عدّاد مشترك) |
| `example` | شريط أزرق | مرقّم · خاصية `homework` تضيف شارة |
| `solution` | تبويب أخضر "Solution" | **يُخفى للطالب** ويظهر مكانه سطور كتابة. `space=8` عدد السطور. `steps` لعرض الحل خطوة بخطوة |
| `answer` | داخل solution | "Answer." باللون الأخضر — للدكتور فقط |
| `proof` | تبويب رمادي + ∎ | `hide` ⇐ يُخفى للطالب |
| `remark` / `remarks` / `howto` / `illustration` | خط جانبي بنفسجي | العنوان يُكتب بين علامتي تنصيص |
| `recall "Determinants" from="Matrix Theory"` | شريط رمادي مزرق | يظهر: Recall from Matrix Theory: Determinants |
| `caution` | شريط برتقالي | |
| `keybox` | صندوق أزرق فاتح في الوسط | جملة مفتاحية |
| `note "عنوان"` | أصفر خفيف | |
| `summary` | شريط أزرق | |
| `homework` | شريط بني | |
| `teacher` | ذهبي | **للدكتور فقط** (ملاحظات تدريس) |
| `mcq` | قسم Self-Assessment البرتقالي | انظر §5 |
| `columns` | عمودان أو أكثر | افصل بينها بسطر `+++` · تصبح عموداً واحداً على الهاتف |

### حل خطوة بخطوة
```
::: solution steps space=6
$|A-\lambda I| = \lambda^2-\lambda-6$
>>>
$=(\lambda-3)(\lambda+2)=0$
>>>
$\lambda_1=3,\ \lambda_2=-2$
:::
```
يظهر زر **Next step ▸** و **Show all**.

### عمليات الصفوف (Gauss–Jordan) — متحركة
````
```rowops
[1 5 -9 | 1 0 0; 0 1 0 | 0 1 0; 0 -1 1 | 0 0 1]
R3+R2, R1-5R2
[1 0 -9 | 1 -5 0; 0 1 0 | 0 1 0; 0 0 1 | 0 1 1]
```
````
الصفوف `;` · المدخلات بمسافات · `|` خط المصفوفة الموسّعة · `1/2` يصبح ½ · مدخل LaTeX بين أقواس `{\cos t}`. أول عملية فوق السهم والباقي تحته، والصفوف التي تغيّرت تتلوّن بالأزرق وتظهر المصفوفات تباعاً.

---

## 4. الحركة (تلقائية — لا تحتاج كتابة شيء)
- كل صندوق يظهر بنعومة عند الوصول إليه، وعنوانه يلمع.
- كل معادلة مستقلة "تُكتب" من اليسار لليمين.
- كل منحنى في الرسومات يُرسم أمام الطالب، والنقاط تقفز للظهور.
- حقول الاتجاه فيها زر **Animate flow** (جسيمات تتحرك مع الحقل).
- الرسم ثلاثي الأبعاد يدور، ويُدار بالإصبع/الماوس.
- تُحترم إعدادات "تقليل الحركة" في الجهاز.

---

## 5. أسئلة الاختيار من متعدد
```
::: mcq
Q: The largest interval on which … has a unique solution is
- $(0,3)$ *
- $(0,\infty)$
- $(3,\infty)$
- $(-\infty,3)$
> We need $t\neq3$ and $t>0$; the piece containing $t_0=1$ is $(0,3)$.
:::
```
`*` في آخر الخيار = الإجابة الصحيحة · `>` = الشرح.
**الدكتور:** الإجابة مظللة + "Answer: (a)…" · **الطالب:** يضغط خياراً ⇐ أخضر/أحمر + الشرح + عدّاد درجته (لا يُحفظ شيء).

---

## 6. الرسومات

كتلة كود باسم النوع، والخصائص في سطر الافتتاح. خصائص عامة: `x=[a,b]` `y=[c,d]` `caption="… $math$ …"` `grid=off` `axes=off` `labels=off` `height=` `aspect=equal`.
خصائص العناصر: `color=blue|red|green|gold|navy|purple|orange|sky|gray|#hex` · `width=` · `label="$…$"` · `dash` · `opacity=`.
الدوال المتاحة: `sin cos tan sec csc cot asin acos atan sinh cosh tanh exp ln log sqrt abs floor ceil sign min max gamma fact ml(α,z) ml2(α,β,z) heaviside if(c,a,b)` والثوابت `pi e`. الضرب الضمني مسموح: `2x`, `3(x+1)`, `2pi`.

### `pyplot` — رسومات بايثون ⭐ (الطريقة المفضّلة للذكاء الاصطناعي)
كود Python عادي (matplotlib) داخل كتلة ```` ```pyplot ````. يُنفَّذ **مرة واحدة** في متصفح الدكتور عند Save أو Preview، وتُحفظ الصورة (SVG) في Cloudflare، والطالب يرى صورة جاهزة فوراً. لا يعمل بايثون على جهاز الطالب.

````
```pyplot caption="$E_\alpha(-t^\alpha)$ for several orders" width=560
t = np.linspace(0, 6, 400)
for a in [0.4, 0.6, 0.8, 1.0]:
    plt.plot(t, ml(-t**a, a), label=rf"$\alpha={a}$")
plt.xlabel("$t$"); plt.ylabel(r"$E_\alpha(-t^\alpha)$")
plt.legend()
```
````

| جاهز بدون import | الوصف |
|---|---|
| `np`, `plt`, `math`, `mp` | numpy, matplotlib.pyplot, math, mpmath |
| `gamma(x)` | دالة غاما (تقبل مصفوفات) |
| `ml(z, alpha, beta=1)` | Mittag-Leffler $E_{\alpha,\beta}(z)$ بدقة عالية (تقبل مصفوفات) |
| `caputo(y, t, alpha)` | مشتقة كابوتو $0<\alpha<1$ على شبكة منتظمة (L1). `y` مصفوفة أو دالة |
| `fde_solve(f, y0, alpha, t_end, h=0.01)` | يحل ${}^CD^\alpha y=f(t,y)$، $y(0)=y_0$، $0<\alpha\le1$ (predictor–corrector). يرجع `(t, y)`. يقبل أنظمة (`y0` قائمة) |
| `axes_through_origin()` | محوران يمرّان بالأصل (أسلوب المدرسة) |
| `pi_ticks(axis='x', step=0.5)` | تدريج بمضاعفات π |
| `blue red green orange purple brown sky gray gold navy` | ألوان الشيت |

- يمكن `import scipy…` و `import sympy` (تُحمَّل تلقائياً).
- الشكل الافتراضي مطابق للشيت: خط STIX، ألوان الصناديق، شبكة خفيفة، خلفية شفافة.
- رسم واحد لكل كتلة (يمكن `plt.subplots(1, 2)`). لوحتان جنباً إلى جنب تصغران على الهاتف، فالأفضل لوحة واحدة.
- **ممنوع:** `plt.show()`، `savefig`، قراءة ملفات أو إنترنت. الحد الأقصى للتنفيذ 3 دقائق.
- النص داخل الرسم: إنجليزي أو LaTeX (`$...$`) فقط، لأن matplotlib لا يدعم تشكيل العربية. الشرح العربي يوضع في `caption`.
- `width=520` أقصى عرض للصورة على الشاشة (افتراضي 660).
- الأسطح والرسومات الكثيفة جداً تُحوَّل تلقائياً لصورة نقطية داخل الـ SVG، مع بقاء النصوص والمحاور حادّة.
- الخطأ في الكود يظهر في المحرر مع رقم السطر، والحفظ لا يتم حتى يُصلح.
- لا تُعاد الرسمة إلا إذا تغيّر كودها، فالحفظ الثاني سريع.

**متى أستخدم الرسومات المدمجة (`plot`, `field`…)؟** عندما تكون الحركة أو التفاعل هي الهدف: مستوى طور متحرك، أو منزلق (`slider`). غير ذلك: `pyplot`.

### `plot` — الدوال
````
```plot x=[-2*pi,2*pi] y=[-2,2] pi=on caption="Trig"
f(x) = sin(x)  color=blue label="$\sin x$"
g(x) = cos(x)  color=red dash
y = x/3                          # بدون اسم
param (cos(3t), sin(2t)) t=[0,2pi]
polar r = 1 + cos(theta)
x^2 + y^2 = 4                    # منحنى ضمني
region y > x^2 and y < 2 color=gold
area f from 0 to pi               # مساحة تحت f
between f g from 0 to 1           # بين منحنيين
tangent f at 1
asymptote x = 0
riemann f from 0 to 2 n=8 mid     # left | right | mid + المجموع
point (pi/2, 1) label="max" guides
segment (0,0) (1,1)
vector (0,0) (2,1) color=red
text (1,1.5) "label"
slider a = 1 in [0, 5] step 0.1   # منزلق تفاعلي يُستخدم في الدوال
```
````
`pi=on` تدريج المحور بمضاعفات π/2 · `at=0.3` مكان عنوان المنحنى · `if(x<0,-x,x)` لدوال معرّفة بقطع.

### `field` — حقل الاتجاه ومستوى الطور ⭐
````
```field x=[-4,4] y=[-4,4]
matrix [2 3; 2 1]                 # أو: system x' = 2x+3y ; y' = 2x+y   أو: slope dy/dx = x - y
trajectories from (1,0.2) (-1,-0.2) (2,-2)     # أو: trajectories auto
eigenlines on
classify on                       # saddle / node / spiral / center + الاستقرار
nullclines on
flow on                           # يبدأ متحركاً
arrows off                        # إخفاء أسهم الحقل
```
````

### `plot3d`
````
```plot3d x=[-2,2] y=[-2,2]
surface z = x^2 - y^2  color=viridis      # viridis | ocean | gold
plane x + y + z = 1
curve (cos(t), sin(t), t/4) t=[0,8] color=red
vector (0,0,0) -> (1,1,1)
point (1,0,1)
```
````
`rotate=off` لإيقاف الدوران التلقائي.

### `numberline`
````
```numberline range=[-2,7]
interval (1, 5] color=blue label="$I$"
interval [-1, 0)
point 2 closed label="$t_0$"
mark 3.5
ray x >= 6
```
````

### `vectors`
````
```vectors x=[-1,5] y=[-1,4]
u = (3,1) color=blue
v = (1,2) color=red from=(0,0)
sum u v parallelogram
projection u on v
```
````

### `geometry`
````
```geometry x=[-1,6] y=[-1,5]
A = (0,0); B = (5,0); C = (1.5,3.5)
polygon A B C fill=blue
segment A B label="$c$"
line A C dash
circle center=A radius=2 dash
angle B A C label="$\alpha$"
midpoint M of B C
perpendicular from C to AB name=H
```
````
`axes=on` لإظهار المحاور.

### `complex`
````
```complex x=[-3,3] y=[-2.5,2.5]
z1 = 2+1.5i ; z2 = -1+2i
vector z1 z2
point conj(z1)
circle |z| = 1 dash
circle |z - (1+i)| = 2
polar-form z1
```
````

### `signchart` و `variation`
````
```signchart
factors (x-1) (x+2)
f'(x) = (x-1)(x+2)
roots -2 1          # اختياري — تُحسب تلقائياً
```

```variation
x: -inf | -2 | 1 | +inf
f'(x): + 0 - 0 +
f(x): up 4 down -1 up
```
````

### `stats`
````
```stats
histogram data=[2,3,3,5,7,7,9] bins=4
bar labels=[A,B,C] values=[5,3,8]
pie labels=[A,B,C] values=[5,3,8]
boxplot data=[2,3,5,7,9,11]
scatter data=[(1,2),(2,3.1),(3,4.2)] regression=linear
line data=[(0,1),(1,3),(2,2)]
normal mean=0 sd=1 from -1 to 1      # يظلل ويحسب الاحتمال
```
````

### `tree`, `venn`, `graph`, `diagram`
````
```tree
Start
  H : 1/2
    H : 1/2
    T : 1/2
  T : 1/2
```

```venn
A = {1,2,3} ; B = {3,4} ; C = {4,5}
shade A ∩ B          # ∩ ∪ -  و ' للمتمّمة، وأقواس
```

```graph layout=circle           # أو layout=force
A -> B : 3
B -- C
C -> A : 2
```

```diagram
cd: X --f--> Y --g--> Z ; X --g∘f--> Z
flow: Find |A − λI| -> Solve for λ -> {distinct?} -yes-> Use Theorem 4.1
```
````

### جداول وصور وفيديو
```
| $\lambda$ | Eigenvector |
|:---:|:---:|
| 3 | $(1,2)^T$ |

![Figure caption](https://… width=60%)
@video(youtube:VIDEO_ID start=120)
@desmos(https://www.desmos.com/calculator/abcd1234)
```
الصور: رابط https مباشر (رفع الصور داخل الشيت سيُضاف لاحقاً).

---

## 7. ما يحدث تلقائياً
- نسختا الطالب/الدكتور من نفس الملف.
- **علامة مائية** بالرقم الجامعي على كامل الشيت (تظهر في الطباعة أيضاً) + "Licensed to …" في التذييل. ملفات PDF تُختم برقم الطالب عند التنزيل.
- فهرس جانبي (حاسوب) / زر فهرس عائم (هاتف) + شريط تقدّم القراءة + تكبير/تصغير الخط.
- وضع الطباعة A4 مطابق للشيت الأصلي.
- **زر تحميل PDF** للطالب: يبني ملف PDF حقيقياً (نص قابل للتحديد، A4) من نفس الملف، مختوماً برقمه الجامعي.
- **الوضع الليلي:** الشيت يتحوّل لألوان داكنة مريحة، والرسومات تُعرض بألوان معكوسة متناسقة. الطباعة و PDF دائماً بالألوان الأصلية.
- **التحقق قبل النشر:** المحرر في لوحة التحكم يعرض الأخطاء فوراً (صندوق غير مغلق، `@ref` غير موجود، MCQ بلا إجابة…) + زر Preview.

---

## 8. Prompt جاهز للذكاء الاصطناعي
(موجود أيضاً بزر **Copy AI prompt** في محرر الشيت — أرفق هذا الملف معه)
```
You are converting lecture material into MN Syntax v1.2 (spec attached).
Rules:
1. Start with the YAML header (course, chapter, chapter_title, lecture, title, duration, lang).
2. Begin with ::: outcomes and ::: timeplan blocks.
3. Use ## for sections and ### for sub-sections.
4. Put every definition/theorem/example/remark/recall/caution in its ::: block. Do NOT number them — numbering is automatic. Give important items a {#label} and refer to them with @label.
5. After every example, add a ::: solution block with space=N (N = lines a student needs). Use `steps` with >>> for multi-step solutions.
6. Use LaTeX for all math. Number key equations with {#eq:name} after the closing $$ and cite them as (@eq:name).
7. FIGURES — write them in Python inside a ```pyplot block (matplotlib). Add one whenever a graph helps.
   - Already imported: np, plt, math, mp (mpmath), gamma, ml(z, alpha, beta=1) (Mittag-Leffler),
     caputo(y, t, alpha), fde_solve(f, y0, alpha, t_end, h), axes_through_origin(), pi_ticks().
     scipy and sympy may be imported. Colours: blue, red, green, orange, purple, gold, navy.
   - One figure per block (plt.subplots(1, 2) is fine). Never call plt.show() or savefig, never read files or the internet.
   - Text inside the figure: English or LaTeX ($...$) only. Put the explanation in caption="..." (any language).
   - Label axes and curves, add a legend when there are several curves, keep it under ~5 s of computing.
   - Use the built-in ```field block (animated phase portrait) only when the motion of trajectories is the point.
8. Use ```rowops for Gauss–Jordan row reductions.
9. End each lecture with ::: mcq (5 questions, mark the correct option with *, explain with >).
10. Output ONLY the .mn file content, nothing else.
```

---

## 9. Changelog
- **v1.2 (2026-11-01):** كتلة ```` ```pyplot ```` — رسومات بايثون حقيقية (numpy, matplotlib, scipy, sympy, mpmath) مع دوال جاهزة: `ml` (Mittag-Leffler)، `gamma`، `caputo`، `fde_solve`، `axes_through_origin`، `pi_ticks`. أصبحت الطريقة المفضّلة للرسومات في الـ Prompt. ملف مرجعي جديد: `docs/mn/python-figures.mn`.
- **v1.1 (2026-10-31):** مطابقة كاملة لما بُني فعلاً: إضافة `teacher`, `summary`, `illustration`, `note`, `from=` لـ recall، `(@eq:x)` للإشارة للمعادلات، `between`, `segment`, `vector`, `text`, `nullclines`, `arrows off`, `plane`, `line` في stats، ودوال `ml`, `if`. الحركة أصبحت تلقائية (أُلغيت `animate=` و `reveal=click`). الصور: روابط https فقط حالياً.
- **v1.0 (2026-10-31):** الإصدار الأول.
