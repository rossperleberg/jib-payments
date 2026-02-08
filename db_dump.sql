--
-- PostgreSQL database dump
--

\restrict RavWgYVyCVqn9gP7PdTvJfSyAFIfdlZakgUUNw3M1XdTeoKA5K52iXDYHamVTc6

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_operator_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_operator_owners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    account_id character varying NOT NULL,
    operator_id character varying NOT NULL,
    owner_number text NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    account_name text NOT NULL,
    account_prefix text NOT NULL,
    bank_name text,
    current_check_number integer DEFAULT 1000,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ach_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ach_batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    account_id character varying NOT NULL,
    batch_name text NOT NULL,
    file_name text NOT NULL,
    payment_period text,
    total_amount numeric(12,2) NOT NULL,
    payment_count integer NOT NULL,
    generated_date timestamp without time zone DEFAULT now(),
    generated_by text,
    file_path text
);


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    account_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: credit_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_applications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credit_id character varying NOT NULL,
    payment_id character varying NOT NULL,
    amount_applied numeric(12,2) NOT NULL,
    applied_date date NOT NULL,
    applied_by text,
    notes text
);


--
-- Name: credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credits (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    account_id character varying NOT NULL,
    operator_id character varying NOT NULL,
    original_amount numeric(12,2) NOT NULL,
    remaining_balance numeric(12,2) NOT NULL,
    source text NOT NULL,
    reference text,
    date_received date NOT NULL,
    created_date timestamp without time zone DEFAULT now(),
    created_by text,
    notes text,
    is_active boolean DEFAULT true
);


