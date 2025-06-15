
BEGIN;

-- Wiping data to ensure a clean slate. Order is important due to foreign keys.
TRUNCATE TABLE 
  public.attendance_records,
  public.dcg_members,
  public.financial_transactions,
  public.events,
  public.members,
  public.dcgs,
  public.profiles,
  public.user_roles,
  public.communications,
  public.financial_transaction_categories,
  public.regions
RESTART IDENTITY CASCADE;

DO $$
DECLARE
    -- Region IDs
    region_na_id uuid;
    region_eu_id uuid;
    region_as_id uuid;
    region_af_id uuid;
    region_sa_id uuid;

    -- Financial Category IDs
    cat_tithes_id uuid;
    cat_missions_id uuid;
    cat_salaries_id uuid;
    cat_utilities_id uuid;

    -- Profile IDs
    profile_id uuid;

    -- Member IDs
    member_id uuid;
    member_id_na_1 uuid;
    member_id_na_2 uuid;
    member_id_na_3 uuid;
    member_id_eu_1 uuid;
    member_id_eu_2 uuid;

    -- DCG IDs
    dcg_id uuid;
    dcg_na_1_id uuid;
    dcg_na_2_id uuid;

    -- Event IDs
    event_id uuid;

BEGIN
    -- 1. Seed Financial Categories
    INSERT INTO public.financial_transaction_categories (name, type) VALUES ('Tithes & Offerings', 'Income') RETURNING id INTO cat_tithes_id;
    INSERT INTO public.financial_transaction_categories (name, type) VALUES ('Missions', 'Income') RETURNING id INTO cat_missions_id;
    INSERT INTO public.financial_transaction_categories (name, type) VALUES ('Salaries & Wages', 'Expense') RETURNING id INTO cat_salaries_id;
    INSERT INTO public.financial_transaction_categories (name, type) VALUES ('Utilities', 'Expense') RETURNING id INTO cat_utilities_id;

    -- 2. Seed Regions
    INSERT INTO public.regions (name, code, regional_pastor, contact_email) VALUES ('North America', 'NA', 'Ps. John Doe', 'pastor.john@wca.org') RETURNING id INTO region_na_id;
    INSERT INTO public.regions (name, code, regional_pastor, contact_email) VALUES ('Europe', 'EU', 'Ps. Jane Smith', 'pastor.jane@wca.org') RETURNING id INTO region_eu_id;
    INSERT INTO public.regions (name, code, regional_pastor, contact_email) VALUES ('Asia', 'AS', 'Ps. Ken Tanaka', 'pastor.ken@wca.org') RETURNING id INTO region_as_id;
    INSERT INTO public.regions (name, code, regional_pastor, contact_email) VALUES ('Africa', 'AF', 'Ps. Tunde Adebayo', 'pastor.tunde@wca.org') RETURNING id INTO region_af_id;
    INSERT INTO public.regions (name, code, regional_pastor, contact_email) VALUES ('South America', 'SA', 'Ps. Maria Garcia', 'pastor.maria@wca.org') RETURNING id INTO region_sa_id;

    -- 3. Seed Data for North America
    -- Members
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Michael', 'Scott', 'michael.scott@example.com', region_na_id, '1964-03-15') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id, join_date) VALUES (profile_id, region_na_id, public.generate_member_id(region_na_id), '2022-01-10') RETURNING id INTO member_id_na_1;
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Dwight', 'Schrute', 'dwight.schrute@example.com', region_na_id, '1970-01-20') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id, join_date) VALUES (profile_id, region_na_id, public.generate_member_id(region_na_id), '2023-05-20') RETURNING id INTO member_id_na_2;
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Pam', 'Beesly', 'pam.beesly@example.com', region_na_id, '1979-03-25') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id, join_date) VALUES (profile_id, region_na_id, public.generate_member_id(region_na_id), '2024-04-01') RETURNING id INTO member_id_na_3;
    -- DCGs
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('Downtown Morning Group', region_na_id, member_id_na_1) RETURNING id INTO dcg_na_1_id;
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('Suburbs Evening Group', region_na_id, member_id_na_2) RETURNING id INTO dcg_na_2_id;
    -- DCG Members
    INSERT INTO public.dcg_members (dcg_id, member_id) VALUES (dcg_na_1_id, member_id_na_2), (dcg_na_1_id, member_id_na_3);
    -- Financials
    INSERT INTO public.financial_transactions (region_id, category_id, amount, transaction_date) VALUES (region_na_id, cat_tithes_id, 12500.75, '2025-05-01'), (region_na_id, cat_salaries_id, -4500.00, '2025-05-05');
    -- Attendance
    INSERT INTO public.attendance_events (name, event_date, region_id) VALUES ('NA Regional Conference Day 1', '2025-05-15', region_na_id) RETURNING id INTO event_id;
    INSERT INTO public.attendance_records (event_id, member_id, is_present) VALUES (event_id, member_id_na_1, true), (event_id, member_id_na_2, true), (event_id, member_id_na_3, false);

    -- 4. Seed Data for Europe
    -- Members
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('James', 'Bond', 'james.bond@example.com', region_eu_id, '1968-11-11') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id, join_date) VALUES (profile_id, region_eu_id, public.generate_member_id(region_eu_id), '2021-03-12') RETURNING id INTO member_id_eu_1;
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Hercule', 'Poirot', 'hercule.poirot@example.com', region_eu_id, '1955-06-01') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id, join_date) VALUES (profile_id, region_eu_id, public.generate_member_id(region_eu_id), '2024-02-14') RETURNING id INTO member_id_eu_2;
    -- DCGs
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('London City Prayer', region_eu_id, member_id_eu_1) RETURNING id INTO dcg_id;
    INSERT INTO public.dcg_members (dcg_id, member_id) VALUES (dcg_id, member_id_eu_2);
    -- Financials
    INSERT INTO public.financial_transactions (region_id, category_id, amount, transaction_date) VALUES (region_eu_id, cat_tithes_id, 8200.50, '2025-05-01'), (region_eu_id, cat_utilities_id, -850.25, '2025-05-10');
    -- Attendance
    INSERT INTO public.attendance_events (name, event_date, region_id) VALUES ('EU Sunday Service', '2025-06-01', region_eu_id) RETURNING id INTO event_id;
    INSERT INTO public.attendance_records (event_id, member_id, is_present) VALUES (event_id, member_id_eu_1, true), (event_id, member_id_eu_2, true);

    -- 5. Seed Basic Data for Other Regions to ensure they appear in reports
    -- Asia
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Son', 'Goku', 'son.goku@example.com', region_as_id, '1984-04-16') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id) VALUES (profile_id, region_as_id, public.generate_member_id(region_as_id)) RETURNING id INTO member_id;
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('Tokyo Central', region_as_id, member_id) RETURNING id INTO dcg_id;
    INSERT INTO public.financial_transactions (region_id, category_id, amount) VALUES (region_as_id, cat_tithes_id, 150000.00);
    -- Africa
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('T''Challa', 'King', 'tchalla.king@example.com', region_af_id, '1977-11-29') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id) VALUES (profile_id, region_af_id, public.generate_member_id(region_af_id)) RETURNING id INTO member_id;
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('Nairobi Faith Group', region_af_id, member_id) RETURNING id INTO dcg_id;
    INSERT INTO public.financial_transactions (region_id, category_id, amount) VALUES (region_af_id, cat_tithes_id, 9850.00);
    -- South America
    INSERT INTO public.profiles (first_name, last_name, email, region_id, date_of_birth) VALUES ('Dora', 'Explorer', 'dora.explorer@example.com', region_sa_id, '2000-08-14') RETURNING id INTO profile_id;
    INSERT INTO public.members (profile_id, region_id, member_id) VALUES (profile_id, region_sa_id, public.generate_member_id(region_sa_id)) RETURNING id INTO member_id;
    INSERT INTO public.dcgs (name, region_id, leader_id) VALUES ('Rio Worship Team', region_sa_id, member_id) RETURNING id INTO dcg_id;
    INSERT INTO public.financial_transactions (region_id, category_id, amount) VALUES (region_sa_id, cat_tithes_id, 7600.00);

END $$;

COMMIT;
