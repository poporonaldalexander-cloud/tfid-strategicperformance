-- ==============================================================
-- Strategic Performance (Tanoto Foundation) — SETUP SEKALI JALAN
-- Tempelkan SELURUH isi file ini ke Supabase > SQL Editor > Run.
-- Berisi: pembuatan tabel (schema) + data awal (seed) 121 indikator.
-- Aman dijalankan ulang: tabel lama akan di-drop lebih dulu.
-- ==============================================================

-- ============================================================
-- Tanoto Foundation — Strategic Performance (Balanced Scorecard)
-- Supabase schema. Jalankan seluruh file ini di Supabase SQL Editor.
-- ============================================================

-- Hapus tabel lama (jika ada) agar bisa dijalankan ulang dengan aman
drop table if exists indicators cascade;
drop table if exists programs cascade;
drop table if exists outcomes cascade;
drop table if exists accountability cascade;
drop table if exists app_users cascade;
drop table if exists strategy_map cascade;

create table strategy_map (
  id     text primary key,
  name   text not null,
  "order" int default 0,
  status text default 'Active'
);

create table accountability (
  id          text primary key,
  name        text not null,
  short       text,
  lead_person text,
  status      text default 'Active'
);

create table outcomes (
  id          text primary key,
  sm_id       text references strategy_map(id),
  code        text,
  name        text not null,
  description text,
  status      text default 'Active'
);

create table programs (
  id         text primary key,
  name       text not null,
  portfolio  text,
  acc_id     text references accountability(id),
  start_year int,
  end_year   int,
  status     text default 'Active'
);

create table app_users (
  email       text primary key,
  name        text not null,
  role        text default 'Program PIC',
  dept        text,
  acc_id      text,                 -- 'ALL' atau NULL = semua unit
  can_edit    boolean default false,
  can_approve boolean default false,
  status      text default 'Active'
);

create table indicators (
  id              text primary key,   -- format: <code>-<year>, mis. IND01-2025
  year            int  not null,
  sm_id           text references strategy_map(id),
  outcome_id      text references outcomes(id),
  acc_id          text references accountability(id),
  program_id      text,
  program_name    text,
  code            text,
  details         text,
  name            text not null,
  definition      text,
  unit            text,
  disaggregation  text,
  frequency       text,
  data_source     text,
  mov             text,
  calc_method     text,
  indicator_type  text,
  direction       text default 'Naik',
  pic             text,
  target_2030     double precision,
  target_2030_raw text,
  target_year     double precision,
  target_year_raw text,
  actual          double precision,
  actual_raw      text,
  ach_target_2030 double precision,
  ach_year        double precision,
  q1 double precision, q2 double precision, q3 double precision, q4 double precision,
  notes           text,
  key_initiatives text,
  follow_up       text,
  status          text default 'Active',
  updated_at      timestamptz default now()
);

create index on indicators (year);
create index on indicators (acc_id);
create index on indicators (sm_id);

-- ------------------------------------------------------------
-- Keamanan: untuk DEMO, RLS dimatikan agar anon key bisa baca/tulis.
-- Untuk PRODUKSI, aktifkan RLS + Supabase Auth (lihat README, langkah 8).
-- ------------------------------------------------------------
alter table strategy_map   disable row level security;
alter table accountability disable row level security;
alter table outcomes       disable row level security;
alter table programs       disable row level security;
alter table app_users      disable row level security;
alter table indicators     disable row level security;

-- =================  DATA AWAL (SEED)  ========================

-- Seed data hasil ekstraksi dari TFID_Strategic_Performance.xlsx

insert into strategy_map (id,name,"order",status) values
('SM01','Beneficiaries & Stakeholders',1,'Active'),
('SM02','Financial',2,'Active'),
('SM03','Internal Process',3,'Active'),
('SM04','Learning & Growth',4,'Active');

insert into accountability (id,name,short,lead_person,status) values
('ACC01','Learning Environment','LE','Head LE','Active'),
('ACC02','Leadership Development and Scholarship','LDS','Head LDS','Active'),
('ACC03','Strategic Plan and Partnership','SPP','Head SPP','Active'),
('ACC04','Policy and Advocacy','PA','Head P&A','Active'),
('ACC05','Finance, Administration, Tax, Legal and Compliance','FATLC','Head FATLC','Active'),
('ACC06','Human Resources Development','HRD','Head HRD','Active');

insert into outcomes (id,sm_id,code,name,description,status) values
('OUT01','SM01','O1','Maintain/increase the scale of implementation of teaching and learning improvement programs.',NULL,'Active'),
('OUT02','SM01','O2','Effective improvement in reading and numeracy skills.',NULL,'Active'),
('OUT03','SM01','O3','Program participants lead/support social transformation in the various sectors in which they work.',NULL,'Active'),
('OUT04','SM01','O4','Increasing the capacity of partner districts to implement stunting reduction programs.',NULL,'Active'),
('OUT05','SM01','O5','Children in our center are developing at an age-appropriate pace.','According to CREDI','Active'),
('OUT06','SM01','O6','Early stimulation & parenting are mainstreamed through all avenue.',NULL,'Active'),
('OUT07','SM01','O7','Improved literacy & numeracy.',NULL,'Active'),
('OUT08','SM01','O8','Beneficiaries contribute to the community and country.',NULL,'Active'),
('OUT09','SM01','O9','Expansion of partner district through catalytic funding.',NULL,'Active'),
('OUT10','SM01','O10','Implementation of early stimulation & parenting through catalytic funding.',NULL,'Active'),
('OUT11','SM01','O11','Increased awareness, knowledge, resources and partnership for human capital development.',NULL,'Active'),
('OUT12','SM01','O12','Increased importance of leadership development in HD sector.',NULL,'Active'),
('OUT13','SM01','O13','Leaders contribute to​ the community and country.',NULL,'Active'),
('OUT14','SM01','O14','Reducing of stunting prevalence.',NULL,'Active'),
('OUT15','SM01','O15','Strengthened institutions, policies, and people related to national stunting reduction initiatives.',NULL,'Active'),
('OUT16','SM01','O16','Tanoto Foundation serves as a thought and catalytic leader for human capital development within the social ecosystem.',NULL,'Active'),
('OUT17','SM01','O17','Tanoto Scholars show evidence of the development of soft skills and values.',NULL,'Active'),
('OUT18','SM01','O18','Government demonstrates enhanced capacity and financial commitment to improve human capital development; 10% government leaders drive action in early stimulation, parenting, literacy, and numeracy.',NULL,'Active'),
('OUT19','SM01','O19','Improved national and sub-national policy climate for early stimulation and parenting: Parenting and early stimulation policies are issued by national Government; 40% of our partner district governments (out of 27) have parenting and early stimulation policies; A coalition as center of excellence for research and advocacy for child development.',NULL,'Active'),
('OUT20','SM01','O20','Improved national and sub-national policy climate for  literacy and numeracy: APS-like monitoring system on school quality is adapted by national government; 80% of partner districts have regulation for literacy and numeracy.',NULL,'Active'),
('OUT21','SM02','O21','Operation excellence & sustainable growth (Financial).',NULL,'Active'),
('OUT22','SM03','O22','Operation excellence & sustainable growth (Internal Process).',NULL,'Active'),
('OUT23','SM04','O23','Operation excellence & sustainable growth (Learning & Growth).',NULL,'Active');

insert into programs (id,name,portfolio,acc_id,start_year,end_year,status) values
('PRG01','BE','LE','ACC01',2024,2030,'Active'),
('PRG02','ECED','LE','ACC01',2024,2030,'Active'),
('PRG03','Fellowship','LDS','ACC02',2024,2030,'Active'),
('PRG04','TELADAN','LDS','ACC02',2024,2030,'Active'),
('PRG05','KM','SPP','ACC03',2026,2030,'Active'),
('PRG06','Partnership','SPP','ACC03',2026,2030,'Active'),
('PRG07','SPP','SPP','ACC03',2024,2030,'Active'),
('PRG08','SPP, MLE','SPP','ACC03',2026,2030,'Active'),
('PRG09','Thought and Catalityc Leadership','SPP','ACC03',2025,2030,'Active'),
('PRG10','Communication','PA','ACC04',2024,2030,'Active'),
('PRG11','ECED','PA','ACC04',2024,2030,'Active'),
('PRG12','GCB','PA','ACC04',2024,2030,'Active'),
('PRG13','PA','PA','ACC04',2024,2030,'Active'),
('PRG14','Thought and Catalityc Leadership','PA','ACC04',2025,2030,'Active'),
('PRG15','PA, ECED','PA','ACC04',2024,2030,'Active'),
('PRG16','PA, ECED, BE','PA','ACC04',2025,2030,'Active'),
('PRG17','FATLC','FATLC','ACC05',2024,2030,'Active'),
('PRG18','HRD','HRD','ACC06',2024,2030,'Active');

insert into app_users (email,name,role,dept,acc_id,can_edit,can_approve,status) values
('admin@tanotofoundation.org','Administrator','Administrator','SPP','ALL',true,true,'Active'),
('Francisca_Aprilia@tanotofoundation.org','Francisca Aprilia','Program PIC','LE','ACC01',true,true,'Active'),
('gemilang_chairunisa@tanotofoundation.org','Gemilang Chairunisa','Program PIC','LDS','ACC02',true,true,'Active'),
('fitriana_herarti@tanotofoundation.org','Fitriana Wuri Herarti','Program PIC','PA','ACC04',true,true,'Active'),
('Colley_Buwana@tanotofoundation.org','Colley Windya Tyas Buwana','Program PIC','SPP','ACC03',true,true,'Active'),
('Nisrina_Alissabila@tanotofoundation.org','Nisrina Alissabila','Program PIC','PA','ACC04',true,true,'Active'),
('patrick_hutajulu@tanotofoundation.org','Patrick Patros Saro Hutajulu','Program PIC','PA','ACC04',true,true,'Active'),
('meilia_amanda@tanotofoundation.org','Meilia Amanda','Program PIC','HRD','ACC06',true,true,'Active'),
('Lidya_Edhie@tanotofoundation.org','Lidya Clarissa Edhie','Program PIC','FATLC','ACC05',true,true,'Active');

