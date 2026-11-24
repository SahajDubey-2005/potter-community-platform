"""Official-source scheme listings used by the Potter Community Government Schemes page.

This catalog is informational; the links are official sources, not proof that
applications are currently open. A Potter Community assistance request is NOT
an application to a government programme, nor is it an approval or guarantee.

Entries were researched using official Indian government / department pages
on 22 November 2026. Keep existing scheme IDs stable for saved requests.
"""

from copy import deepcopy

# Each listing includes source information, display copy and preliminary screening
# metadata. The frontend reads this data from GET /government-schemes/catalog.
_CATALOG = [{'id': 'kumhar-sashaktikaran',
  'scope': 'National',
  'state': 'All India',
  'title': 'Kumhar Sashaktikaran Programme (KSP)',
  'category': 'Potter-Specific Artisan Support',
  'ministry': 'Khadi and Village Industries Commission (KVIC), Ministry of MSME',
  'description': 'A pottery-focused initiative intended to strengthen traditional potters by improving their '
                 'tools, skills, productivity and livelihood opportunities.',
  'benefit': 'Depending on current local implementation and availability: pottery-wheel/equipment assistance '
             'and skill support. This is not an unconditional cash grant; the exact assistance depends on '
             'the approved programme and selection.',
  'eligibility': 'Traditional potters and eligible pottery artisans, subject to current KVIC programme '
                 "criteria and availability in the applicant's area.",
  'documents': 'Identity and address proof, bank details, evidence of pottery work if requested, and any '
               'documents specified by the local KVIC office.',
  'applicationUrl': 'https://www.kviconline.gov.in/',
  'sourceLabel': 'KVIC official website',
  'applicationNote': 'Contact the district KVIC office or state Khadi and Village Industries Board to '
                     'confirm current local availability, eligibility and application dates. Benefits are '
                     'not guaranteed.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'gramodyog-vikas-pottery',
  'scope': 'National',
  'state': 'All India',
  'title': 'Gramodyog Vikas Yojana — Pottery Activity',
  'category': 'Pottery Training & Equipment',
  'ministry': 'Khadi and Village Industries Commission (KVIC), Ministry of MSME',
  'description': 'The pottery-related component of Gramodyog Vikas Yojana supports pottery artisans through '
                 'skill development, improved production methods and equipment assistance.',
  'benefit': 'Depending on the approved activity: wheel-pottery, press-pottery or jigger-jolly training, and '
             'possible equipment such as pottery wheels, clay blungers or granulators. Support depends on '
             'the current programme and local implementation.',
  'eligibility': 'Eligible pottery artisans, trainees or pottery groups selected under the applicable KVIC '
                 'activity. Current age and selection conditions must be confirmed with the implementing '
                 'office.',
  'documents': 'Identity and address proof, bank details, evidence of pottery activity if requested, and '
               'application/training documents specified by KVIC.',
  'applicationUrl': 'https://champions.gov.in/Ministry-of-MSME_Portal/youth_Entrepreneurs-rural_urban_self_employment/New_Schemes.htm',
  'sourceLabel': 'Ministry of MSME — GVY Pottery Activity',
  'applicationNote': 'Contact KVIC or your state Khadi and Village Industries Board to check current pottery '
                     'training/equipment batches and application dates. Assistance is subject to approval '
                     'and availability.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'pm-vishwakarma-potter',
  'scope': 'National',
  'state': 'All India',
  'title': 'PM Vishwakarma — Potter (Kumhaar) Trade',
  'category': 'Traditional Artisan Support',
  'ministry': 'Ministry of Micro, Small and Medium Enterprises',
  'description': 'The national PM Vishwakarma scheme explicitly lists Potter (Kumhaar) among its 18 eligible '
                 'traditional trades. It is relevant to eligible potters, although it is not exclusive to '
                 'pottery alone.',
  'benefit': 'Eligible beneficiaries may receive recognition through a certificate and ID card, skill '
             'training, toolkit incentive up to ₹15,000, concessional collateral-free credit in tranches up '
             'to ₹3 lakh, and marketing/digital transaction support, subject to scheme rules.',
  'eligibility': 'Generally for Indian citizens aged 18 or older who are self-employed and actively '
                 'practising the notified Potter (Kumhaar) trade, subject to household, prior-loan and other '
                 'scheme restrictions.',
  'documents': 'Aadhaar-based identity verification and the documents requested through the official '
               'registration process.',
  'applicationUrl': 'https://pmvishwakarma.gov.in/',
  'sourceLabel': 'PM Vishwakarma official portal',
  'applicationNote': 'Registration is processed through the official portal/participating Common Service '
                     'Centre (CSC). Confirm the current eligibility rules before applying; approval is not '
                     'guaranteed.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18},
 {'id': 'gujarat-potter-toolkit',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Toolkit Assistance Scheme for Potters',
  'category': 'Gujarat — Pottery Equipment',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute (GMKRTI)',
  'description': 'A Gujarat state programme to improve pottery productivity by helping eligible working '
                 'potters obtain foot-operated or electric pottery wheels and electric pug mills.',
  'benefit': 'The official scheme page describes 75% government assistance for eligible equipment, with a '
             '25% beneficiary contribution. Confirm current rates, equipment availability and application '
             'status before applying.',
  'eligibility': 'Potters aged 18–50 who are engaged in pottery work. The official page states there is no '
                 'income limit; final eligibility is determined by GMKRTI.',
  'documents': 'Identity, age, residence and pottery-work proof, plus any documents required in the official '
               'application.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/toolkit_assistance_scheme_for_potters',
  'sourceLabel': 'GMKRTI Gujarat official scheme page',
  'applicationNote': 'This programme is for eligible applicants in Gujarat. Use the official scheme page to '
                     'check the live application process, required documents and current availability.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18,
  'max_age': 50},
 {'id': 'up-matikala-rojgar',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Mukhyamantri Matikala Rojgar Yojana',
  'category': 'Uttar Pradesh — Pottery Enterprise',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'A state programme supporting eligible pottery artisans who want to establish a '
                 'pottery-related unit producing items such as kulhads, household clay products, toys, '
                 'decorative items and garden pots.',
  'benefit': 'The official scheme page describes bank-financed projects up to ₹10 lakh, with a 5% '
             'entrepreneur contribution and 25% of the capital loan amount provided as margin money under '
             'the scheme rules. Confirm the current guidelines before relying on these figures.',
  'eligibility': 'Eligible applicants establishing an individual pottery-related enterprise in Uttar '
                 "Pradesh, selected through the Board's prescribed process and subject to current criteria.",
  'documents': 'Residence and identity proof, project details, bank-required documents and other documents '
               'requested by the Uttar Pradesh Matikala Board.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/MatikalaRojgaar',
  'sourceLabel': 'Uttar Pradesh Matikala Board',
  'applicationNote': 'For current eligibility and applications, use the official Uttar Pradesh Matikala '
                     'Board portal or contact the district Gramodyog office. Loan sanction and margin-money '
                     'release are subject to the scheme process.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'up-matikala-toolkit',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Matikala Tool-Kit Distribution Scheme',
  'category': 'Uttar Pradesh — Artisan Tools',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'A state programme listed by the Uttar Pradesh Matikala Board to provide modern tools to '
                 'economically weaker pottery artisans.',
  'benefit': 'Tool-kit assistance for eligible pottery artisans, according to the current scheme guidelines '
             'and availability. The official listing does not establish a universal cash amount.',
  'eligibility': "Eligible pottery artisans in Uttar Pradesh selected under the Board's current rules.",
  'documents': 'Identity and residence proof, evidence of pottery work and any documents listed in the '
               'current application instructions.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/Index',
  'sourceLabel': 'Uttar Pradesh Matikala Board',
  'applicationNote': "Check the Board's official portal or district Gramodyog office for the current "
                     'application window, selection rules and tool-kit availability.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'up-matikala-skill',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Matikala Skill Development Scheme',
  'category': 'Uttar Pradesh — Pottery Training',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'Practical pottery and craft training for eligible artisans, including everyday clay '
                 'products, decorative products, toys, idols and surface-decoration techniques.',
  'benefit': 'The Board describes a 15-day pottery craft training programme. Training access and any '
             'associated support depend on selection and current programme availability.',
  'eligibility': "Candidates selected under the Uttar Pradesh Matikala Board's current criteria; the "
                 'published description links practical training to beneficiaries selected for the '
                 'Mukhyamantri Matikala Rojgar Yojana.',
  'documents': 'Identity and residence proof, pottery/business application details and any documents '
               'requested by the district Gramodyog office.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/MatikalaKaushal',
  'sourceLabel': 'Uttar Pradesh Matikala Board',
  'applicationNote': 'Use the official Board page or contact the district Gramodyog office to verify current '
                     'batches, selection requirements and application dates.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'chhattisgarh-matikala-registration',
  'scope': 'State',
  'state': 'Chhattisgarh',
  'title': 'Chhattisgarh Matikala Board — Potter/Clay Artisan Registration',
  'category': 'Chhattisgarh — Artisan Registration',
  'ministry': 'Chhattisgarh Matikala Board / Rural Industries Department',
  'description': 'An official registration service for residents engaged in pottery (Kumhari) and clay work. '
                 'Registration identifies artisans for possible inclusion in Board welfare and support '
                 'programmes.',
  'benefit': 'Registration may enable eligible artisans to access pottery-related schemes, training, '
             'exhibitions, marketing support and electric-wheel assistance when such support is available. '
             'Registration itself is not a guaranteed grant.',
  'eligibility': 'Applicants engaged in pottery or clay work, native residents of Chhattisgarh, and at least '
                 '18 years old under the published service conditions.',
  'documents': 'Identity and residence proof, age proof and evidence of pottery/clay work, as required by '
               'the official registration service.',
  'applicationUrl': 'https://uat-ed.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=211',
  'sourceLabel': 'Chhattisgarh government Sewa Setu service',
  'applicationNote': 'This is a state registration service, not a guaranteed cash benefit. Check the live '
                     'Chhattisgarh government service portal for current availability and linked schemes.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18},
 {'id': 'pmegp-pottery-enterprise',
  'scope': 'National',
  'state': 'All India',
  'title': 'Prime Minister’s Employment Generation Programme (PMEGP)',
  'category': 'All India — Pottery Business Loans',
  'ministry': 'Ministry of MSME / KVIC',
  'description': 'Credit-linked subsidy for eligible NEW manufacturing and service micro-enterprises. A new '
                 'pottery, terracotta or ceramic production unit may be considered under current lending '
                 'rules.',
  'benefit': 'Official MSME guidance describes up to ₹50 lakh manufacturing project cost, up to ₹20 lakh '
             'services project cost and subsidy bands of 15–35%; sanction and subsidy depend on bank '
             'approval and current rules, not automatic grants.',
  'eligibility': 'Indian adults proposing eligible new micro-enterprises, subject to sector, qualification, '
                 'investment, prior subsidy and bank eligibility restrictions.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://pmegp.msme.gov.in/Home/HomePage',
  'sourceLabel': 'MSME / PMEGP official portal',
  'applicationNote': 'PMEGP is a bank-linked enterprise scheme, not a potter-specific cash grant. Use the '
                     'official PMEGP e-portal for the genuine application and check rules before incurring '
                     'any expenses.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18},
 {'id': 'mudra-pottery-enterprise',
  'scope': 'National',
  'state': 'All India',
  'title': 'Pradhan Mantri MUDRA Yojana (PMMY)',
  'category': 'All India — Micro-Enterprise Credit',
  'ministry': 'Ministry of Finance / MUDRA / participating banks',
  'description': 'Micro-enterprise financing that can potentially support eligible pottery manufacturers, '
                 'potters selling their products, or clay-craft service enterprises.',
  'benefit': 'Loan support in Shishu, Kishor, Tarun and eligible Tarun Plus categories. Ministry of MSME '
             'guidance describes loans up to ₹20 lakh subject to Tarun Plus conditions; this is repayable '
             'credit, not a subsidy.',
  'eligibility': 'Eligible non-farm income-generating micro-enterprise borrowers, based on participating '
                 'lender underwriting and the relevant loan category.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://www.mudra.org.in/',
  'sourceLabel': 'MUDRA official portal',
  'applicationNote': 'This is a loan facility—not a government grant. Tarun Plus has specific previous-loan '
                     'repayment requirements. Apply through participating lenders only.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'sfurti-pottery-cluster',
  'scope': 'National',
  'state': 'All India',
  'title': 'SFURTI — Traditional Industries Cluster Support',
  'category': 'All India — Artisan Clusters',
  'ministry': 'Ministry of MSME / KVIC',
  'description': 'Cluster-based support for traditional industries, including pottery and terracotta '
                 'clusters, through eligible implementing agencies and approved projects.',
  'benefit': 'May support shared machinery, common facilities, design, training and marketing in approved '
             'clusters; individuals are not automatically entitled to direct cash or equipment.',
  'eligibility': 'Pottery artisans and producer groups in approved clusters; formal proposals generally pass '
                 'through implementing agencies and technical agencies.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://sfurti.msme.gov.in/',
  'sourceLabel': 'MSME SFURTI official portal',
  'applicationNote': 'This is a CLUSTER programme. Ask your district industries centre or KVIC whether a '
                     'local pottery cluster or implementing agency is active. There is no universal '
                     'individual grant.',
  'applicant_type': 'GROUP'},
 {'id': 'nhdp-handicrafts',
  'scope': 'National',
  'state': 'All India',
  'title': 'National Handicrafts Development Programme (NHDP)',
  'category': 'All India — Handicraft Skill & Marketing',
  'ministry': 'Office of Development Commissioner (Handicrafts), Ministry of Textiles',
  'description': 'National handicrafts support for eligible registered crafts and artisans, including '
                 'pottery/terracotta where included in notified training, market, design or cluster '
                 'activities.',
  'benefit': 'Programme activities can include artisan mobilisation, skill-upgradation, design and product '
             'development, marketing events and supported craft clusters; availability differs by programme '
             'and location.',
  'eligibility': 'Eligible handicraft artisans, groups or agencies under the applicable NHDP component and '
                 'craft-specific notice; not every pottery business automatically qualifies.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://indian.handicrafts.gov.in/en',
  'sourceLabel': 'Development Commissioner (Handicrafts) official portal',
  'applicationNote': 'Contact the relevant Handicrafts Service Centre and check the latest '
                     'component-specific invitations. This entry is general handicraft support, not a '
                     'guaranteed pottery grant.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'gujarat-energy-efficient-kiln',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Energy-Efficient Potters Kiln Scheme',
  'category': 'Gujarat — Group Kiln Assistance',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute',
  'description': 'Energy-efficient pottery kilns intended to reduce fuel, smoke and health risks in eligible '
                 'pottery artisan groups.',
  'benefit': 'The official institute describes 100% subsidised energy-efficient kilns for selected potter '
             'groups, subject to land, group formation and programme rules.',
  'eligibility': 'Potters working as an eligible group and able to satisfy site, land and participation '
                 'conditions; not an unconditional individual cash transfer.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/energy_efficient_kiln_scheme',
  'sourceLabel': 'GMKRTI Gujarat official kiln scheme',
  'applicationNote': 'Official programme information was verified on 22 November 2026; current funding, '
                     'intake, eligibility and application dates must be confirmed directly with the '
                     'authority. Potter Community only records an assistance request; it does not submit an '
                     'official application.',
  'applicant_type': 'GROUP'},
 {'id': 'gujarat-clay-idol-promotion',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Clay Idol Promotion Scheme',
  'category': 'Gujarat — Eco-Friendly Clay Idols',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute',
  'description': 'Programme promoting eco-friendly clay idol manufacturing and marketing by eligible Gujarat '
                 'artisans.',
  'benefit': 'Official programme details describe subsidised ready-to-use clay, marketing facilities and '
             'related support for registered clay idol makers; benefits depend on current fair and scheme '
             'conditions.',
  'eligibility': 'Gujarat clay idol makers meeting institute registration and scheme rules.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/clay_idol_promotion_scheme',
  'sourceLabel': 'GMKRTI Gujarat official clay idol scheme',
  'applicationNote': 'Official programme information was verified on 22 November 2026; current funding, '
                     'intake, eligibility and application dates must be confirmed directly with the '
                     'authority. Potter Community only records an assistance request; it does not submit an '
                     'official application.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'gujarat-pottery-skill-training',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Pottery Skill Training Programme',
  'category': 'Gujarat — Pottery Training',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute',
  'description': 'Official pottery skill courses cover clay identification, red/black pottery, glazing, '
                 'design and casting techniques for artisan livelihood improvement.',
  'benefit': 'Practical skill training in announced batches; training slots and any associated benefits '
             'depend on current institute schedules.',
  'eligibility': 'Eligible Gujarat artisans or training candidates admitted by the institute under the '
                 'current training notice.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/short_term_skill_training/pottery_skill',
  'sourceLabel': 'GMKRTI Gujarat pottery training',
  'applicationNote': 'Official programme information was verified on 22 November 2026; current funding, '
                     'intake, eligibility and application dates must be confirmed directly with the '
                     'authority. Potter Community only records an assistance request; it does not submit an '
                     'official application.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'gujarat-kulhad-training',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Kulhad Making Skill Training',
  'category': 'Gujarat — Clay Cup Training',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute',
  'description': 'Training in making earthen kulhads for beverage-serving and other uses, including '
                 'pottery-wheel and kiln handling.',
  'benefit': 'Practical skill development; course admission depends on current batch availability.',
  'eligibility': 'Eligible applicants selected for Gujarat Institute training; may include artisans and '
                 'interested unemployed youth as announced.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/short_term_skill_training/kullhad_making',
  'sourceLabel': 'GMKRTI Gujarat kulhad training',
  'applicationNote': 'Official programme information was verified on 22 November 2026; current funding, '
                     'intake, eligibility and application dates must be confirmed directly with the '
                     'authority. Potter Community only records an assistance request; it does not submit an '
                     'official application.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'gujarat-mati-mela',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Mati Mela Yojna — Clay Craft Marketing Fairs',
  'category': 'Gujarat — Sales & Exhibitions',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute',
  'description': 'Gujarat scheme approved in August 2026 for free sales-fair stalls and market access for '
                 'clay artisans producing diyas, kulhads, toys and pottery.',
  'benefit': 'The official 2026 scheme page states free fair stalls and ₹1,000 per day attendance/sales '
             'assistance including freight allowance for qualifying participants.',
  'eligibility': 'Gujarat clay craft producing artisans aged at least 18 with recognised artisan '
                 'identification or the prescribed village certificate; only one participant per artisan '
                 'family.',
  'documents': 'Artisan ID card or prescribed Talati-cum-Mantri certificate; residence and identity proof; '
               'additional forms requested for the chosen fair.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/mati_mela_yojna',
  'sourceLabel': 'GMKRTI Gujarat 2026 Mati Mela Yojna',
  'applicationNote': 'Launched for 2026–27; participation is subject to individual fair notices and '
                     'approval. Follow the official portal for the downloadable application form.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18},
 {'id': 'gujarat-manav-kalyan-training',
  'scope': 'State',
  'state': 'Gujarat',
  'title': 'Manav Kalyan Yojana — Toolkit Beneficiary Training',
  'category': 'Gujarat — Selected Artisan Training',
  'ministry': 'Gujarat Matikam Kalakari & Rural Technology Institute / Cottage Industries',
  'description': 'Five-day entrepreneurship, marketing, digital-payment and soft-skill training given to '
                 'toolkit beneficiaries chosen under the official Manav Kalyan online draw.',
  'benefit': 'The institute describes ₹500 per day training stipend for selected participants; selection '
             'through Manav Kalyan is a prerequisite.',
  'eligibility': 'People aged 18–60 who were selected for the relevant Manav Kalyan toolkit programme; it is '
                 'not an open programme for every potter.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://gmkrti.gujarat.gov.in/schemes/manav_kalyan_yojana',
  'sourceLabel': 'GMKRTI Gujarat Manav Kalyan training',
  'applicationNote': 'Only beneficiaries selected under the online draw receive this training; do not '
                     'represent the stipend as a direct grant to all potters.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18,
  'max_age': 60},
 {'id': 'up-matikala-marketing',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Matikala Marketing Development & Promotion Assistance',
  'category': 'Uttar Pradesh — Marketing Fairs',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'Official application programme for pottery artisans to participate in marketing and '
                 'promotion events and display clay-based products.',
  'benefit': 'Participation opportunities and exhibition stalls subject to event, financial-year and '
             'selection requirements; no universal payment is listed.',
  'eligibility': 'Eligible Uttar Pradesh pottery producers and artisan units meeting the Board '
                 'event/application conditions.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/VipdanScheme',
  'sourceLabel': 'Uttar Pradesh Matikala Board marketing application',
  'applicationNote': 'The official Board provides an online form. Confirm the active financial year, '
                     'eligible exhibitions, and any grant/fee conditions before applying.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'up-matikala-awards',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Matikala Puraskar Yojana — Artisan Awards',
  'category': 'Uttar Pradesh — Pottery Awards',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'State and divisional awards recognising outstanding traditionally-made pottery and '
                 'clay-craft work.',
  'benefit': 'Selected craftspersons receive awards at divisional or state level after evaluation; awards '
             'are competitive, not automatic livelihood grants.',
  'eligibility': 'Uttar Pradesh potters/craftspersons at least 18 years old, meeting Board registration, '
                 'residence and craft competition rules.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/MatikalaPuraskar',
  'sourceLabel': 'Uttar Pradesh Matikala Board awards',
  'applicationNote': 'Official board page confirms the award programme. Check current competition dates and '
                     'registration instructions.',
  'applicant_type': 'INDIVIDUAL',
  'min_age': 18},
 {'id': 'up-matikala-common-facility',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Micro Matikala Common Facility Centre Scheme',
  'category': 'Uttar Pradesh — Group Facilities',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'Common facility centre programme for eligible clay-industry cooperative societies to set '
                 'up pottery workspaces and shared production facilities.',
  'benefit': 'Common infrastructure/facility support to approved cooperative applications; not a direct '
             'individual equipment grant.',
  'eligibility': 'Eligible registered Matikala industrial cooperative societies with member details, '
                 'land/workshop documentation, a project proposal and bank records.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/MicroMatikalaCommon',
  'sourceLabel': 'Uttar Pradesh Matikala Board cooperative facility application',
  'applicationNote': 'The official application specifically requests cooperative registration, members, '
                     'land, project report and bank details. An individual potter generally cannot apply as '
                     'a single applicant.',
  'applicant_type': 'GROUP'},
 {'id': 'up-matikala-artisan-registration',
  'scope': 'State',
  'state': 'Uttar Pradesh',
  'title': 'Matikala Artisan Registration & Certificate',
  'category': 'Uttar Pradesh — Artisan Registration',
  'ministry': 'Uttar Pradesh Matikala Board',
  'description': 'Board artisan recording/registration and certification service for traditional pottery '
                 'workers.',
  'benefit': 'Artisan registration/certification may be used in other Board programmes; registering is not '
             'itself a financial benefit.',
  'eligibility': 'Potters in Uttar Pradesh meeting the Board occupational and residence verification '
                 'requirements.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://upmatikalaboard.in/Home/MatikalaKarigarCertificate',
  'sourceLabel': 'Uttar Pradesh Matikala Board registration service',
  'applicationNote': 'This is a registration service, not a grant. Check the official form and district '
                     'office for applicable requirements.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'kerala-traditional-pottery-assistance',
  'scope': 'State',
  'state': 'Kerala',
  'title': 'Assistance to Traditional Pottery Makers',
  'category': 'Kerala — Traditional Potter Grant',
  'ministry': 'Kerala Backward Classes Development Department',
  'description': 'Kerala grant programme for eligible OBC traditional pottery makers engaged in actual '
                 'clay-vessel production.',
  'benefit': 'The state scheme page describes assistance of up to ₹50,000, capped at 50% of eligible tools, '
             'workshed and kiln expenditure, with staged release and verification.',
  'eligibility': 'Kerala OBC traditional pottery workers with family income not exceeding ₹2.5 lakh per '
                 'year, maximum age 60, currently manufacturing pottery; previous beneficiaries and families '
                 'can be excluded.',
  'documents': 'Relevant caste/income certificate, identity and ration card, land/possession records, '
               'local-body pottery occupation certificate and other documents in the current official '
               'notice.',
  'applicationUrl': 'https://www.bwin.kerala.gov.in/',
  'sourceLabel': 'Kerala BWIN Backward Classes official scheme page',
  'applicationNote': 'The official listing describes the grant, but the current 2026–27 application window '
                     'was not confirmed. Applicants must verify the latest notice; the platform cannot '
                     'register them with Kerala government.',
  'applicant_type': 'INDIVIDUAL',
  'max_age': 60},
 {'id': 'kerala-asha-handicrafts',
  'scope': 'State',
  'state': 'Kerala',
  'title': 'Assistance Scheme for Handicrafts Artisans (ASHA)',
  'category': 'Kerala — Craft Enterprise Assistance',
  'ministry': 'Kerala Directorate of Industries and Commerce',
  'description': 'Kerala one-time support for eligible handicraft enterprises; the industry department '
                 'explicitly recognises potters through the Kerala State Pottery Manufacturing Marketing and '
                 'Welfare Development Corporation.',
  'benefit': 'Capital/working-capital assistance for eligible micro handicraft enterprises according to '
             'current guidelines; benefit ceilings should be confirmed with the district industries office.',
  'eligibility': 'Kerala handicraft artisans establishing eligible enterprises and holding the necessary '
                 'craft recognition, Udyam and project/financial documents.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://www.industry.kerala.gov.in/index.php/schemes-mainmenu/asha-schemes',
  'sourceLabel': 'Kerala Industries official ASHA scheme',
  'applicationNote': 'Different official Kerala pages publish differing assistance figures. Confirm the '
                     'latest government order, ceilings and application method with the District Industries '
                     'Centre before applying.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'tamilnadu-pottery-workers-welfare',
  'scope': 'State',
  'state': 'Tamil Nadu',
  'title': 'Tamil Nadu Pottery Workers Welfare Board Registration',
  'category': 'Tamil Nadu — Potter Welfare',
  'ministry': 'Tamil Nadu Labour Welfare Department / Pottery Workers Welfare Board',
  'description': 'State welfare-board registration and applicable social-security support for eligible '
                 'pottery workers under the unorganised worker welfare framework.',
  'benefit': 'Registration can provide access to applicable welfare benefits subject to worker status and '
             'prevailing board rules; it is not an immediate cash grant.',
  'eligibility': 'Eligible Tamil Nadu workers engaged in pottery work under the current board registration '
                 'and welfare rules.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://tnuwwb.tn.gov.in/applications/natureofwork',
  'sourceLabel': 'Tamil Nadu unorganised workers official portal',
  'applicationNote': 'Choose TN Pottery WWB / Pottery Works on the official state portal. Eligibility and '
                     'claim documentation vary by benefit.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'tamilnadu-artisan-registration',
  'scope': 'State',
  'state': 'Tamil Nadu',
  'title': 'Tamil Nadu Artisans Portal — Handicraft Registration',
  'category': 'Tamil Nadu — Artisan Directory',
  'ministry': 'Tamil Nadu Handicrafts Development Corporation (Poompuhar)',
  'description': 'The state handicrafts portal maintains an artisan skills repository, enabling eligible '
                 'craftspeople to list and connect to training and marketing opportunities.',
  'benefit': 'Artisan profile/visibility and access to notified craft development activities; registration '
             'alone guarantees neither a toolkit nor a cash award.',
  'eligibility': 'Tamil Nadu handicraft artisans meeting the state portal registration criteria, including '
                 'relevant clay/terracotta artisans.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://tnartisan.tn.gov.in/',
  'sourceLabel': 'Tamil Nadu Handicrafts Corporation official artisan portal',
  'applicationNote': 'Official programme information was verified on 22 November 2026; current funding, '
                     'intake, eligibility and application dates must be confirmed directly with the '
                     'authority. Potter Community only records an assistance request; it does not submit an '
                     'official application.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'tamilnadu-terracotta-facilities',
  'scope': 'State',
  'state': 'Tamil Nadu',
  'title': 'Clay & Terracotta Common Facility / Training Support',
  'category': 'Tamil Nadu — Shared Craft Facilities',
  'ministry': 'Tamil Nadu Handicrafts Development Corporation (Poompuhar)',
  'description': 'The Corporation describes clay and terracotta common facility centres and periodic '
                 'training/design workshops under handicraft development initiatives.',
  'benefit': 'Shared facilities, skills and design/production access where programmes or centres are '
             'operating; individual monetary benefits are not guaranteed.',
  'eligibility': 'Artisans accepted by eligible local clusters, facility centres or training programmes.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://tnartisan.tn.gov.in/faq',
  'sourceLabel': 'Tamil Nadu Handicrafts Corporation official FAQ',
  'applicationNote': 'Official descriptions include older facility projects. Contact the Corporation for '
                     'current centres, intake and available pottery/terracotta activities.',
  'applicant_type': 'GROUP'},
 {'id': 'odisha-artisan-workshed',
  'scope': 'State',
  'state': 'Odisha',
  'title': 'Workshed Assistance for Handicraft Artisans',
  'category': 'Odisha — Handicraft Workshed',
  'ministry': 'Odisha Directorate of Handicrafts',
  'description': 'State handicraft workshed construction support, potentially relevant to qualified '
                 'pottery/terracotta artisans.',
  'benefit': 'Workshed assistance subject to current state guidelines, land proof and sanctioned funding; '
             'the government does not guarantee approval to every applicant.',
  'eligibility': 'Eligible Odisha handicraft artisans including recognised pottery/terracotta workers who '
                 'satisfy current land and occupation requirements.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://crafts.odisha.gov.in/?page_id=525',
  'sourceLabel': 'Odisha Directorate of Handicrafts guidelines',
  'applicationNote': 'Use the current government workshed guidelines and district handicrafts office to '
                     'confirm active applications; published programme guidelines do not establish an '
                     'always-open intake.',
  'applicant_type': 'INDIVIDUAL'},
 {'id': 'odisha-craft-village',
  'scope': 'State',
  'state': 'Odisha',
  'title': 'Craft Village / Cluster Skill Upgradation',
  'category': 'Odisha — Craft Cluster Training',
  'ministry': 'Odisha Directorate of Handicrafts',
  'description': 'State craft-village programme helping artisans in selected handicraft clusters with '
                 'organised training and group livelihood support.',
  'benefit': 'Group-based training, skill upgrading and cluster infrastructure where the district selects a '
             'craft village; individual equipment or money is not automatic.',
  'eligibility': 'Odisha handicraft workers in approved craft clusters/SHGs, including pottery/terracotta '
                 'only where designated as an eligible cluster.',
  'documents': 'Identity and address proof, bank/account records if requested, evidence of craft or '
               'enterprise, and any documents in the current official notice.',
  'applicationUrl': 'https://handloom.odisha.gov.in/en/node/153558',
  'sourceLabel': 'Odisha Handlooms, Textiles & Handicrafts Department',
  'applicationNote': 'The programme is cluster-based. Verify local craft and location coverage through the '
                     'Directorate of Handicrafts or the District Industries Centre.',
  'applicant_type': 'GROUP'}]

SCHEMES = {item["id"]: item for item in _CATALOG}

# Backward compatibility: the Ministry of Culture pottery/ceramics scholarship
# already exists on the separate Scholarships page and was previously accepted
# by the Government Schemes assistance endpoint. Keep its ID valid for older
# users, but do not duplicate its card in the Government Schemes section.
SCHEMES["young-artistes-pottery-ceramics"] = {
    "id": "young-artistes-pottery-ceramics",
    "title": "Scholarships to Young Artistes in Different Cultural Fields",
    "state": "All India",
    "scope": "National",
    "min_age": 18,
    "max_age": 25,
    "visible": False,
}


def visible_catalog():
    """Return a fresh copy to ensure request handlers never mutate shared records."""
    return deepcopy(_CATALOG)
