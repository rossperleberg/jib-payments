--
-- PostgreSQL database dump
--

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
-- Drop existing tables (in reverse dependency order)
--

DROP TABLE IF EXISTS public.credit_applications;
DROP TABLE IF EXISTS public.credits;
DROP TABLE IF EXISTS public.activity_log;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.ach_batches;
DROP TABLE IF EXISTS public.account_operator_owners;
DROP TABLE IF EXISTS public.operators;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS public.users;

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
    credit_applied numeric(12,2) DEFAULT 0,
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

INSERT INTO public.accounts VALUES ('f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'Triple T, Inc.', 'Triple T', 'Western State Bank', 3057, '2026-01-28 16:32:35.378232');
INSERT INTO public.accounts VALUES ('37fd4fe0-fe11-4707-86e1-67628258f4d0', 'Irene Johnson', 'Irene Johnson', 'Western State Bank', 1000, '2026-01-28 16:33:43.844998');
INSERT INTO public.accounts VALUES ('78682eb7-3786-4661-ae91-48ae2449849b', 'Meadow Woods Energy', 'Meadow Woods', 'Western State Bank', 1000, '2026-01-28 16:34:00.282053');
INSERT INTO public.accounts VALUES ('dbdde722-11a4-4da8-856c-80a77eefdc70', 'Western Energy Corp', 'WEC', 'Western State Bank', 2583, '2026-01-28 16:03:35.025547');
INSERT INTO public.accounts VALUES ('e06b6271-a62a-467d-99a4-6627fdccbccc', 'GPG, Inc.', 'GPG', 'Western State Bank', 3181, '2026-01-28 16:03:34.986953');
INSERT INTO public.accounts VALUES ('82ff82a9-4f1a-4368-8782-389ea5edbaca', 'GROW Minerals LLC', 'GROW Minerals ', 'Western State Bank', 1000, '2026-01-28 16:03:35.057372');
INSERT INTO public.accounts VALUES ('e38c72be-93cf-404e-9e77-f22220e7859e', 'Jon Geyerman, Inc.', 'JGI', 'Western State Bank', 2630, '2026-01-28 16:35:20.604047');

--
-- Data for Name: ach_batches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.activity_log VALUES ('417fc4d3-2b0a-43ab-96c3-2ce74b72ad74', 'import', 'Imported 21 payments for GPG', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '2026-01-28 16:34:23.860319');
INSERT INTO public.activity_log VALUES ('33ffb1a6-3e09-44cf-ba29-215d4365167c', 'import', 'Imported 7 payments for JGI', 'e38c72be-93cf-404e-9e77-f22220e7859e', '2026-01-28 16:35:46.282808');
INSERT INTO public.activity_log VALUES ('bd5c34ae-02ef-4be0-b434-616e99998669', 'import', 'Imported 15 payments for Triple T', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '2026-01-28 16:37:26.790114');
INSERT INTO public.activity_log VALUES ('0976028e-41e0-488c-9de1-4bc3b7c41215', 'import', 'Imported 2 payments for GROW', '82ff82a9-4f1a-4368-8782-389ea5edbaca', '2026-01-28 16:38:31.171861');
INSERT INTO public.activity_log VALUES ('cdb09768-de06-43ad-8eed-336ca60e1be1', 'import', 'Imported 2 payments for GROW', '82ff82a9-4f1a-4368-8782-389ea5edbaca', '2026-01-28 16:39:14.579204');
INSERT INTO public.activity_log VALUES ('35aaada6-ac9c-4c81-a8f4-01733cb57269', 'import', 'Imported 1 payments for Meadow Woods', '78682eb7-3786-4661-ae91-48ae2449849b', '2026-01-28 16:39:47.87695');
INSERT INTO public.activity_log VALUES ('3a017757-cd91-4063-9749-79275e351bc0', 'import', 'Imported 5 payments for WEC', 'dbdde722-11a4-4da8-856c-80a77eefdc70', '2026-01-28 16:42:28.235215');
INSERT INTO public.activity_log VALUES ('899d560d-a515-40fa-b036-7df1c715d844', 'import', 'Imported 1 payments for Irene Johnson', '37fd4fe0-fe11-4707-86e1-67628258f4d0', '2026-01-28 16:43:18.478437');
INSERT INTO public.activity_log VALUES ('790fb85a-1b9e-436e-a627-32e9dd66b8fa', 'import', 'Imported 5 payments for WEC', 'dbdde722-11a4-4da8-856c-80a77eefdc70', '2026-01-28 17:08:06.469033');
INSERT INTO public.activity_log VALUES ('6393b1df-0bc3-47f6-be5c-3c496435cd25', 'checks_sent_to_bill_pay', 'Sent 3 checks to Bill Pay', NULL, '2026-01-28 17:10:13.283903');
INSERT INTO public.activity_log VALUES ('abcbf700-1f48-45eb-a257-2e73eae8f27e', 'entry_tracker', 'Moved 49 payments to Entry Tracker', NULL, '2026-01-28 17:10:24.261245');

--
-- Data for Name: credit_applications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: credits; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.operators VALUES ('04994e79-3772-4798-b5ac-3f36de3647c6', 'Chord/Enerplus', 'Enerplus Resources (USA) Corporation', '{"ENERPLUS RESOURCES","ENERPLUS RESOURCES (USA) CORPORATION",ENERPLUS,"ENERPLUS RESOURCES USA"}', true, 'JPMorgan Chase', NULL, '111000614', '682587129', '021000021', NULL, NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 16:03:35.089253');
INSERT INTO public.operators VALUES ('6e4b3c9d-be78-4b84-86ee-695e74090b3a', 'Chord/Oasis', 'Oasis Petroleum North America LLC', '{"OASIS PETROLEUM","OASIS PETROLEUM NORTH AMERICA","OASIS PETROLEUM NORTH AMERICA LLC",OASIS}', true, 'JP Morgan Chase', NULL, '111000614', '747479327', '021000021', NULL, NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 16:03:35.123152');
INSERT INTO public.operators VALUES ('2ce15878-da06-45bb-9f2a-77cdcb81b71e', 'Chord/Whiting', 'Whiting Oil & Gas Corp.', '{"WHITING OIL AND GAS","WHITING OIL & GAS","WHITING OIL AND GAS CORPORATION","WHITING PETROLEUM",WHITING}', true, 'JP Morgan Chase', NULL, '102001017', '192493417', '021000021', NULL, NULL, NULL, NULL, NULL, 'Different ACH routing!', 'admin', '2026-01-28 16:03:35.154549');
INSERT INTO public.operators VALUES ('6e2e71b1-2d04-48e2-88f3-1219e1de9447', 'ConocoPhillips', 'ConocoPhillips Company', '{COP,"COP ON BEHALF","COP ON BEHALF-MARATHON","COP ON BEHALF-BURL","COP ON BEHALF-BURLINGTON",MARATHON,"MARATHON OIL","BURLINGTON RESOURCES","CONOCOPHILLIPS COMPANY"}', true, 'JP Morgan Chase', '270 Park Ave, New York, NY 10017', '071000013', '643625262', '021000021', NULL, 'rsc.ar.cash@conocophillips.com', NULL, NULL, NULL, 'Effective July 1, 2025 (Marathon acquisition)', 'admin', '2026-01-28 16:03:35.18626');
INSERT INTO public.operators VALUES ('bd308554-f067-4584-aea4-88e573935042', 'Continental Resources', 'Continental Resources, Inc. Operating Account', NULL, true, 'US Bank', '950 17th St., Denver, CO 80202', '102000021', '103690174968', '102000021', 'USBKUS44IMT', 'pmtremittance@clr.com', 'Fonette Hedrick', '405-234-9528', 'Fonette.Hedrick@clr.com', 'PO Box 268835, Oklahoma City, OK 73126', 'admin', '2026-01-28 16:03:35.217799');
INSERT INTO public.operators VALUES ('f83120a9-d854-4969-a1fc-3083388ecf2c', 'Formentera Operations', 'Formentera Operations LLC', NULL, true, 'Frost Bank', NULL, '114000093', '578895031', NULL, NULL, NULL, 'Jack Herndon (SVP)', '432-617-1316', NULL, NULL, 'admin', '2026-01-28 16:03:35.250745');
INSERT INTO public.operators VALUES ('d0052aa8-b0bf-4657-84a3-98591eb358aa', 'Foundation Energy', 'Foundation Energy Management, LLC', NULL, true, 'Amegy Bank', '2501 N Harwood St, 16th Floor, Dallas, TX 75201', '113011258', '51583697', '113011258', NULL, NULL, 'JB Askew (SVP)', NULL, NULL, 'PO Box 650696, Dallas, TX 75265-0696', 'admin', '2026-01-28 16:03:35.282491');
INSERT INTO public.operators VALUES ('d5f7e9ab-9010-4b79-9735-6f39116fc3ba', 'Hess Bakken', 'Hess Bakken Investment II LLC', NULL, true, 'JPMorgan Chase Bank', 'One Chase Manhattan Plaza, New York, NY 10081', '021000021', '486301224', '021000021', 'CHASUS33', NULL, NULL, NULL, NULL, NULL, 'admin', '2026-01-28 16:03:35.313634');
INSERT INTO public.operators VALUES ('6c7e6072-c67c-4ec7-a46b-84bba3da4a3f', 'Hunt Oil', 'HUNT OIL COMPANY', '{"HUNT OIL COMPANY","HUNT OIL CO",HUNT}', true, 'Bank of America', '1900 N AKARD ST, DALLAS, TX 75201', '111000012', '000180001230', '026009593', 'BOFAUS3N/BOFAUS6S', NULL, 'Natalie Reynolds', '888.400.9009', NULL, 'Has active ACH blocks/filters', 'admin', '2026-01-28 16:03:35.349137');
INSERT INTO public.operators VALUES ('6fdc0ddd-2e13-4500-9be6-10fa11d95c9d', 'KODA Resources', 'KODA Resources Operating, LLC', NULL, true, 'Capital One, N.A.', 'Houston, TX', '111901014', '3746652652', '111901014', NULL, NULL, 'Tony Queen', '(469) 331-6617', 'EnergyClientService@capitalone.com', '1401 Wynkoop St, Suite 300, Denver, CO 80202', 'admin', '2026-01-28 16:03:35.380111');
INSERT INTO public.operators VALUES ('797e7dc8-a6d8-473d-be03-d2fb9888d0b5', 'Kraken Operating', 'Kraken Operating LLC', NULL, true, 'Texas Capital Bank, N.A.', '2000 McKinney Ave, Dallas, TX 75201', '111017979', '2400001425', NULL, NULL, NULL, 'Cheresa Hogan (AVP)', '346-542-4928', 'cheresa.hogan@texascapitalbank.com', NULL, 'admin', '2026-01-28 16:03:35.411184');
INSERT INTO public.operators VALUES ('8fb5101a-28ff-430d-980c-f5c497673bf1', 'Lime Rock Resources', 'LIME ROCK RESOURCES OPERATING COMPANY', NULL, true, 'Amegy Bank (Zions)', NULL, '113011258', '0053268195', NULL, NULL, NULL, 'April Saldivar', '1-888-539-7928', 'tmclientservices@amegybank.com', '1111 Bagby St Suite 4600, Houston TX 77002-2559', 'admin', '2026-01-28 16:03:35.44205');
INSERT INTO public.operators VALUES ('d957bd99-17e3-465e-a361-997632f78fab', 'Murex Petroleum', 'Murex Petroleum Corporation', '{"MUREX PETROLEUM CORPORATION","MUREX PETROLEUM CORP",MUREX}', true, 'US Bank', '120 W 12th St, Suite 105, Kansas City, MO 64105', '102000021', '103690310018', NULL, NULL, NULL, 'Kathy Machado', '281.590.3313', 'kmachado@murexpetroleum.com', '1700 City Plaza Dr., Suite 575, Spring, TX 77389', 'admin', '2026-01-28 16:03:35.473345');
INSERT INTO public.operators VALUES ('22ac1fba-6378-40ff-b100-c1c4dfad7249', 'Red Rock Resources', 'Red Rock Resources Corporation Operating Account', NULL, true, 'Frost Bank', '111 W. Houston St. San Antonio, TX 78205', '114000093', '579215883', NULL, NULL, NULL, 'Ileana Moralez', '(432) 617-1309', 'ileana.moralez@frostbank.com', '8101 E Prentice Ave Ste 725, Greenwood Village CO 80111', 'admin', '2026-01-28 16:03:35.504711');
INSERT INTO public.operators VALUES ('6f941b95-9979-4839-ba02-32acc0c95672', 'Rockport Oil & Gas', 'Rockport Oil & Gas IV LLC', NULL, true, 'Bank of America', NULL, '111000012', '4451804502', NULL, NULL, NULL, NULL, NULL, 'bryan.phiffer@plantemoran.com', NULL, 'admin', '2026-01-28 16:03:35.535669');
INSERT INTO public.operators VALUES ('d2f268c0-d990-485d-9b2a-d09f2d891917', 'Silver Hill Energy', 'Silver Hill Energy Operating LLC', NULL, true, 'Bank of Texas NA', NULL, '111014325', '8097566224', NULL, NULL, 'ownerrelations@silverhillenergy.com', 'Shannan', NULL, 'OwnerRelations@SilverHillEnergy.com', NULL, 'admin', '2026-01-28 16:03:35.566279');
INSERT INTO public.operators VALUES ('f7a3b182-0e9a-4421-a889-7115a544b7ea', 'Slawson Exploration', 'Slawson Exploration Co., Inc. - Operating', NULL, true, 'Intrust Bank', 'Wichita, KS', '101100029', '41472381', '101100029', NULL, NULL, 'Cindy', '(405) 478-7412', 'chowell@slawson.com', 'Same routing for ACH and Wire', 'admin', '2026-01-28 16:03:35.597788');
INSERT INTO public.operators VALUES ('6a0d067c-5600-4085-85a2-12dee914a3ac', 'EOG Resources', 'EOG Resources, Inc.', NULL, true, 'Bank of America, N.A.', '901 Main Street, Dallas, TX 75202', '111000012', '3750494413', NULL, NULL, NULL, NULL, NULL, NULL, '1111 Bagby, Sky Lobby 2, Houston, TX 77002', 'admin', '2026-01-28 16:03:35.723486');
INSERT INTO public.operators VALUES ('a6da600a-3028-4abf-bd6a-c64e7e066e1e', 'Phoenix Operating', 'Phoenix Operating LLC', NULL, true, 'Amarillo National Bank', '410 South Taylor Street, Amarillo, TX 79101', '111300958', '322334', NULL, NULL, NULL, NULL, NULL, NULL, '4643 S. Ulster Street Ste. 1510, Denver, CO 80237', 'admin', '2026-01-28 16:03:35.755116');
INSERT INTO public.operators VALUES ('63339ff5-9a4d-4afd-8f32-b75a48e60097', 'Petro-Hunt', 'Petro-Hunt, L.L.C.', '{"PETRO-HUNT LLC","PETRO-HUNT L.L.C.",PETROHUNT,"PETRO HUNT"}', true, 'Bank of Texas, N.A.', 'Dallas, TX', '111014325', '8094647720', NULL, NULL, NULL, 'J.M. Mason', '214-880-8400', NULL, 'Rosewood Court, 2101 Cedar Springs Road, Suite 600, Dallas, TX 75201', 'admin', '2026-01-28 16:03:35.785605');
INSERT INTO public.operators VALUES ('7d2ddaaf-4320-427c-8e79-6135858888fc', 'Zavanna Energy', 'Zavanna Energy Operating Drilling Account', '{"ZAVANNA ENERGY OPERATING, LLC"}', true, 'Comerica Bank', NULL, '111000753', '1883565440', NULL, NULL, NULL, NULL, '303-595-8004', NULL, 'Wire instructions', 'admin', '2026-01-28 16:03:35.660099');
INSERT INTO public.operators VALUES ('99fa650b-a1b6-40f0-84d2-a4ec82efccc6', 'IRON OIL', 'Iron Oil Operating, LLC', '{"IRON OIL OPERATING LLC"}', true, 'Stockman Bank', '402 N Broadway, Billings MT 59101', '092905249', '4510008015', '092905249', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-28 16:40:53.776396');
INSERT INTO public.operators VALUES ('fd9b13a3-85e3-4e96-a4b6-03a2a0ceecf5', 'Devon Energy', 'Devon Energy Production Company', '{"DEVON ENERGY WILLISTON, L.L.C."}', true, 'Bank of America, N.A.', '901 Main Street, Dallas, TX 75202', '026009593', '4451454159', NULL, NULL, NULL, NULL, NULL, NULL, 'Also known as Devon Energy Williston, LLC per invoice', 'admin', '2026-01-28 16:03:35.691131');
INSERT INTO public.operators VALUES ('c1c29701-0835-49a1-ac5b-bac71b674747', 'XTO Energy', 'XTO Energy Inc.', '{"XTO ENERGY INC"}', true, 'Citibank, N.A.', NULL, '021000089', '30956943', '021000089', 'CITIUS33', NULL, 'Julio Cesar Xavier Guerios', '+1 (346) 335-6919', 'julio.c.guerios@exxonmobil.com', 'Tax ID: 75-2847769', 'admin', '2026-01-28 16:03:35.62869');
INSERT INTO public.operators VALUES ('664a7411-4671-408c-bcf2-cceae9a0f8fe', 'MORNINGSTAR OPERATING LLC', 'MORNINGSTAR OPERATING LLC', '{"MORNINGSTAR OPERATING LLC"}', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-28 17:09:29.165326');
INSERT INTO public.operators VALUES ('078530c8-e5bb-492f-823d-3d5e07070671', 'CORNERSTONE NATURAL RESOURCES', 'CORNERSTONE NATURAL RESOURCES', '{"CORNERSTONE NATURAL RESOURCES"}', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-28 17:09:19.956799');

--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments VALUES ('e0992dff-d684-493f-83ee-7b5ce4f26d06', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'd957bd99-17e3-465e-a361-997632f78fab', 'MUREX PETROLEUM CORPORATION', 'GPG01', 33.21, NULL, '2026-01-19', 'GPG01  -2512', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:23:17.607', true, '2026-01-28 17:35:08.052', false, '2026-01-28 16:34:23.205614');
INSERT INTO public.payments VALUES ('794ac013-2330-488d-9469-61fec1c31994', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '63339ff5-9a4d-4afd-8f32-b75a48e60097', 'PETRO-HUNT LLC', '108366-01', 78.47, NULL, '2026-01-15', '202511-00044', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:26:29.2', true, '2026-01-28 17:35:48.183', false, '2026-01-28 16:34:23.239621');
INSERT INTO public.payments VALUES ('f3cdece3-aa64-42e6-8422-5daa0618a545', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6e2e71b1-2d04-48e2-88f3-1219e1de9447', 'COP ON BEHALF-BURL. RES. O&G CO LP', '408952', 904.39, NULL, '2026-01-13', '202512NANN408952', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:17:25.18', true, '2026-01-28 17:31:15.867', false, '2026-01-28 16:34:23.270473');
INSERT INTO public.payments VALUES ('f3ed2ec0-a694-416b-b24a-662def69d643', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6e2e71b1-2d04-48e2-88f3-1219e1de9447', 'COP ON BEHALF-MARATHON OIL COMPANY', '421387', 688.20, NULL, '2026-01-13', '202512OABO421387', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:18:04.006', true, '2026-01-28 17:32:04.809', false, '2026-01-28 16:34:23.300793');
INSERT INTO public.payments VALUES ('06457a23-18b5-4838-af98-35652646e319', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '04994e79-3772-4798-b5ac-3f36de3647c6', 'ENERPLUS RESOURCES (USA) CORP', '33377', 7218.54, NULL, '2026-01-15', 'S2025121000810', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:18:49.054', true, '2026-01-28 17:32:59.166', false, '2026-01-28 16:34:23.330826');
INSERT INTO public.payments VALUES ('ee2511a3-5883-4b77-80c7-4065adc15b41', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6c7e6072-c67c-4ec7-a46b-84bba3da4a3f', 'HUNT OIL COMPANY', '0020001300', 10159.71, NULL, '2026-01-13', '1220250020001300', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:22:00.778', true, '2026-01-28 17:34:08.182', false, '2026-01-28 16:34:23.360448');
INSERT INTO public.payments VALUES ('cedb2fe5-0c2e-4654-b86e-baf598461f4b', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6fdc0ddd-2e13-4500-9be6-10fa11d95c9d', 'KODA RESOURCES OPERATING LLC', '2752', 8272.12, NULL, '2026-01-13', '4589', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:22:18.673', true, '2026-01-28 17:34:24.405', false, '2026-01-28 16:34:23.392606');
INSERT INTO public.payments VALUES ('7e247047-869b-4ef9-8d93-cd54ad3865cf', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '8fb5101a-28ff-430d-980c-f5c497673bf1', 'LIME ROCK RESOURCES OPERATING', 'GPG001', 1872.70, NULL, '2026-01-12', 'GPG001122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:22:56.535', true, '2026-01-28 17:34:52.546', false, '2026-01-28 16:34:23.426383');
INSERT INTO public.payments VALUES ('436f707c-eddd-46b4-8690-017b2272c451', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6e4b3c9d-be78-4b84-86ee-695e74090b3a', 'OASIS PETROLEUM NORTH AMERICA LLC', '138895', 751.38, NULL, '2026-01-15', 'S2025121001184', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:38:28.912', true, '2026-01-28 17:39:44.243', false, '2026-01-28 16:34:23.456254');
INSERT INTO public.payments VALUES ('edb96f07-511c-4bfc-8a00-909636475a3a', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6e4b3c9d-be78-4b84-86ee-695e74090b3a', 'OASIS PETROLEUM NORTH AMERICA LLC', '33377', 9960.38, NULL, '2026-01-15', 'S2025121001867', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:23:45.338', true, '2026-01-28 17:35:26.097', false, '2026-01-28 16:34:23.491568');
INSERT INTO public.payments VALUES ('d29c690d-8503-4c3f-a88a-5ef4a7947c74', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '2ce15878-da06-45bb-9f2a-77cdcb81b71e', 'WHITING OIL AND GAS CORPORATION', '33377', 3815.92, NULL, '2026-01-15', 'S2025121002156', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:26:50.831', true, '2026-01-28 17:36:53.54', false, '2026-01-28 16:34:23.521451');
INSERT INTO public.payments VALUES ('4a89fea4-81f3-4bd9-84db-3aca80a525e9', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'bd308554-f067-4584-aea4-88e573935042', 'CONTINENTAL RESOURCES INC.', '0127726301', 19532.58, NULL, '2026-01-11', '1220250127726301', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:16:48.166', true, '2026-01-28 17:30:51.689', false, '2026-01-28 16:34:23.551559');
INSERT INTO public.payments VALUES ('19b0b00f-28d0-4190-803a-6a756ff94d45', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '078530c8-e5bb-492f-823d-3d5e07070671', 'CORNERSTONE NATURAL RESOURCES', '34010', 14.59, NULL, '2026-01-08', '12768', 'Check', 'processed', NULL, NULL, 3180, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', 'Check #3180 sent via WSB Bill Pay', false, NULL, false, NULL, true, '2026-01-28 19:33:57.469', true, '2026-01-28 19:33:58.765', false, '2026-01-28 16:34:23.582918');
INSERT INTO public.payments VALUES ('d525343d-b03e-4081-80db-5eba679259f9', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'fd9b13a3-85e3-4e96-a4b6-03a2a0ceecf5', 'DEVON ENERGY WILLISTON, L.L.C.', '0008259310', 41636.73, NULL, '2026-01-07', '03021220250008259310', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:18:27.134', true, '2026-01-28 17:32:20.733', false, '2026-01-28 16:34:23.61268');
INSERT INTO public.payments VALUES ('a8eeac76-134e-4a7a-bd84-22b27fcd0e27', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '6a0d067c-5600-4085-85a2-12dee914a3ac', 'EOG RESOURCES INC', '433792', 759.06, NULL, '2026-01-08', '25121551', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:19:16.119', true, '2026-01-28 17:33:17.533', false, '2026-01-28 16:34:23.643056');
INSERT INTO public.payments VALUES ('01b1fc3d-e3ec-41c6-9f5e-06b27ebe2967', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'd5f7e9ab-9010-4b79-9735-6f39116fc3ba', 'HESS BAKKEN INVESTMENTSII', '1018694102', 6904.29, NULL, '2026-01-08', '1220251018694102', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:21:41.168', true, '2026-01-28 17:33:47.249', false, '2026-01-28 16:34:23.672273');
INSERT INTO public.payments VALUES ('95c30648-25fb-4deb-8ec9-9c455b061330', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'c1c29701-0835-49a1-ac5b-bac71b674747', 'XTO ENERGY INC', '0030293209', 76974.35, NULL, '2026-01-07', '4331122530293209', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:27:58.333', true, '2026-01-28 17:37:06.85', false, '2026-01-28 16:34:23.701655');
INSERT INTO public.payments VALUES ('0e81e1aa-8dfe-4c80-b087-aa5cc8b45dc1', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '7d2ddaaf-4320-427c-8e79-6135858888fc', 'ZAVANNA ENERGY OPERATING, LLC', '3986', 924.00, NULL, '2026-01-10', '3986122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:29:03.558', true, '2026-01-28 17:37:36.68', false, '2026-01-28 16:34:23.740749');
INSERT INTO public.payments VALUES ('307c756a-ffdc-429f-9ed1-9eed5d23bee5', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'f83120a9-d854-4969-a1fc-3083388ecf2c', 'FORMENTERA OPERATIONS LLC', '3210', 208.32, NULL, '2026-01-05', '3210122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:21:15.023', true, '2026-01-28 17:33:32.207', false, '2026-01-28 16:34:23.770739');
INSERT INTO public.payments VALUES ('574047ad-c2f2-4e14-ae91-1051840b1955', 'e06b6271-a62a-467d-99a4-6627fdccbccc', '797e7dc8-a6d8-473d-be03-d2fb9888d0b5', 'KRAKEN OPERATING LLC', '126965525', 5474.31, NULL, '2025-12-31', 'RIB36668', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:22:35.351', true, '2026-01-28 17:34:38.651', false, '2026-01-28 16:34:23.80069');
INSERT INTO public.payments VALUES ('e5dfe3f2-6b49-492d-9dc6-75b5f2cab2d6', 'e06b6271-a62a-467d-99a4-6627fdccbccc', 'd957bd99-17e3-465e-a361-997632f78fab', 'MUREX PETROLEUM CORPORATION', 'GPG01', 38.31, NULL, '2025-12-14', 'GPG01  -2511', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'gpg jan jibs.xlsx', '2026-01-28 16:34:23.19', NULL, false, NULL, false, NULL, true, '2026-01-28 17:38:10.721', true, '2026-01-28 17:39:29.291', false, '2026-01-28 16:34:23.830924');
INSERT INTO public.payments VALUES ('3e34dfce-754c-42f3-9c9e-e5f9c26e0995', 'e38c72be-93cf-404e-9e77-f22220e7859e', '63339ff5-9a4d-4afd-8f32-b75a48e60097', 'PETRO-HUNT LLC', '99304-01', 38.48, NULL, '2026-01-15', '202511-01056', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:22:27.561', true, '2026-01-28 19:23:49.797', false, '2026-01-28 16:35:46.046577');
INSERT INTO public.payments VALUES ('56cc19c9-8770-485f-9f0a-180cd18869c0', 'e38c72be-93cf-404e-9e77-f22220e7859e', '6e4b3c9d-be78-4b84-86ee-695e74090b3a', 'OASIS PETROLEUM NORTH AMERICA LLC', '08788', 1228.35, NULL, '2026-01-15', 'S2025121000598', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:19:03.666', true, '2026-01-28 19:23:36.961', false, '2026-01-28 16:35:46.084684');
INSERT INTO public.payments VALUES ('ceae1941-dcc3-4659-b27d-7cf9ca31e27f', 'e38c72be-93cf-404e-9e77-f22220e7859e', 'bd308554-f067-4584-aea4-88e573935042', 'CONTINENTAL RESOURCES INC.', '0122871001', 914.37, NULL, '2026-01-11', '1220250122871001', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:18:03.13', true, '2026-01-28 19:22:58.645', false, '2026-01-28 16:35:46.115129');
INSERT INTO public.payments VALUES ('8e01bbde-c694-4711-9f7a-5024d378787a', 'e38c72be-93cf-404e-9e77-f22220e7859e', 'd5f7e9ab-9010-4b79-9735-6f39116fc3ba', 'HESS BAKKEN INVESTMENTSII', '1019357304', 12.29, NULL, '2026-01-08', '1220251019357304', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:18:28.559', true, '2026-01-28 19:23:14.263', false, '2026-01-28 16:35:46.164643');
INSERT INTO public.payments VALUES ('328e2f68-27ad-48bb-83e5-f47490e318b8', 'e38c72be-93cf-404e-9e77-f22220e7859e', '7d2ddaaf-4320-427c-8e79-6135858888fc', 'ZAVANNA ENERGY OPERATING, LLC', '2230', 534.55, NULL, '2026-01-10', '2230122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:22:43.373', true, '2026-01-28 19:24:09.776', false, '2026-01-28 16:35:46.194764');
INSERT INTO public.payments VALUES ('9a506704-4a85-48d9-a9c4-51371d0f52e3', 'e38c72be-93cf-404e-9e77-f22220e7859e', '797e7dc8-a6d8-473d-be03-d2fb9888d0b5', 'KRAKEN OPERATING LLC', '122871001', 682.03, NULL, '2025-12-31', 'RIB36571', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:18:45.806', true, '2026-01-28 19:23:25.91', false, '2026-01-28 16:35:46.224896');
INSERT INTO public.payments VALUES ('dc9dbce4-edb7-420f-b6df-d391bceddc1e', 'e38c72be-93cf-404e-9e77-f22220e7859e', '63339ff5-9a4d-4afd-8f32-b75a48e60097', 'PETRO-HUNT LLC', '99304-01', 23.35, NULL, '2025-12-15', '202510-00766', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'jgi jan jibs.xlsx', '2026-01-28 16:35:46.031', NULL, false, NULL, false, NULL, true, '2026-01-28 19:24:26.464', true, '2026-01-28 19:24:36.395', false, '2026-01-28 16:35:46.254049');
INSERT INTO public.payments VALUES ('d542d018-74f4-4d91-a329-162d30302c3d', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'd957bd99-17e3-465e-a361-997632f78fab', 'MUREX PETROLEUM CORPORATION', 'TRI04', 1028.26, NULL, '2026-01-19', 'TRI04  -2512', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:50:29.044', true, '2026-01-28 18:18:13.013', false, '2026-01-28 16:37:26.307416');
INSERT INTO public.payments VALUES ('18327d05-503b-4ba2-aade-31673365e97e', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '6e2e71b1-2d04-48e2-88f3-1219e1de9447', 'COP ON BEHALF-MARATHON OIL COMPANY', '424391', 12901.29, NULL, '2026-01-13', '202512OABO424391', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:47:03.591', true, '2026-01-28 18:14:21.659', false, '2026-01-28 16:37:26.347412');
INSERT INTO public.payments VALUES ('e34baa76-4aa3-4723-978f-1ce867f7e0f9', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '04994e79-3772-4798-b5ac-3f36de3647c6', 'ENERPLUS RESOURCES (USA) CORP', '09219', 6236.44, NULL, '2026-01-15', 'S2025121000211', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:47:42.329', true, '2026-01-28 18:15:05.421', false, '2026-01-28 16:37:26.379305');
INSERT INTO public.payments VALUES ('bd10ca3b-4a5a-4b11-b4c8-e843e2b0ba03', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '6c7e6072-c67c-4ec7-a46b-84bba3da4a3f', 'HUNT OIL COMPANY', '0020001017', 3346.21, NULL, '2026-01-13', '1220250020001017', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:49:13.737', true, '2026-01-28 18:17:14.115', false, '2026-01-28 16:37:26.413281');
INSERT INTO public.payments VALUES ('a40598b7-342b-408f-9422-fab448df4f58', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '6e4b3c9d-be78-4b84-86ee-695e74090b3a', 'OASIS PETROLEUM NORTH AMERICA LLC', '09219', 9230.91, NULL, '2026-01-15', 'S2025121000636', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:10:31.47', true, '2026-01-28 18:18:32.905', false, '2026-01-28 16:37:26.44458');
INSERT INTO public.payments VALUES ('ae229dc8-76d3-4741-8fd9-6aa2c585c2d1', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '2ce15878-da06-45bb-9f2a-77cdcb81b71e', 'WHITING OIL AND GAS CORPORATION', '09219', 24807.30, NULL, '2026-01-15', 'S2025121001268', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:11:58.117', true, '2026-01-28 18:19:37.281', false, '2026-01-28 16:37:26.475409');
INSERT INTO public.payments VALUES ('be2027ee-263c-4954-be9c-93b5a2e81502', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '2ce15878-da06-45bb-9f2a-77cdcb81b71e', 'ROCKPORT OIL & GAS IV LLC', '2043', 6366.85, NULL, '2026-01-08', '5308', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:11:26.877', true, '2026-01-28 18:19:07.083', false, '2026-01-28 16:37:26.506633');
INSERT INTO public.payments VALUES ('c407c2db-e3ef-4e79-8ac1-404bbde360be', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'bd308554-f067-4584-aea4-88e573935042', 'CONTINENTAL RESOURCES INC.', '0122031401', 541.71, NULL, '2026-01-11', '1220250122031401', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:44:17.48', true, '2026-01-28 18:13:54.166', false, '2026-01-28 16:37:26.539627');
INSERT INTO public.payments VALUES ('940cecb6-cb85-43f7-a5c7-c580862563b4', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'fd9b13a3-85e3-4e96-a4b6-03a2a0ceecf5', 'DEVON ENERGY WILLISTON, L.L.C.', '0008258780', 10293.86, NULL, '2026-01-07', '03021220250008258780', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:47:26.455', true, '2026-01-28 18:14:43.177', false, '2026-01-28 16:37:26.5711');
INSERT INTO public.payments VALUES ('b5cbef0a-9cb1-4e96-b2ce-f00a4c6aaf15', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', '6a0d067c-5600-4085-85a2-12dee914a3ac', 'EOG RESOURCES INC', '211291', 42074.48, NULL, '2026-01-08', '25120417', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:48:14.111', true, '2026-01-28 18:16:15.487', false, '2026-01-28 16:37:26.602119');
INSERT INTO public.payments VALUES ('d5fd7e6b-6903-40ae-941c-2800479e9fb9', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'd5f7e9ab-9010-4b79-9735-6f39116fc3ba', 'HESS BAKKEN INVESTMENTSII', '1015962202', 95670.45, NULL, '2026-01-08', '1220251015962202', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-29', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:48:52.176', true, '2026-01-29 14:53:09.384', false, '2026-01-28 16:37:26.633245');
INSERT INTO public.payments VALUES ('6fd08e69-6855-4523-ae2b-ff90b31b8fd7', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'f7a3b182-0e9a-4421-a889-7115a544b7ea', 'SLAWSON EXPLORATION CO INC', '10696', 1368.82, NULL, '2026-01-09', '10696-151209', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:11:47.922', true, '2026-01-28 18:19:19.151', false, '2026-01-28 16:37:26.663994');
INSERT INTO public.payments VALUES ('711e0558-c9f0-4d35-abe4-4fe4a22bf094', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'c1c29701-0835-49a1-ac5b-bac71b674747', 'XTO ENERGY INC', '0030073514', 42140.03, NULL, '2026-01-07', '4331122530073514', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:12:20.351', true, '2026-01-28 18:19:59.448', false, '2026-01-28 16:37:26.695447');
INSERT INTO public.payments VALUES ('b11e834a-a42b-4707-92c7-75b27de71a78', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'f83120a9-d854-4969-a1fc-3083388ecf2c', 'FORMENTERA OPERATIONS LLC', '4463', 821.81, NULL, '2026-01-05', '4463122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 17:48:35.953', true, '2026-01-28 18:16:39.611', false, '2026-01-28 16:37:26.726602');
INSERT INTO public.payments VALUES ('d8281642-5518-482f-b9dc-16c3f1bd3076', 'f7843ee0-e80e-43fe-a65a-deb4e7c13aea', 'a6da600a-3028-4abf-bd6a-c64e7e066e1e', 'PHOENIX OPERATING LLC', '1186', 53336.51, NULL, '2026-01-05', '2935', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'triple t jan jibs.xlsx', '2026-01-28 16:37:26.291', NULL, false, NULL, false, NULL, true, '2026-01-28 18:11:09.289', true, '2026-01-28 18:18:50.038', false, '2026-01-28 16:37:26.7593');
INSERT INTO public.payments VALUES ('87919f22-0a40-46eb-8d32-e95a00078bc2', '82ff82a9-4f1a-4368-8782-389ea5edbaca', 'bd308554-f067-4584-aea4-88e573935042', 'CONTINENTAL RESOURCES INC.', '0129004201', 4.81, NULL, '2026-01-11', '1220250129004201', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'grow jan jibs.xlsx', '2026-01-28 16:38:31.097', NULL, false, NULL, false, NULL, true, '2026-01-28 19:14:17.856', true, '2026-01-28 19:14:46.759', false, '2026-01-28 16:38:31.11295');
INSERT INTO public.payments VALUES ('86a6bc78-75d9-4e37-aaa0-c42e04dbe4b9', '82ff82a9-4f1a-4368-8782-389ea5edbaca', 'd5f7e9ab-9010-4b79-9735-6f39116fc3ba', 'HESS BAKKEN INVESTMENTSII', '1019238202', 3.67, NULL, '2026-01-08', '1220251019238202', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'grow jan jibs.xlsx', '2026-01-28 16:38:31.097', NULL, false, NULL, false, NULL, true, '2026-01-28 19:14:33.511', true, '2026-01-28 19:15:03.246', false, '2026-01-28 16:38:31.142974');
INSERT INTO public.payments VALUES ('38c2f929-b74c-4e07-a2f5-800376759b71', '78682eb7-3786-4661-ae91-48ae2449849b', '99fa650b-a1b6-40f0-84d2-a4ec82efccc6', 'Iron OIl ', '000637', 30829.30, NULL, '2026-01-15', 'S2025121000015', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'meadow jan jibs.xlsx', '2026-01-28 16:39:47.829', NULL, false, NULL, false, NULL, true, '2026-01-28 19:16:52.399', true, '2026-01-28 19:17:01.255', false, '2026-01-28 16:39:47.844534');
INSERT INTO public.payments VALUES ('4d12322e-a6b1-4938-abc0-a935bf165f68', '37fd4fe0-fe11-4707-86e1-67628258f4d0', 'c1c29701-0835-49a1-ac5b-bac71b674747', 'XTO ENERGY INC', '0030083688', 254.20, NULL, '2026-01-07', '4331122530083688', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'irene johnson jan jibs.xlsx', '2026-01-28 16:43:18.433', NULL, false, NULL, false, NULL, true, '2026-01-28 19:15:35.431', true, '2026-01-28 19:15:46.849', false, '2026-01-28 16:43:18.447769');
INSERT INTO public.payments VALUES ('8a202bb9-de2d-4c95-a26d-a888d18251b3', 'dbdde722-11a4-4da8-856c-80a77eefdc70', 'fd9b13a3-85e3-4e96-a4b6-03a2a0ceecf5', 'Devon Energy', '0008263372', 1973.91, NULL, '2026-01-07', '03021220250008263372', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'wec jan jibs.xlsx', '2026-01-28 17:08:06.269', NULL, false, NULL, false, NULL, true, '2026-01-28 19:25:54.974', true, '2026-01-28 19:26:40.319', false, '2026-01-28 17:08:06.286082');
INSERT INTO public.payments VALUES ('e57371f4-073f-4227-bfad-aac8f6ab25e5', 'dbdde722-11a4-4da8-856c-80a77eefdc70', '664a7411-4671-408c-bcf2-cceae9a0f8fe', 'MORNINGSTAR OPERATING LLC', '356948-06', 0.86, NULL, '2026-01-08', '202512-00691', 'Check', 'processed', NULL, NULL, 2581, '2026-01-28', NULL, 0.00, false, 'wec jan jibs.xlsx', '2026-01-28 17:08:06.269', 'Check #2581 sent via WSB Bill Pay', false, NULL, false, NULL, true, '2026-01-28 19:29:19.78', true, '2026-01-28 19:31:44.979', false, '2026-01-28 17:08:06.329914');
INSERT INTO public.payments VALUES ('6b424d89-1c04-4066-ba7a-7fc5daad841f', 'dbdde722-11a4-4da8-856c-80a77eefdc70', 'c1c29701-0835-49a1-ac5b-bac71b674747', 'XTO Energy', '0030206216', 132.33, NULL, '2026-01-07', '4331122530206216', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'wec jan jibs.xlsx', '2026-01-28 17:08:06.269', NULL, false, NULL, false, NULL, true, '2026-01-28 19:26:16.729', true, '2026-01-28 19:26:54.967', false, '2026-01-28 17:08:06.367969');
INSERT INTO public.payments VALUES ('cb431890-00e9-4c52-a009-29b66c7dc201', 'dbdde722-11a4-4da8-856c-80a77eefdc70', '7d2ddaaf-4320-427c-8e79-6135858888fc', 'Zavanna Energy', '188', 24.71, NULL, '2026-01-10', '188122500', 'ACH', 'processed', NULL, NULL, NULL, '2026-01-28', NULL, 0.00, false, 'wec jan jibs.xlsx', '2026-01-28 17:08:06.269', NULL, false, NULL, false, NULL, true, '2026-01-28 19:26:31.29', true, '2026-01-28 19:27:08.041', false, '2026-01-28 17:08:06.407156');
INSERT INTO public.payments VALUES ('5a4b1399-95c7-4b5d-bdfd-d5859b84850b', 'dbdde722-11a4-4da8-856c-80a77eefdc70', NULL, 'MORNINGSTAR OPERATING LLC', '356948-06', 0.94, NULL, '2025-12-05', '202511-05767', 'Check', 'processed', NULL, NULL, 2582, '2026-01-28', NULL, 0.00, false, 'wec jan jibs.xlsx', '2026-01-28 17:08:06.269', 'Check #2582 sent via WSB Bill Pay', false, NULL, false, NULL, true, '2026-01-28 19:32:51.752', true, '2026-01-28 19:32:56.163', false, '2026-01-28 17:08:06.437572');

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