insert into indicators (id,year,sm_id,outcome_id,acc_id,program_id,program_name,code,details,name,definition,unit,disaggregation,frequency,data_source,mov,calc_method,indicator_type,direction,pic,target_2030,target_2030_raw,target_year,target_year_raw,actual,actual_raw,ach_target_2030,ach_year,q1,q2,q3,q4,notes,key_initiatives,follow_up,status) values
('IND01-2024',2024,'SM01','OUT06','ACC01','PRG02','ECED','IND01','ECED','% of children in TF-operated Rumah Anak Sigap (RAS) centers are developmentally on-track',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,'Outcome','Naik','Francisca_Aprilia@tanotofoundation.org',0.8,0.8,0.6,0.6,0.69,0.69,0.8624999999999999,1.15,0.0,0.56,0.0,0.69,'- Average % of children in (22) TF-operated RAS centers are developmentally on-track = 69% ((48% + 90%))/2

- CREDI score RAS 2.0 = 48% children meeting development target. Quantitative data of RAS 2.0 Evaluation using CREDI tool showed  improvement in Language aspect of child development. Follow-up qualitative data collection is on-going to investigate why the CREDI result is lower than expected target.

- ASQ monitoring showed that 90% children are developmentally on-track in Q4 2024 as compared to only 61% in Q2 2024',NULL,NULL,'Active'),
('IND02-2024',2024,'SM01','OUT06','ACC04','PRG02','ECED','IND02','ECED','# of a measurement tool for ECD age 0-3 is available and adopted by government',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,2.0,2,1.0,1,1.0,1,0.5,1.0,0.0,0.0,0.0,1.0,'Pilot for national survey for ECDI (child outcome measurement age 4-6) by BKKBN is on-going till Dec 2024; 1,500 sample village identified.',NULL,NULL,'Active'),
('IND03-2024',2024,'SM01','OUT06','ACC04','PRG02','ECED','IND03','ECED','# of the policy level for parenting and early stimulation (national level)',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,3.0,3,1.0,1,1.0,1,0.3333333333333333,1.0,0.0,0.0,0.0,1.0,'- The enactment of UU KIA with a thought contribution from TF
- Support for RPJMN inclusion of parenting/early stimulation clause is on-going. 
- Assisted KPPPA and BSN in developing national standard SNI 9245:2024 on Child Friendly Daycare.',NULL,NULL,'Active'),
('IND04-2024',2024,'SM01','OUT06','ACC01','PRG02','ECED','IND04','ECED','% of partner districts with regulations for parenting and early stimulation; # of districts receiving awareness campaign',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,0.8,0.8,0.0,0,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Advocacy to raise government stakeholders on the importance of PES will only start in 2025',NULL,NULL,'Active'),
('IND05-2024',2024,'SM01','OUT06','ACC04','PRG15','PA, ECED','IND05','ECED','# of members in the coalition for COE in research & advocacy',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,10.0,10,4.0,4,27.0,27,2.7,6.75,0.0,2.0,0.0,27.0,'- International Organisation (UNICEF, WB, WHO)
- Universities (UI, UGM, UPI, UNPAD, Atmajaya, Nusa Cendana)
- Research Organization(SMERU, J-PAL, PUSKAPA)
- SEAMEO
- HIMPAUDI',NULL,NULL,'Active'),
('IND06-2024',2024,'SM01','OUT06','ACC01','PRG02','ECED','IND06','ECED','Total catalytic funding for early stimulation & parenting',NULL,'Text',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1000000.0,1000000,80000.0,80000,14000.0,14000,0.014,0.175,0.0,0.0,0.0,14000.0,'Total catalytic funding:
- Renovation & Operatioal EC Center (RAS) Kukar - Desa Loa Pari : IDR 144,460,500 (USD 9.3K)
- Renovation & Operatioal EC Center (RAS) Kukar - Desa Bendang Raya : IDR 70,732,500 (USD 4.6K)
- Operational EC Center (RAS) Jakarta : IDR 6,000,000 (USD 0.4K)

- Donation from desa for RAS operation cost -->
RAS sustainability that is not yet part of priority strategy but realized early.
- Higher target 2024 with assumption of RAS could have been scaled in 2024. However, scaling-up is not yet executed - pending RAS Operational Excellence strategy being implemented optimally.',NULL,NULL,'Active'),
('IND07-2024',2024,'SM01','OUT14','ACC01','PRG02','ECED','IND07','Stunting 1.0','% of districts (villages) with the capacity to do stunting reduction programs',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,0.7,0.7,0.7,0.7,0.79,0.79,1.1285714285714288,1.1285714285714288,0.0,0.0,0.0,0.79,'From SMERU Evaluation, 15 out of 19 partner districts score 80 and above on government capacity for stunting reduction',NULL,NULL,'Active'),
('IND08-2024',2024,'SM01','OUT14','ACC01','PRG02','ECED','IND08','Stunting 1.0','# of national policy enacted to support stunting reduction',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,10.0,10,10.0,10,10.0,10,1.0,1.0,0.0,0.0,0.0,10.0,'- Integration of stunting data into SATU SEHAT
- 1000 Days Fund study recommendation accepted by Minister BGS
- 8 policies from WB MDTF 2023 but reported in 2024, including: TA to MOH Promkes on SBCC in two districts, eHDW implementation,Nutrition Guide in Puskesmas,  TA for Pustu, Evaluation of Convergence Actions, Fiscal Note for Stunting, TA for covid-19 social assistance, TA for Rice Fortification',NULL,NULL,'Active'),
('IND09-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND09','BE','% of students in partner schools acquire mastery in literacy and numeracy by respective grade',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,0.8,0.8,0.0,0,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Numeracy and Parent Engagement levers identified. Pilot to commence in 2025.',NULL,NULL,'Active'),
('IND10-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND10','BE','# of districts implement PINTAR model',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,30.0,30,17.0,17,17.0,17,0.5666666666666667,1.0,0.0,15.0,0.0,17.0,'- 15 districts (Kukar and Balikpapan didn’t join Fasda Perubahan because they are focusing on supporting OIKN)
- 2 districts continue to replicate PINTAR training program : Cimahi & Tana Tidung',NULL,NULL,'Active'),
('IND11-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND11','BE','% of partner districts with regulations for literacy & numeracy',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,0.8,0.8,0.4,0.4,0.47,0.47,0.5874999999999999,1.1749999999999998,0.0,0.12,0.0,0.47,'- 6 Perbup (P. Siantar, Muaro Jambi, Dumai, Batanghari, Kendal, Tebo)
- 2 Perkadin (Kota Semarang and Kota Cimahi) related to strengthen and develop literacy and numeracy skills
(8 districts / 17 districts = 47%)',NULL,NULL,'Active'),
('IND12-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND12','BE','Total catalytic funding for literacy & numeracy',NULL,'Text',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,2000000.0,2000000,80000.0,80000,40000.0,40000,0.02,0.5,0.0,0.0,0.0,40000.0,'Govt fund for replication PINTAR (data collected based on direct discussion with government).
- Tana Tidung : IDR 311,200,000 (USD 20K)
- Cimahi : IDR 316,995,000 (USD 20K)

Target not achieved because dissemination was not active in Jakarta and Kutai Barat for 2024 (Kutai Barat will start in 2025)',NULL,NULL,'Active'),
('IND13-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND13','BE','% of a national numeracy initiative implemented',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.2,0.2,0.2,0.2,0.2,1.0,0.0,0.0,0.0,0.2,'Gerakan Numerasi Nasional was initiated by MoECRT in 2024. Our LE staff contributed in the discussions with MOECRT on 23 Dec 2024.',NULL,NULL,'Active'),
('IND14-2024',2024,'SM01','OUT20','ACC01','PRG01','BE','IND14','BE','% of recommendations on school monitoring system (APS) presented to the national government',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.2,0.2,0.3,0.3,0.3,1.4999999999999998,0.0,0.2,0.0,0.3,'-APS Modeled in 8 districts and are sustainable in 50% of the district (Siak, Dumai, Kendal and Karo).
-Best practice and lesson learned published.',NULL,NULL,'Active'),
('IND15-2024',2024,'SM01','OUT07','ACC01','PRG01','BE','IND15','BE','% of a national system for new teacher placement is implemented',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.2,0.2,0.2,0.2,0.2,1.0,0.0,0.0,0.0,0.2,'- Study on PPG Prajabatan Curriculum & Program Delivery completed and disseminated to MOECRT and TTIs. 
- Konsorsium Pendidikan Daerah established in 5 provinces: Jambi, Sumut, Riau, Jateng, Kaltim',NULL,NULL,'Active'),
('IND16-2024',2024,'SM01','OUT12','ACC02','PRG03','Fellowship','IND16','Fellowship','% of fellows employed or start their own initiatives in development sectors < 4 months after graduation',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,0.7,0.7,0.0,0,0.7777777777777778,0.7777777777777778,1.1111111111111112,0.0,0.0,0.0,0.0,0.7777777777777778,'- 9 Fellows on-board 
- Outcomes data will be available in 2025',NULL,NULL,'Active'),
('IND17-2024',2024,'SM01','OUT12','ACC02','PRG04','TELADAN','IND17','TELADAN','% of Tanoto scholars show evidence of soft skill development and values',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,0.8,0.8,0.65,0.65,0.51,0.51,0.6375,0.7846153846153846,0.0,0.51,0.0,0.51,'Half of Scholars of Cohort 2021 met the expected competency score (2.5 out of 4) at endline, versus 65% scholars of Cohort 2020. Cause: Pandemic-affected cohort experienced mostly online programs. Domain with low score: Grit, Strive for Excellence, Agility, Relationship, Innovative, Planning, Global Citizenship',NULL,NULL,'Active'),
('IND18-2024',2024,'SM01','OUT12','ACC02','PRG04','TELADAN','IND18','TELADAN','% of Tanoto scholars employed within 6 months of graduation (by cohort)',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,0.9,0.9,0.81,0.81,0.81,0.9,0.0,0.81,0.0,0.81,'- 37% scholars of Cohort 2020 secured employment before graduation.
- 85% scholars are economically active after graduation; 77% scholars (include only employed and unemployed) are employed <6 months
- Tracer study for Cohort 2021 to be conducted in Dec 2024',NULL,NULL,'Active'),
('IND19-2024',2024,'SM01','OUT12','ACC02','PRG04','TELADAN','IND19','TELADAN','% of Tanoto scholars conduct pay-it-forward, 3 years after graduation',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,0.3,0.3,0.15,0.15,0.4,0.4,1.3333333333333335,2.666666666666667,0.0,0.1,0.0,0.4,'- Majority of alumni cared for issues around SDG 1, SDG 2,
SDG 3, SDG 4
- 105 out of 262 alumni respondence conduct pay-it-forward activities and consist of : 50% respondents donate, 22% volunteer occasionally,
25% develop community, 3% work in social sector.
- Next tracer study in Dec 2024',NULL,NULL,'Active'),
('IND20-2024',2024,'SM01','OUT12','ACC02','PRG04','TELADAN','IND20','TELADAN','# of universities adopt TELADAN leadership and soft skills development model/modul',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Cumulative',NULL,'Naik',NULL,5.0,5,1.0,1,3.0,3,0.6,3.0,0.0,1.0,0.0,3.0,'- Cohort 2024 includes KIP-K scholars (MOECRT’s higher education scholarship program for underprivileged family).
''- ITB, TELADAN partner university, included Lead Self Module into the student orientation program reaching all new students. 
- IPB converted Lead Self to SKS',NULL,NULL,'Active'),
('IND21-2024',2024,'SM01','OUT08','ACC01','PRG02','ECED','IND21','Stunting 1.0','# of caregivers reached',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Cumulative',NULL,'Naik',NULL,5000000.0,5000000,3043064.0,3043064,3192324.0,3192324,0.6384648,1.0490492477318913,0.0,3192081.0,0.0,3192324.0,'- Unicef : 3.053.000 pregnant women & caregivers
- PASTI: 139.029 beneficiary for maternal, newborn and child survival program
- Rumah Anak SIGAP : 2.211 (2023) + 784 (2024)',NULL,NULL,'Active'),
('IND22-2024',2024,'SM01','OUT08','ACC01','PRG01','BE','IND22','BE','# of teachers reached',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Cumulative',NULL,'Naik',NULL,100000.0,100000,60000.0,60000,59971.0,59971,0.59971,0.9995166666666667,0.0,55988.0,0.0,59971.0,'Teachers reached : 54.835 (annual report 2023) + 5.136 (FY 2024) teachers and principals are trained:
- Teacher reached in fasda perubahan project: 3.157
- PINTAR dissemination at Cimahi area : 1.739 (1.628 teachers + 111 principals)
- PINTAR dissemination at Tana Tidung area : 240 (239 teachers +1 principals)
- Kukar, Balikpapan didn’t join Fasda Perubahan
- DKI Jakarta and Kubar did not conduct dissemination.',NULL,NULL,'Active'),
('IND23-2024',2024,'SM01','OUT08','ACC01','PRG02','ECED','IND23','ECED','# of children 0-3 reached by RAS',NULL,'Number',NULL,'Annual',NULL,NULL,'Cumulative',NULL,'Naik',NULL,10000.0,10000,2000.0,2000,2995.0,2995,0.2995,1.4975,0.0,2457.0,0.0,2995.0,'Total active child attendant in RAS = 1,045 (at capacity).',NULL,NULL,'Active'),
('IND24-2024',2024,'SM01','OUT08','ACC04','PRG12','GCB','IND24','CSD','# of government officials reached',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,50000.0,50000,20000.0,20000,23958.5,23958.5,0.47917,1.197925,0.0,3372.0,0.0,23958.5,'- 21.792 trained from CSD and SDG AI programs
- Mobile Leaning Program = 50% x 4.333  (7.481 course enrollment with 4.333 course completed & 50% for government sector)',NULL,NULL,'Active'),
('IND25-2024',2024,'SM01','OUT08','ACC02','PRG04','TELADAN','IND25','TELADAN','# of scholars reached',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Cumulative',NULL,'Naik',NULL,10000.0,10000,8598.0,8598,8599.0,8599,0.8599,1.0001163061177019,0.0,8599.0,0.0,8599.0,'- Annual Report 2023 : 8,338
- Cohort 2024 = 261 (161 Teladan + 100 KIP-K)',NULL,NULL,'Active'),
('IND26-2024',2024,'SM01','OUT08','ACC04','PRG10','Communication','IND26','Communication','# of public reached through comms program',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,20000000.0,20000000,10000000.0,10000000,105712542.0,105712542,5.2856271,10.5712542,0.0,89422502.0,0.0,105712542.0,'- Conventional media: 97.552.825 (from 1.088 media coverage)
- Digital & social media: 8.159.717
- Higher public reached has aligned with the new strategy re-focusing from local to national media',NULL,NULL,'Active'),
('IND27-2024',2024,'SM01','OUT08','ACC04','PRG10','Communication','IND27','Communication','% of alumni engaged that receive of alumni newsletter (responses rate)',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,0.3,0.3,0.1,0.1,0.2515,0.2515,0.8383333333333334,2.5149999999999997,0.0,0.0,0.61,0.396,'We only started engaging alumni in H2 2024 with our alumni newsletter:
•1st edition (Aug 2024) – broadcast via email and WA group: 
Target recipient (total alumni email addresses): 4268
Open rate (# of engaged alumni): 2008 (61.3%)
•2nd edition (Nov 2024) – broadcast via email and WA group: 
Target recipient (total alumni email addresses): 3640 (after we sorted and double check the recipients’ email)
Open rate: 1388 (39.6%)',NULL,NULL,'Active'),
('IND28-2024',2024,'SM01','OUT18','ACC04','PRG13','PA','IND28','PA','# of Policy Quality Index in Education (MOECRT) and Health (MOH) sectors',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,80.0,80,80.73,80.73,80.73,80.73,1.009125,1.0,0.0,0.0,0.0,80.73,'- Signed MOU with MOHA for Leadership Development for newly elected sub-national leaders
- 6 TA on-going to support LAN on digital transformation, upskilling on public policy analysis, and LAN institutional strengthening',NULL,NULL,'Active'),
('IND29-2024',2024,'SM01','OUT16','ACC04','PRG13','PA','IND29','PA','Level of stakeholders perception',NULL,'Text',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,NULL,'High positive',NULL,'Mid to High positive',NULL,'Mid to high positive',0.0,0.0,0.0,NULL,0.0,NULL,'- Net promoter score (Promoter – Detractor) = 72%
- 75% stakeholders mentioned TF as top of mind; 57% wider audience mentioned TF as top of mind. 
- 96% respondents love and quite love the brand TF
- 90% respondents are very satisfied and satisfied with performance',NULL,NULL,'Active'),
('IND30-2024',2024,'SM01','OUT16','ACC04','PRG13','PA','IND30','PA','# of publications, citation and reference',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,30.0,30,22.0,22,24.0,24,0.8,1.0909090909090908,0.0,6.0,0.0,24.0,'- 3 journals on ECED published (2 International, 1 national)
- 15 Op-eds
- 2 RAS Evaluation, 2 SPP, 2 Education roadmap',NULL,NULL,'Active'),
('IND31-2024',2024,'SM01','OUT16','ACC04','PRG10','Communication','IND31','Communication','# of high-level forum on national or regional level with TF representation as a speaker bringing advocacy agenda',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,12.0,12,6.0,6,8.0,8,0.6666666666666666,1.3333333333333333,0.0,1.0,0.0,8.0,'1. ARNEC (Pak Eddy) - 27 May 2024, Minister of Women, Family and Community Development of Malaysia
2. HLF MSP 2024 (Pak Benny) - 1-3 September 2024, Presiden, Menteri, Kepala UN -
3. The Launch of Manajemen Talenta Nasional - Yosea -- 9 Oktober 2024
4. Sharing Digitalisasi & Penanganan Stunting di Jepang & Indonesia LAN RI (Cilla) 29 Oktober 2024 - (Minister Embassy of Japan in Indonesia, Hoshin Daisuke)
5. LAN National Future Learning Forum - 18 November 2024 - Pak Eddy - kepala LAN dan Menteri Kemenpan
6. RAKORNAS Stunting 2024 (Pak Eddy) - 12 Desember 2024 - Wapres (Organizer)
7. SDGs Annual Conference 2024 - 7 Oktober 2024 - (Pak Mike) - wapres & menppn bappenas
8. Dialog Future Jobs and Skill LAN RI (Yunety Tarigan) (Profesor Stella Christie, P.hD)',NULL,NULL,'Active'),
('IND32-2024',2024,'SM02','OUT21','ACC05','PRG17','FATLC','IND32','All','Zero major audit findings',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,0.0,0,0.0,0,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Verified by Audit',NULL,NULL,'Active'),
('IND33-2024',2024,'SM02','OUT21','ACC05','PRG17','FATLC','IND33','FATLC','Budget control TF Indo budget effectiveness',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,0.9,0.9,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND34-2024',2024,'SM02','OUT21','ACC05','PRG17','FATLC','IND34','FATLC','Efficient budget absorption: Overhead Cost',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,NULL,'<=10%',NULL,'<=10%',0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND35-2024',2024,'SM02','OUT21','ACC02','PRG04','TELADAN','IND35','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Average tuition fee/scholar/semester',NULL,'Text',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,7100000.0,7100000,7000000.0,7000000,6500000.0,6500000,-0.08450704225352113,-0.07142857142857142,0.0,0.0,0.0,6500000.0,NULL,NULL,NULL,'Active'),
('IND36-2024',2024,'SM02','OUT21','ACC02','PRG04','TELADAN','IND36','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Recruitment cost / scholar',NULL,'Text',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,2000000.0,2000000,3700000.0,3700000,3640000.0,3640000,0.82,-0.016216216216216217,0.0,0.0,0.0,3640000.0,NULL,NULL,NULL,'Active'),
('IND37-2024',2024,'SM03','OUT22','ACC03','PRG07','SPP','IND37','SPP','# of kaizen projects completed and operationalized',NULL,'Number',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,5.0,5,5.0,5,6.0,6,1.2,1.2,0.0,0.0,0.0,6.0,'11 National + 4 regional initiatives:
1. Improvement of business trip update visibility  - Jateng
2. Installment of calendar for event - Jateng
3. Standarization of project document - Riau
4. Standarization of MoM format - Riau
5. Installment of MLE Dashboard - Jakarta
6. Program user utilize RACI for project manajement planning as resulted PM workshop
7. TF digital app : completed SIGAP and TELADAN systems integration.

8 new & revised SOP :
- Resource person honorarium
- Recruitment
- Business travel
- Training
- Medical outpatient
- Entertainment
- Petty cash
- Transaction authorization',NULL,NULL,'Active'),
('IND38-2024',2024,'SM04','OUT23','ACC06','PRG18','HRD','IND38','HR','Regrettable attrition rate due to culture (through a trust-based organization with a global mindset)',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,NULL,'<=2%',NULL,'<=2%',0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND39-2024',2024,'SM04','OUT23','ACC06','PRG18','HRD','IND39','HR','Critical vacancy fulfilment rate',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,0.9,0.9,0.87,0.87,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'13 out of 14 fullfilled',NULL,NULL,'Active'),
('IND40-2024',2024,'SM04','OUT23','ACC06','PRG18','HRD','IND40','HR','Key succession leadership in-place and key subject-matter expertise available',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'All key position already have successor',NULL,NULL,'Active'),
('IND41-2025',2025,'SM01','OUT06','ACC01','PRG02','ECED','IND41','ECED','% of children in TF-operated Rumah Anak Sigap (RAS) centers are developmentally on-track',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,0.8,0.8,0.6,0.6,0.94,0.94,1.1749999999999998,1.5666666666666667,0.0,0.94,0.0,0.89,'ASQ score October 2025',NULL,NULL,'Active'),
('IND42-2025',2025,'SM01','OUT06','ACC01','PRG02','ECED','IND42','ECED','% of completion a measurement tool for ECD age 0-3 is available and adopted by government',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.1,0.1,0.0,0,0.0,0.0,0.0,0.0,NULL,0.0,'Proxy indicator for 2025 : Milestones achieved',NULL,NULL,'Active'),
('IND43-2025',2025,'SM01','OUT06','ACC01','PRG02','ECED','IND43','ECED','% of completion the policy level for parenting and early stimulation (national level)',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.2,0.2,0.4,0.4,0.4,2.0,0.0,0.4,0.0,0.0,'Proxy indicator for 2025 : Milestones achieved; The finalisation of the RAN PAUD HI is still pending the submission of detailed output annexes from each line ministry serving as task force members. The launch is planned for February 2026.',NULL,NULL,'Active'),
('IND44-2025',2025,'SM01','OUT06','ACC01','PRG02','ECED','IND44','ECED','% of partner districts with regulations for parenting and early stimulation; # of districts receiving awareness campaign',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,30.0,30,15.0,15,20.0,20,0.6666666666666666,1.3333333333333333,0.0,20.0,0.0,20.0,'RPJMD Workshop
Sum A (4): Batubara, Kota Pematangsiantar, Medan, and Karo
Sum B (7): Dumai, Pekanbaru, Siak, Bengkalis, Batang Hari, Tebo and Muaro Jambi
Jawa (3): Kendal, Tegal and Kota Semarang
Kalimantan (5): Balikpapan, Paser, Bontang, Kutai Kartanegara, Kutai Barat
Jakarta (1): Pandeglang',NULL,NULL,'Active'),
('IND45-2025',2025,'SM01',NULL,'ACC01','PRG02','ECED','IND45','ECED Council','% of ECED Council community in-place',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.3,0.3,0.2,0.2,0.2,0.6666666666666667,0.0,0.2,0.0,0.2,'By December, the ECED Council is focused on finalising the strategy, with implementation planned for next year',NULL,NULL,'Active'),
('IND46-2025',2025,'SM01','OUT10','ACC01','PRG02','ECED','IND46','ECED','# of institutions that give concrete commitment to ECED issues',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,5.0,5,2.0,2,3.0,3,0.6,1.5,0.0,1.0,0.0,3.0,'1. Village Funds (Ponoragan, Loa Pari, Gandaria, Tuwel)
2. Budget Allocation under the Budget Implementation Document (DPA) of the Semarang City Health Office (Bandarharjo)
3. Community contributions (parents)- Sokawera',NULL,NULL,'Active'),
('IND47-2025',2025,'SM01','OUT14','ACC01','PRG02','ECED','IND47','Stunting 1.0','% of districts (villages) with the capacity to do stunting reduction programs',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,0.7,0.7,0.7,0.7,0.79,0.79,1.1285714285714288,1.1285714285714288,0.0,0.79,0.0,0.79,'From SMERU Evaluation, 15 out of 19 partner districts score 80 and above on government capacity for stunting reduction',NULL,NULL,'Active'),
('IND48-2025',2025,'SM01','OUT14','ACC01','PRG02','ECED','IND48','Stunting 1.0','# of national policy enacted to support stunting reduction',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,10.0,10,10.0,10,12.0,12,1.2,1.2,0.0,0.0,0.0,12.0,'The implementing partners (World Bank for MDTF and UNICEF) are expected to submit reports by the end of the year.

Achievement comes from WB last year report',NULL,NULL,'Active'),
('IND49-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND49','BE','# of lever programs launched (Proxy Indicator for 2025)
% of students in partner schools acquire mastery in literacy and numeracy by respective grade',NULL,'Number',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,6.0,6,3.0,3,3.0,3,0.5,1.0,0.0,0.0,0.0,3.0,'Proxy Indicator for 2025 : # of lever programs launched; 1. Teacher New Lever
- ToT Teacher (Ocotober)
- Teacher Training (November)

2. Parent New lever
- 2nd Logistical Testing in Kendal (November)

3. School Leadership
- Online Kick off w/ Nias and Pandeglang district (December)
- Logistical Testing in Nias (December)',NULL,NULL,'Active'),
('IND50-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND50','BE','# of districts implement PINTAR model',NULL,'Number',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,30.0,30,21.0,21,21.0,21,0.7,1.0,0.0,13.0,0.0,21.0,'Fasilitator Grant Project (13): 
Sum A (2): Batubara, Kota Pematangsiantar
Sum B (6): Pekanbaru, Bengkalis, Dumai, Batang Hari, Tebo, Muaro Jambi
Jawa (2): Semarang, Tegal
Kalimantan Timur (3): Balikpapan, Bontang, Kukar

Replikasi (2):
OIKN & Pekalongan

School Leadership Project (2): 
Nias and Pandeglang – currently in progress of the baseline study. to be implemented in Q1 2026; 

Teacher & Parents New Lever (4):
Kendal, Paser, Karo, Siak – roll out November',NULL,NULL,'Active'),
('IND51-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND51','BE','% of partner districts with regulations for literacy & numeracy',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.5238095238095238,0.5238095238095238,0.6666666666666666,0.6666666666666666,0.6666666666666666,1.2727272727272725,0.0,0.42857142857142855,0.0,0.6666666666666666,'Successfully influenced RPJMN to incorporate foundational literacy and numeracy. Now, supporting RPJMD to include foundational litnum. 
Sum A (2) : Pematangsiantar (Perwali, RPJMD), Karo (RPJMD)
Sum B (5) : Batanghari (Perbup, RPJMD), Kota Dumai (Perwali, RPJMD), Muaro Jambi (Perbup, RPJMD), Tebo (SK Bupati, RPJMD), Kota Pekanbaru (RPJMD)
Jawa (4): Kendal (Perbup, RPJMD), Kota Semarang (Perkadin, RPJMD), Tegal, (RPJMD), Cimahi (Perkadin), 
Kalimantan (2) : Paser (RPJMD), Kota Bontang (RPJMD)
Nasional (1) : Pandeglang (RPJMD)',NULL,NULL,'Active'),
('IND52-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND52','BE','# of institutions that give concrete commitment to Literacy and Numeracy issues',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,5.0,5,5.0,5,8.0,8,1.6,1.6,0.0,0.0,0.0,8.0,'District Level
1. Replication in Jawa (Pekalongan)
2. Dissemination in Sum B (Bengkalis & Tebo)
3. KTT & Kutai Barat (APS)
Institutional Level
1. Gates Foundation (kickoff December 2025)
2. UNICEF (FAASTER Project)
3. WVI (School leadership)

Activities in Jepara are limited to the design phase only',NULL,NULL,'Active'),
('IND53-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND53','BE','% of A national numeracy initiative implemented',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.4,0.4,0.6,0.6,0.6,1.4999999999999998,0.0,0.4,0.0,0.6,'Tanoto Foundation contributed to the GNN launch on 19 Aug 2025 by hosting a booth. The exhibit featured two Fasda (facilitators) who shared PINTAR lessons learned in numeracy and demonstrated support for coding by integrating mathematical thinking about pattern',NULL,NULL,'Active'),
('IND54-2025',2025,'SM01','OUT20','ACC01','PRG01','BE','IND54','BE','% of recommendations on school monitoring system (APS) presented to the national government',NULL,'Percent',NULL,'Quarterly',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.4,0.4,0.4,0.4,0.4,1.0,0.0,0.2,0.0,0.4,'Update progres district sustainable school monitoring system:
1. Siak : 80%
2. Dumai: 100%
3. Kendal: 100%
4. Kutai  Barat: 80%
5. Karo: 100%',NULL,NULL,'Active'),
('IND55-2025',2025,'SM01','OUT07','ACC01','PRG01','BE','IND55','BE','% of a national system for new teacher placement is implemented',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,0.4,0.4,0.4,0.4,0.4,1.0,0.0,0.0,0.0,0.4,'Key data sources are mapped, and a harmonized dashboard specification is agreed upon. Inter-OPD coordination (Education Office, BKPSDM, BKAD) has started during kick-off session on 1 October 2025.',NULL,NULL,'Active'),
('IND56-2025',2025,'SM01','OUT12','ACC02','PRG03','Fellowship','IND56','Fellowship','% of fellows employed or start their own initiatives in development sectors < 4 months after graduation',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,0.7,0.7,0.7,0.7,0.8888888888888888,0.8888888888888888,1.2698412698412698,1.2698412698412698,0.0,0.0,0.0,0.8888888888888888,'Social Development Sector :
1. Claresta Vega Audrey : Join TFID as a Management Trainee
2. Denny Susanto : Join TFID as a Management Trainee
3. Feliani : Signed with The Wikimedia Foundation
4. Ni Kadek Putri Adyaningsih : Join Merah Putih Hijau a NGO which interest in circular econony
5. Shania Ruth Diaz : Join CD/CSR team in RAPP
6. Charla Eunike Luan  : Strengthening local NGO in Kupang
7. Cornelius Prabhaswara Marpaung : Join CRMS as a knowledge management officer
8. Andika Simamora : Consultant at Bappenas / Kementerian PPN

Non-Social Development Sector:
9. Jonathan Andreas Ahuluheluw : Join PT Pertamina Geothermal Energy Tbk. as BPS',NULL,NULL,'Active'),
('IND57-2025',2025,'SM01','OUT12','ACC02','PRG04','TELADAN','IND57','TELADAN','% of Tanoto scholars show evidence of soft skill development and values',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,0.8,0.8,0.65,0.65,0.69,0.69,0.8624999999999999,1.0615384615384613,0.0,0.69,0.0,0.69,'Cohort 2022 endline result',NULL,NULL,'Active'),
('IND58-2025',2025,'SM01','OUT12','ACC02','PRG04','TELADAN','IND58','TELADAN','% of Tanoto scholars employed within 6 months of graduation (by cohort)',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,0.9,0.9,0.98,0.98,0.98,1.0888888888888888,0.0,0.0,0.0,0.98,'Cohort 2021 graduation',NULL,NULL,'Active'),
('IND59-2025',2025,'SM01','OUT12','ACC02','PRG04','TELADAN','IND59','TELADAN','% of Tanoto scholars conduct pay-it-forward, 3 years after graduation',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,0.3,0.3,0.3,0.3,0.38,0.38,1.2666666666666668,1.2666666666666668,0.0,0.38,0.0,0.38,'NCS graduating in 2021 exhibited strong pay-it-forward spirit, contributing back for SDG 3 (Health) and SDG 4 (Education). 20% of those who volunteers hold the management role in the org.',NULL,NULL,'Active'),
('IND60-2025',2025,'SM01','OUT12','ACC02','PRG04','TELADAN','IND60','TELADAN','# of universities adopt TELADAN leadership and soft skills development model/modul',NULL,'Number',NULL,'Annual',NULL,NULL,'Cumulative',NULL,'Naik',NULL,5.0,5,4.0,4,8.0,8,1.6,2.0,0.0,3.0,0.0,5.0,'Cumulative Achievements (5):
- Cohort 2024 includes KIP-K scholars (MOECRT’s higher education scholarship program for under privileged family).
- ITB, TELADAN partner university, included Lead Self Module into the student orientation program reaching all new students. 
- IPB converted the Lead Self module into academic credits (SKS).
- UNRI Student Journey SoftSkills Development (December 2025)
- UI Lead Self Training (Adaptation Skills Module) for new Students (KIP-K scholarship recipient (November 2025) approx 800 Students',NULL,NULL,'Active'),
('IND61-2025',2025,'SM01','OUT18','ACC04','PRG16','PA, ECED, BE','IND61','ECED, BE','% government leaders drive action in early stimulation, parenting, literacy, and numeracy
SDG AI and CSD supports the achievement of Advocacy Goal 1 and 2',NULL,'Percent',NULL,'Annual',NULL,NULL,0,NULL,'Naik',NULL,1.0,1,1.0,1,1.0,1,1.0,1.0,0.0,0.5,0.0,0.5,'Progress on SDG Academy Indonesia’s National Ownership (Q4):
•	Supported the handover to Bappenas through draft 2026 roadmap and comms plan, knowledge-transfer workshops, and IT technical support.
•	Supported the soft launch at SAC 2025 and preparation for a “Grand Launch” in early 2026.
•	Initiated a 2026 programme to synchronise RAD across four pilot provinces, aligning 2025–2030 policies and integrating FLN and PES.',NULL,NULL,'Active'),
('IND62-2025',2025,'SM01','OUT16','ACC04','PRG13','PA','IND62','PA','Level of stakeholders perception',NULL,'Text',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,NULL,'High positive',NULL,'Mid to high positive',NULL,'Mid to high positive',0.0,0.0,0.0,NULL,0.0,NULL,'Perception survey is based on 2023 study. The next perception survey will be done in H1 2026',NULL,NULL,'Active'),
('IND63-2025',2025,'SM01','OUT16','ACC04','PRG13','PA','IND63','PA','# of publications, citation and reference',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,30.0,30,25.0,25,55.0,55,1.8333333333333333,2.2,0.0,20.0,0.0,55.0,'OpED  (51):
- Regional (37)
- Nasional (3)
- ECED Councl (10)

Publication (4):
LE (3):
- Pembelajaran Program Orang Tua Sahabat Anak Belajar (OTSAB)
- Improving Learning Outcomes in Indonesia through the PINTAR Program
- The Effectiveness of Different Modalities of Digital-based Teacher Training Program in Indonesia
TELADAN (1) : TELADAN Program Evaluation Report',NULL,NULL,'Active'),
('IND64-2025',2025,'SM01','OUT16','ACC04','PRG10','Communication','IND64','Communication','# of high-level forum on national or regional level with TF representation as a speaker bringing advocacy agenda',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,12.0,12,9.0,9,18.0,18,1.5,2.0,0.0,8.0,0.0,18.0,'1. Indonesia Scholarship Network 2025
2. UNICEF Global High-Level Roundtable
3. CAPS Hong Kong
4. CIES Chicago
5. Talkshow Pengembangan Policy Brief Berbasis Data 
6. Lokakarya “Penguatan Kebijakan Pendidikan Daerah melalui Sinkronisasi RPJMN 2025–2029 dan SDGs ke Perencanaan Daerah
7. Lokakarya “Inovasi untuk Percepatan Pencegahan dan Penurunan Stunting” 
8. Early Childhood Roundtable, Abu Dhabi Early Childhood Authority 
9. Asia-Pacific Regional Conference on Early Childhood Development (ECD) 2025
10. High-level Discussion Co-IMPACT 
11. UNICEF  Online Discussion on Tackling ​
12. Child Malnutrition in AsiaThe 4th ICECCEP 2025  by SEAMEO CECCEP 
13. Anugerah Kerja Sama Diktisaintek
14. Filantropi Indonesia Festival 2025
15. Webinar: The Evidence Behind Smarter Philanthropy by Asia Philanthropy Circle
16. Webinar: Dukungan Kebijakan dan Inovasi Program Kolaboratif dalam Percepatan Pencegahan dan Penurunan Stunting bersama Lembaga Penelitian, Pendidikan, dan Penerangan Ekonomi dan Sosial (LP3ES)
17. AVPN Global Conference 2025
18.SEAMEO CECCEP Annual Early Childhood Care Education and Parenting Regional Forum',NULL,NULL,'Active'),
('IND65-2025',2025,'SM01','OUT16','ACC04','PRG13','PA','IND65','PA','# of reach harnessed from media',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,100000000.0,100000000,100000000.0,100000000,122647060.0,122647060,1.2264706,1.2264706,0.0,40043776.504,0.0,122647060.0,'Organic reach from conventional media and digital channels',NULL,NULL,'Active'),
('IND66-2025',2025,'SM01','OUT11','ACC04','PRG10','Communication','IND66','PA','# of alumni engaged (annual)',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,500.0,500,250.0,250,573.0,573,1.146,2.292,0.0,285.0,0.0,573.0,'Alumni engagement was carried out through the following activities:
- Tracer study: 135 participants
- Offline/online events and alumni newsletters: 438 participants',NULL,NULL,'Active'),
('IND67-2025',2025,'SM02','OUT21','ACC05','PRG17','FATLC','IND67','All','Zero major audit findings',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,0.0,0,0.0,0,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'No audit adjustment',NULL,NULL,'Active'),
('IND68-2025',2025,'SM02','OUT21','ACC05','PRG17','FATLC','IND68','FATLC','Budget control TF Indo budget effectiveness',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,0.9,0.9,0.11333333333333334,0.11333333333333334,0.11333333333333334,0.12592592592592594,0.0,0.34,0.0,NULL,'- Total spending TF Indo IDR 170.6b from total budget IDR 186.6b exclude CAPEX.
- Overhead cost : IDR 16.6b from total spending TF Indo
IDR 173.4b (excluded CAPEX of 0.8b).',NULL,NULL,'Active'),
('IND69-2025',2025,'SM02','OUT21','ACC05','PRG17','FATLC','IND69','FATLC','Efficient budget absorption: Overhead Cost',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,0.1,0.1,0.1,0.1,0.136,0.136,1.36,1.36,NULL,0.04,NULL,0.096,NULL,NULL,NULL,'Active'),
('IND70-2025',2025,'SM02','OUT21','ACC05','PRG17','FATLC','IND70','FATLC','% of LE cost saving',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,0.03,0.03,0.05,0.05,0.07,0.07,2.3333333333333335,1.4000000000000001,NULL,0.0,NULL,0.07,NULL,NULL,NULL,'Active'),
('IND71-2025',2025,'SM02','OUT21','ACC02','PRG04','TELADAN','IND71','Leadership Development','Unit cost for leadership development & scholarship program below agreed threshold: IDR Leadership Dev. Cost /scholar /cohort',NULL,'Text',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,12000000.0,12000000,12000000.0,12000000,0.0,0,-1.0,-1.0,0.0,0.0,0.0,0.0,'- Average tuition fee / scholar / semester = IDR 6.4 mio
- Recruitment cost / scholar = IDR 3.33 mio (159 reguler + 20 KIP-K)
- Leadership Dev. Cost /scholar /cohort = IDR 15.2 mio',NULL,NULL,'Active'),
('IND72-2025',2025,'SM02','OUT21','ACC02','PRG04','TELADAN','IND72','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Average tuition fee/scholar/semester',NULL,'Text',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,7000000.0,7000000,7000000.0,7000000,6500000.0,6500000,-0.07142857142857142,-0.07142857142857142,0.0,0.0,0.0,6500000.0,NULL,NULL,NULL,'Active'),
('IND73-2025',2025,'SM02','OUT21','ACC02','PRG04','TELADAN','IND73','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Recruitment cost / scholar',NULL,'Text',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,3700000.0,3700000,3700000.0,3700000,0.0,0,-1.0,-1.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND74-2025',2025,'SM03','OUT22','ACC03','PRG07','SPP','IND74','SPP','# of CI projects completed and operationalized',NULL,'Number',NULL,'Annual',NULL,NULL,'Annual',NULL,'Naik',NULL,5.0,5,14.0,14,15.0,15,3.0,1.0714285714285714,NULL,0.0,NULL,15.0,'1) Dashboard (4) : Regional Performance, RAS monitoring, TELADAN, Action tracker
5) Regional initiatives (4) : Sum A, Sum B, Jawa, Kalimantan
9) LDS human library
10) KM online platform update
11) Kaizen RAS
12) Request for communications support
13) Partnership bank
14) Inventory request and management
15) Payment logbook 2026 feature update',NULL,NULL,'Active'),
('IND75-2025',2025,'SM04','OUT23','ACC06','PRG18','HRD','IND75','HR','Regrettable attrition rate due to culture (through a trust-based organization with a global mindset)',NULL,'Percent',NULL,'Annual',NULL,NULL,'Annual',NULL,'Turun',NULL,0.02,0.02,0.02,0.02,0.008,0.008,0.4,0.4,0.0,0.0,0.0,0.008,'Regrettable attrition by December 2025',NULL,NULL,'Active'),
('IND76-2025',2025,'SM04','OUT23','ACC06','PRG18','HRD','IND76','HR','Critical vacancy fulfilment rate',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,0.9,0.9,0.9,0.9,0.75,0.75,0.8333333333333333,0.8333333333333333,0.67,0.67,0.75,0.6,'3 of 5 critical vacancy already filled
vacancy: BE Program Lead (will be onboard Jan 2026) & Head of SPP',NULL,NULL,'Active'),
('IND77-2025',2025,'SM04','OUT23','ACC06','PRG18','HRD','IND77','HR','Key succession leadership in-place and key subject-matter expertise available',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,1.0,1,1.0,1,1.0,1,1.0,1.0,0.0,1.0,0.0,0.9375,'Head of SPP vacant',NULL,NULL,'Active'),
('IND78-2026',2026,'SM01','OUT15','ACC01','PRG02','ECED','IND78','1. MDTF
2. SATUSEHAT
3. MBG','# of MCHN policy recommendations provided to and/or adopted by national government',NULL,'Number',NULL,'Quarterly',NULL,'Activity/IP Report',0,NULL,'Naik',NULL,20.0,20,4.0,4,1.0,1,0.05,0.25,1.0,0.0,0.0,0.0,'Criteria for policy:
- Policy is resulted from TF''s technical assistance to national government
- Policy is in the areas: (1) cadre capacity building, (2) data system strengthening, and (3) planning & budgeting 
- This includes framework, regulation, instruction, decree

Policy recommendations format:
-Policy brief and/or recommendation based on study which presented to the Government','- TA on MBG to BGN contributes to 2 policy recommendations/development
- MDTF evaluation presented to the government
- SATUSEHAT recommendation on ASIK (based on report on the study)',NULL,'Active'),
('IND79-2026',2026,'SM01','OUT04','ACC01','PRG02','ECED','IND79','ALPHA, SNAP-ON','% of ALPHA and SNAP-ON program inception milestones successfully completed',NULL,'Percent',NULL,'Annual',NULL,'Document of MLE Plan and Program Design',0,NULL,'Naik',NULL,1.0,1,1.0,1,1.0,1,1.0,1.0,1.0,0.0,0.0,0.0,'Milestones:
-50%: Programme has a robust MLE and the learning agenda is developed. 
-50%: Programme is ready to be kicked off (government stakeholders and implementing partners onboard, tools are ready to use, targeted beneficiaries are identified)','- Co-develop concept notes with UNICEF
- Publish RFP',NULL,'Active'),
('IND80-2026',2026,'SM01','OUT04','ACC01','PRG02','ECED','IND80','Stunting 2.0','% of data system (operational POPS) at village level established and data collected/updated',NULL,'Percent',NULL,'Annual',NULL,'Activity/IP Report',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Milestones, average progress in 18 villages:
1. system established (2026)
2. data collected/updated (2026)
3. data utilized and used for decision making (2027)
4. data system sustained through budget/policy (2028-2030)','1. Implemention of Stunting 2.0
2. Ensure evidence generation for the effectiveness of data-driven decision making and village-level intervention',NULL,'Active'),
('IND81-2026',2026,'SM01','OUT04','ACC01','PRG02','ECED','IND81','PASTI 2.0','# of villages adopted integrated model for acceleration stunting reduction',NULL,'Number',NULL,'Annual',NULL,'Activity/IP Report',0,NULL,'Naik',NULL,27.0,27,18.0,18,27.0,27,1.0,1.5,27.0,0.0,0.0,0.0,'Criteria: successful exit i.e. budget to ensure​ continue functioning of desa model (18 out of 24 - 75%)','Complete PASTI Grant, Evaluate and Capture Lessons Learned
Ensure sustainabiity of the program in intervened villages',NULL,'Active'),
('IND82-2026',2026,'SM01','OUT05','ACC01','PRG02','ECED','IND82','RAS','# of Rumah Anak SIGAP as CoE and/or newly built',NULL,'Number',NULL,'Annual',NULL,'Rumah Anak SIGAP monitoring dashboard',0,NULL,'Naik',NULL,50.0,50,20.0,20,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria of CoE: 
to achieve 3 out 5 deliverables:
- 70% parents has 85% attendance rate (6 out of 7 visits) (2026)
- capacity per center 50 dyad (2027)
- score of quality services >75 (2026)
- standardize facilities (2026)
- have cost effective delivery (2027)

Newly built RAS:
2026: 5 centres to be built in Medan using TF funding. Programme implementation will start in 2027
2027: 10 centers to be built and operationalize using TF funding (5 centers start to operate in Medan, 5 centers to be built in other region - TBC) 
2030 : 25 centers to be built and operationalize using catalytic funding (by SPP = 12 RAS centers, and by LE= 13 RAS centers)','- Scale Semi-fixed Attendance in all Rumah Anak SIGAP
- Implement  A/B Testing for Cadre vs Professional for 1-1 Stimulation
- Optimise cost 
- Improve enrollment by increasing demand and a more frequent recruitment

''- Engage government for replication
- Build/renovate Rumah Anak SIGAP centers',NULL,'Active'),
('IND83-2026',2026,'SM01','OUT10','ACC01','PRG02','ECED','IND83','ECED','# of institutions that give concrete commitment to ECED issues',NULL,'Number',NULL,'Annual',NULL,'MoU w/ philantrophic organizations','Annual',NULL,'Naik',NULL,4.0,4,4.0,4,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria to meet:
- Institutions include private sector, philanthropy, NGOs, government 
- Commitment includes funding, program, human resources, in-kind, technical assistance. 
- Commitment must be traceable to TF catalytic efforts 
- Commitment to build new Rumah Anak SIGAP

2026: 1 by SPP (ECED Collab/RAS), 2 by regional (RAS), 1 by P&A (ECED Collab)','ECED Collaboratives and Partnership
- Map key funders and projects for ECED Collaboratives
- Engage key funders 
- Organise convening events for ECED

Rumah Anak SIGAP:
- Develop program in a box for Rumah Anak SIGAP  
- Advocate to government and philanthropy to replicate Rumah Anak SIGAP
- Build capacity of village leaders to manage and  co-fund the operations of Rumah Anak SIGAP''s COE',NULL,'Active'),
('IND84-2026',2026,'SM01',NULL,'ACC01','PRG01','BE','IND84','Adv Goal 1','# of PES national and regional policies developed or strengthened',NULL,'Number',NULL,'Quarterly',NULL,'National, Presidential, or Ministerial level planning, regulation, and/or SoP/guideline','Cumulative',NULL,'Naik',NULL,17.0,17,10.0,10,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Government policies/regulation published or strengthened.
national level
2025: RPJMN 2025-2029 (accomplished)
2026: Permenko RAN PAUD HI, Road Map Parenting - Bappenas/KPPPA
2027-2030: RUU PA, Perpres PAUD HI

regional level:
- PES issues included in district development planning documents (Renja/RKPD)
- Perbup/Perwali LN signed (at least a draft in 2026)
- Program and budget allocated (KAK, SE/SK, Juklak)','- Support for RUU SISDIKNAS 
- Support for BPS on ECDI 

''- TA to district government to develop derivatives policy and implement PES related programs (e.g. Kota Layak Anak)',NULL,'Active'),
('IND85-2026',2026,'SM01',NULL,'ACC01','PRG02','ECED','IND85','SPRING','% of successful pre-pilot implementation',NULL,'Percent',NULL,'Quarterly',NULL,'Observation checklist',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.25,0.25,0.25,0.25,0.25,0.0,0.0,0.0,'Milestones:
- Pre pilot (2026)
  1. Module is ready for pilot
  2. Sustained government commitment to proceed to pilot stage
- Pilot (2027-2030)
  3. Dissemination of pilot impact results
  4. Strengthened national policy (RPJMN/RPJMD 2030-2034)','- Evaluation of pre-pilot
- Program design for pilot based on pre-pilot result',NULL,'Active'),
('IND86-2026',2026,'SM01',NULL,'ACC01','PRG02','ECED','IND86','ECED Council','% of ECED Council community in-place',NULL,'Percent',NULL,'Quarterly',NULL,'Observation checklist',0,NULL,'Naik',NULL,1.0,1,0.6,0.6,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Milestones:
- 20%: institution, member, and strategy in-place 
- 40%: policy advocacy through the council  
- 60%: projects launched and implemented
- 80%: ECED council is sustainable as community
- 100%: ECED council is self-managed"','- Project implementation 
- Strengthening measurement',NULL,'Active'),
('IND87-2026',2026,'SM01','OUT02','ACC01','PRG01','BE','IND87','New Levers:
1. DDSL
2. Numeracy Parent
3. Numeracy Teacher
4. PPG - Teaching Practicum
5. FAASTER - Structured Pedagogy
6. FAASTER - DD Affirmative Action w. Digital Assessment','Proxy indicator 2026: 
# new levers program with compliance to program design',NULL,'Number',NULL,'Quarterly',NULL,'Program tracking/monitoring report',0,NULL,'Naik',NULL,4.0,4,6.0,6,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria, to achieve all of this deliverables:
a). fidelity, attendance rate of participants 
       - DDSL : principals, senior teachers, and schools operators > 80%
       - Numeracy:  teachers training > 80%
       - Numeracy: Parents socialization > 40%
       - PPG: teacher mentors training > 80%
       - FAASTER: teacher training > 80%
b) advocacy : meeting progress and/or joint monitoring 2x
c) implementation: all planned activities implemented

*2030 target to be reduced to 4 as it will be measured based on a higher level of indicator','- Implement DDSL, JPAL Numeracy, PPG with high fidelity
- Ensure robust measurement 
- Engage government for updates and commitment for future dissemination and adoption',NULL,'Active'),
('IND88-2026',2026,'SM01','OUT09','ACC01','PRG01','BE','IND88','1. PINTAR Replication
2. Partnership','# of institutions that give concrete commitment to BE issues',NULL,'Number',NULL,'Quarterly',NULL,'- Budget allocation by government, policy or SK issued by government.
- MoU/Letter of Commitment with other institutions.','Annual',NULL,'Naik',NULL,2.0,2,2.0,2,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Non partner districts or other institutions that adopt or replicate PINTAR lesson learned (monitoring system, teachers training system). All BE portfolio will be counted here not limited to Pintar 1.0 or/and Pintar 2.0

2026:
- Regional: 2
- SPP: 0','''- Replicate PINTAR to new districts 
- Engage new funders
- Organise convening events',NULL,'Active'),
('IND89-2026',2026,'SM01','OUT01','ACC01','PRG01','BE','IND89','PINTAR 1.0','# of local innovation adopted by schools or governments or private sectors',NULL,'Number',NULL,'Quarterly',NULL,'- Facilitator grant report
- Program evaluation report',0,NULL,'Naik',NULL,15.0,15,3.0,3,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'- Local innovation to improve FLN initiated by PINTAR Facilitators. 
- Adopted: Local innovations that are supported through external funding sources (other than TF) for the implementation or scale-up of the Fasda project.','- Evaluate Fasda Perubahan
- Revamp Fasda Perubahan Program 
- Comms & Regional initiatives: to amplify innovation, gain recognition from district leaders, in order to drive adoption across other schools and educational institutions.',NULL,'Active'),
('IND90-2026',2026,'SM01','OUT20','ACC01','PRG01','BE','IND90','BE','% of recommendations on school monitoring system (APS) presented to the national government',NULL,'Percent',NULL,'Quarterly',NULL,'Program report',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.36,0.36,0.36,0.36,0.36,0.0,0.0,0.0,'Milestones, 
School monitoring system is defined as tech-enabled data collection of school/classroom performance in teaching & learning whereby data is used for decision making at the respective administrative government level. Adoption means tools/best practices/policies are in-place to support school or classroom performance monitoring.
1. program modeled in 5districts
2. best practice documented and disseminated; sustainable monitoring system established in model districts
3. recommendations presented to the national government','- Evaluation update by MLE
- Successfull transfer of APS in Kendal, Karo, and Dumai
- Presentation of APS to MoPSE (Policy Brief)
- Continue in 2 districts ( Kubar, Siak)',NULL,'Active'),
('IND91-2026',2026,'SM01','OUT20','ACC01','PRG01','BE','IND91','Adv Goal 2','# of national and regional policies related to LN developed or strengthened',NULL,'Number',NULL,'Quarterly',NULL,'National, Presidential, or Ministerial level planning, regulation, and/or SoP/guideline','Cumulative',NULL,'Naik',NULL,31.0,31,13.0,13,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Government policies/regulation enacted and/or in-place.
national level
2025: PPG supervision guide produced, and GNN and Deep Learning launched
2026: RUU Sisdiknas, GNN implementation 
regional level
- LN issues included in district development documents (Renja/RKPD)
- Perbup/Perwali LN signed (at least a draft in 2026)
- Program and budget allocated (KAK, SE/SK, Juklak)','- TA to RUU Sisdiknas
- TA to GNN',NULL,'Active'),
('IND92-2026',2026,'SM01','OUT17','ACC02','PRG04','TELADAN','IND92','TELADAN','# of TELADAN delivery model (LS, LO, PP) transformation implemented (incl. fully developed, launched, tested and implemented leadership competency assessment tools)',NULL,'Number',NULL,'Quarterly',NULL,'- LD new delivery booklets
- Assessment Tools, Assessment Report','Annual',NULL,'Naik',NULL,4.0,4,4.0,4,1.0,1,0.25,0.25,1.0,0.0,0.0,0.0,'3 transformed delivery of LS, LO, and PP

1 Assessment tools developed with milestones:
- TELADAN leadership competencies defined
- Instrument developed 
- Instrument tested
- Assessment instrument used in TELADAN monitoring and program optimization','- Re-design, adjust, and implement LS, LO, and PP learning journey with new delivery models
- Develop and test assessment tools
- Use the new  assessment tools in endline cohort 2023, midline cohor 2025, and baseline cohort 2027',NULL,'Active'),
('IND93-2026',2026,'SM01','OUT17','ACC02','PRG04','TELADAN','IND93','TELADAN','TELADAN maintain performance of employment and skill development',NULL,'Percent',NULL,'Quarterly',NULL,'- Tracer survey
- Endline assessment report','Annual',NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria:
- 90% of Scholars graduated employed or self-employed <=6months after graduation
- 65% of Tanoto scholars show evidence of soft skill competencies development','- Improve the curriculum for Lead Others and PEP, in conjunction to the change of new delivery models
- Improve learning enrichment implementation (TSA, TSG, Global Experiences & Sponsorship) as integrative approach of LD',NULL,'Active'),
('IND94-2026',2026,'SM01','OUT12','ACC02','PRG04','TELADAN','IND94','TELADAN','# of universities adopt TELADAN leadership and soft skills development model/modul',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report','Cumulative',NULL,'Naik',NULL,5.0,5,2.0,2,1.0,1,0.2,0.5,1.0,0.0,0.0,0.0,'Total universities that replicate leadership and soft skill development practices using TELADAN as a key reference','- Provide technical assistance to partner universities and stakeholders to design and  implement soft-skill development using TELADAN as a key reference',NULL,'Active'),
('IND95-2026',2026,'SM01','OUT12','ACC02','PRG03','Fellowship','IND95','Fellowship','% of fellows employed or start their own initiatives in development sectors < 4 months after graduation',NULL,'Percent',NULL,'Quarterly',NULL,'Tracer survey','Annual',NULL,'Naik',NULL,0.7,0.7,0.7,0.7,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Numerator: # of fellows who obtain full-time, part-time, or start their own initiaives in social development sector within ≤ 4 months after program graduation
Denominator: total of fellows per cohort','- Improve field experience and project learning 
- Link fellows to more philanthropies and NGOs',NULL,'Active'),
('IND96-2026',2026,'SM01','OUT18','ACC04','PRG13','PA','IND96','GEA','Level of government engagement and maintenance',NULL,'Percent',NULL,'Quarterly',NULL,'MoU/PKS, MoM, Activity report',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria:
- 20%:  MoU/PKS active/issued
- 20%: Foundation level Meetings w national high level officials (minister/vice/Echelon-1) and regional high level officials (bupati atau wakil/walikota atau wakil/ Sekda atau Kepala OPD)
- 20%: Gov high level officials attended TF events
- 20%: Recognitions from government (Awards, documentation of statements, letters)
- 20%: Zero MoU/PKS termination due to dispute','- Implement government engagement meetings as per government engagement strategy
- Present policy briefs and other key knowledge products',NULL,'Active'),
('IND97-2026',2026,'SM01','OUT18','ACC04','PRG12','GCB','IND97','CSD','# of civil servants participated in capacity building activities, with at least PES or LN content',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report, attendance list',0,NULL,'Naik',NULL,10000.0,10000,2000.0,2000,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Civil servants that participate in GCB Programmes, equipped with capacity to improve policies around FLN and/or PES','- Ensure GCB modules contain reference to best practices in LN or PES
- Ensure the participation of TF key stakeholders in GCB programmes
- Continue engagement with LAN to promote enabling policy environment
- 400 ASN from each regions to be participated in the capacity building activities',NULL,'Active'),
('IND98-2026',2026,'SM01','OUT16','ACC03','PRG06','Partnership','IND98','Partnership','# of NPO trained (proxy Indicator 2026)',NULL,'Number',NULL,'Quarterly',NULL,'NPO assessment, activity/training report',0,NULL,'Naik',NULL,7.0,7,3.0,3,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Criteria:
- NGO receives strengthening in measurement, leadership, and fundraising','- NPO development initial assessment
- Ensure FAASTER provides NGO capacity building to the local implemeting partners
- Build curriculum/ buy off-the-shelf modules on measurement, leadership, and fundraising
- SPP to support/facilitated the training',NULL,'Active'),
('IND99-2026',2026,'SM01','OUT16','ACC04','PRG13','PA','IND99','PA','Level of stakeholders perception',NULL,'Text',NULL,'Quarterly',NULL,'Stakeholders perception survey report','Annual',NULL,'Naik',NULL,NULL,'Mid to High Positive',NULL,'Mid to High Positive',0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Level:
- Score perception survey','- Develop stakeholder perception measurement framework
- Align framework with Global Comms 
- Conduct baseline',NULL,'Active'),
('IND100-2026',2026,'SM01','OUT16','ACC04','PRG13','PA','IND100','PA','# of publications, citation and reference',NULL,'Number',NULL,'Quarterly',NULL,'Op-ed, articles/ documents/ media with citation','Annual',NULL,'Naik',NULL,21.0,21,21.0,21,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'`- Collaborative Op-ed by strategic partners (12): 2 per region, 4 national
- Citation by academic paper/journal, materials produced by media, UN organization, NGOs, governments, etc (5)
- ''4 impact stories/lesson learned written and disseminated (Case study: Fasda Perubahan, HTHT Study, Rumah Anak SIGAP, INSPIRASI)','- Increase target in citation and reference, not only # publications
- Facilitate dissemination event by SPP
- Support the development of government presentation to have reference to TF studies
- Established Impact Hub',NULL,'Active'),
('IND101-2026',2026,'SM01','OUT16','ACC04','PRG10','Communication','IND101','Communication','# of public advocacy campaign executed on the national and subnational level',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report','Annual',NULL,'Naik',NULL,2.0,2,2.0,2,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'- Orchestrate public advocacy campaign involving national & regional comms team around TF advocacy goals in place by utilizing necessary public advocacy tools (op-ed, podcast, social media, event, community activation, FGD, and other communications initiatives)
- 2026: 1 PES, 1 LN public advocacy campaign','- Conduct public campaign during relevant dates: Teacher''s Day, Nutrition Day, Education''s Day, etc',NULL,'Active'),
('IND102-2026',2026,'SM01','OUT16','ACC04','PRG10','Communication','IND102','Communication','# of high-level forum on national or regional level with TF representation as a speaker bringing advocacy agenda',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report','Annual',NULL,'Naik',NULL,20.0,20,20.0,20,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Example of highly influential events: 
1) Ministerial-level and above, national & regional policy forum, UN events 
2) including external or internal 
3) the objective of the event is to inform policy change in regards to Advocacy Goal 1, Advocacy Goal 2, Soft-skill development, MCHN, Philanthropy 
4) high-impact','- Improve attendance of highly influential person
- Increase the use of TF data in presentation',NULL,'Active'),
('IND103-2026',2026,'SM01','OUT16','ACC04','PRG13','PA','IND103','PA','# of reach harnessed from media',NULL,'Number',NULL,'Quarterly',NULL,'Media tracking','Annual',NULL,'Naik',NULL,100000000.0,100000000,100000000.0,100000000,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,'- Media partnership
- Social media post and engagement',NULL,'Active'),
('IND104-2026',2026,'SM01','OUT08','ACC02','PRG04','TELADAN','IND104','Communication','# of alumni engaged to OpEd, as speaker/resource person, events, FGDs',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report','Cumulative',NULL,'Naik',NULL,250.0,250,250.0,250,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'a) 250 alumni engaged to OpEd, as speaker/resource person, events, FGDs
b) 30 TELADAN alumni: alumni contributed back to LDS program (gatherings, mentoring sessions, online platforms)
c) 10 “high profile” alumni engaged to OpEd, speaker/resource person,  FGDs','- Revisit alumni management and development strategy 
- Implement alumni engagement programs: involving in LD & partnering with alumni association
- Identify potential inspirational alumni and engage to be featured in OpEd, as speaker/resource persons, or FGDs.',NULL,'Active'),
('IND105-2026',2026,'SM01','OUT08','ACC02','PRG04','TELADAN','IND105','Communication','# of TELADAN alumni contributed back',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,30.0,30,30.0,30,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND106-2026',2026,'SM01','OUT08','ACC02','PRG04','TELADAN','IND106','Communication','# of high profile alumni engaged',NULL,'Number',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Naik',NULL,10.0,10,10.0,10,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND107-2026',2026,'SM02','OUT21','ACC05','PRG17','FATLC','IND107','All','Zero major audit findings',NULL,'Number',NULL,'Quarterly',NULL,'Audit report','Annual',NULL,'Naik',NULL,0.0,0,0.0,0,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,'- Exercise SOP 
- Conduct Audit',NULL,'Active'),
('IND108-2026',2026,'SM02','OUT21','ACC05','PRG17','FATLC','IND108','FATLC','Budget control TF Indo budget effectiveness',NULL,'Percent',NULL,'Quarterly',NULL,'Finance report','Annual',NULL,'Naik',NULL,1.0,1,0.9,0.9,0.77,0.77,0.77,0.8555555555555555,0.77,0.0,0.0,0.0,'Based on monthly report issued by FATLC','- Exercise Budget Control',NULL,'Active'),
('IND109-2026',2026,'SM02','OUT21','ACC05','PRG17','FATLC','IND109','FATLC','Efficient budget absorption: Overhead Cost',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,0.1,0.1,0.1,0.1,0.07,0.07,0.7000000000000001,0.7000000000000001,0.07,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND110-2026',2026,'SM02','OUT21','ACC05','PRG17','FATLC','IND110','FATLC','% of LE cost saving',NULL,'Percent',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,0.03,0.03,0.03,0.03,0.01,0.01,0.33333333333333337,0.33333333333333337,0.01,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND111-2026',2026,'SM02','OUT21','ACC02','PRG04','TELADAN','IND111','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Average tuition fee/scholar/semester',NULL,'Text',NULL,'Quarterly',NULL,'Finance report','Annual',NULL,'Turun',NULL,7100000.0,7100000,7100000.0,7100000,0.0,0,-1.0,-1.0,0.0,0.0,0.0,0.0,NULL,'- Implement new delivery model of TELADAN  
- Introduce new assessment tool for leadership competency
- Exercise more cost-efficient activities for learning enrichment',NULL,'Active'),
('IND112-2026',2026,'SM02','OUT21','ACC02','PRG04','TELADAN','IND112','TELADAN','Unit cost for leadership development & scholarship program below agreed threshold: IDR Recruitment cost / scholar',NULL,'Text',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,2000000.0,2000000,2000000.0,2000000,0.0,0,-1.0,-1.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND113-2026',2026,'SM02','OUT21','ACC02','PRG04','TELADAN','IND113','Leadership Development','Unit cost for leadership development & scholarship program below agreed threshold: IDR Leadership Dev. Cost /scholar /cohort',NULL,'Text',NULL,'Quarterly',NULL,NULL,'Annual',NULL,'Turun',NULL,12000000.0,12000000,14500000.0,14500000,0.0,0,-1.0,-1.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND114-2026',2026,'SM02','OUT21','ACC01','PRG02','ECED','IND114','RAS','Unit cost for Rumah Anak SIGAP program below agreed threshold (IDR/child/day)',NULL,'Text',NULL,'Quarterly',NULL,'Finance report',0,NULL,'Turun',NULL,7200.0,7200,9000.0,9000,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'2025 0.57USD/child/day or Rp9200/child/day
2026: Rp9000 per child per day
2030: 20% decreased','- Optimise enrollment (dyad per center)
- Introduce cadre as the facilitator of individual stimulation 
- Optimise number of center per district
- 2027: return the management of RAS in Kalimantan to Regional Office',NULL,'Active'),
('IND115-2026',2026,'SM03','OUT22','ACC03','PRG07','SPP','IND115','KM','# of CI projects completed and operationalized',NULL,'Number',NULL,'Quarterly',NULL,'Activity Report','Annual',NULL,'Naik',NULL,12.0,12,12.0,12,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'2 per regional
4 for national','- Develop stakeholders management platform (P&A-SPP)
- Conduct A/B testing
- Conduct CI projects',NULL,'Active'),
('IND116-2026',2026,'SM03','OUT22','ACC03','PRG08','SPP, MLE','IND116','SPP, MLE','% of completion strategic system alignment established and implemented',NULL,'Percent',NULL,'Quarterly',NULL,'1. BSC 
2. ⁠Quarterly review report
3. Exco/BoT/LT meeting MoM',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.35,0.35,0.35,0.35,0.35,0.0,0.0,0.0,'- 35%: All BSCs aligned with key priorities 
- 35%: Quarterly review of strategic results against key priorities and actions follow-through
- 30%: Exco/BoT meetings with feedback addressed','- BSC alignment workshops
- Quarterly Review
- LT meetings to address Exco/BoT feedback',NULL,'Active'),
('IND117-2026',2026,'SM03','OUT22','ACC03','PRG07','SPP','IND117','SPP','% of One-TF operating system established',NULL,'Percent',NULL,'Quarterly',NULL,'1. Approved investment memo
2. ⁠Partnership database bank',0,NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'- 50%: Investment memo and due diligence are enacted for grants >50K and reviewed
- 50%: Partnership and MoM database established, updated and analyzed for actions','- OneTF Operating System development',NULL,'Active'),
('IND118-2026',2026,'SM04','OUT23','ACC06','PRG18','HRD','IND118','HR','Regrettable attrition rate due to culture (through a trust-based organization with a global mindset)',NULL,'Percent',NULL,'Quarterly',NULL,'HR report','Annual',NULL,'Turun',NULL,0.02,0.02,0.02,0.02,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND119-2026',2026,'SM04','OUT23','ACC06','PRG18','HRD','IND119','HR','Critical vacancy fulfilment rate',NULL,'Percent',NULL,'Quarterly',NULL,'HR report','Annual',NULL,'Naik',NULL,0.9,0.9,0.9,0.9,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,NULL,NULL,'Active'),
('IND120-2026',2026,'SM04','OUT23','ACC06','PRG18','HRD','IND120','HR','Key succession leadership in-place and key subject-matter expertise available',NULL,'Percent',NULL,'Quarterly',NULL,'HR report','Annual',NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Regional level (successor, BE + ECED specialist)','- Conduct training on data literacy, MTP, and FLP 
- Conduct on-the-job assignment/shadowing for identified potential subject-matter',NULL,'Active'),
('IND121-2026',2026,'SM04','OUT23','ACC06','PRG18','HRD','IND121','HR','% of completion development of capability framework',NULL,'Percent',NULL,'Quarterly',NULL,'HR report','Annual',NULL,'Naik',NULL,1.0,1,1.0,1,0.0,0,0.0,0.0,0.0,0.0,0.0,0.0,'Includes catalyser collective action capability, data literacy, subject-matter and other core skills','- Conduct baseline and develop assessment tools',NULL,'Active');