--
-- Name: operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operators (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    operator_name text NOT NULL,
    legal_entity_name text,
    aliases text[],
    has_ach boolean DEFAULT false,
    bank_name text,
    bank_address text,
    routing_number text,
    account_number text,
    wire_routing text,
    swift_code text,
    remittance_email text,
    contact_name text,
    contact_phone text,
    contact_email text,
    notes text,
    ach_added_by text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    account_id character varying NOT NULL,
    operator_id character varying,
    operator_name text NOT NULL,
    owner_number text,
    amount numeric(12,2) NOT NULL,
    original_amount numeric(12,2),
    payment_date date NOT NULL,
    doc_num text,
    payment_method text DEFAULT 'ACH'::text,
    status text DEFAULT 'imported'::text,
    batch_id character varying,
    batch_name text,
    check_number integer,
    processed_date date,
    failed_reason text,
    credit_applied numeric(12,2) DEFAULT '0'::numeric,
    paid_by_credit boolean DEFAULT false,
    import_file_name text,
    import_date timestamp without time zone,
    notes text,
    is_potential_duplicate boolean DEFAULT false,
    duplicate_of_id character varying,
    has_available_credit boolean DEFAULT false,
    available_credit_amount numeric(12,2),
    entry_edited boolean DEFAULT false,
    entry_edited_at timestamp without time zone,
    entry_sent boolean DEFAULT false,
    entry_sent_at timestamp without time zone,
    is_historical boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


--
-- Data for Name: account_operator_owners; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts VALUES ('eb97dff2-f427-4d84-b7e0-6b3c741e7f65', 'GPG, Inc.', 'GPG', 'Western State Bank', 1005, '2026-01-28 15:10:52.926566');
INSERT INTO public.accounts VALUES ('fbde5bab-db03-4c47-ae9a-956a965b5c26', 'Western Energy Corp', 'WEC', 'Western State Bank', 1000, '2026-01-28 15:10:52.96192');
INSERT INTO public.accounts VALUES ('b602999f-1124-4896-b332-1a6191be6b84', 'GROW Minerals', 'GROW', 'Western State Bank', 1000, '2026-01-28 15:10:52.964753');
INSERT INTO public.accounts VALUES ('3028999b-a042-43cc-b152-0778291af653', 'Irene Johnson', 'Irene Johnson', 'Western State Bank', 1000, '2026-01-28 16:08:40.610993');
INSERT INTO public.accounts VALUES ('2fbc04db-2f92-445b-a6a1-3a5dfb10ba2c', 'Jon Geyerman, Inc.', 'JGI', 'Western State Bank', 1000, '2026-01-28 16:08:40.610993');
INSERT INTO public.accounts VALUES ('560bcf16-b23a-4361-abfb-1190d11745b5', 'Meadow Woods Energy', 'Meadow Woods', 'Western State Bank', 1000, '2026-01-28 16:08:40.610993');
INSERT INTO public.accounts VALUES ('8ae25aba-de40-4cd3-9d30-91107e146c63', 'Triple T, Inc.', 'Triple T', 'Western State Bank', 1000, '2026-01-28 16:08:40.610993');
INSERT INTO public.accounts VALUES ('aa4563ab-c481-4bcb-b6d3-ae6beb41ed14', 'SeeSaw Energy LLC', 'SeeSaw', 'Western State Bank', 1000, '2026-01-28 16:08:40.610993');


--
-- Data for Name: ach_batches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.activity_log VALUES ('edc6b620-8978-47bc-8558-7df1b33afd64', 'import', 'Imported 7 payments for GPG', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '2026-01-28 15:46:56.735289');
INSERT INTO public.activity_log VALUES ('07d6a91a-6e1f-4fa0-b73a-892ff4a7a81b', 'import', 'Imported 7 payments for GPG', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '2026-01-28 15:51:47.394881');
INSERT INTO public.activity_log VALUES ('17e4afb8-7efd-491f-ac4b-839b5d6b34eb', 'import', 'Imported 7 payments for GPG', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '2026-01-28 15:52:02.186425');
INSERT INTO public.activity_log VALUES ('11671f8d-9445-4e95-8ee8-37f60b8eda97', 'entry_tracker', 'Moved 7 payments to Entry Tracker', NULL, '2026-01-28 19:06:59.54897');


--
-- Data for Name: credit_applications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: credits; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.operators VALUES ('5385af3e-4f34-4f8a-94d5-e1f81855c760', 'Chord/Enerplus', 'Enerplus Resources (USA) Corporation', '{"ENERPLUS RESOURCES","ENERPLUS RESOURCES (USA) CORPORATION",ENERPLUS,"ENERPLUS RESOURCES USA"}', true, 'JPMorgan Chase', NULL, '111000614', '682587129', '021000021', NULL, NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 15:10:52.968046');
INSERT INTO public.operators VALUES ('e62d656f-1a1a-452b-bd4c-c73ec99d7a89', 'Chord/Oasis', 'Oasis Petroleum North America LLC', '{"OASIS PETROLEUM","OASIS PETROLEUM NORTH AMERICA","OASIS PETROLEUM NORTH AMERICA LLC",OASIS}', true, 'JP Morgan Chase', NULL, '111000614', '747479327', '021000021', NULL, NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 15:10:52.97209');
INSERT INTO public.operators VALUES ('4e3717e4-3bf1-46bf-8273-ccd45af735f3', 'Chord/Whiting', 'Whiting Oil & Gas Corp.', '{"WHITING OIL AND GAS","WHITING OIL & GAS","WHITING OIL AND GAS CORPORATION","WHITING PETROLEUM",WHITING}', true, 'JP Morgan Chase', NULL, '102001017', '192493417', '021000021', NULL, NULL, NULL, NULL, NULL, 'Different ACH routing!', 'admin', '2026-01-28 15:10:52.975322');
INSERT INTO public.operators VALUES ('676b6122-ef75-4f5f-bfe8-3960c2a4d5df', 'ConocoPhillips', 'ConocoPhillips Company', '{COP,"COP ON BEHALF","COP ON BEHALF-MARATHON","COP ON BEHALF-BURL","COP ON BEHALF-BURLINGTON",MARATHON,"MARATHON OIL","BURLINGTON RESOURCES","CONOCOPHILLIPS COMPANY"}', true, 'JP Morgan Chase', '270 Park Ave, New York, NY 10017', '071000013', '643625262', '021000021', NULL, 'rsc.ar.cash@conocophillips.com', NULL, NULL, NULL, 'Effective July 1, 2025 (Marathon acquisition)', 'admin', '2026-01-28 15:10:52.980112');
INSERT INTO public.operators VALUES ('7609d33e-cc74-4117-a4db-b6553c6bd5b2', 'Continental Resources', 'Continental Resources, Inc. Operating Account', NULL, true, 'US Bank', '950 17th St., Denver, CO 80202', '102000021', '103690174968', '102000021', 'USBKUS44IMT', 'pmtremittance@clr.com', 'Fonette Hedrick', '405-234-9528', 'Fonette.Hedrick@clr.com', 'PO Box 268835, Oklahoma City, OK 73126', 'admin', '2026-01-28 15:10:52.983028');
INSERT INTO public.operators VALUES ('d1a0b569-1384-427d-804b-ee3350e16e05', 'Formentera Operations', 'Formentera Operations LLC', NULL, true, 'Frost Bank', NULL, '114000093', '578895031', NULL, NULL, NULL, 'Jack Herndon (SVP)', '432-617-1316', NULL, NULL, 'admin', '2026-01-28 15:10:52.986351');
INSERT INTO public.operators VALUES ('26863ccf-7e9a-4dd4-97fa-39d12e41a882', 'Foundation Energy', 'Foundation Energy Management, LLC', NULL, true, 'Amegy Bank', '2501 N Harwood St, 16th Floor, Dallas, TX 75201', '113011258', '51583697', '113011258', NULL, NULL, 'JB Askew (SVP)', NULL, NULL, 'PO Box 650696, Dallas, TX 75265-0696', 'admin', '2026-01-28 15:10:52.98935');
INSERT INTO public.operators VALUES ('2ad18fd6-b3a2-4e0b-bee5-9744ad65bb77', 'Hess Bakken', 'Hess Bakken Investment II LLC', NULL, true, 'JPMorgan Chase Bank', 'One Chase Manhattan Plaza, New York, NY 10081', '021000021', '486301224', '021000021', 'CHASUS33', NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 15:10:52.992182');
INSERT INTO public.operators VALUES ('3f174c27-450c-4b78-b5e5-b79185c54238', 'Hunt Oil', 'HUNT OIL COMPANY', '{"HUNT OIL COMPANY","HUNT OIL CO",HUNT}', true, 'Bank of America', '1900 N AKARD ST, DALLAS, TX 75201', '111000012', '000180001230', '026009593', 'BOFAUS3N/BOFAUS6S', NULL, 'Natalie Reynolds', '888.400.9009', NULL, 'Has active ACH blocks/filters', 'admin', '2026-01-28 15:10:52.995933');
INSERT INTO public.operators VALUES ('93eaff37-6917-47da-87e0-89584bacde61', 'KODA Resources', 'KODA Resources Operating, LLC', NULL, true, 'Capital One, N.A.', 'Houston, TX', '111901014', '3746652652', '111901014', 'HIBKUS44', NULL, 'Tony Queen', '(469) 331-6617', 'EnergyClientService@capitalone.com', '1401 Wynkoop St, Suite 300, Denver, CO 80202', 'admin', '2026-01-28 15:10:52.998896');
INSERT INTO public.operators VALUES ('04aff2d2-7947-4699-af4c-03673b196b84', 'Kraken Operating', 'Kraken Operating LLC', NULL, true, 'Texas Capital Bank, N.A.', '2000 McKinney Ave, Dallas, TX 75201', '111017979', '2400001425', NULL, NULL, NULL, 'Cheresa Hogan (AVP)', '346-542-4928', 'cheresa.hogan@texascapitalbank.com', NULL, 'admin', '2026-01-28 15:10:53.001745');
INSERT INTO public.operators VALUES ('52265f69-5830-4287-8f52-1b0b3d34cd8a', 'Lime Rock Resources', 'LIME ROCK RESOURCES OPERATING COMPANY', NULL, true, 'Amegy Bank (Zions)', NULL, '113011258', '0053268195', NULL, 'ZFNBUS55', NULL, 'April Saldivar', '1-888-539-7928', 'tmclientservices@amegybank.com', '1111 Bagby St Suite 4600, Houston TX 77002-2559', 'admin', '2026-01-28 15:10:53.004501');
INSERT INTO public.operators VALUES ('899f1e3f-2667-4419-825a-df2c4c4999c8', 'Murex Petroleum', 'Murex Petroleum Corporation', '{"MUREX PETROLEUM CORPORATION","MUREX PETROLEUM CORP",MUREX}', true, 'US Bank', '120 W 12th St, Suite 105, Kansas City, MO 64105', '102000021', '103690310018', NULL, NULL, NULL, 'Kathy Machado', '281.590.3313', 'kmachado@murexpetroleum.com', '1700 City Plaza Dr., Suite 575, Spring, TX 77389', 'admin', '2026-01-28 15:10:53.007646');
INSERT INTO public.operators VALUES ('26ff1bc0-bdeb-48e3-872e-cb2dfd058672', 'Red Rock Resources', 'Red Rock Resources Corporation Operating Account', NULL, true, 'Frost Bank', '111 W. Houston St. San Antonio, TX 78205', '114000093', '579215883', NULL, 'FRSTUS44', NULL, 'Ileana Moralez', '(432) 617-1309', 'ileana.moralez@frostbank.com', '8101 E Prentice Ave Ste 725, Greenwood Village CO 80111', 'admin', '2026-01-28 15:10:53.010346');
INSERT INTO public.operators VALUES ('f12d7656-2cad-421f-ab86-5bad247a79df', 'Rockport Oil & Gas', 'Rockport Oil & Gas IV LLC', NULL, true, 'Bank of America', NULL, '111000012', '4451804502', NULL, NULL, NULL, NULL, NULL, 'bryan.phiffer@plantemoran.com', NULL, 'admin', '2026-01-28 15:10:53.013245');
INSERT INTO public.operators VALUES ('cf4cbef3-d4a9-4fba-96a3-c18815d82166', 'Silver Hill Energy', 'Silver Hill Energy Operating LLC', NULL, true, 'Bank of Texas NA', NULL, '111014325', '8097566224', NULL, NULL, 'ownerrelations@silverhillenergy.com', 'Shannan', NULL, 'OwnerRelations@SilverHillEnergy.com', NULL, 'admin', '2026-01-28 15:10:53.016261');
INSERT INTO public.operators VALUES ('c00ad652-1143-49aa-b970-74ed79c5e3db', 'Slawson Exploration', 'Slawson Exploration Co., Inc. - Operating', NULL, true, 'Intrust Bank', 'Wichita, KS', '101100029', '41472381', '101100029', NULL, NULL, 'Cindy', '(405) 478-7412', 'chowell@slawson.com', 'Same routing for ACH and Wire', 'admin', '2026-01-28 15:10:53.019527');
INSERT INTO public.operators VALUES ('e15b71ba-b77c-44ef-bddc-31e2ceb0c733', 'XTO Energy', 'XTO Energy Inc.', NULL, true, 'Citibank, N.A.', NULL, '021000089', '30956943', '021000089', 'CITIUS33', NULL, 'Julio Cesar Xavier Guerios', '+1 (346) 335-6919', 'julio.c.guerios@exxonmobil.com', 'Tax ID: 75-2847769', 'admin', '2026-01-28 15:10:53.021781');
INSERT INTO public.operators VALUES ('8ccf19b8-7bb8-4d75-bd17-841d5230d349', 'Zavanna Energy', 'Zavanna Energy Operating Drilling Account', NULL, true, 'Comerica Bank', NULL, '111000753', '1883565440', NULL, NULL, NULL, NULL, '303-595-8004', NULL, 'Wire instructions', 'admin', '2026-01-28 15:10:53.025113');
INSERT INTO public.operators VALUES ('1e120026-09c3-488f-93ef-eb50215d7060', 'Devon Energy', 'Devon Energy Production Company', NULL, true, 'Bank of America, N.A.', '901 Main Street, Dallas, TX 75202', '026009593', '4451454159', NULL, NULL, NULL, NULL, NULL, NULL, 'Also known as Devon Energy Williston, LLC per invoice', 'admin', '2026-01-28 15:10:53.027849');
INSERT INTO public.operators VALUES ('5644844e-56f2-4df2-96d5-bf4fa7990e60', 'EOG Resources', 'EOG Resources, Inc.', NULL, true, 'Bank of America, N.A.', '901 Main Street, Dallas, TX 75202', '111000012', '3750494413', NULL, NULL, NULL, NULL, NULL, NULL, '1111 Bagby, Sky Lobby 2, Houston, TX 77002 | PO Box 4362, Houston, TX 77210-4362', 'admin', '2026-01-28 15:10:53.030295');
INSERT INTO public.operators VALUES ('e6ce2a98-1052-464c-9722-a16e86b2ffbb', 'Phoenix Operating', 'Phoenix Operating LLC', NULL, true, 'Amarillo National Bank', '410 South Taylor Street, Amarillo, TX 79101', '111300958', '322334', NULL, NULL, NULL, NULL, NULL, NULL, '4643 S. Ulster Street Ste. 1510, Denver, CO 80237', 'admin', '2026-01-28 15:10:53.032775');
INSERT INTO public.operators VALUES ('db7ceff7-43a5-4a74-b5b8-3317d05ead95', 'Petro-Hunt', 'Petro-Hunt, L.L.C.', '{"PETRO-HUNT LLC","PETRO-HUNT L.L.C.",PETROHUNT,"PETRO HUNT"}', true, 'Bank of Texas, N.A.', 'Dallas, TX', '111014325', '8094647720', NULL, NULL, NULL, 'J.M. Mason', '214-880-8400', NULL, 'Rosewood Court, 2101 Cedar Springs Road, Suite 600, Dallas, TX 75201 | Fax: 214-880-7171', 'admin', '2026-01-28 15:10:53.035558');
INSERT INTO public.operators VALUES ('eebc4899-011b-48eb-bbcb-99f753eeb515', 'Iron Oil Operating', 'Iron Oil Operating, LLC', '{"IRON OIL","IRON OIL OPERATING","IRON OIL OPERATING LLC"}', true, 'Stockman Bank', '402 N Broadway, Billings MT 59101', '092905249', '4510008015', '092905249', NULL, NULL, NULL, NULL, NULL, 'Checks: ATTN: Accounting, 2507 Montana Ave., Billings, MT 59103-0955', 'admin', '2026-01-28 15:41:24.516279');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments VALUES ('b0f7478a-3c0f-45d7-91e2-d811b9dd5d99', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', 'e62d656f-1a1a-452b-bd4c-c73ec99d7a89', 'OASIS PETROLEUM NORTH AMERICA LLC', '08788', 1228.35, NULL, '2026-01-15', 'S2025121000598', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.141125');
INSERT INTO public.payments VALUES ('3e24d944-99af-4c1d-8a41-69110186b698', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', 'db7ceff7-43a5-4a74-b5b8-3317d05ead95', 'PETRO-HUNT LLC', '99304-01', 38.48, NULL, '2026-01-15', '202511-01056', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.134208');
INSERT INTO public.payments VALUES ('7509a78e-8381-46cf-a87a-3ec585648652', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '7609d33e-cc74-4117-a4db-b6553c6bd5b2', 'CONTINENTAL RESOURCES INC.', '0122871001', 914.37, NULL, '2026-01-11', '1220250122871001', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.147095');
INSERT INTO public.payments VALUES ('34375f15-c524-4e08-8946-a168d23d5252', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '8ccf19b8-7bb8-4d75-bd17-841d5230d349', 'ZAVANNA ENERGY OPERATING, LLC', '2230', 534.55, NULL, '2026-01-10', '2230122500', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.159988');
INSERT INTO public.payments VALUES ('0df5d78b-6464-4081-9b40-cf840ffeec29', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '2ad18fd6-b3a2-4e0b-bee5-9744ad65bb77', 'HESS BAKKEN INVESTMENTSII', '1019357304', 12.29, NULL, '2026-01-08', '1220251019357304', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.150703');
INSERT INTO public.payments VALUES ('1207eab0-5eff-4c5e-aafd-c1765cec7ce2', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', '04aff2d2-7947-4699-af4c-03673b196b84', 'KRAKEN OPERATING LLC', '122871001', 682.03, NULL, '2025-12-31', 'RIB36571', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.171777');
INSERT INTO public.payments VALUES ('8e9eb1c2-11ba-48da-843f-9354a57cea7c', 'eb97dff2-f427-4d84-b7e0-6b3c741e7f65', 'db7ceff7-43a5-4a74-b5b8-3317d05ead95', 'PETRO-HUNT LLC', '99304-01', 23.35, NULL, '2025-12-15', '202510-00766', 'ACH', 'in_entry_tracker', NULL, NULL, NULL, NULL, NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 15:52:02.132', NULL, false, NULL, false, NULL, false, NULL, false, NULL, false, '2026-01-28 15:52:02.17735');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: account_operator_owners account_operator_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_operator_owners
    ADD CONSTRAINT account_operator_owners_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: ach_batches ach_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ach_batches
    ADD CONSTRAINT ach_batches_pkey PRIMARY KEY (id);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: credit_applications credit_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_applications
    ADD CONSTRAINT credit_applications_pkey PRIMARY KEY (id);


--
-- Name: credits credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credits
    ADD CONSTRAINT credits_pkey PRIMARY KEY (id);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- PostgreSQL database dump complete
--

\unrestrict RavWgYVyCVqn9gP7PdTvJfSyAFIfdlZakgUUNw3M1XdTeoKA5K52iXDYHamVTc6

