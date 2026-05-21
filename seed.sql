INSERT INTO config (
  id,
  brand,
  backend,
  app_title,
  customer_label,
  primary_record_label,
  create_label,
  recent_records_label,
  customer_tier_label,
  logo_url,
  primary_hex,
  secondary_hex,
  accent_hex,
  debug,
  updated_at
) VALUES (
  1,
  'custom_crm',
  'custom_crm',
  'CRM Integration Demo',
  'Client',
  'Appointment',
  'New Appointment',
  'Recent Appointments',
  'Status',
  '/assets/logos/custom_crm.svg',
  '#4F46E5',
  '#EEF2FF',
  '#3730A3',
  0,
  datetime('now')
);

INSERT INTO state (key, value) VALUES
  ('active_scenario', 'custom_crm_appointment');

INSERT INTO seeds (
  scenario_key,
  backend,
  phone,
  email,
  customer_name,
  customer_status,
  primary_subject,
  primary_status,
  primary_due_date,
  recent_count
) VALUES
  ('matched_open_order',      'salesforce',  '+447700900001', 'sarah.thompson@example.com', 'Sarah Thompson', 'Gold',     'Delayed order enquiry',       'Pending', 'Tomorrow', 2),
  ('vip_customer',            'salesforce',  '+447794516641', 'joe@eno.solutions',          'Joe Bloggs',     'Platinum', 'Priority delivery issue',     'New',     'Today',    3),
  ('matched_no_open_order',   'salesforce',  '+447700900003', 'emma.clarke@example.com',    'Emma Clarke',    'Standard', '',                            '',        '',         3),
  ('no_customer_match',       'salesforce',  '+447700900999', 'nomatch@example.com',        '',               '',         '',                            '',        '',         0),
  ('custom_crm_appointment',  'custom_crm',  '+447700900010', 'olivia.bennett@example.com', 'Olivia Bennett', 'Active',   'Follow-up appointment change','Closed',  'Friday',   2);
